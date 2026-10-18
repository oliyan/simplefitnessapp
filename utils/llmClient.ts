import { getApiKey } from './secureSettings';
import { buildCoachNotePrompt } from './promptTemplates';
import { buildGeneratePlanPrompt, buildRefinePlanPrompt, PlanRequest } from './promptTemplates';
import type { CoachNote } from './coachNotesUtils';
import type { ExportedWorkout } from './workoutSharingUtils';

const API_URL = 'https://api.anthropic.com/v1/messages';
const API_VERSION = '2023-06-01';
const TIMEOUT_MS = 30000;
const PLAN_TIMEOUT_MS = 120000;

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
  if (error instanceof LLMBillingError) {
    return 'Your Anthropic account is out of credits - add some at console.anthropic.com (Billing).';
  }
  if (error instanceof LLMSchemaError) {
    return "The AI's reply wasn't a usable workout plan, even after retrying - try again or adjust your request.";
  }
  return "Couldn't reach the AI service - check your connection and try again.";
};

// Returns the note, or null when the model decided there was nothing to say.
export const generateCoachNote = async (context: string): Promise<CoachNote | null> => {
  const text = (
    await callClaude(buildCoachNotePrompt(context), {
      model: MODELS.fast,
      maxTokens: 600,
      lowEffort: true,
    })
  ).trim();
  if (!text || /^none/i.test(text)) return null;

  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end <= start) {
    // Not JSON despite the instructions; treat the whole reply as the summary.
    return { summary: text, exercises: {} };
  }
  try {
    const parsed = JSON.parse(text.slice(start, end + 1));
    const exercises: Record<string, string> = {};
    for (const [name, line] of Object.entries(parsed.exercises ?? {})) {
      if (typeof line === 'string' && line.trim()) exercises[name.trim()] = line.trim();
    }
    const summary =
      typeof parsed.summary === 'string' && parsed.summary.trim() ? parsed.summary.trim() : null;
    if (!summary && Object.keys(exercises).length === 0) return null;
    return { summary, exercises };
  } catch {
    return { summary: text, exercises: {} };
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
      return {
        exercise_name: ex.exercise_name.trim(),
        sets: Math.round(sets),
        reps: Math.round(reps),
        web_link: typeof ex.web_link === 'string' && ex.web_link.trim() ? ex.web_link.trim() : null,
        muscle_group: muscleGroup,
        exercise_notes: typeof ex.exercise_notes === 'string' && ex.exercise_notes.trim() ? ex.exercise_notes.trim() : null,
      };
    });
    return { day_name: day.day_name.trim(), exercises };
  });
  return { workout_name: raw.workout_name.trim(), days };
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
  const options: CallOptions = { model: MODELS.smart, maxTokens: 8000, effort: 'medium', timeoutMs: PLAN_TIMEOUT_MS };
  try {
    return parsePlan(await callClaude(prompt, options));
  } catch (error) {
    if (!(error instanceof LLMSchemaError)) throw error;
    return parsePlan(await callClaude(prompt, options));
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
