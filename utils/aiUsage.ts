import * as FileSystem from 'expo-file-system';
import { loadSettings, saveSettings } from './settingsStorage';

// A monthly spending cap counted by the app itself, from the token counts every API
// response reports. It is an estimate (prices below can go stale) and is NOT a
// substitute for a spend limit set in the Anthropic console.

const USAGE_FILE = `${FileSystem.documentDirectory}aiUsage.json`;

export const DEFAULT_MONTHLY_LIMIT_USD = 2;

// USD per million tokens, Anthropic list prices as of Oct 2026 (prompts up to 100K tokens).
const PRICES_PER_MTOK: Record<string, { input: number; output: number }> = {
  'claude-haiku-5-5': { input: 0.1, output: 0.5 },
  'claude-sonnet-5-5': { input: 2, output: 10 },
};
// Unknown model: assume the dearer price rather than undercount.
const FALLBACK_PRICE = { input: 2, output: 10 };

export interface Usage {
  month: string; // YYYY-MM, local time
  spendUsd: number;
  calls: number;
}

const currentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

// The counter starts again each calendar month.
export const getUsage = async (): Promise<Usage> => {
  const fresh: Usage = { month: currentMonth(), spendUsd: 0, calls: 0 };
  try {
    const info = await FileSystem.getInfoAsync(USAGE_FILE);
    if (!info.exists) return fresh;
    const stored = JSON.parse(await FileSystem.readAsStringAsync(USAGE_FILE));
    return stored.month === fresh.month ? stored : fresh;
  } catch (error) {
    console.error('Error reading AI usage:', error);
    return fresh;
  }
};

export const recordUsage = async (model: string, inputTokens: number, outputTokens: number): Promise<void> => {
  const price = PRICES_PER_MTOK[model] ?? FALLBACK_PRICE;
  const cost = (inputTokens * price.input + outputTokens * price.output) / 1_000_000;
  const usage = await getUsage();
  usage.spendUsd += cost;
  usage.calls += 1;
  await FileSystem.writeAsStringAsync(USAGE_FILE, JSON.stringify(usage));
};

export const getMonthlyLimit = async (): Promise<number> => {
  const settings = await loadSettings();
  const value = Number(settings?.aiMonthlyLimitUsd);
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_MONTHLY_LIMIT_USD;
};

export const setMonthlyLimit = (limitUsd: number) => saveSettings({ aiMonthlyLimitUsd: limitUsd });

export const checkBudget = async (): Promise<{ over: boolean; spendUsd: number; limitUsd: number }> => {
  const [usage, limitUsd] = await Promise.all([getUsage(), getMonthlyLimit()]);
  return { over: usage.spendUsd >= limitUsd, spendUsd: usage.spendUsd, limitUsd };
};
