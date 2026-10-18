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
): Promise<{ found: boolean; note: string | null }> => {
  const row = await db.getFirstAsync(
    `SELECT note_text FROM Coach_Notes
     WHERE workout_name = ? AND day_name = ? AND workout_date = ?`,
    [workoutName, dayName, workoutDate],
  );
  return row ? { found: true, note: row.note_text ?? null } : { found: false, note: null };
};

export const saveCoachNote = async (
  db: any,
  workoutName: string,
  dayName: string,
  workoutDate: number,
  note: string | null,
) => {
  await db.runAsync(
    `INSERT OR REPLACE INTO Coach_Notes (workout_name, day_name, workout_date, note_text, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [workoutName, dayName, workoutDate, note, Math.floor(Date.now() / 1000)],
  );
};
