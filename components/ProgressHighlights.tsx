import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import Svg, { Polyline, Circle } from 'react-native-svg';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import { loadInBodySnapshots } from '../utils/inbodyStorage';

interface BestLift {
  exercise_name: string;
  best: number;
  reps: number;
}

interface WeightPoint {
  date: string;
  kg: number;
}

// Two small cards for the Progress screen: the heaviest lifts, and body weight over time when
// InBody scans were imported.
export default function ProgressHighlights() {
  const db = useSQLiteContext();
  const { theme } = useTheme();
  const [lifts, setLifts] = useState<BestLift[]>([]);
  const [weights, setWeights] = useState<WeightPoint[]>([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        try {
          const rows = await db.getAllAsync<BestLift>(
            `SELECT w.exercise_name AS exercise_name, w.weight_logged AS best, MAX(w.reps_logged) AS reps
             FROM Weight_Log w
             JOIN (SELECT exercise_name, MAX(weight_logged) AS m FROM Weight_Log GROUP BY exercise_name) b
               ON b.exercise_name = w.exercise_name AND b.m = w.weight_logged
             WHERE w.weight_logged > 0
             GROUP BY w.exercise_name
             ORDER BY w.weight_logged DESC
             LIMIT 6;`,
          );
          const scans = await loadInBodySnapshots();
          if (!active) return;
          setLifts(rows);
          setWeights(
            scans
              .filter((s) => s.weight_kg != null)
              .map((s) => ({ date: s.scan_date, kg: s.weight_kg as number }))
              .sort((a, b) => a.date.localeCompare(b.date)),
          );
        } catch (error) {
          console.error('Error loading progress highlights:', error);
        }
      })();
      return () => {
        active = false;
      };
    }, [db]),
  );

  const card = [styles.card, { backgroundColor: theme.card, borderColor: theme.border }];

  const renderTrend = () => {
    const width = 300;
    const height = 90;
    const min = Math.min(...weights.map((w) => w.kg));
    const max = Math.max(...weights.map((w) => w.kg));
    const span = max - min || 1;
    const points = weights.map((w, i) => {
      const x = 8 + (i / (weights.length - 1)) * (width - 16);
      const y = 10 + (1 - (w.kg - min) / span) * (height - 20);
      return { x, y };
    });
    const change = weights[weights.length - 1].kg - weights[0].kg;
    return (
      <View style={card}>
        <Text style={[styles.heading, { color: theme.text }]}>Body weight</Text>
        <Text style={{ color: theme.text, opacity: 0.7, marginBottom: 8 }}>
          {weights[weights.length - 1].kg.toFixed(1)} kg now · {change >= 0 ? '+' : ''}
          {change.toFixed(1)} kg since {weights[0].date}
        </Text>
        <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
          <Polyline
            points={points.map((p) => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke={theme.accent}
            strokeWidth={3}
            strokeLinejoin="round"
          />
          {points.map((p, i) => (
            <Circle key={i} cx={p.x} cy={p.y} r={4} fill={theme.accent} />
          ))}
        </Svg>
      </View>
    );
  };

  if (lifts.length === 0 && weights.length < 2) return null;

  return (
    <View style={{ marginTop: 6 }}>
      {lifts.length > 0 && (
        <View style={card}>
          <Text style={[styles.heading, { color: theme.text }]}>Best lifts</Text>
          {lifts.map((lift) => (
            <View key={lift.exercise_name} style={styles.row}>
              <Ionicons name="trophy-outline" size={18} color={theme.accent} style={{ marginRight: 10 }} />
              <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
                {lift.exercise_name}
              </Text>
              <Text style={[styles.value, { color: theme.accent }]}>
                {lift.best} kg × {lift.reps}
              </Text>
            </View>
          ))}
        </View>
      )}
      {weights.length >= 2 && renderTrend()}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 20, padding: 16, marginBottom: 14 },
  heading: { fontSize: 18, fontWeight: '800', marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  name: { flex: 1, fontSize: 15, fontWeight: '600' },
  value: { fontSize: 15, fontWeight: '800' },
});
