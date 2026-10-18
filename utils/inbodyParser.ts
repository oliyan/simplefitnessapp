// Pure CSV parsing/merging for InBody exports - no React Native imports, so it can
// be run under plain Node for testing.

export interface InBodySnapshot {
  scan_date: string; // YYYY-MM-DD
  source_timestamp: string; // raw YYYYMMDDHHMMSS; breaks ties between scans on the same day
  weight_kg: number | null;
  skeletal_muscle_mass_kg: number | null;
  soft_lean_mass_kg: number | null;
  body_fat_mass_kg: number | null;
  bmi: number | null;
  percent_body_fat: number | null;
  basal_metabolic_rate: number | null;
  inbody_score: number | null;
  waist_hip_ratio: number | null;
  visceral_fat_level: number | null;
}

type NumericField = Exclude<keyof InBodySnapshot, 'scan_date' | 'source_timestamp'>;

// Parse by header NAME, never by position: if a name changed, positions probably did too.
const COLUMNS: Record<NumericField, string> = {
  weight_kg: 'Weight(kg)',
  skeletal_muscle_mass_kg: 'Skeletal Muscle Mass(kg)',
  soft_lean_mass_kg: 'Soft Lean Mass(kg)',
  body_fat_mass_kg: 'Body Fat Mass(kg)',
  bmi: 'BMI(kg/m²)',
  percent_body_fat: 'Percent Body Fat(%)',
  basal_metabolic_rate: 'Basal Metabolic Rate(kcal)',
  inbody_score: 'InBody Score',
  waist_hip_ratio: 'Waist Hip Ratio',
  visceral_fat_level: 'Visceral Fat Level(Level)',
};

const MAX_ROWS = 2000; // sanity check on one upload

const splitCsvLine = (line: string): string[] => {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      cells.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  cells.push(current);
  return cells;
};

// "-" means "not measured" and must become null, never 0. The decimal separator is
// assumed to be "." (a "22,5" would be rejected here, not misread).
const toNumber = (raw: string | undefined): number | null => {
  const value = (raw ?? '').trim();
  return /^-?\d+(\.\d+)?$/.test(value) ? Number(value) : null;
};

export const parseInBodyCsv = (text: string): InBodySnapshot[] => {
  const lines = text
    .replace(/^﻿/, '') // UTF-8 BOM would otherwise corrupt the first header
    .split(/\r?\n/)
    .filter((line) => line.trim() !== '');
  if (lines.length < 2) throw new Error('The file has no data rows.');
  if (lines.length - 1 > MAX_ROWS) throw new Error('The file has too many rows to be an InBody export.');

  const headers = splitCsvLine(lines[0]).map((h) => h.trim());
  const indexOf = (name: string) => headers.indexOf(name);

  const dateIndex = indexOf('Date');
  const weightIndex = indexOf('Weight(kg)');
  if (dateIndex === -1 || weightIndex === -1) {
    throw new Error('This does not look like an InBody export: the Date or Weight(kg) column is missing.');
  }

  const fieldIndexes = (Object.keys(COLUMNS) as NumericField[]).map((field) => {
    const index = indexOf(COLUMNS[field]);
    if (index === -1) console.warn(`InBody CSV: column "${COLUMNS[field]}" not found; ${field} will be empty.`);
    return [field, index] as const;
  });

  const rows: InBodySnapshot[] = [];
  for (const line of lines.slice(1)) {
    const cells = splitCsvLine(line);
    const stamp = (cells[dateIndex] ?? '').trim();
    if (!/^\d{14}$/.test(stamp)) continue; // not a data row
    const snapshot: InBodySnapshot = {
      scan_date: `${stamp.slice(0, 4)}-${stamp.slice(4, 6)}-${stamp.slice(6, 8)}`,
      source_timestamp: stamp,
      weight_kg: null,
      skeletal_muscle_mass_kg: null,
      soft_lean_mass_kg: null,
      body_fat_mass_kg: null,
      bmi: null,
      percent_body_fat: null,
      basal_metabolic_rate: null,
      inbody_score: null,
      waist_hip_ratio: null,
      visceral_fat_level: null,
    };
    for (const [field, index] of fieldIndexes) {
      snapshot[field] = index === -1 ? null : toNumber(cells[index]);
    }
    rows.push(snapshot);
  }
  if (rows.length === 0) throw new Error('No scans were found in the file.');

  // Several scans on one day: keep the latest time of day.
  const byDate = new Map<string, InBodySnapshot>();
  for (const row of rows) {
    const existing = byDate.get(row.scan_date);
    if (!existing || row.source_timestamp > existing.source_timestamp) byDate.set(row.scan_date, row);
  }
  return Array.from(byDate.values()).sort((a, b) => a.scan_date.localeCompare(b.scan_date));
};

export interface MergeResult {
  snapshots: InBodySnapshot[];
  addedCount: number;
  updatedCount: number;
}

// Same calendar date: the new upload wins. Re-uploading the same file changes nothing.
export const mergeInBodySnapshots = (existing: InBodySnapshot[], incoming: InBodySnapshot[]): MergeResult => {
  const byDate = new Map(existing.map((s) => [s.scan_date, s]));
  let addedCount = 0;
  let updatedCount = 0;
  for (const snapshot of incoming) {
    const previous = byDate.get(snapshot.scan_date);
    if (!previous) {
      addedCount++;
    } else if (JSON.stringify(previous) !== JSON.stringify(snapshot)) {
      updatedCount++;
    }
    byDate.set(snapshot.scan_date, snapshot);
  }
  const snapshots = Array.from(byDate.values()).sort((a, b) => a.scan_date.localeCompare(b.scan_date));
  return { snapshots, addedCount, updatedCount };
};

const fmt = (value: number | null, unit = '') => (value === null ? null : `${value}${unit}`);

// Compact text for prompts: the latest scan plus the change since the one before it.
export const formatBodyComposition = (snapshots: InBodySnapshot[]): string | null => {
  if (snapshots.length === 0) return null;
  const latest = snapshots[snapshots.length - 1];
  const parts = [
    fmt(latest.weight_kg, ' kg weight'),
    fmt(latest.skeletal_muscle_mass_kg, ' kg skeletal muscle'),
    fmt(latest.body_fat_mass_kg, ' kg body fat'),
    fmt(latest.percent_body_fat, '% body fat'),
    fmt(latest.bmi, ' BMI'),
    fmt(latest.basal_metabolic_rate, ' kcal BMR'),
    fmt(latest.visceral_fat_level, ' visceral fat level'),
    fmt(latest.inbody_score, ' InBody score'),
  ].filter(Boolean);
  let text = `Latest InBody scan (${latest.scan_date}): ${parts.join(', ')}.`;

  if (snapshots.length > 1) {
    const previous = snapshots[snapshots.length - 2];
    const change = (a: number | null, b: number | null, label: string) =>
      a === null || b === null ? null : `${label} ${a - b >= 0 ? '+' : ''}${Math.round((a - b) * 10) / 10}`;
    const deltas = [
      change(latest.weight_kg, previous.weight_kg, 'weight'),
      change(latest.skeletal_muscle_mass_kg, previous.skeletal_muscle_mass_kg, 'skeletal muscle'),
      change(latest.body_fat_mass_kg, previous.body_fat_mass_kg, 'body fat mass'),
    ].filter(Boolean);
    if (deltas.length > 0) text += ` Change since ${previous.scan_date}: ${deltas.join(', ')}.`;
  }
  return text;
};
