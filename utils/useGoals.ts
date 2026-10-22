import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { loadSettings, saveSettings } from './settingsStorage';
import { DEFAULT_GOALS, GoalsState, normaliseGoals } from './motivation';

// The person's goals, rest weeks and "why", kept in the settings file under `goals`. Reloaded whenever
// the screen comes into view; `update` merges a change on top of what is on disk, so two screens
// cannot overwrite each other's part.
export default function useGoals() {
  const [goals, setGoals] = useState<GoalsState>(DEFAULT_GOALS);
  const [ready, setReady] = useState(false);

  const reload = useCallback(async () => {
    const saved = await loadSettings();
    setGoals(normaliseGoals(saved?.goals));
    setReady(true);
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const update = useCallback(async (patch: Partial<GoalsState>) => {
    const saved = await loadSettings();
    const next = { ...normaliseGoals(saved?.goals), ...patch };
    await saveSettings({ goals: next });
    setGoals(next);
  }, []);

  return { goals, ready, update, reload };
}
