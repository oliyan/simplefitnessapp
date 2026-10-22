// Numbers for the Home dashboard, computed from rows of Workout_Log and Weight_Log.
// Pure functions so they can be tested without a database.

export interface WorkoutRow {
  workout_log_id: number;
  workout_date: number; // Unix seconds at local midnight
  workout_name: string;
  day_name: string;
  logged: number; // 1 when sets were logged and the workout was finished (or logged by hand)
  in_progress?: number; // 1 when it was started and left halfway: it can be resumed
}

export interface SetRow {
  d: number; // workout_date of the session the set belongs to
  name: string;
  wt: number;
  reps: number;
}

export type DayState = 'rest' | 'done' | 'planned' | 'missed';

export interface WeekCell {
  date: Date;
  workouts: WorkoutRow[];
  state: DayState;
  isToday: boolean;
}

export interface PersonalRecord {
  name: string;
  wt: number;
  reps: number;
  d: number;
}

const midnight = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const toSeconds = (date: Date) => Math.floor(date.getTime() / 1000);

// Monday 00:00 (local) of the week containing `date`.
export const weekStart = (date: Date): Date => {
  const day = midnight(date);
  const sinceMonday = (day.getDay() + 6) % 7;
  return new Date(day.getFullYear(), day.getMonth(), day.getDate() - sinceMonday);
};

const addDays = (date: Date, days: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

// Monday to Sunday of the current week, each with its sessions and a state.
export const buildWeek = (rows: WorkoutRow[], today: Date): WeekCell[] => {
  const start = weekStart(today);
  const todayStart = midnight(today);
  const cells: WeekCell[] = [];
  for (let i = 0; i < 7; i++) {
    const date = addDays(start, i);
    const ts = toSeconds(date);
    const workouts = rows.filter((r) => r.workout_date === ts);
    const isPast = date.getTime() < todayStart.getTime();
    let state: DayState = 'rest';
    if (workouts.length > 0) {
      const anyLogged = workouts.some((w) => w.logged);
      const allLogged = workouts.every((w) => w.logged);
      if (isPast) state = anyLogged ? 'done' : 'missed';
      else state = allLogged ? 'done' : 'planned';
    }
    cells.push({ date, workouts, state, isToday: date.getTime() === todayStart.getTime() });
  }
  return cells;
};

// Weeks in a row (Monday to Sunday) with at least one logged session. A week that has
// just started with nothing logged yet does not break a streak from the weeks before it.
// `restWeeks` are Mondays (Unix seconds) the person marked as a rest week: such a week keeps the
// streak alive without adding to it, so an illness or a trip does not wipe out a long run.
export const weeklyStreak = (rows: WorkoutRow[], today: Date, restWeeks: number[] = []): number => {
  const weeksWithLogs = new Set<number>();
  for (const r of rows) {
    if (r.logged) weeksWithLogs.add(toSeconds(weekStart(new Date(r.workout_date * 1000))));
  }
  const rest = new Set(restWeeks);
  let cursor = weekStart(today);
  if (!weeksWithLogs.has(toSeconds(cursor)) && !rest.has(toSeconds(cursor))) cursor = addDays(cursor, -7);
  let streak = 0;
  for (;;) {
    const key = toSeconds(cursor);
    if (weeksWithLogs.has(key)) streak++;
    else if (!rest.has(key)) break;
    cursor = addDays(cursor, -7);
  }
  return streak;
};

// The earliest unfinished session from today onwards.
export const nextUpcoming = (rows: WorkoutRow[], today: Date): WorkoutRow | null => {
  const todayTs = toSeconds(midnight(today));
  const later = rows
    .filter((r) => r.workout_date >= todayTs && !r.logged)
    .sort((a, b) => a.workout_date - b.workout_date || a.workout_log_id - b.workout_log_id);
  return later[0] ?? null;
};

// A set is a record when it lifts more than anything logged for that exercise before it.
// The first time an exercise is ever logged sets the baseline and is not reported.
// One record per exercise per session (its best). Newest first.
export const findPersonalRecords = (sets: SetRow[], limit: number): PersonalRecord[] => {
  const ordered = [...sets].filter((s) => s.wt > 0 && s.reps > 0).sort((a, b) => a.d - b.d);
  const best = new Map<string, number>();
  const records: PersonalRecord[] = [];
  let i = 0;
  while (i < ordered.length) {
    // Process one session's date at a time so records compare against earlier sessions only.
    let j = i;
    while (j < ordered.length && ordered[j].d === ordered[i].d) j++;
    const session = ordered.slice(i, j);
    const sessionBest = new Map<string, SetRow>();
    for (const s of session) {
      const current = sessionBest.get(s.name);
      if (!current || s.wt > current.wt || (s.wt === current.wt && s.reps > current.reps)) sessionBest.set(s.name, s);
    }
    sessionBest.forEach((s, name) => {
      const previous = best.get(name);
      if (previous !== undefined && s.wt > previous) {
        records.push({ name, wt: s.wt, reps: s.reps, d: s.d });
      }
      if (previous === undefined || s.wt > previous) best.set(name, s.wt);
    });
    i = j;
  }
  return records.sort((a, b) => b.d - a.d).slice(0, limit);
};

// Total weight lifted (weight x reps, all sets) this week and last week.
export const weekVolumes = (sets: SetRow[], today: Date): { thisWeek: number; lastWeek: number } => {
  const thisStart = weekStart(today);
  const lastStart = addDays(thisStart, -7);
  const thisTs = toSeconds(thisStart);
  const lastTs = toSeconds(lastStart);
  const nextTs = toSeconds(addDays(thisStart, 7));
  let thisWeek = 0;
  let lastWeek = 0;
  for (const s of sets) {
    const volume = s.wt * s.reps;
    if (s.d >= thisTs && s.d < nextTs) thisWeek += volume;
    else if (s.d >= lastTs && s.d < thisTs) lastWeek += volume;
  }
  return { thisWeek, lastWeek };
};

// Whole days from `today` to a stored date: 0 today, 1 tomorrow, -1 yesterday.
export const dayDiff = (workoutDate: number, today: Date): number =>
  Math.round((workoutDate - toSeconds(midnight(today))) / 86400);
