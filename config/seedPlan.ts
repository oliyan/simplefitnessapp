import type { ExportedWorkout } from '../utils/workoutSharingUtils';

// A workout plan added on the first launch, for a private build. Empty in the open-source app.
export const SEED_PLAN: ExportedWorkout | null = null;

// How many weeks of sessions to put on the calendar for that plan on the first launch (0 = none).
export const SEED_SCHEDULE_WEEKS = 0;
