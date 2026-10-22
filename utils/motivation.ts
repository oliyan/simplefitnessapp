// Goals, streak care, comeback, plateau and month-in-review logic. Pure functions (no database, no
// React), so they can be tried with a plain script. All the wording is warm and never scolding.
import { PersonalRecord, weekStart, weeklyStreak, WorkoutRow } from './dashboardStats';
import {
  Badge, ProgSession, ProgSet, badges, exerciseSeries, formatKg, formatLifted, freshRecord, heroSummary,
  mostImproved, percentChange, recentRecords, totalVolume,
} from './progressStats';

const DAY = 86400;
const midnight = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const seconds = (date: Date) => Math.floor(date.getTime() / 1000);
const addDays = (date: Date, days: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
const toRows = (sessions: ProgSession[]): WorkoutRow[] =>
  sessions.map((s) => ({ workout_log_id: s.logId, workout_date: s.d, workout_name: s.name, day_name: s.day, logged: 1 }));

// ---------------------------------------------------------------- stored state

export interface LiftGoal {
  name: string; // exercise
  target: number; // kg on the heaviest set
  by: number | null; // deadline, Unix seconds, or none
  createdAt: number;
  startValue: number; // the heaviest set when the goal was made
}

export interface GoalsState {
  weeklySessions: number | null; // null = follow the plan
  why: string;
  lifts: LiftGoal[];
  restWeeks: number[]; // Mondays (Unix seconds) marked as rest weeks
  plateauHidden: Record<string, number>; // exercise -> hidden until (Unix seconds)
  checklistHidden: boolean;
  progressVisited: boolean;
  reviewShared: string; // "2026-10" of the last month recap that was shared
}

export const DEFAULT_GOALS: GoalsState = {
  weeklySessions: null,
  why: '',
  lifts: [],
  restWeeks: [],
  plateauHidden: {},
  checklistHidden: false,
  progressVisited: false,
  reviewShared: '',
};

// Fills anything missing or of the wrong type, so an old or damaged settings file cannot break a screen.
export const normaliseGoals = (raw: any): GoalsState => {
  const g = raw && typeof raw === 'object' ? raw : {};
  const num = (v: any) => (typeof v === 'number' && isFinite(v) ? v : null);
  return {
    weeklySessions: num(g.weeklySessions) !== null && g.weeklySessions >= 1 && g.weeklySessions <= 7 ? Math.round(g.weeklySessions) : null,
    why: typeof g.why === 'string' ? g.why.slice(0, 400) : '',
    lifts: Array.isArray(g.lifts)
      ? g.lifts
          .filter((l: any) => l && typeof l.name === 'string' && num(l.target) !== null && l.target > 0)
          .map((l: any) => ({ name: l.name, target: l.target, by: num(l.by), createdAt: num(l.createdAt) ?? 0, startValue: num(l.startValue) ?? 0 }))
      : [],
    restWeeks: Array.isArray(g.restWeeks) ? g.restWeeks.filter((w: any) => num(w) !== null) : [],
    plateauHidden: g.plateauHidden && typeof g.plateauHidden === 'object' ? g.plateauHidden : {},
    checklistHidden: g.checklistHidden === true,
    progressVisited: g.progressVisited === true,
    reviewShared: typeof g.reviewShared === 'string' ? g.reviewShared : '',
  };
};

// ---------------------------------------------------------------- weekly goal

// Sessions to aim for this week: the person's own number, or what the plan put in the week.
export const weeklyTarget = (plannedThisWeek: number, override: number | null): number => (override && override > 0 ? override : plannedThisWeek);

export const weekKey = (today: Date): number => seconds(weekStart(today));

// ---------------------------------------------------------------- lift goals

export interface GoalProgress {
  best: number;
  pct: number; // 0 to 1
  achieved: boolean;
  weeksLeft: number | null;
  pace: 'on' | 'behind' | 'none';
  sentence: string;
}

export const bestWeight = (sets: ProgSet[], name: string): number =>
  sets.reduce((m, s) => (s.name === name && s.wt > m ? s.wt : m), 0);

export const goalProgress = (goal: LiftGoal, sets: ProgSet[], today: Date): GoalProgress => {
  const best = bestWeight(sets, goal.name);
  const achieved = best >= goal.target;
  const span = goal.target - goal.startValue;
  const pct = achieved ? 1 : span > 0 ? Math.max(0, Math.min(1, (best - goal.startValue) / span)) : 0;
  const now = seconds(midnight(today));
  const weeksLeft = goal.by ? Math.max(0, Math.ceil((goal.by - now) / (7 * DAY))) : null;
  let pace: GoalProgress['pace'] = 'none';
  if (goal.by && !achieved && goal.by > goal.createdAt) {
    const expected = Math.max(0, Math.min(1, (now - goal.createdAt) / (goal.by - goal.createdAt)));
    pace = pct >= expected * 0.85 ? 'on' : 'behind';
  }
  let sentence: string;
  if (achieved) sentence = `Goal reached: ${formatKg(best)} kg on ${goal.name}. Well done!`;
  else {
    const head = `${formatKg(best)} of ${formatKg(goal.target)} kg, ${Math.round(pct * 100)}% of the way.`;
    if (weeksLeft === null) sentence = head;
    else if (goal.by! < now) sentence = `${head} The date has passed, and it is fine to move it.`;
    else sentence = `${head} ${weeksLeft} ${weeksLeft === 1 ? 'week' : 'weeks'} left, ${pace === 'on' ? 'on track' : 'a little behind, still within reach'}.`;
  }
  return { best, pct, achieved, weeksLeft, pace, sentence };
};

// ---------------------------------------------------------------- streak care

export interface Guard {
  daysLeft: number; // including today
  streak: number;
  message: string;
}

// The streak is at risk when the week is on its last days and nothing is logged in it yet.
export const streakGuard = (sessions: ProgSession[], today: Date, restWeeks: number[]): Guard | null => {
  const start = seconds(weekStart(today));
  if (restWeeks.includes(start)) return null;
  const rows = toRows(sessions);
  const loggedThisWeek = sessions.some((s) => s.d >= start);
  if (loggedThisWeek) return null;
  const streak = weeklyStreak(rows, today, restWeeks);
  if (streak < 1) return null;
  const dow = (today.getDay() + 6) % 7; // Monday 0
  if (dow < 3) return null; // Monday to Wednesday is early enough
  const daysLeft = 7 - dow;
  const message =
    daysLeft === 1
      ? `Last day of the week. One session today keeps your ${streak} week streak.`
      : `${daysLeft} days left this week. One session keeps your ${streak} week streak.`;
  return { daysLeft, streak, message };
};

export interface Comeback {
  days: number;
  message: string;
}

// A kind welcome after a break of 10 days or more. Never counts the days against the person.
export const comeback = (sessions: ProgSession[], today: Date): Comeback | null => {
  if (sessions.length === 0) return null;
  const last = Math.max(...sessions.map((s) => s.d));
  const todayTs = seconds(midnight(today));
  if (last >= todayTs) return null;
  const days = Math.round((todayTs - last) / DAY);
  if (days < 10) return null;
  const message =
    days >= 42
      ? 'Welcome back. A long break is just part of the story. Start light today and let it come back to you.'
      : days >= 21
        ? 'Welcome back! Start a little lighter than you left off. Your body remembers more than you think.'
        : 'Welcome back! A short break is nothing. Ease in today and the rhythm returns.';
  return { days, message };
};

// ---------------------------------------------------------------- milestones and plateaus

export interface Next {
  badge: Badge;
  remaining: number;
  message: string;
}

// The unearned badge that is closest, when it is close enough to feel reachable.
export const nextMilestone = (list: Badge[]): Next | null => {
  const open = list.filter((b) => !b.earned && b.goal > 0);
  let best: Next | null = null;
  let bestRatio = -1;
  for (const b of open) {
    const ratio = b.value / b.goal;
    const remaining = b.goal - b.value;
    const near = b.unit === 'kg' ? ratio >= 0.7 : remaining <= 3 && ratio > 0;
    if (!near) continue;
    if (ratio > bestRatio) {
      bestRatio = ratio;
      const unit = remaining === 1 ? b.unit.replace(/s$/, '') : b.unit;
      best = { badge: b, remaining, message: `${remaining.toLocaleString('en-US')} more ${unit} to the "${b.title}" badge.` };
    }
  }
  return best;
};

export interface Plateau {
  name: string;
  weeks: number;
  tip: string;
}

const TIPS = [
  'Try an easier week, about 60 percent of your usual weight, then build back up. Strength often jumps after a rest.',
  'Add one rep to every set before you add any weight. Small steps count.',
  'Swap to a close variation for three weeks (a different grip, angle or machine), then come back.',
  'Check sleep and food this week. They shape strength more than most people expect.',
  'Slow the lowering part to 3 seconds. It feels harder and wakes the muscle up again.',
];
const hash = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

// A lifted exercise whose best estimated max has not risen in the last 4 weeks while it was trained 3 times or more.
export const findPlateau = (sets: ProgSet[], today: Date, hidden: Record<string, number> = {}): Plateau | null => {
  const todayTs = seconds(midnight(today));
  const recentFrom = todayTs - 28 * DAY;
  const priorFrom = todayTs - 56 * DAY;
  let found: Plateau | null = null;
  let most = 0;
  for (const name of [...new Set(sets.map((s) => s.name))]) {
    if ((hidden[name] ?? 0) > todayTs) continue;
    const series = exerciseSeries(sets, name, 'e1rm');
    const recent = series.filter((p) => p.d >= recentFrom);
    const prior = series.filter((p) => p.d >= priorFrom && p.d < recentFrom);
    if (recent.length < 3 || prior.length < 2) continue;
    const rb = Math.max(...recent.map((p) => p.v));
    const pb = Math.max(...prior.map((p) => p.v));
    if (rb > pb * 1.005) continue;
    if (recent.length > most) {
      most = recent.length;
      found = { name, weeks: 4, tip: TIPS[hash(name) % TIPS.length] };
    }
  }
  return found;
};

// ---------------------------------------------------------------- the one card Home shows

export type HomeCard =
  | { kind: 'comeback'; message: string }
  | { kind: 'guard'; message: string; streak: number }
  | { kind: 'rested' }
  | { kind: 'goal'; name: string; pct: number; sentence: string }
  | { kind: 'plateau'; name: string; tip: string }
  | { kind: 'milestone'; message: string }
  | { kind: 'why'; text: string };

export interface HomeCardInput {
  sessions: ProgSession[];
  sets: ProgSet[];
  today: Date;
  goals: GoalsState;
  doneToday: boolean;
}

// One at a time so Home stays calm. Order: a welcome back, then the streak, a goal that is close,
// a plateau, a near milestone, and last the person's own reason.
export const pickHomeCard = ({ sessions, sets, today, goals, doneToday }: HomeCardInput): HomeCard | null => {
  if (sessions.length === 0) return null;
  const c = comeback(sessions, today);
  if (c) return { kind: 'comeback', message: c.message };
  if (goals.restWeeks.includes(weekKey(today))) return { kind: 'rested' };
  const g = streakGuard(sessions, today, goals.restWeeks);
  if (g && !doneToday) return { kind: 'guard', message: g.message, streak: g.streak };
  for (const goal of goals.lifts) {
    const p = goalProgress(goal, sets, today);
    if (!p.achieved && p.pct >= 0.8) return { kind: 'goal', name: goal.name, pct: p.pct, sentence: p.sentence };
  }
  const plateau = findPlateau(sets, today, goals.plateauHidden);
  if (plateau) return { kind: 'plateau', name: plateau.name, tip: plateau.tip };
  const m = nextMilestone(badges(sessions, sets, today, goals.restWeeks));
  if (m) return { kind: 'milestone', message: m.message };
  if (goals.why.trim()) return { kind: 'why', text: goals.why.trim() };
  return null;
};

// One line for Home's progress card.
export const homeInsight = (sessions: ProgSession[], sets: ProgSet[], today: Date, restWeeks: number[]): string => {
  const fresh: PersonalRecord | null = freshRecord(sets, today);
  if (fresh) return `New record: ${fresh.name}, ${formatKg(fresh.wt)} kg x ${fresh.reps}.`;
  const mi = mostImproved(sets, today);
  if (mi) return `${mi.name} is up ${Math.round(mi.pct)}% in the last 2 months.`;
  return heroSummary(sessions, sets, today, restWeeks).sentence;
};

// ---------------------------------------------------------------- first week checklist

export interface Step {
  label: string;
  done: boolean;
}

export const checklistSteps = (input: { plans: number; scheduled: number; logged: number; visitedProgress: boolean }): Step[] => [
  { label: 'Create or import a workout plan', done: input.plans > 0 },
  { label: 'Put it on your calendar', done: input.scheduled > 0 },
  { label: 'Finish your first workout', done: input.logged > 0 },
  { label: 'Look at My Progress', done: input.visitedProgress },
];

// ---------------------------------------------------------------- month in review

export interface MonthReview {
  label: string; // "October"
  partial: boolean; // the month is not over yet
  key: string; // "2026-10"
  sessions: number;
  activeDays: number;
  volume: number;
  prevVolume: number;
  change: number | null;
  records: number;
  topMuscle: string | null;
  bestLift: { name: string; wt: number; reps: number } | null;
  text: string;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// Which month to show: the one just finished in the first days of a month, otherwise this one so far.
export const reviewMonthFor = (today: Date): { year: number; month: number } =>
  today.getDate() <= 5 ? { year: today.getMonth() === 0 ? today.getFullYear() - 1 : today.getFullYear(), month: (today.getMonth() + 11) % 12 } : { year: today.getFullYear(), month: today.getMonth() };

export const monthReview = (
  sessions: ProgSession[],
  sets: ProgSet[],
  today: Date,
  year: number,
  month: number,
  signature = 'Urudhi',
): MonthReview => {
  const from = seconds(new Date(year, month, 1));
  const to = seconds(new Date(year, month + 1, 1));
  const prevFrom = seconds(new Date(year, month - 1, 1));
  const inMonth = (d: number) => d >= from && d < to;
  const ses = sessions.filter((s) => inMonth(s.d));
  const st = sets.filter((s) => inMonth(s.d));
  const prevVolume = totalVolume(sets.filter((s) => s.d >= prevFrom && s.d < from));
  const volume = totalVolume(st);
  const records = recentRecords(sets, 1000).filter((r: PersonalRecord) => inMonth(r.d)).length;
  const muscles = new Map<string, number>();
  for (const s of st) if (s.muscle && s.muscle.toLowerCase() !== 'unspecified') muscles.set(s.muscle.toLowerCase(), (muscles.get(s.muscle.toLowerCase()) ?? 0) + 1);
  const topMuscle = [...muscles.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  let bestLift: MonthReview['bestLift'] = null;
  for (const s of st) if (s.wt > 0 && (!bestLift || s.wt > bestLift.wt)) bestLift = { name: s.name, wt: s.wt, reps: s.reps };
  const change = percentChange(prevVolume, volume);
  const partial = seconds(midnight(today)) < to - DAY;
  const label = MONTHS[month];
  const lines = [
    `${label}${partial ? ' so far' : ''} on ${signature}`,
    `${ses.length} ${ses.length === 1 ? 'session' : 'sessions'} on ${new Set(ses.map((s) => s.d)).size} days`,
    volume > 0 ? `${formatLifted(volume)} lifted` : '',
    change !== null && Math.abs(change) >= 1 ? `${Math.abs(Math.round(change))}% ${change > 0 ? 'more' : 'less'} than the month before` : '',
    records > 0 ? `${records} new ${records === 1 ? 'record' : 'records'}` : '',
    bestLift ? `Heaviest: ${bestLift.name} ${formatKg(bestLift.wt)} kg x ${bestLift.reps}` : '',
    topMuscle ? `Most trained: ${topMuscle}` : '',
  ].filter(Boolean);
  return {
    label, partial, key: `${year}-${String(month + 1).padStart(2, '0')}`, sessions: ses.length, activeDays: new Set(ses.map((s) => s.d)).size,
    volume, prevVolume, change, records, topMuscle, bestLift, text: lines.join('\n'),
  };
};

