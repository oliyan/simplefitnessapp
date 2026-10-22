import { ensureInProgressColumn } from './workoutProgress';
import { ProgSession, ProgSet } from './progressStats';

// Every finished session and every set that belongs to one, oldest first. In-progress sessions are left out.
export const loadProgress = async (db: any): Promise<{ sessions: ProgSession[]; sets: ProgSet[] }> => {
  await ensureInProgressColumn(db);
  const sessions: ProgSession[] = await db.getAllAsync(
    `SELECT w.workout_log_id AS logId, w.workout_date AS d, w.workout_name AS name, w.day_name AS day,
            w.completion_time AS durationSec
     FROM Workout_Log w
     WHERE EXISTS (SELECT 1 FROM Weight_Log x WHERE x.workout_log_id = w.workout_log_id)
       AND COALESCE(w.in_progress, 0) = 0
     ORDER BY w.workout_date, w.workout_log_id;`,
  );
  const ids = new Set(sessions.map((s) => s.logId));
  const rows: ProgSet[] = await db.getAllAsync(
    `SELECT w.workout_date AS d, wl.exercise_name AS name, wl.weight_logged AS wt, wl.reps_logged AS reps,
            wl.set_number AS setNo, wl.workout_log_id AS logId, le.muscle_group AS muscle
     FROM Weight_Log wl
     JOIN Workout_Log w ON w.workout_log_id = wl.workout_log_id
     LEFT JOIN Logged_Exercises le ON le.logged_exercise_id = wl.logged_exercise_id
     ORDER BY w.workout_date, wl.weight_log_id;`,
  );
  return { sessions, sets: rows.filter((r) => ids.has(r.logId)) };
};
