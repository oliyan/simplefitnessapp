export interface CoachNote {
  summary: string | null; // shown on the workout overview
  exercises: Record<string, string>; // one-liners shown on the matching exercise screen
}

// Stored as JSON in note_text. Older rows hold plain text, which is the summary.
export const parseCoachNote = (raw: string | null): CoachNote | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return { summary: parsed.summary ?? null, exercises: parsed.exercises ?? {} };
    }
  } catch {}
  return { summary: raw, exercises: {} };
};

// Cache for AI coach notes, one row per workout/day/date. A NULL note_text is a
// valid cached result meaning "the model had nothing to say".

export const ensureCoachNotesTable = async (db: any) => {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS Coach_Notes (
      note_id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
      workout_name TEXT NOT NULL,
      day_name TEXT NOT NULL,
      workout_date INTEGER NOT NULL,
      note_text TEXT,
      created_at INTEGER NOT NULL,
      UNIQUE (workout_name, day_name, workout_date)
    );
  `);
};

export const getCachedCoachNote = async (
  db: any,
  workoutName: string,
  dayName: string,
  workoutDate: number,
): Promise<{ found: boolean; note: CoachNote | null }> => {
  const row = await db.getFirstAsync(
    `SELECT note_text FROM Coach_Notes
     WHERE workout_name = ? AND day_name = ? AND workout_date = ?`,
    [workoutName, dayName, workoutDate],
  );
  return row
    ? { found: true, note: parseCoachNote(row.note_text ?? null) }
    : { found: false, note: null };
};

export const saveCoachNote = async (
  db: any,
  workoutName: string,
  dayName: string,
  workoutDate: number,
  note: CoachNote | null,
) => {
  await db.runAsync(
    `INSERT OR REPLACE INTO Coach_Notes (workout_name, day_name, workout_date, note_text, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [workoutName, dayName, workoutDate, note ? JSON.stringify(note) : null, Math.floor(Date.now() / 1000)],
  );
};
