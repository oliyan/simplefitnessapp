import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { ProgSet, exerciseSummaries, formatKg, shortDate, metricUnit } from '../../utils/progressStats';
import Sparkline from './Sparkline';

interface Props {
  sets: ProgSet[];
  onOpenExercise: (name: string) => void;
}

// One searchable list of every exercise that has been logged, each with its latest value and a
// small trend line. Tapping a row opens that exercise's chart.
export default function ExercisesTab({ sets, onOpenExercise }: Props) {
  const { theme } = useTheme();
  const [query, setQuery] = useState('');
  const [muscle, setMuscle] = useState<string | null>(null);

  const all = useMemo(() => exerciseSummaries(sets), [sets]);
  const muscles = useMemo(() => [...new Set(all.map((e) => e.muscle).filter((m): m is string => !!m && m.toLowerCase() !== 'unspecified'))].sort(), [all]);
  const shown = all.filter((e) => (!muscle || e.muscle === muscle) && e.name.toLowerCase().includes(query.trim().toLowerCase()));

  if (all.length === 0) return null;

  return (
    <View>
      <View style={[styles.search, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Ionicons name="search" size={18} color={theme.text} style={{ opacity: 0.5, marginRight: 8 }} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search your exercises"
          placeholderTextColor={theme.text + '80'}
          style={{ flex: 1, color: theme.text, fontSize: 16, paddingVertical: 10 }}
          accessibilityLabel="Search exercises"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')} accessibilityLabel="Clear search" style={{ padding: 6 }}>
            <Ionicons name="close-circle" size={18} color={theme.text} style={{ opacity: 0.5 }} />
          </TouchableOpacity>
        )}
      </View>

      {muscles.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
          {[null, ...muscles].map((m) => {
            const on = muscle === m;
            return (
              <TouchableOpacity
                key={m ?? 'all'}
                onPress={() => setMuscle(m)}
                style={[styles.chip, { backgroundColor: on ? theme.buttonBackground : theme.card, borderColor: theme.border }]}
              >
                <Text style={{ color: on ? theme.buttonText : theme.text, fontWeight: '700' }}>{m ? m[0].toUpperCase() + m.slice(1) : 'All'}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {shown.length === 0 && <Text style={{ color: theme.text, opacity: 0.6, textAlign: 'center', marginTop: 20 }}>No exercise matches that.</Text>}

      {shown.map((e) => {
        const up = e.change !== null && e.change >= 1;
        const down = e.change !== null && e.change <= -1;
        return (
          <TouchableOpacity
            key={e.name}
            onPress={() => onOpenExercise(e.name)}
            accessibilityRole="button"
            accessibilityLabel={`${e.name}, latest ${formatKg(e.last)} ${metricUnit(e.metric)}`}
            style={[styles.row, { backgroundColor: theme.card, borderColor: theme.border }]}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.text, fontWeight: '800', fontSize: 16 }} numberOfLines={1}>{e.name}</Text>
              <Text style={{ color: theme.text, opacity: 0.65, marginTop: 2 }}>
                {formatKg(e.last)} {metricUnit(e.metric)} · {shortDate(e.lastDate)} · {e.sessions} {e.sessions === 1 ? 'session' : 'sessions'}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Sparkline values={e.spark} color={down ? '#DC3545' : theme.accent} />
              {e.change !== null && (
                <Text style={{ color: up ? '#28A745' : down ? '#DC3545' : theme.text, opacity: up || down ? 1 : 0.5, fontWeight: '800', fontSize: 12 }}>
                  {up ? '+' : ''}{Math.round(e.change)}%
                </Text>
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  search: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 16, paddingHorizontal: 12, marginBottom: 10 },
  chip: { borderWidth: 1, borderRadius: 18, paddingVertical: 8, paddingHorizontal: 14, marginRight: 8, minHeight: 40, justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 18, padding: 14, marginBottom: 10, minHeight: 64 },
});
