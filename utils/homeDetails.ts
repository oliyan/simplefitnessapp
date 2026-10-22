import { ensureCoachNotesTable, getCachedCoachNote } from './coachNotesUtils';
import { estimateMinutes, firstSentence } from './motivation';

export interface SessionDetail {
  exercises: number;
  sets: number;
  minutes: number;
  muscles: string[];
  note: string | null; // the first line of the coach's note, when one was already written
}

interface SessionRef {
  workout_log_id: number;
  workout_name: string;
  day_name: string;
  workout_date: number;
}

// What is in each of the given sessions: how many exercises and sets, about how long it takes, which
// muscles it works, and the coach's first line if a note is already saved. Reads only; never calls the AI.
export const loadSessionDetails = async (db: any, sessions: SessionRef[]): Promise<Record<number, SessionDetail>> => {
  const out: Record<number, SessionDetail> = {};
  if (sessions.length === 0) return out;
  try {
    await ensureCoachNotesTable(db);
  } catch {
    // the notes table is optional here
  }
  for (const s of sessions) {
    try {
      const totals = await db.getFirstAsync(
        'SELECT COUNT(*) AS c, COALESCE(SUM(sets), 0) AS s FROM Logged_Exercises WHERE workout_log_id = ?;',
        [s.workout_log_id],
      );
      const muscleRows = await db.getAllAsync(
        "SELECT DISTINCT muscle_group FROM Logged_Exercises WHERE workout_log_id = ? AND muscle_group IS NOT NULL AND muscle_group != '' AND LOWER(muscle_group) != 'unspecified';",
        [s.workout_log_id],
      );
      const past = await db.getFirstAsync(
        'SELECT AVG(completion_time) AS avg FROM Workout_Log WHERE workout_name = ? AND day_name = ? AND completion_time > 0 AND workout_log_id != ?;',
        [s.workout_name, s.day_name, s.workout_log_id],
      );
      let note: string | null = null;
      try {
        const cached = await getCachedCoachNote(db, s.workout_name, s.day_name, s.workout_date);
        note = cached.note?.summary ? firstSentence(cached.note.summary) : null;
      } catch {
        note = null;
      }
      const sets = Number(totals?.s ?? 0);
      out[s.workout_log_id] = {
        exercises: Number(totals?.c ?? 0),
        sets,
        minutes: estimateMinutes(sets, past?.avg ?? null),
        muscles: (muscleRows as { muscle_group: string }[]).map((r) => r.muscle_group.toLowerCase()).slice(0, 4),
        note,
      };
    } catch (error) {
      console.error('Error loading session details:', error);
    }
  }
  return out;
};
