import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../../context/ThemeContext';

export type GraphMode = 'Exercise' | 'Time' | 'Overall';

// The three kinds of chart, named by the question each one answers.
const SEGMENTS: { mode: GraphMode; icon: string; question: string; caption: string }[] = [
  { mode: 'Exercise', icon: 'trending-up-outline', question: 'Getting stronger?', caption: 'By exercise' },
  { mode: 'Time', icon: 'timer-outline', question: 'Doing enough?', caption: 'By workout' },
  { mode: 'Overall', icon: 'pie-chart-outline', question: 'Balanced?', caption: 'Overall' },
];

export default function GraphModeRibbon({ mode, onChange }: { mode: GraphMode; onChange: (m: GraphMode) => void }) {
  const { theme } = useTheme();
  return (
    <View style={[styles.ribbon, { backgroundColor: theme.card, borderColor: theme.border }]} accessibilityRole="tablist">
      {SEGMENTS.map((s, i) => {
        const on = s.mode === mode;
        const color = on ? theme.buttonText : theme.text;
        return (
          <TouchableOpacity
            key={s.mode}
            onPress={() => onChange(s.mode)}
            activeOpacity={0.8}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            style={[styles.segment, i > 0 && { borderLeftWidth: 1, borderLeftColor: theme.border }, on && { backgroundColor: theme.buttonBackground }]}
          >
            <Ionicons name={s.icon as any} size={20} color={color} />
            <Text style={{ color, fontSize: 12, fontWeight: '800', textAlign: 'center', marginTop: 2 }} numberOfLines={1} adjustsFontSizeToFit>
              {s.question}
            </Text>
            <Text style={{ color, opacity: 0.75, fontSize: 11, textAlign: 'center' }} numberOfLines={1}>
              {s.caption}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  ribbon: { flexDirection: 'row', borderWidth: 1, borderRadius: 18, overflow: 'hidden', marginBottom: 16 },
  segment: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, paddingHorizontal: 4, minHeight: 64 },
});
