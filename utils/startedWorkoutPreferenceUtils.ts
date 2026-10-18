import AsyncStorage from '@react-native-async-storage/async-storage';

// AsyncStorage keys for rest timer preferences
const REST_TIME_BETWEEN_SETS_KEY = '@rest_time_between_sets';
const REST_TIME_BETWEEN_EXERCISES_KEY = '@rest_time_between_exercises';

// Default values
const DEFAULT_SET_REST_TIME = '30';
const DEFAULT_EXERCISE_REST_TIME = '60';

export interface RestTimerPreferences {
  restTimeBetweenSets: string;
  restTimeBetweenExercises: string;
}

/**
 * Load saved rest times from AsyncStorage
 * returns Promise<RestTimerPreferences> - The saved preferences or defaults
 */
export const loadRestTimerPreferences = async (): Promise<RestTimerPreferences> => {
  try {
    const [savedSetRestTime, savedExerciseRestTime] = await Promise.all([
      AsyncStorage.getItem(REST_TIME_BETWEEN_SETS_KEY),
      AsyncStorage.getItem(REST_TIME_BETWEEN_EXERCISES_KEY),
    ]);

    return {
      restTimeBetweenSets: savedSetRestTime || DEFAULT_SET_REST_TIME,
      restTimeBetweenExercises:
        savedExerciseRestTime || DEFAULT_EXERCISE_REST_TIME,
    };
  } catch (error) {
    console.error('Error loading rest timer preferences:', error);
    return {
      restTimeBetweenSets: DEFAULT_SET_REST_TIME,
      restTimeBetweenExercises: DEFAULT_EXERCISE_REST_TIME,
    };
  }
};

const saveRestTime = async (key: string, time: string): Promise<void> => {
  const timeNumber = parseInt(time);
  if (isNaN(timeNumber) || timeNumber < 0) {
    throw new Error('Invalid rest time value');
  }
  await AsyncStorage.setItem(key, time);
};

/**
 * Save both rest times at once
 * param preferences - Object containing both rest time values
 * returns Promise<void>
 */
export const saveRestTimerPreferences = async (
  preferences: RestTimerPreferences
): Promise<void> => {
  try {
    await Promise.all([
      saveRestTime(REST_TIME_BETWEEN_SETS_KEY, preferences.restTimeBetweenSets),
      saveRestTime(REST_TIME_BETWEEN_EXERCISES_KEY, preferences.restTimeBetweenExercises),
    ]);
  } catch (error) {
    console.error('Error saving rest timer preferences:', error);
    throw error;
  }
};
