import * as FileSystem from 'expo-file-system';
import { InBodySnapshot, MergeResult, mergeInBodySnapshots, parseInBodyCsv } from './inbodyParser';

const INBODY_FILE = `${FileSystem.documentDirectory}inbodySnapshots.json`;

export const loadInBodySnapshots = async (): Promise<InBodySnapshot[]> => {
  try {
    const info = await FileSystem.getInfoAsync(INBODY_FILE);
    if (!info.exists) return [];
    const parsed = JSON.parse(await FileSystem.readAsStringAsync(INBODY_FILE));
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error loading InBody snapshots:', error);
    return [];
  }
};

// Parses an uploaded CSV, merges it into what is stored, and returns the counts.
// Throws with a readable message when the file is not a usable InBody export.
export const importInBodyCsv = async (csvText: string): Promise<MergeResult> => {
  const incoming = parseInBodyCsv(csvText);
  const result = mergeInBodySnapshots(await loadInBodySnapshots(), incoming);
  await FileSystem.writeAsStringAsync(INBODY_FILE, JSON.stringify(result.snapshots));
  return result;
};

export const clearInBodySnapshots = async (): Promise<void> => {
  await FileSystem.deleteAsync(INBODY_FILE, { idempotent: true });
};
