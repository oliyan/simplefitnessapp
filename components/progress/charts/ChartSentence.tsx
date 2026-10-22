import React from 'react';
import { Text } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';

// What to say about a chart in one plain sentence, or null when a sentence would not help
// (pie style charts) or there is nothing drawn. Never scolds: a dip is described gently.
export const chartSentence = (input: {
  count: number; // points on the chart
  averageSeconds: number | null; // for the Duration chart
  percentChange: number | null;
}): string | null => {
  if (input.count === 0) return null;
  if (input.count < 2) return 'One data point so far. Log again and a line appears.';
  if (input.averageSeconds !== null) return `Your sessions average ${Math.round(input.averageSeconds / 60)} minutes.`;
  const c = input.percentChange;
  if (c === null) return null;
  const rounded = Math.round(Math.abs(c));
  if (c === 999) return 'Up from nothing. A great start.';
  if (c >= 1) return `Up ${rounded}% over this time frame.`;
  if (c <= -1) return `Down ${rounded}% over this time frame. A lighter spell is normal and you can build back.`;
  return 'Holding steady over this time frame.';
};

export default function ChartSentence({ text }: { text: string | null }) {
  const { theme } = useTheme();
  if (!text) return null;
  return <Text style={{ color: theme.text, fontSize: 15, lineHeight: 21, marginTop: 10 }}>{text}</Text>;
}
