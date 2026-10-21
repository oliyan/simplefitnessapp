// Numbers for the Progress screens, computed from rows of Workout_Log and Weight_Log.
// Pure functions (no database), so they can be tried with a plain script. Dates are Unix seconds at
// local midnight, like the rest of the app; weights are kilograms.
import { weekStart, weeklyStreak, findPersonalRecords, PersonalRecord, WorkoutRow } from './dashboardStats';

export interface ProgSet {
  d: number; // workout_date of the session
  name: string;
  wt: number;
  reps: number;
  setNo: number;
  logId: number;
  muscle: string | null;
}

export interface ProgSession {
  logId: number;
  d: number;
  name: string;
  day: string;
  durationSec: number | null;
}

const DAY = 86400;
const midnight = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const seconds = (date: Date) => Math.floor(date.getTime() / 1000);
const addDays = (date: Date, days: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
const round1 = (n: number) => Math.round(n * 10) / 10;

// ---------------------------------------------------------------- formatting

export const formatKg = (kg: number): string => {
  const rounded = Math.abs(kg) >= 100 ? Math.round(kg) : round1(kg);
  return rounded.toLocaleString('en-US', { maximumFractionDigits: 1 });
};

// 8,400 kg reads as "8.4 tonnes" once it is large enough to be easier to take in.
export const formatLifted = (kg: number): string =>
  kg >= 5000 ? `${round1(kg / 1000).toLocaleString('en-US')} tonnes` : `${formatKg(kg)} kg`;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const shortDate = (d: number): string => {
  const date = new Date(d * 1000);
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
};

// ---------------------------------------------------------------- strength maths

// Estimated one-rep max (Epley). A single rep is the weight itself.
export const estimate1RM = (wt: number, reps: number): number => {
  if (wt <= 0 || reps <= 0) return 0;
  return reps === 1 ? wt : round1(wt * (1 + reps / 30));
};

export type MetricKind = 'e1rm' | 'weight' | 'volume' | 'reps';

export interface SeriesPoint {
  d: number;
  v: number;
  top: { wt: number; reps: number }; // the set that produced the value
  sets: { wt: number; reps: number }[];
  isRecord: boolean; // a new best for this metric
}

// An exercise is "loaded" when any set used weight; otherwise it is counted in reps (plank, push-ups).
export const isLoaded = (sets: ProgSet[]): boolean => sets.some((s) => s.wt > 0);

export const defaultMetric = (sets: ProgSet[]): MetricKind => (isLoaded(sets) ? 'e1rm' : 'reps');

export const metricLabel = (m: MetricKind): string =>
  ({ e1rm: 'Estimated max', weight: 'Heaviest set', volume: 'Total lifted', reps: 'Reps' } as const)[m];

export const metricHelp = (m: MetricKind): string =>
  ({
    e1rm: 'The most you could probably lift for one rep, worked out from your heaviest sets (weight x (1 + reps / 30)). It lets sessions with different reps be compared fairly.',
    weight: 'The heaviest weight you used in each session.',
    volume: 'Weight x reps added up over all the sets of the exercise in each session. It grows when you lift more weight or do more reps.',
    reps: 'The most reps you did in a single set in each session.',
  } as const)[m];

export const metricUnit = (m: MetricKind): string => (m === 'reps' ? 'reps' : 'kg');

// One value per session for one exercise, oldest first.
export const exerciseSeries = (sets: ProgSet[], name: string, metric: MetricKind): SeriesPoint[] => {
  const byLog = new Map<number, ProgSet[]>();
  for (const s of sets) {
    if (s.name !== name) continue;
    const list = byLog.get(s.logId) ?? [];
    list.push(s);
    byLog.set(s.logId, list);
  }
  const sessions = [...byLog.values()].sort((a, b) => a[0].d - b[0].d || a[0].logId - b[0].logId);
  const points: SeriesPoint[] = [];
  let best = -Infinity;
  for (const list of sessions) {
    let v = 0;
    let top = list[0];
    for (const s of list) {
      const score =
        metric === 'e1rm' ? estimate1RM(s.wt, s.reps) : metric === 'weight' ? s.wt : metric === 'reps' ? s.reps : s.wt * s.reps;
      if (metric === 'volume') v += score;
      else if (score > v) {
        v = score;
        top = s;
      }
    }
    v = round1(v);
    if (v <= 0) continue;
    const isRecord = points.length > 0 && v > best;
    best = Math.max(best, v);
    points.push({
      d: list[0].d,
      v,
      top: { wt: top.wt, reps: top.reps },
      sets: [...list].sort((a, b) => a.setNo - b.setNo).map((s) => ({ wt: s.wt, reps: s.reps })),
      isRecord,
    });
  }
  return points;
};

export type FrameKey = '4w' | '3m' | '1y' | 'all';
export const FRAMES: { key: FrameKey; label: string; days: number }[] = [
  { key: '4w', label: '4 weeks', days: 28 },
  { key: '3m', label: '3 months', days: 91 },
  { key: '1y', label: '1 year', days: 365 },
  { key: 'all', label: 'All', days: 0 },
];

export const inFrame = (points: SeriesPoint[], frame: FrameKey, today: Date): SeriesPoint[] => {
  const days = FRAMES.find((f) => f.key === frame)?.days ?? 0;
  if (!days) return points;
  const from = seconds(addDays(midnight(today), -days));
  return points.filter((p) => p.d >= from);
};

// Least-squares line through the points, as [start value, end value]; null for fewer than 3 points.
export const trendLine = (points: SeriesPoint[]): [number, number] | null => {
  const n = points.length;
  if (n < 3) return null;
  const xs = points.map((p) => (p.d - points[0].d) / DAY);
  const ys = points.map((p) => p.v);
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    den += (xs[i] - mx) ** 2;
  }
  if (den === 0) return null;
  const slope = num / den;
  const at = (x: number) => my + slope * (x - mx);
  return [at(xs[0]), at(xs[n - 1])];
};

export const percentChange = (from: number, to: number): number | null => (from > 0 ? ((to - from) / from) * 100 : null);

const weeksBetween = (a: number, b: number) => Math.max(1, Math.round((b - a) / (7 * DAY)));

// One plain sentence about a chart. Never scolds: a dip is described gently.
export const insightFor = (points: SeriesPoint[], metric: MetricKind): string => {
  const unit = metricUnit(metric);
  if (points.length === 0) return 'Nothing logged for this in the chosen time frame.';
  const last = points[points.length - 1];
  if (points.length === 1) return `One session so far: ${formatKg(last.v)} ${unit} on ${shortDate(last.d)}. Log it again to see a line.`;
  const first = points[0];
  const best = points.reduce((a, b) => (b.v > a.v ? b : a));
  const change = percentChange(first.v, last.v);
  const span = weeksBetween(first.d, last.d);
  const when = span === 1 ? 'in a week' : `in ${span} weeks`;
  let lead: string;
  if (change === null || Math.abs(change) < 1) lead = `Holding steady ${when}.`;
  else if (change > 0) lead = `Up ${Math.round(change)}% ${when}.`;
  else lead = `Down ${Math.abs(Math.round(change))}% ${when}. A lighter spell is normal and you can build back.`;
  return `${lead} Best: ${formatKg(best.v)} ${unit} on ${shortDate(best.d)}.`;
};

// ---------------------------------------------------------------- compare with the period before

export interface Comparison {
  frameLabel: string;
  prev: number;
  cur: number;
  pct: number | null;
}

// The best value in the chosen time frame against the best in the same length of time just before it.
export const compareWithPrevious = (all: SeriesPoint[], frame: FrameKey, today: Date): Comparison | null => {
  const f = FRAMES.find((x) => x.key === frame);
  if (!f || !f.days) return null;
  const end = seconds(midnight(today));
  const start = end - f.days * DAY;
  const prevStart = start - f.days * DAY;
  const cur = all.filter((p) => p.d >= start);
  const prev = all.filter((p) => p.d >= prevStart && p.d < start);
  if (cur.length === 0 || prev.length === 0) return null;
  const best = (ps: SeriesPoint[]) => Math.max(...ps.map((p) => p.v));
  return { frameLabel: f.label, prev: best(prev), cur: best(cur), pct: percentChange(best(prev), best(cur)) };
};

export const compareSentence = (c: Comparison, unit: string): string => {
  const change = c.pct === null || Math.abs(c.pct) < 1 ? 'about the same' : `${c.pct > 0 ? 'up' : 'down'} ${Math.abs(Math.round(c.pct))}%`;
  return `Against the ${c.frameLabel} before: best ${formatKg(c.prev)} ${unit} then, ${formatKg(c.cur)} ${unit} now, ${change}.`;
};

// ---------------------------------------------------------------- exercise list

export interface ExerciseSummary {
  name: string;
  metric: MetricKind;
  sessions: number;
  lastDate: number;
  last: number;
  spark: number[]; // up to 12 latest values
  change: number | null; // % change over the sparkline window
  muscle: string | null;
}

export const exerciseSummaries = (sets: ProgSet[]): ExerciseSummary[] => {
  const byName = new Map<string, ProgSet[]>();
  for (const s of sets) {
    const list = byName.get(s.name) ?? [];
    list.push(s);
    byName.set(s.name, list);
  }
  const out: ExerciseSummary[] = [];
  byName.forEach((list, name) => {
    const metric = defaultMetric(list);
    const series = exerciseSeries(list, name, metric);
    if (series.length === 0) return;
    const window = series.slice(-12);
    out.push({
      name,
      metric,
      sessions: series.length,
      lastDate: series[series.length - 1].d,
      last: series[series.length - 1].v,
      spark: window.map((p) => p.v),
      change: window.length > 1 ? percentChange(window[0].v, window[window.length - 1].v) : null,
      muscle: list.find((s) => s.muscle)?.muscle ?? null,
    });
  });
  return out.sort((a, b) => b.lastDate - a.lastDate || a.name.localeCompare(b.name));
};

// ---------------------------------------------------------------- overview

export interface Hero {
  streak: number;
  sessionsThisWeek: number;
  volume30: number;
  volumePrev30: number;
  volumeChange: number | null;
  sentence: string;
}

export const heroSummary = (sessions: ProgSession[], sets: ProgSet[], today: Date): Hero => {
  const rows: WorkoutRow[] = sessions.map((s) => ({ workout_log_id: s.logId, workout_date: s.d, workout_name: s.name, day_name: s.day, logged: 1 }));
  const startThis = seconds(weekStart(today));
  const todayTs = seconds(midnight(today));
  const from30 = todayTs - 29 * DAY;
  const fromPrev = from30 - 30 * DAY;
  let volume30 = 0;
  let volumePrev30 = 0;
  for (const s of sets) {
    const v = s.wt * s.reps;
    if (s.d >= from30 && s.d <= todayTs) volume30 += v;
    else if (s.d >= fromPrev && s.d < from30) volumePrev30 += v;
  }
  const volumeChange = percentChange(volumePrev30, volume30);
  let sentence: string;
  if (volume30 <= 0) sentence = 'No weight logged in the last 30 days. One session and this fills in.';
  else if (volumeChange === null) sentence = `You lifted ${formatLifted(volume30)} in the last 30 days.`;
  else if (volumeChange >= 1) sentence = `You lifted ${formatLifted(volume30)} in the last 30 days, ${Math.round(volumeChange)}% more than the 30 before.`;
  else if (volumeChange <= -1) sentence = `You lifted ${formatLifted(volume30)} in the last 30 days, a bit less than the 30 before. Easy weeks happen.`;
  else sentence = `You lifted ${formatLifted(volume30)} in the last 30 days, about the same as the 30 before.`;
  return {
    streak: weeklyStreak(rows, today),
    sessionsThisWeek: sessions.filter((s) => s.d >= startThis).length,
    volume30,
    volumePrev30,
    volumeChange,
    sentence,
  };
};

export interface HeatCell {
  d: number;
  sessions: number;
  level: 0 | 1 | 2 | 3;
  future: boolean;
}

// Columns are weeks (oldest first), rows are Monday to Sunday. Darker means more lifted that day.
export const consistencyGrid = (sessions: ProgSession[], sets: ProgSet[], today: Date, weeks = 12): HeatCell[][] => {
  const volumeByDay = new Map<number, number>();
  for (const s of sets) volumeByDay.set(s.d, (volumeByDay.get(s.d) ?? 0) + s.wt * s.reps + (s.wt === 0 ? s.reps : 0));
  const sessionsByDay = new Map<number, number>();
  for (const s of sessions) sessionsByDay.set(s.d, (sessionsByDay.get(s.d) ?? 0) + 1);
  const nonzero = [...volumeByDay.values()].filter((v) => v > 0).sort((a, b) => a - b);
  const q = (p: number) => nonzero[Math.min(nonzero.length - 1, Math.floor(nonzero.length * p))] ?? 0;
  const t1 = q(0.34);
  const t2 = q(0.67);
  const first = addDays(weekStart(today), -7 * (weeks - 1));
  const todayTs = seconds(midnight(today));
  const grid: HeatCell[][] = [];
  for (let w = 0; w < weeks; w++) {
    const col: HeatCell[] = [];
    for (let i = 0; i < 7; i++) {
      const ts = seconds(addDays(first, w * 7 + i));
      const count = sessionsByDay.get(ts) ?? 0;
      const v = volumeByDay.get(ts) ?? 0;
      const level: HeatCell['level'] = count === 0 ? 0 : v <= t1 ? 1 : v <= t2 ? 2 : 3;
      col.push({ d: ts, sessions: count, level, future: ts > todayTs });
    }
    grid.push(col);
  }
  return grid;
};

export interface Improved {
  name: string;
  metric: MetricKind;
  from: number;
  to: number;
  pct: number;
}

// The exercise whose best value rose most over the last 60 days (needs 3 sessions and a real rise).
export const mostImproved = (sets: ProgSet[], today: Date): Improved | null => {
  const from = seconds(addDays(midnight(today), -60));
  let best: Improved | null = null;
  const names = [...new Set(sets.map((s) => s.name))];
  for (const name of names) {
    const own = sets.filter((s) => s.name === name);
    const metric = defaultMetric(own);
    const series = exerciseSeries(own, name, metric).filter((p) => p.d >= from);
    if (series.length < 3) continue;
    const a = series[0].v;
    const b = series[series.length - 1].v;
    const pct = percentChange(a, b);
    if (pct === null || pct < 3) continue;
    if (!best || pct > best.pct) best = { name, metric, from: a, to: b, pct };
  }
  return best;
};

export const recentRecords = (sets: ProgSet[], limit: number): PersonalRecord[] =>
  findPersonalRecords(sets.map((s) => ({ d: s.d, name: s.name, wt: s.wt, reps: s.reps })), limit);

// ---------------------------------------------------------------- muscle balance

export type MuscleArea = 'push' | 'pull' | 'lower' | 'core';
export const AREA_OF: Record<string, MuscleArea> = {
  chest: 'push', shoulders: 'push', triceps: 'push',
  back: 'pull', biceps: 'pull', forearms: 'pull',
  legs: 'lower', quads: 'lower', hamstrings: 'lower', glutes: 'lower', calves: 'lower',
  abs: 'core', core: 'core',
};

export interface MuscleLoad {
  muscle: string;
  sets: number;
}

export const muscleLoads = (sets: ProgSet[], today: Date, days = 30): MuscleLoad[] => {
  const from = seconds(addDays(midnight(today), -days));
  const counts = new Map<string, number>();
  for (const s of sets) {
    if (s.d < from || !s.muscle) continue;
    const m = s.muscle.toLowerCase();
    if (m === 'unspecified') continue;
    counts.set(m, (counts.get(m) ?? 0) + 1);
  }
  return [...counts.entries()].map(([muscle, n]) => ({ muscle, sets: n })).sort((a, b) => b.sets - a.sets);
};

export const balanceSentence = (loads: MuscleLoad[]): string => {
  const total = loads.reduce((a, l) => a + l.sets, 0);
  if (total < 12) return 'Log a few more sessions and your muscle balance shows up here.';
  const area = (a: MuscleArea) => loads.filter((l) => AREA_OF[l.muscle] === a).reduce((x, l) => x + l.sets, 0);
  const push = area('push');
  const pull = area('pull');
  const lower = area('lower');
  const upper = push + pull;
  if (push > 0 && pull > 0) {
    const r = push / pull;
    if (r > 1.5) return 'Push work is well ahead of pull work. A few more rows or pulldowns would balance it.';
    if (r < 0.67) return 'Pull work is well ahead of push work. A little more pressing would balance it.';
  } else if (push > 0 || pull > 0) {
    return push > 0 ? 'Only push muscles were trained lately. Add some pulling too.' : 'Only pull muscles were trained lately. Add some pressing too.';
  }
  if (lower === 0) return 'No leg work in the last 30 days. Legs are the biggest muscles, so they are worth a day.';
  if (upper > 0 && lower / upper < 0.3) return 'Upper body gets most of the work. A bit more leg work would even it out.';
  return 'Push and pull are balanced, and legs are getting their share. Nicely done.';
};

// ---------------------------------------------------------------- badges

export interface Badge {
  id: string;
  title: string;
  hint: string;
  earned: boolean;
  icon: string;
  progress: string; // e.g. "7 of 10"
}

export const totalVolume = (sets: ProgSet[]): number => sets.reduce((a, s) => a + s.wt * s.reps, 0);

export const badges = (sessions: ProgSession[], sets: ProgSet[], today: Date): Badge[] => {
  const n = sessions.length;
  const rows: WorkoutRow[] = sessions.map((s) => ({ workout_log_id: s.logId, workout_date: s.d, workout_name: s.name, day_name: s.day, logged: 1 }));
  const perWeek = new Map<number, number>();
  for (const s of sessions) {
    const k = seconds(weekStart(new Date(s.d * 1000)));
    perWeek.set(k, (perWeek.get(k) ?? 0) + 1);
  }
  const bestWeek = Math.max(0, ...perWeek.values());
  // The longest run of weeks in a row, not only the current one.
  const weekKeys = [...perWeek.keys()].sort((a, b) => a - b);
  let longest = 0;
  let run = 0;
  weekKeys.forEach((k, i) => {
    run = i > 0 && k - weekKeys[i - 1] === 7 * DAY ? run + 1 : 1;
    longest = Math.max(longest, run);
  });
  const current = weeklyStreak(rows, today);
  longest = Math.max(longest, current);
  const kg = totalVolume(sets);
  const hasRecord = recentRecords(sets, 1).length > 0;
  const of = (v: number, goal: number) => `${Math.min(v, goal).toLocaleString('en-US')} of ${goal.toLocaleString('en-US')}`;
  return [
    { id: 'first', title: 'First workout', hint: 'Log your first session', earned: n >= 1, icon: 'flag', progress: of(n, 1) },
    { id: 'ten', title: '10 sessions', hint: 'Log 10 sessions', earned: n >= 10, icon: 'barbell', progress: of(n, 10) },
    { id: 'twentyfive', title: '25 sessions', hint: 'Log 25 sessions', earned: n >= 25, icon: 'medal', progress: of(n, 25) },
    { id: 'fifty', title: '50 sessions', hint: 'Log 50 sessions', earned: n >= 50, icon: 'ribbon', progress: of(n, 50) },
    { id: 'fullweek', title: 'Full week', hint: 'Train 3 times in one week', earned: bestWeek >= 3, icon: 'calendar', progress: of(bestWeek, 3) },
    { id: 'streak4', title: '4 weeks in a row', hint: 'Train in 4 weeks running', earned: longest >= 4, icon: 'flame', progress: of(longest, 4) },
    { id: 'streak8', title: '8 weeks in a row', hint: 'Train in 8 weeks running', earned: longest >= 8, icon: 'bonfire', progress: of(longest, 8) },
    { id: 'record', title: 'First record', hint: 'Lift more than your best on an exercise', earned: hasRecord, icon: 'trophy', progress: hasRecord ? '1 of 1' : '0 of 1' },
    { id: 'tonne', title: 'One tonne', hint: 'Lift 1,000 kg in total', earned: kg >= 1000, icon: 'cube', progress: of(Math.round(kg), 1000) },
    { id: 'tentonnes', title: 'Ten tonnes', hint: 'Lift 10,000 kg in total', earned: kg >= 10000, icon: 'planet', progress: of(Math.round(kg), 10000) },
  ];
};

// ---------------------------------------------------------------- weekly recap

export interface Recap {
  label: string; // "This week" or "Last week"
  sessions: number;
  sets: number;
  volume: number;
  records: number;
  topLift: { name: string; wt: number; reps: number } | null;
  streak: number;
  text: string; // ready to share
}

// The week so far if it has anything in it, otherwise the one before.
export const weeklyRecap = (sessions: ProgSession[], sets: ProgSet[], today: Date, signature = 'Urudhi'): Recap => {
  const thisStart = weekStart(today);
  const pick = (start: Date) => {
    const a = seconds(start);
    const b = seconds(addDays(start, 7));
    return { a, b, ses: sessions.filter((s) => s.d >= a && s.d < b), st: sets.filter((s) => s.d >= a && s.d < b) };
  };
  let label = 'This week';
  let w = pick(thisStart);
  if (w.ses.length === 0) {
    label = 'Last week';
    w = pick(addDays(thisStart, -7));
  }
  const records = recentRecords(sets, 500).filter((r) => r.d >= w.a && r.d < w.b).length;
  let top: Recap['topLift'] = null;
  for (const s of w.st) if (s.wt > 0 && (!top || s.wt > top.wt)) top = { name: s.name, wt: s.wt, reps: s.reps };
  const volume = totalVolume(w.st);
  const rows: WorkoutRow[] = sessions.map((s) => ({ workout_log_id: s.logId, workout_date: s.d, workout_name: s.name, day_name: s.day, logged: 1 }));
  const streak = weeklyStreak(rows, today);
  const lines = [
    `${label} on ${signature}`,
    `${w.ses.length} ${w.ses.length === 1 ? 'session' : 'sessions'}, ${w.st.length} sets`,
    volume > 0 ? `${formatLifted(volume)} lifted` : '',
    records > 0 ? `${records} new ${records === 1 ? 'record' : 'records'}` : '',
    top ? `Heaviest: ${top.name} ${formatKg(top.wt)} kg x ${top.reps}` : '',
    streak > 0 ? `${streak} ${streak === 1 ? 'week' : 'weeks'} in a row` : '',
  ].filter(Boolean);
  return { label, sessions: w.ses.length, sets: w.st.length, volume, records, topLift: top, streak, text: lines.join('\n') };
};

// A new record the person has not been shown yet: the newest record within the last 7 days.
export const freshRecord = (sets: ProgSet[], today: Date): PersonalRecord | null => {
  const from = seconds(addDays(midnight(today), -7));
  const r = recentRecords(sets, 1)[0];
  return r && r.d >= from ? r : null;
};
