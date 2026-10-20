import type { SQLiteDatabase } from 'expo-sqlite';
import { EMBEDDED_API_KEY } from '../config/embeddedKey';
import { SEED_PLAN } from '../config/seedPlan';
import { getApiKey, saveApiKey } from './secureSettings';
import { ensureWorkoutColumns } from './exerciseDetailUtils';
import { insertWorkoutData, workoutNameExists } from './workoutSharingUtils';

// Once, on the first launch: save the embedded key (if the build has one) and add the seed plan
// (if the build has one). The database's own user_version is the "already done" marker, so a plan
// the person later deletes does not come back.
const SEED_VERSION = 1;

export const applyFirstLaunch = async (db: SQLiteDatabase): Promise<void> => {
  try {
    if (EMBEDDED_API_KEY && !(await getApiKey())) {
      await saveApiKey(EMBEDDED_API_KEY);
    }
    const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
    if ((row?.user_version ?? 0) >= SEED_VERSION) return;
    if (SEED_PLAN && !(await workoutNameExists(db, SEED_PLAN.workout_name))) {
      await insertWorkoutData(db, SEED_PLAN);
    }
    await db.execAsync(`PRAGMA user_version = ${SEED_VERSION};`);
  } catch (error) {
    console.error('First-launch setup failed:', error);
  }
};

// Runs whenever the database opens.
export const initDatabase = async (db: SQLiteDatabase): Promise<void> => {
  await ensureWorkoutColumns(db);
  await applyFirstLaunch(db);
};
