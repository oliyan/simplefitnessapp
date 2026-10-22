import { loadProgress } from './progressData';
import { loadSettings } from './settingsStorage';
import { normaliseGoals, finishStatsFor, FinishStats } from './motivation';
export type { FinishStats };

// Reads the history and works out the finish screen's extras for one session. Null when it cannot.
export const loadFinishStats = async (db: any, logId: number): Promise<FinishStats | null> => {
  try {
    const { sessions, sets } = await loadProgress(db);
    const saved = await loadSettings();
    return finishStatsFor(sessions, sets, logId, new Date(), normaliseGoals(saved?.goals).restWeeks);
  } catch (error) {
    console.error('Error loading finish stats:', error);
    return null;
  }
};
