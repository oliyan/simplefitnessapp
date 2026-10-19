import { dateToWeekday } from './weekdays';

export interface PlanDay {
  day_id: number;
  day_name: string;
  weekday: number | null; // 1 (Monday) to 7 (Sunday)
}

export interface Occurrence {
  date: Date; // local midnight
  timestamp: number; // Unix seconds at local midnight, as stored in Workout_Log.workout_date
  day: PlanDay;
}

export const midnight = (date: Date): Date => new Date(date.getFullYear(), date.getMonth(), date.getDate());

// Every date from `start` for `weeks` * 7 days on which one of the plan's days falls.
// Days without a weekday are left out. Result is in date order, then plan order.
export const computeOccurrences = (days: PlanDay[], start: Date, weeks: number): Occurrence[] => {
  const first = midnight(start);
  const result: Occurrence[] = [];
  for (let offset = 0; offset < weeks * 7; offset++) {
    const date = new Date(first.getFullYear(), first.getMonth(), first.getDate() + offset);
    const weekday = dateToWeekday(date);
    for (const day of days) {
      if (day.weekday === weekday) {
        result.push({ date, timestamp: Math.floor(date.getTime() / 1000), day });
      }
    }
  }
  return result;
};

// Writes the occurrences to the calendar the same way the "Schedule a workout" screen does
// (a Workout_Log row plus a copy of the day's exercises). Dates that already have this
// workout day are skipped, not duplicated.
// `reminder` (optional) schedules a notification at that time of day on each new session and stores
// its id on the session, so deleting the session cancels it.
export interface ReminderOptions {
  time: Date; // only the hours and minutes are used
  schedule: (args: {
    workoutName: string;
    dayName: string;
    scheduledDate: Date;
    notificationTime: Date;
  }) => Promise<string | null>;
}

export const scheduleOccurrences = async (
  db: any,
  workoutName: string,
  occurrences: Occurrence[],
  reminder?: ReminderOptions,
): Promise<{ added: number; skipped: number; reminders: number }> => {
  let added = 0;
  let skipped = 0;
  let reminders = 0;
  const created: { workoutLogId: number; occurrence: Occurrence }[] = [];

  await db.withTransactionAsync(async () => {
    for (const occurrence of occurrences) {
      const existing = await db.getAllAsync(
        'SELECT workout_log_id FROM Workout_Log WHERE workout_date = ? AND day_name = ? AND workout_name = ?;',
        [occurrence.timestamp, occurrence.day.day_name, workoutName],
      );
      if (existing.length > 0) {
        skipped++;
        continue;
      }

      const { lastInsertRowId: workoutLogId } = await db.runAsync(
        'INSERT INTO Workout_Log (workout_date, day_name, workout_name, notification_id) VALUES (?, ?, ?, ?);',
        [occurrence.timestamp, occurrence.day.day_name, workoutName, null],
      );

      const exercises = await db.getAllAsync(
        'SELECT exercise_name, sets, reps, web_link, muscle_group, exercise_notes FROM Exercises WHERE day_id = ? ORDER BY exercise_id;',
        [occurrence.day.day_id],
      );
      for (const ex of exercises) {
        await db.runAsync(
          'INSERT INTO Logged_Exercises (workout_log_id, exercise_name, sets, reps, web_link, muscle_group, exercise_notes) VALUES (?, ?, ?, ?, ?, ?, ?);',
          [workoutLogId, ex.exercise_name, ex.sets, ex.reps, ex.web_link, ex.muscle_group, ex.exercise_notes],
        );
      }
      created.push({ workoutLogId, occurrence });
      added++;
    }
  });

  if (reminder) {
    for (const { workoutLogId, occurrence } of created) {
      const id = await reminder.schedule({
        workoutName,
        dayName: occurrence.day.day_name,
        scheduledDate: occurrence.date,
        notificationTime: reminder.time,
      });
      if (id) {
        await db.runAsync('UPDATE Workout_Log SET notification_id = ? WHERE workout_log_id = ?;', [id, workoutLogId]);
        reminders++;
      }
    }
  }

  return { added, skipped, reminders };
};
