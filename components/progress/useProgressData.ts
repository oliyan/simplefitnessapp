import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import { ensureInProgressColumn } from '../../utils/workoutProgress';
import { ProgSession, ProgSet } from '../../utils/progressStats';

export interface ProgressData {
  loading: boolean;
  reload: () => void;
  sessions: ProgSession[];
  sets: ProgSet[];
}

// Every finished session and its sets, reloaded each time the Progress tab comes into view.
export default function useProgressData(): ProgressData {
  const db = useSQLiteContext();
  const [state, setState] = useState<Omit<ProgressData, 'reload'>>({ loading: true, sessions: [], sets: [] });
  const [tick, setTick] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        try {
          await ensureInProgressColumn(db);
          const sessions = await db.getAllAsync<ProgSession>(
            `SELECT w.workout_log_id AS logId, w.workout_date AS d, w.workout_name AS name, w.day_name AS day,
                    w.completion_time AS durationSec
             FROM Workout_Log w
             WHERE EXISTS (SELECT 1 FROM Weight_Log x WHERE x.workout_log_id = w.workout_log_id)
               AND COALESCE(w.in_progress, 0) = 0
             ORDER BY w.workout_date, w.workout_log_id;`,
          );
          const ids = new Set(sessions.map((s) => s.logId));
          const rows = await db.getAllAsync<ProgSet>(
            `SELECT w.workout_date AS d, wl.exercise_name AS name, wl.weight_logged AS wt, wl.reps_logged AS reps,
                    wl.set_number AS setNo, wl.workout_log_id AS logId, le.muscle_group AS muscle
             FROM Weight_Log wl
             JOIN Workout_Log w ON w.workout_log_id = wl.workout_log_id
             LEFT JOIN Logged_Exercises le ON le.logged_exercise_id = wl.logged_exercise_id
             ORDER BY w.workout_date, wl.weight_log_id;`,
          );
          if (!active) return;
          setState({ loading: false, sessions, sets: rows.filter((r) => ids.has(r.logId)) });
        } catch (error) {
          console.error('Error loading progress data:', error);
          if (active) setState((s) => ({ ...s, loading: false }));
        }
      })();
      return () => {
        active = false;
      };
    }, [db, tick]),
  );

  return { ...state, reload: () => setTick((n) => n + 1) };
}
