// Pure helpers for the set list of a workout in progress. Kept free of React and SQLite so the
// counting and "extra set" rules can be tested on their own.

export type SetDifficulty = 'Easy' | 'Medium' | 'Hard' | null;

export interface WorkoutSet {
  exercise_name: string;
  exercise_id: number;
  reps_goal: number;
  reps_done: string;
  weight: string;
  set_logged: boolean;
  web_link: string | null;
  muscle_group: string | null;
  exercise_notes: string | null;
  comments: string;
  difficulty: SetDifficulty;
  // True for sets added on the spot ("Add extra set"), false for the planned ones.
  is_extra: boolean;
  // The planned exercise this set was cloned from: renaming an extra set back to this name
  // restores its form notes and link, any other name clears them.
  base_name: string;
  base_notes: string | null;
  base_link: string | null;
  // Row id in Weight_Log once the set is logged, so it can be corrected later.
  weight_log_id: number | null;
}

const normalizeName = (name: string) => name.trim().toLowerCase();

// Sets belong to one "group" when they share the planned exercise and the name they are logged
// under. A renamed extra set therefore counts on its own (1/1), apart from the planned sets.
export const sameGroup = (a: WorkoutSet, b: WorkoutSet) =>
  a.exercise_id === b.exercise_id && a.exercise_name === b.exercise_name;

export function groupIndices(sets: WorkoutSet[], index: number): number[] {
  const current = sets[index];
  if (!current) return [];
  const result: number[] = [];
  sets.forEach((s, i) => {
    if (sameGroup(s, current)) result.push(i);
  });
  return result;
}

// number: position of the set within its group; total: size of the group; logged: how many are done.
export function groupStats(sets: WorkoutSet[], index: number) {
  const indices = groupIndices(sets, index);
  return {
    number: indices.filter((i) => i <= index).length,
    total: indices.length,
    logged: indices.filter((i) => sets[i].set_logged).length,
  };
}

export function exerciseDone(sets: WorkoutSet[], exerciseId: number): boolean {
  const own = sets.filter((s) => s.exercise_id === exerciseId);
  return own.length > 0 && own.every((s) => s.set_logged);
}

export function firstUnloggedIndex(sets: WorkoutSet[], exerciseId: number): number {
  return sets.findIndex((s) => s.exercise_id === exerciseId && !s.set_logged);
}

// An extra set nobody logged is thrown away as soon as the user leaves it.
export function dropUnloggedExtras(sets: WorkoutSet[]): WorkoutSet[] {
  return sets.some((s) => s.is_extra && !s.set_logged)
    ? sets.filter((s) => !s.is_extra || s.set_logged)
    : sets;
}

// Appends a blank set to the group of the set at `index`. Only allowed once every set of that
// exercise is logged; returns null otherwise.
export function addExtraSet(sets: WorkoutSet[], index: number): { sets: WorkoutSet[]; index: number } | null {
  const current = sets[index];
  if (!current || !exerciseDone(sets, current.exercise_id)) return null;
  const group = groupIndices(sets, index);
  const insertAt = group[group.length - 1] + 1;
  const extra: WorkoutSet = {
    ...current,
    reps_done: '',
    weight: '',
    comments: '',
    set_logged: false,
    difficulty: null,
    is_extra: true,
    weight_log_id: null,
  };
  const next = [...sets];
  next.splice(insertAt, 0, extra);
  return { sets: next, index: insertAt };
}

// Applies a new name to an extra set. Form notes and the link only make sense for the planned
// exercise, so they follow the name.
export function renameExtraSet(set: WorkoutSet, name: string): WorkoutSet {
  const backToBase = normalizeName(name) === normalizeName(set.base_name);
  return {
    ...set,
    exercise_name: name,
    exercise_notes: backToBase ? set.base_notes : null,
    web_link: backToBase ? set.base_link : null,
  };
}

// The values of the latest logged set in the same group, shown as a grey hint on a blank set.
export function previousSetHint(sets: WorkoutSet[], index: number): { weight: string; reps: string } | null {
  const group = groupIndices(sets, index).filter((i) => i < index && sets[i].set_logged);
  if (group.length === 0) return null;
  const last = sets[group[group.length - 1]];
  return { weight: last.weight, reps: last.reps_done };
}

// Where "Next exercise" goes: the next exercise after `exerciseId` (in plan order) that still has
// unlogged sets, otherwise any earlier one that was skipped. null means the workout is done.
export function nextUnloggedExerciseId(exerciseOrder: number[], sets: WorkoutSet[], exerciseId: number): number | null {
  const at = exerciseOrder.indexOf(exerciseId);
  const candidates = [...exerciseOrder.slice(at + 1), ...exerciseOrder.slice(0, Math.max(at, 0))];
  return candidates.find((id) => sets.some((s) => s.exercise_id === id && !s.set_logged)) ?? null;
}

export function unloggedCount(sets: WorkoutSet[]): number {
  return sets.filter((s) => !s.set_logged).length;
}
