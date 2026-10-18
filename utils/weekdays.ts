// Weekdays are stored as 1 (Monday) to 7 (Sunday); null means "no fixed weekday".
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const WEEKDAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
export const WEEKDAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const weekdayShort = (weekday: number | null | undefined): string =>
  weekday && weekday >= 1 && weekday <= 7 ? WEEKDAY_SHORT[weekday - 1] : '';

// JS Date.getDay() is 0 (Sunday) to 6 (Saturday); convert to 1 (Monday) to 7 (Sunday).
export const dateToWeekday = (date: Date): Weekday => ((date.getDay() + 6) % 7 + 1) as Weekday;

// Accepts anything an import file or an AI reply might contain and returns a valid weekday or null.
export const normalizeWeekday = (value: unknown): Weekday | null => {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= 7 ? (n as Weekday) : null;
};
