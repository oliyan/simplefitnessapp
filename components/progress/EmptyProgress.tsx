import React from 'react';
import { View, Text } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import Sparkline from './Sparkline';

const NEEDED = 3;

// Shown before there is much to chart: says how far along the person is and previews what they will
// get, with a faded sample so the page does not feel empty.
export default function EmptyProgress({ sessions }: { sessions: number }) {
  const { theme } = useTheme();
  const done = Math.min(sessions, NEEDED);
  const sample: [string, string, string][] = [
    ['flame', '3', 'weeks in a row'],
    ['barbell', '3', 'sessions this week'],
    ['trophy', '2', 'records'],
  ];
  return (
    <View>
      <View style={{ alignItems: 'center', marginTop: 10, marginBottom: 18 }}>
        <View style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: theme.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="trending-up" size={40} color={theme.accent} />
        </View>
        <Text style={{ color: theme.text, fontSize: 20, fontWeight: '900', marginTop: 14, textAlign: 'center' }}>
          {sessions === 0 ? 'Your progress starts with the first workout' : 'Nice start. Keep going!'}
        </Text>
        <Text style={{ color: theme.text, opacity: 0.65, textAlign: 'center', marginTop: 6, paddingHorizontal: 20 }}>
          Log {NEEDED} workouts and your streak, records and graphs fill in here.
        </Text>
        <View style={{ width: '70%', height: 10, borderRadius: 5, backgroundColor: theme.accentSoft, marginTop: 16, overflow: 'hidden' }}>
          <View style={{ width: `${(done / NEEDED) * 100}%`, height: 10, backgroundColor: theme.accent }} />
        </View>
        <Text style={{ color: theme.text, opacity: 0.65, fontSize: 12, marginTop: 6 }}>
          {done} of {NEEDED} workouts logged
        </Text>
      </View>

      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ opacity: 0.45 }}>
        <Text style={{ color: theme.text, opacity: 0.7, fontWeight: '700', marginBottom: 8, textAlign: 'center' }}>What you will see</Text>
        <View style={{ borderWidth: 1, borderColor: theme.border, backgroundColor: theme.card, borderRadius: 20, padding: 16, marginBottom: 12 }}>
          <Text style={{ color: theme.text, fontWeight: '800', fontSize: 16 }}>Bench Press</Text>
          <View style={{ alignItems: 'center', marginVertical: 10 }}>
            <Sparkline values={[40, 42, 41, 45, 47, 50, 52]} color={theme.accent} width={240} height={70} />
          </View>
          <Text style={{ color: theme.text }}>Up 30% in 6 weeks. Best: 52.5 kg.</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', borderWidth: 1, borderColor: theme.border, backgroundColor: theme.card, borderRadius: 20, padding: 16 }}>
          {sample.map(([icon, n, label]) => (
            <View key={label} style={{ alignItems: 'center' }}>
              <Ionicons name={icon as any} size={24} color={theme.accent} />
              <Text style={{ color: theme.text, fontWeight: '900', fontSize: 22 }}>{n}</Text>
              <Text style={{ color: theme.text, fontSize: 11 }}>{label}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
