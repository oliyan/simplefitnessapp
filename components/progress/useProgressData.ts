import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import { loadProgress } from '../../utils/progressData';
import { ProgSession, ProgSet } from '../../utils/progressStats';

export interface ProgressData {
  loading: boolean;
  reload: () => void;
  sessions: ProgSession[];
  sets: ProgSet[];
}

// The last result is kept for the whole session, so switching tabs shows the numbers at once and the
// fresh ones replace them a moment later (no spinner, no jump).
let cached: { sessions: ProgSession[]; sets: ProgSet[] } | null = null;

// Every finished session and its sets, reloaded each time the screen comes into view.
export default function useProgressData(): ProgressData {
  const db = useSQLiteContext();
  const [state, setState] = useState<Omit<ProgressData, 'reload'>>(
    cached ? { loading: false, ...cached } : { loading: true, sessions: [], sets: [] },
  );
  const [tick, setTick] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        try {
          const { sessions, sets } = await loadProgress(db);
          if (!active) return;
          cached = { sessions, sets };
          setState({ loading: false, sessions, sets });
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
