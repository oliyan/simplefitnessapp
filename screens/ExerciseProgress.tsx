import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '../context/ThemeContext';
import { WeightLogStackParamList } from '../App';
import useProgressData from '../components/progress/useProgressData';
import ProgressChart from '../components/progress/ProgressChart';
import {
  MetricKind, FRAMES, FrameKey, exerciseSeries, inFrame, insightFor, isLoaded, metricHelp, metricLabel, metricUnit,
  formatKg, shortDate, percentChange, compareWithPrevious, compareSentence,
} from '../utils/progressStats';

type Nav = StackNavigationProp<WeightLogStackParamList, 'ExerciseProgress'>;

// One exercise on its own: pick what to measure, pick how far back, read the chart and a plain sentence.
export default function ExerciseProgress() {
  const navigation = useNavigation<Nav>();
  const { name } = useRoute<RouteProp<WeightLogStackParamList, 'ExerciseProgress'>>().params;
  const { theme } = useTheme();
  const { loading, sets } = useProgressData();
  const today = useMemo(() => new Date(), []);

  const own = useMemo(() => sets.filter((s) => s.name === name), [sets, name]);
  const loaded = isLoaded(own);
  const metrics: MetricKind[] = loaded ? ['e1rm', 'weight', 'volume'] : ['reps'];
  const [metric, setMetric] = useState<MetricKind>('e1rm');
  const [frame, setFrame] = useState<FrameKey | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    if (!metrics.includes(metric)) setMetric(metrics[0]);
  }, [loaded]);

  const all = useMemo(() => exerciseSeries(own, name, metrics.includes(metric) ? metric : metrics[0]), [own, name, metric, loaded]);

  // Open on 3 months when that has a line to draw, otherwise on everything logged.
  useEffect(() => {
    if (frame === null && all.length > 0) setFrame(inFrame(all, '3m', today).length >= 2 ? '3m' : 'all');
  }, [all]);
  const activeFrame: FrameKey = frame ?? 'all';
  const points = useMemo(() => inFrame(all, activeFrame, today), [all, activeFrame, today]);
  const activeMetric = metrics.includes(metric) ? metric : metrics[0];

  const comparison = useMemo(() => compareWithPrevious(all, activeFrame, today), [all, activeFrame, today]);
  const records = useMemo(() => [...all].filter((p) => p.isRecord).reverse().slice(0, 5), [all]);
  const best = all.length ? all.reduce((a, b) => (b.v > a.v ? b : a)) : null;
  const last = all.length ? all[all.length - 1] : null;
  const sinceFirst = all.length > 1 ? percentChange(all[0].v, all[all.length - 1].v) : null;

  const card = [styles.card, { backgroundColor: theme.card, borderColor: theme.border }];
  const muted = { color: theme.text, opacity: 0.65 };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} accessibilityLabel="Back" style={styles.back}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>{name}</Text>
        <View style={styles.back} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.buttonBackground} style={{ marginTop: 40 }} />
      ) : all.length === 0 ? (
        <Text style={[muted, { textAlign: 'center', marginTop: 40 }]}>Nothing logged for this exercise yet.</Text>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {metrics.length > 1 && (
            <View style={[styles.segment, { backgroundColor: theme.card, borderColor: theme.border }]}>
              {metrics.map((m) => {
                const on = m === activeMetric;
                return (
                  <TouchableOpacity key={m} onPress={() => setMetric(m)} accessibilityRole="button" accessibilityState={{ selected: on }}
                    style={[styles.segmentItem, on && { backgroundColor: theme.buttonBackground }]}>
                    <Text style={{ color: on ? theme.buttonText : theme.text, fontWeight: '700', fontSize: 13 }}>{metricLabel(m)}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <View style={styles.frameRow}>
            {FRAMES.map((f) => {
              const on = f.key === activeFrame;
              return (
                <TouchableOpacity key={f.key} onPress={() => setFrame(f.key)} accessibilityRole="button" accessibilityState={{ selected: on }}
                  style={[styles.frameChip, { backgroundColor: on ? theme.accentSoft : 'transparent', borderColor: on ? theme.accent : theme.border }]}>
                  <Text style={{ color: theme.text, fontWeight: on ? '800' : '500', fontSize: 13 }}>{f.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={card}>
            <View style={styles.rowBetween}>
              <Text style={{ color: theme.text, fontWeight: '800', fontSize: 16 }}>{metricLabel(activeMetric)}</Text>
              <TouchableOpacity onPress={() => setShowHelp((v) => !v)} accessibilityRole="button" accessibilityLabel="What does this mean?" style={styles.info}>
                <Ionicons name={showHelp ? 'information-circle' : 'information-circle-outline'} size={24} color={theme.accent} />
              </TouchableOpacity>
            </View>
            {showHelp && <Text style={[muted, { marginBottom: 8, lineHeight: 20 }]}>{metricHelp(activeMetric)}</Text>}
            {points.length === 0 ? (
              <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                <Text style={[muted, { textAlign: 'center' }]}>No sessions in this time frame.</Text>
                <TouchableOpacity onPress={() => setFrame('all')} style={{ marginTop: 10, padding: 8 }}>
                  <Text style={{ color: theme.accent, fontWeight: '800' }}>Show everything</Text>
                </TouchableOpacity>
              </View>
            ) : points.length === 1 ? (
              <View style={{ paddingVertical: 14, alignItems: 'center' }}>
                <Text style={{ color: theme.text, fontSize: 40, fontWeight: '900' }}>{formatKg(points[0].v)}</Text>
                <Text style={muted}>{metricUnit(activeMetric)} on {shortDate(points[0].d)}</Text>
                <Text style={[muted, { marginTop: 8, textAlign: 'center' }]}>One session so far. Log it once more and a line appears.</Text>
              </View>
            ) : (
              <ProgressChart points={points} metric={activeMetric} />
            )}
            <Text style={{ color: theme.text, fontSize: 15, lineHeight: 21, marginTop: 12 }}>{insightFor(points, activeMetric)}</Text>
            {comparison && <Text style={[muted, { fontSize: 13, lineHeight: 19, marginTop: 6 }]}>{compareSentence(comparison, metricUnit(activeMetric))}</Text>}
          </View>

          <View style={styles.statRow}>
            <Tile label="Best" value={best ? `${formatKg(best.v)} ${metricUnit(activeMetric)}` : '-'} sub={best ? shortDate(best.d) : ''} />
            <Tile label="Latest" value={last ? `${formatKg(last.v)} ${metricUnit(activeMetric)}` : '-'} sub={last ? shortDate(last.d) : ''} />
            <Tile label="Sessions" value={String(all.length)} sub={sinceFirst === null ? '' : `${sinceFirst >= 0 ? '+' : ''}${Math.round(sinceFirst)}% overall`} />
          </View>

          {last && (
            <View style={card}>
              <Text style={{ color: theme.text, fontWeight: '800', fontSize: 16, marginBottom: 6 }}>Last session, set by set</Text>
              {last.sets.map((s, i) => (
                <View key={i} style={styles.setRow}>
                  <Text style={muted}>Set {i + 1}</Text>
                  <Text style={{ color: theme.text, fontWeight: '700' }}>{s.wt > 0 ? `${formatKg(s.wt)} kg x ${s.reps}` : `${s.reps} reps`}</Text>
                </View>
              ))}
            </View>
          )}

          {records.length > 0 && (
            <View style={card}>
              <Text style={{ color: theme.text, fontWeight: '800', fontSize: 16, marginBottom: 6 }}>Records</Text>
              {records.map((r) => (
                <View key={r.d} style={styles.setRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="trophy" size={16} color="#E0A400" style={{ marginRight: 8 }} />
                    <Text style={muted}>{shortDate(r.d)}</Text>
                  </View>
                  <Text style={{ color: theme.text, fontWeight: '700' }}>{formatKg(r.v)} {metricUnit(activeMetric)}</Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );

  function Tile({ label, value, sub }: { label: string; value: string; sub: string }) {
    return (
      <View style={[styles.tile, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[muted, { fontSize: 12 }]}>{label}</Text>
        <Text style={{ color: theme.text, fontWeight: '900', fontSize: 16, marginTop: 2 }} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
        <Text style={[muted, { fontSize: 11 }]} numberOfLines={1}>{sub}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontSize: 24, fontWeight: '900', textAlign: 'center' },
  segment: { flexDirection: 'row', borderWidth: 1, borderRadius: 16, overflow: 'hidden', marginBottom: 10 },
  segmentItem: { flex: 1, paddingVertical: 11, alignItems: 'center', minHeight: 44, justifyContent: 'center' },
  frameRow: { flexDirection: 'row', marginBottom: 12 },
  frameChip: { flex: 1, borderWidth: 1, borderRadius: 16, paddingVertical: 9, alignItems: 'center', marginRight: 6, minHeight: 40, justifyContent: 'center' },
  card: { borderWidth: 1, borderRadius: 20, padding: 16, marginBottom: 14 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  info: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: -10 },
  statRow: { flexDirection: 'row', marginBottom: 14 },
  tile: { flex: 1, borderWidth: 1, borderRadius: 16, padding: 12, marginRight: 8 },
  setRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 7 },
});
