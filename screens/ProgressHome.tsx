import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '../context/ThemeContext';
import { WeightLogStackParamList } from '../App';
import { loadSettings, saveSettings } from '../utils/settingsStorage';
import useProgressData from '../components/progress/useProgressData';
import OverviewTab from '../components/progress/OverviewTab';
import ExercisesTab from '../components/progress/ExercisesTab';
import HistoryTab from '../components/progress/HistoryTab';
import EmptyProgress from '../components/progress/EmptyProgress';
import Skeleton from '../components/progress/Skeleton';
import GraphsWorkoutDetails from './GraphsWorkoutDetails';
import useGoals from '../utils/useGoals';

type Nav = StackNavigationProp<WeightLogStackParamList, 'ProgressHome'>;
type TabKey = 'overview' | 'exercises' | 'charts' | 'history';

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'overview', label: 'Overview', icon: 'sparkles-outline' },
  { key: 'exercises', label: 'Exercises', icon: 'barbell-outline' },
  { key: 'charts', label: 'Charts', icon: 'bar-chart-outline' },
  { key: 'history', label: 'History', icon: 'time-outline' },
];

// The Progress tab: a friendly Overview first, one exercise at a time, the full chart tools, and the raw history.
export default function ProgressHome() {
  const navigation = useNavigation<Nav>();
  const { theme } = useTheme();
  const { loading, sessions, sets, reload } = useProgressData();
  const [tab, setTab] = useState<TabKey>('overview');
  const [refreshing, setRefreshing] = useState(false);
  const { goals, ready, update } = useGoals();

  // Remembers that the person has looked here, for the first-week checklist on Home.
  useEffect(() => {
    if (ready && !goals.progressVisited) update({ progressVisited: true });
  }, [ready]);

  useEffect(() => {
    (async () => {
      const saved = await loadSettings();
      if (saved?.progressTab && TABS.some((t) => t.key === saved.progressTab)) setTab(saved.progressTab);
    })();
  }, []);

  const choose = (key: TabKey) => {
    setTab(key);
    saveSettings({ progressTab: key });
  };

  const onRefresh = () => {
    setRefreshing(true);
    reload();
    setTimeout(() => setRefreshing(false), 600);
  };

  const openExercise = (name: string) => navigation.navigate('ExerciseProgress', { name });
  const hasData = sessions.length > 0;
  // With nothing logged there is nothing to show on the first two tabs, only what to expect.
  const needsData = !loading && !hasData && (tab === 'overview' || tab === 'exercises');

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.titleContainer}>
        <Ionicons name="trending-up" size={30} color={theme.text} style={{ marginRight: 10 }} />
        <Text style={[styles.title, { color: theme.text }]}>My Progress</Text>
      </View>

      <View style={[styles.tabs, { backgroundColor: theme.card, borderColor: theme.border }]} accessibilityRole="tablist">
        {TABS.map((t, i) => {
          const on = t.key === tab;
          return (
            <TouchableOpacity
              key={t.key}
              onPress={() => choose(t.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              style={[styles.tab, i > 0 && { borderLeftWidth: 1, borderLeftColor: theme.border }, on && { backgroundColor: theme.buttonBackground }]}
            >
              <Ionicons name={t.icon as any} size={19} color={on ? theme.buttonText : theme.text} />
              <Text style={{ color: on ? theme.buttonText : theme.text, fontSize: 12, fontWeight: '700', marginTop: 2 }} numberOfLines={1}>
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} colors={[theme.accent]} />}
      >
        {loading ? (
          <Skeleton />
        ) : needsData ? (
          <EmptyProgress sessions={sessions.length} />
        ) : tab === 'overview' ? (
          <>
            <OverviewTab sessions={sessions} sets={sets} onOpenExercise={openExercise} onFindExercises={() => choose('exercises')} />
            {sessions.length < 3 && <EmptyProgress sessions={sessions.length} />}
          </>
        ) : tab === 'exercises' ? (
          <ExercisesTab sets={sets} onOpenExercise={openExercise} />
        ) : tab === 'charts' ? (
          <GraphsWorkoutDetails embedded />
        ) : (
          <HistoryTab
            onOpenAll={() => navigation.navigate('AllLogs')}
            onOpenWorkout={(workoutName) => navigation.navigate('WeightLogDetail', { workoutName })}
            onChanged={reload}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 40 },
  titleContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 14, marginTop: 8 },
  title: { fontSize: 30, fontWeight: '900' },
  tabs: { flexDirection: 'row', borderWidth: 1, borderRadius: 18, overflow: 'hidden', marginBottom: 14 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, minHeight: 56 },
});
