import { type SQLiteDatabase } from 'expo-sqlite';

// Workout_Log.in_progress is 1 from the first logged set of a started workout until it is finished,
// so a workout that was left halfway can be resumed (and is not shown as done meanwhile).
// Workouts logged by hand never set it.
let columnChecked = false;

export const ensureInProgressColumn = async (db: SQLiteDatabase): Promise<void> => {
  if (columnChecked) return;
  try {
    const info = await db.getAllAsync<{ name: string }>('PRAGMA table_info(Workout_Log);');
    if (!info.some((column) => column.name === 'in_progress')) {
      await db.runAsync('ALTER TABLE Workout_Log ADD COLUMN in_progress INTEGER DEFAULT 0;');
    }
    columnChecked = true;
  } catch (error) {
    console.error('Could not add in_progress column:', error);
  }
};

export const setWorkoutInProgress = async (db: SQLiteDatabase, workoutLogId: number, inProgress: boolean) => {
  try {
    await ensureInProgressColumn(db);
    await db.runAsync('UPDATE Workout_Log SET in_progress = ? WHERE workout_log_id = ?;', [inProgress ? 1 : 0, workoutLogId]);
  } catch (error) {
    console.error('Could not update in_progress:', error);
  }
};
