// Builds the text the coach-note prompt sees: today's plan, the last session for
// each muscle group in it, and everything logged in the 72 hours before the workout.

const DAY_SECONDS = 24 * 60 * 60;
const MAX_RECENT_ROWS = 150;
const MAX_COMMENT_CHARS = 300;

interface PlannedExercise {
  exercise_name: string;
  sets: number;
  reps: number;
  muscle_group: string | null;
}

interface LoggedSetRow {
  exercise_name: string;
  muscle_group: string | null;
  set_number: number;
  weight_logged: number;
  reps_logged: number;
  difficulty: string | null;
  comments: string | null;
  workout_date?: number;
}

const formatDate = (unixSeconds: number) => {
  const d = new Date(unixSeconds * 1000);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
};

const formatSet = (row: LoggedSetRow, unit: string) => {
  let line = `${row.exercise_name} set ${row.set_number}: ${row.weight_logged}${unit} x ${row.reps_logged}`;
  if (row.difficulty) line += `, felt ${row.difficulty}`;
  if (row.comments && row.comments.trim()) {
    line += `, comment: "${row.comments.trim().slice(0, MAX_COMMENT_CHARS)}"`;
  }
  return line;
};

// Returns null when there is no history at all, so the caller can skip the API call.
export const buildCoachNoteContext = async (
  db: any,
  params: {
    workoutLogId: number;
    workoutName: string;
    dayName: string;
    workoutDate: number;
    exercises: PlannedExercise[];
    weightUnit: string;
  },
): Promise<string | null> => {
  const { workoutLogId, workoutName, dayName, workoutDate, exercises, weightUnit } = params;
  let hasHistory = false;

  const planLines = exercises.map(
    (e) => `- ${e.exercise_name} [${e.muscle_group ?? 'untagged'}] ${e.sets} x ${e.reps}`,
  );

  // Most recent earlier session for each muscle group in today's plan.
  const groups = Array.from(
    new Set(exercises.map((e) => e.muscle_group).filter((g): g is string => !!g)),
  );
  const groupSections: string[] = [];
  for (const group of groups) {
    const last = await db.getFirstAsync(
      `SELECT w.workout_log_id, w.workout_date
       FROM Weight_Log wl
       JOIN Workout_Log w ON wl.workout_log_id = w.workout_log_id
       WHERE wl.muscle_group = ? AND w.workout_date < ? AND w.workout_log_id != ?
       ORDER BY w.workout_date DESC, w.workout_log_id DESC
       LIMIT 1`,
      [group, workoutDate, workoutLogId],
    );
    if (!last) continue;
    const rows: LoggedSetRow[] = await db.getAllAsync(
      `SELECT exercise_name, muscle_group, set_number, weight_logged, reps_logged, difficulty, comments
       FROM Weight_Log
       WHERE workout_log_id = ? AND muscle_group = ?
       ORDER BY weight_log_id`,
      [last.workout_log_id, group],
    );
    if (rows.length === 0) continue;
    hasHistory = true;
    groupSections.push(
      `Last ${group} session (${formatDate(last.workout_date)}):\n` +
        rows.map((r) => `- ${formatSet(r, weightUnit)}`).join('\n'),
    );
  }

  // Everything in the 72 hours before this workout, whatever the muscle group.
  const recent: LoggedSetRow[] = await db.getAllAsync(
    `SELECT w.workout_date, wl.exercise_name, wl.muscle_group, wl.set_number,
            wl.weight_logged, wl.reps_logged, wl.difficulty, wl.comments
     FROM Weight_Log wl
     JOIN Workout_Log w ON wl.workout_log_id = w.workout_log_id
     WHERE w.workout_date >= ? AND w.workout_date < ? AND w.workout_log_id != ?
     ORDER BY w.workout_date DESC, wl.weight_log_id
     LIMIT ${MAX_RECENT_ROWS}`,
    [workoutDate - 3 * DAY_SECONDS, workoutDate, workoutLogId],
  );
  if (recent.length > 0) hasHistory = true;

  if (!hasHistory) return null;

  const parts = [
    `Today's workout: ${workoutName} - ${dayName} (${formatDate(workoutDate)})`,
    `Planned exercises:\n${planLines.join('\n')}`,
    ...groupSections,
    recent.length > 0
      ? `All sets logged in the previous 72 hours:\n` +
        recent
          .map((r) => `- ${formatDate(r.workout_date as number)} ${formatSet(r, weightUnit)}`)
          .join('\n')
      : `No sets were logged in the previous 72 hours.`,
  ];
  return parts.join('\n\n');
};
