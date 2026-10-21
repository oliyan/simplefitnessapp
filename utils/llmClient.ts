import { getApiKey } from './secureSettings';
import { checkBudget, recordUsage } from './aiUsage';
import { buildCoachNotePrompt, buildFirstSessionPrompt } from './promptTemplates';
import { buildGeneratePlanPrompt, buildRefinePlanPrompt, PlanRequest } from './promptTemplates';
import type { CoachNote } from './coachNotesUtils';
import type { ExportedWorkout } from './workoutSharingUtils';
import { normalizeWeekday } from './weekdays';
import { mentionsPounds } from './weightUnit';
import { stripDashes, mentionsHindi, MIN_NOTE_CHARS, MIN_ROUTINE_NOTE_CHARS } from './textRules';

const API_URL = 'https://api.anthropic.com/v1/messages';
const API_VERSION = '2023-06-01';
const TIMEOUT_MS = 30000;
const PLAN_TIMEOUT_MS = 240000; // long, detailed form notes take a while to write

export const MODELS = {
  fast: 'claude-haiku-5-5', // coach notes
  smart: 'claude-sonnet-5-5', // plan generation / refinement
} as const;

const NO_KEY_MESSAGE = 'No API key set';

export class LLMAuthError extends Error {}
export class LLMRateLimitError extends Error {
  retryAfterSeconds?: number;
  constructor(message: string, retryAfterSeconds?: number) {
    super(message);
    this.retryAfterSeconds = retryAfterSeconds;
  }
}
export class LLMBillingError extends Error {}
export class LLMBudgetError extends Error {
  spendUsd: number;
  limitUsd: number;
  constructor(spendUsd: number, limitUsd: number) {
    super('Monthly AI limit reached');
    this.spendUsd = spendUsd;
    this.limitUsd = limitUsd;
  }
}
export class LLMNetworkError extends Error {}

interface CallOptions {
  model?: string;
  maxTokens?: number;
  // Short answers (notes, connection test) don't need reasoning, and thinking
  // tokens would otherwise eat into maxTokens.
  lowEffort?: boolean;
  // Plan generation reasons first and writes a long answer, so it needs room and time.
  effort?: 'low' | 'medium' | 'high';
  timeoutMs?: number;
}

// Text in, text out. Callers that need structured output validate it themselves.
export const callClaude = async (
  prompt: string,
  { model = MODELS.fast, maxTokens = 1024, lowEffort = false, effort, timeoutMs = TIMEOUT_MS }: CallOptions = {},
): Promise<string> => {
  const apiKey = await getApiKey();
  if (!apiKey) {
    throw new LLMAuthError(NO_KEY_MESSAGE);
  }

  // The app's own monthly cap; checked before any request leaves the device.
  const budget = await checkBudget();
  if (budget.over) {
    throw new LLMBudgetError(budget.spendUsd, budget.limitUsd);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(API_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': API_VERSION,
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        ...(lowEffort && {
          thinking: { type: 'disabled' },
          output_config: { effort: 'low' },
        }),
        ...(!lowEffort && effort && { output_config: { effort } }),
        messages: [{ role: 'user', content: prompt }],
      }),
    });
  } catch (error) {
    throw new LLMNetworkError(
      error instanceof Error ? error.message : 'Network request failed',
    );
  } finally {
    clearTimeout(timer);
  }

  if (response.status === 401 || response.status === 403) {
    throw new LLMAuthError(`HTTP ${response.status}`);
  }
  if (response.status === 429) {
    const retryAfter = Number(response.headers.get('retry-after'));
    throw new LLMRateLimitError(
      'Rate limited',
      Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : undefined,
    );
  }
  if (!response.ok) {
    // 4xx other than auth/rate-limit means a bug in our request; make it visible.
    const body = await response.text().catch(() => '');
    console.error(`LLM request failed: HTTP ${response.status}`, body);
    // Out of credits comes back as a 400, not a 402.
    if (/credit balance/i.test(body)) {
      throw new LLMBillingError('Credit balance too low');
    }
    throw new LLMNetworkError(`HTTP ${response.status}`);
  }

  const data = await response.json();
  try {
    // Output tokens include thinking, so this counts what is actually billed.
    await recordUsage(model, data.usage?.input_tokens ?? 0, data.usage?.output_tokens ?? 0);
  } catch (error) {
    console.error('Could not record AI usage:', error);
  }
  const text = (data.content ?? [])
    .filter((block: any) => block.type === 'text')
    .map((block: any) => block.text)
    .join('');
  return text;
};

export const getUserFacingErrorMessage = (error: unknown): string => {
  if (error instanceof LLMAuthError) {
    if (error.message === NO_KEY_MESSAGE) {
      return 'No API key set - add one in Settings.';
    }
    return 'Anthropic rejected your API key - check it in Settings.';
  }
  if (error instanceof LLMRateLimitError) {
    return error.retryAfterSeconds
      ? `Rate limit reached - try again in ${error.retryAfterSeconds} seconds.`
      : 'Rate limit reached - try again in a bit.';
  }
  if (error instanceof LLMBudgetError) {
    return `You've reached your monthly AI limit ($${error.spendUsd.toFixed(2)} of $${error.limitUsd.toFixed(2)}). Raise it in Settings > AI Coach, or wait for next month.`;
  }
  if (error instanceof LLMBillingError) {
    return 'Your Anthropic account is out of credits - add some at console.anthropic.com (Billing).';
  }
  if (error instanceof LLMSchemaError) {
    return "The AI's reply wasn't a usable workout plan, even after retrying - try again or adjust your request.";
  }
  return "Couldn't reach the AI service - check your connection and try again.";
};

// Returns the note, or null when the model decided there was nothing to say.
// `firstSession` is for a workout with no history: `context` is then just the plan.
export const generateCoachNote = async (
  context: string,
  userName?: string,
  firstSession = false,
): Promise<CoachNote | null> => {
  const ask = async (extra: string) =>
    (
      await callClaude((firstSession ? buildFirstSessionPrompt(context, userName) : buildCoachNotePrompt(context, userName)) + extra, {
        model: MODELS.fast,
        maxTokens: 600,
        lowEffort: true,
      })
    ).trim();

  let text = await ask('');
  // The lifter trains in kg only. A reply that talks about pounds is asked for again once;
  // if it still does, it is dropped rather than shown with the wrong unit.
  if (mentionsPounds(text)) {
    text = await ask('\n\nYour previous reply used pounds. Rewrite it using kilograms (kg) only.');
    if (mentionsPounds(text)) return null;
  }
  // No Hindi, ever (Tamil, Tanglish or English only). One more try, then the note is dropped.
  if (mentionsHindi(text)) {
    text = await ask('\n\nYour previous reply used Hindi words. Rewrite it using only English, Tamil or Tanglish. No Hindi words at all.');
    if (mentionsHindi(text)) return null;
  }
  if (!text || /^none/i.test(text)) return null;

  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end <= start) {
    // Not JSON despite the instructions; treat the whole reply as the summary.
    return { summary: stripDashes(text), exercises: {} };
  }
  try {
    const parsed = JSON.parse(text.slice(start, end + 1));
    const exercises: Record<string, string> = {};
    for (const [name, line] of Object.entries(parsed.exercises ?? {})) {
      if (typeof line === 'string' && line.trim()) exercises[name.trim()] = stripDashes(line.trim());
    }
    const summary =
      typeof parsed.summary === 'string' && parsed.summary.trim() ? stripDashes(parsed.summary.trim()) : null;
    if (!summary && Object.keys(exercises).length === 0) return null;
    return { summary, exercises };
  } catch {
    return { summary: stripDashes(text), exercises: {} };
  }
};

export class LLMSchemaError extends Error {}

const MUSCLE_GROUPS = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms',
  'abs', 'legs', 'glutes', 'hamstrings', 'calves', 'quads',
];

// Checks the model's plan against the shape importWorkout writes to the database,
// and tidies muscle_group (the join key for coach notes). Never pass unvalidated
// JSON to the database.
const validatePlan = (raw: any): ExportedWorkout => {
  const tooShort: string[] = [];
  if (!raw || typeof raw.workout_name !== 'string' || !raw.workout_name.trim()) {
    throw new LLMSchemaError('missing workout_name');
  }
  if (!Array.isArray(raw.days) || raw.days.length === 0) {
    throw new LLMSchemaError('no days');
  }
  const days = raw.days.map((day: any) => {
    if (!day || typeof day.day_name !== 'string' || !day.day_name.trim()) {
      throw new LLMSchemaError('day without a name');
    }
    if (!Array.isArray(day.exercises) || day.exercises.length === 0) {
      throw new LLMSchemaError(`day "${day.day_name}" has no exercises`);
    }
    const exercises = day.exercises.map((ex: any) => {
      const sets = Number(ex?.sets);
      const reps = Number(ex?.reps);
      if (!ex || typeof ex.exercise_name !== 'string' || !ex.exercise_name.trim() ||
          !Number.isFinite(sets) || !Number.isFinite(reps) || sets < 1 || reps < 1) {
        throw new LLMSchemaError('bad exercise entry');
      }
      let muscleGroup: string | null = typeof ex.muscle_group === 'string' ? ex.muscle_group.trim().toLowerCase() : null;
      if (muscleGroup && !MUSCLE_GROUPS.includes(muscleGroup)) {
        console.warn(`Unknown muscle_group "${ex.muscle_group}" for ${ex.exercise_name}; set to null`);
        muscleGroup = null;
      }
      const notes = typeof ex.exercise_notes === 'string' ? stripDashes(ex.exercise_notes.trim()) : '';
      const isRoutine = Math.round(sets) === 1 && Math.round(reps) === 1;
      if (notes.length < (isRoutine ? MIN_ROUTINE_NOTE_CHARS : MIN_NOTE_CHARS)) {
        tooShort.push(ex.exercise_name.trim());
      }
      return {
        exercise_name: stripDashes(ex.exercise_name.trim()),
        sets: Math.round(sets),
        reps: Math.round(reps),
        web_link: typeof ex.web_link === 'string' && ex.web_link.trim() ? ex.web_link.trim() : null,
        muscle_group: muscleGroup,
        exercise_notes: notes || null,
      };
    });
    return { day_name: stripDashes(day.day_name.trim()), weekday: normalizeWeekday(day.weekday), exercises };
  });
  // Hard rule: every exercise carries a thorough form note. A plan with thin notes is rejected,
  // which makes callForPlan ask again and name the exercises that need more.
  if (tooShort.length > 0) {
    throw new LLMSchemaError(`These exercises need a thorough form note (why, setup, how to do it, what to avoid): ${tooShort.join('; ')}`);
  }
  return { workout_name: stripDashes(raw.workout_name.trim()), days };
};

const parsePlan = (text: string): ExportedWorkout => {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end <= start) throw new LLMSchemaError('no JSON in reply');
  let parsed: any;
  try {
    parsed = JSON.parse(text.slice(start, end + 1));
  } catch {
    throw new LLMSchemaError('invalid JSON');
  }
  return validatePlan(parsed);
};

// One silent retry for a malformed plan (a one-off glitch); network/auth/rate errors
// are not retried, and a timeout is a network error.
const callForPlan = async (prompt: string): Promise<ExportedWorkout> => {
  const options: CallOptions = { model: MODELS.smart, maxTokens: 16000, effort: 'medium', timeoutMs: PLAN_TIMEOUT_MS };
  try {
    return parsePlan(await callClaude(prompt, options));
  } catch (error) {
    if (!(error instanceof LLMSchemaError)) throw error;
    const again = `${prompt}

Your previous reply was rejected: ${error.message}. Return the complete plan again and fix that.`;
    return parsePlan(await callClaude(again, options));
  }
};

export const generateWorkoutPlan = (request: PlanRequest): Promise<ExportedWorkout> =>
  callForPlan(buildGeneratePlanPrompt(request));

export const refineWorkoutPlan = (
  currentDraft: ExportedWorkout,
  feedback: string,
  request: PlanRequest,
): Promise<ExportedWorkout> =>
  callForPlan(buildRefinePlanPrompt(currentDraft, feedback, request));
