import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Linking, Share } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { ensureInProgressColumn } from '../utils/workoutProgress';
import { useSettings } from '../context/SettingsContext';
import { usePersonal } from '../context/PersonalContext';
import Onboarding from '../components/Onboarding';
import { loadSettings, saveSettings } from '../utils/settingsStorage';
import {
  buildWeek,
  dayDiff,
  findPersonalRecords,
  nextUpcoming,
  PersonalRecord,
  SetRow,
  WeekCell,
  weekStart,
  weekVolumes,
  weeklyStreak,
  WorkoutRow,
} from '../utils/dashboardStats';
import { dateToWeekday, WEEKDAY_LETTERS, weekdayShort } from '../utils/weekdays';

interface Dashboard {
  workoutCount: number;
  rows: WorkoutRow[];
  week: WeekCell[];
  streak: number;
  volume: { thisWeek: number; lastWeek: number };
  records: PersonalRecord[];
}

const formatDM = (date: Date) =>
  `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;

const formatVolume = (value: number) => (value >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(Math.round(value)));

// Home: a dashboard of today, this week, streak, volume and recent records, all computed
// from the workouts you have scheduled and logged.
export default function Home({ navigation }: any) {
  const db = useSQLiteContext();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { weightFormat } = useSettings();
  const { personal, noteText } = usePersonal();
  // The greeting you wrote, or a plain "Hi, <name>!" once a name is known.
  const greetingText = personal.greeting.trim() || (personal.userName.trim() ? `Hi, ${personal.userName.trim()}!` : '');

  const [data, setData] = useState<Dashboard | null>(null);
  const [needsBackup, setNeedsBackup] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        try {
          const today = new Date();
          const since = Math.floor(
            new Date(today.getFullYear(), today.getMonth(), today.getDate() - 730).getTime() / 1000,
          );
          await ensureInProgressColumn(db);
          const [countRow] = await db.getAllAsync<{ c: number }>('SELECT COUNT(*) AS c FROM Workouts;');
          const rows = await db.getAllAsync<WorkoutRow>(
            `SELECT w.workout_log_id, w.workout_date, w.workout_name, w.day_name,
                    (EXISTS(SELECT 1 FROM Weight_Log x WHERE x.workout_log_id = w.workout_log_id)
                      AND COALESCE(w.in_progress, 0) = 0) AS logged,
                    COALESCE(w.in_progress, 0) AS in_progress
             FROM Workout_Log w WHERE w.workout_date >= ?;`,
            [since],
          );
          const sets = await db.getAllAsync<SetRow>(
            `SELECT w.workout_date AS d, wl.exercise_name AS name, wl.weight_logged AS wt, wl.reps_logged AS reps
             FROM Weight_Log wl JOIN Workout_Log w ON w.workout_log_id = wl.workout_log_id
             ORDER BY w.workout_date, wl.weight_log_id;`,
          );
          const saved = await loadSettings();
          const lastBackup: number = saved?.lastBackup ?? 0;
          const snoozedUntil: number = saved?.backupSnoozedUntil ?? 0;
          const hasHistory = rows.filter((r) => r.logged).length >= 5;
          if (!active) return;
          setNeedsBackup(hasHistory && Date.now() - lastBackup > 30 * 86400000 && Date.now() > snoozedUntil);
          setData({
            workoutCount: countRow?.c ?? 0,
            rows,
            week: buildWeek(rows, today),
            streak: weeklyStreak(rows, today),
            volume: weekVolumes(sets, today),
            records: findPersonalRecords(sets, 3),
          });
        } catch (error) {
          console.error('Error loading dashboard:', error);
        }
      })();
      return () => {
        active = false;
      };
    }, [db]),
  );

  const today = new Date();

  const relativeDay = (workoutDate: number): string => {
    const diff = dayDiff(workoutDate, today);
    if (diff === 0) return t('Today');
    if (diff === 1) return t('Tomorrow');
    if (diff === -1) return t('Yesterday');
    if (diff < 0 && diff > -30) return t('dashDaysAgo', { count: -diff });
    const date = new Date(workoutDate * 1000);
    return `${weekdayShort(dateToWeekday(date))} ${formatDM(date)}`;
  };

  const card = [styles.card, { backgroundColor: theme.card, borderColor: theme.border }];
  const heading = [styles.heading, { color: theme.text }];
  const muted = { color: theme.text, opacity: 0.65 };

  const bigButton = (label: string, onPress: () => void, filled = true) => (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.button,
        filled
          ? { backgroundColor: theme.buttonBackground }
          : { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 },
      ]}
    >
      <Text style={{ color: filled ? theme.buttonText : theme.text, fontWeight: '700', fontSize: 16 }}>{label}</Text>
    </TouchableOpacity>
  );

  const goToCalendar = () => navigation.navigate('My Calendar', { screen: 'MyCalendar' }); // back to the calendar even if a workout screen is open
  const goToWorkouts = (screen: string) => navigation.navigate('My Workouts', { screen, initial: false });

  const renderToday = (d: Dashboard) => {
    const todayCell = d.week.find((c) => c.isToday);
    const sessions = todayCell?.workouts ?? [];
    const pending = sessions.filter((s) => !s.logged);

    if (sessions.length > 0) {
      return (
        <View style={[card, { backgroundColor: theme.accentSoft, borderColor: theme.accent }]}>
          <Text style={[heading, { color: theme.accent }]}>{t('Today')}</Text>
          {sessions.map((s) => (
            <View key={s.workout_log_id} style={styles.todayRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.todayName, { color: theme.text }]}>{s.day_name}</Text>
                <Text style={muted}>{s.workout_name}</Text>
              </View>
              {s.logged ? (
                <View style={styles.doneBadge}>
                  <Ionicons name="checkmark-circle" size={24} color={theme.accent} />
                  <Text style={{ color: theme.accent, fontWeight: '800', marginLeft: 6 }}>{t('dashDone')}</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.startButton, { backgroundColor: theme.buttonBackground, paddingHorizontal: 22, paddingVertical: 12 }]}
                  onPress={() =>
                    navigation.navigate('My Calendar', {
                      screen: 'StartedWorkoutInterface',
                      params: { workout_log_id: s.workout_log_id },
                      initial: false, // keep the calendar underneath so Back returns to it
                    })
                  }
                >
                  <Text style={{ color: theme.buttonText, fontWeight: '700' }}>{s.in_progress ? t('dashResume') : t('dashStart')}</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
          {pending.length === 0 && <Text style={[muted, { marginTop: 6 }]}>{t('dashAllDone')}</Text>}
        </View>
      );
    }

    const next = nextUpcoming(d.rows, today);
    return (
      <View style={card}>
        <Text style={heading}>{t('dashRestDay')}</Text>
        {next ? (
          <Text style={{ color: theme.text, fontSize: 16 }}>
            {t('dashNext', { when: relativeDay(next.workout_date), name: next.day_name })}
          </Text>
        ) : (
          <>
            <Text style={muted}>{t('dashNothingPlanned')}</Text>
            {bigButton(t('dashSchedule'), () => navigation.navigate('My Calendar', { screen: 'SchedulePlan', initial: false }))}
          </>
        )}
      </View>
    );
  };

  const renderWeek = (d: Dashboard) => {
    const planned = d.week.filter((c) => c.workouts.length > 0);
    const done = planned.filter((c) => c.state === 'done').length;
    return (
      <TouchableOpacity style={card} activeOpacity={0.8} onPress={goToCalendar}>
        <View style={styles.weekHeader}>
          <Text style={heading}>{t('dashThisWeek')}</Text>
          {planned.length > 0 && <Text style={muted}>{t('dashWeekSummary', { done, total: planned.length })}</Text>}
        </View>
        <View style={styles.weekRow}>
          {d.week.map((cell, index) => (
            <View key={index} style={styles.dayCol}>
              <Text style={[styles.dayLetter, { color: theme.text, opacity: cell.isToday ? 1 : 0.6 }]}>
                {WEEKDAY_LETTERS[index]}
              </Text>
              <View
                style={[
                  styles.dayCircle,
                  { borderColor: theme.accent },
                  cell.state === 'done' && { backgroundColor: theme.buttonBackground, borderColor: theme.buttonBackground },
                  cell.state === 'planned' && { borderWidth: 2 },
                  cell.state === 'missed' && { borderColor: theme.border, opacity: 0.8 },
                  cell.state === 'rest' && { borderColor: theme.border },
                ]}
              >
                {cell.state === 'done' && <Ionicons name="checkmark" size={18} color={theme.buttonText} />}
                {cell.state === 'planned' && <Ionicons name="ellipse" size={8} color={theme.accent} />}
              </View>
              <View style={[styles.todayBar, { backgroundColor: cell.isToday ? theme.accent : 'transparent' }]} />
            </View>
          ))}
        </View>
      </TouchableOpacity>
    );
  };

  const renderStats = (d: Dashboard) => {
    const { thisWeek, lastWeek } = d.volume;
    const pct = lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : null;
    const arrow = pct === null ? '' : pct >= 0 ? '▲ ' : '▼ ';
    return (
      <View style={styles.statsRow}>
        <View style={[card, styles.statCard]}>
          <Text style={[styles.bigNumber, { color: theme.accent }]}>{d.streak}</Text>
          <Text style={[styles.statLabel, { color: theme.text }]}>{t('dashStreak')}</Text>
        </View>
        <View style={[card, styles.statCard]}>
          <Text style={[styles.bigNumber, { color: theme.accent }]}>
            {formatVolume(thisWeek)}
            <Text style={styles.unit}> {weightFormat}</Text>
          </Text>
          <Text style={[styles.statLabel, { color: theme.text }]}>{t('dashVolume')}</Text>
          <Text style={[muted, { fontSize: 12, marginTop: 2 }]}>
            {pct === null ? t('dashVolumeNoPrev') : `${arrow}${Math.abs(pct)}% ${t('dashVsLastWeek')}`}
          </Text>
        </View>
      </View>
    );
  };

  // A short text summary of this week to send to someone.
  const shareWeek = (d: Dashboard) => {
    const planned = d.week.filter((c) => c.workouts.length > 0);
    const done = planned.filter((c) => c.state === 'done').length;
    const lines = [
      `${personal.userName.trim() ? personal.userName.trim() + "'s" : 'My'} week on Urudhi`,
      `${done} of ${planned.length} workouts done`,
      `${formatVolume(d.volume.thisWeek)} ${weightFormat} lifted`,
      d.streak > 0 ? `${d.streak} week streak` : '',
    ].filter(Boolean);
    Share.share({ message: lines.join('\n') }).catch(() => {});
  };

  const renderShare = (d: Dashboard) =>
    d.rows.some((r) => r.logged) ? (
      <TouchableOpacity
        style={[styles.shareButton, { borderColor: theme.accent, backgroundColor: theme.card }]}
        onPress={() => shareWeek(d)}
      >
        <Ionicons name="share-social-outline" size={18} color={theme.accent} style={{ marginRight: 8 }} />
        <Text style={{ color: theme.accent, fontWeight: '800' }}>{t('shareMyWeek')}</Text>
      </TouchableOpacity>
    ) : null;

  const renderRecords = (d: Dashboard) => (
    <TouchableOpacity style={card} activeOpacity={0.8} onPress={() => navigation.navigate('My Progress')}>
      <Text style={heading}>{t('dashPRs')}</Text>
      {d.records.length === 0 ? (
        <Text style={muted}>{t('dashPRNone')}</Text>
      ) : (
        d.records.map((r, i) => (
          <View key={i} style={styles.prRow}>
            <Ionicons name="trophy-outline" size={20} color={theme.text} style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.prName, { color: theme.text }]}>{r.name}</Text>
              <Text style={muted}>
                {r.wt} {weightFormat} × {r.reps} · {relativeDay(r.d)}
              </Text>
            </View>
          </View>
        ))
      )}
    </TouchableOpacity>
  );

  // A short note from the sender, chosen by what is happening today.
  const renderNote = (d: Dashboard) => {
    const sessions = d.week.find((c) => c.isToday)?.workouts ?? [];
    const allDone = sessions.length > 0 && sessions.every((s) => s.logged);
    const recordToday = d.records.some((r) => dayDiff(r.d, new Date()) >= -1);
    const loggedCount = d.rows.filter((r) => r.logged).length;
    let text = '';
    if (recordToday) text = noteText('pr');
    else if (allDone && loggedCount === 1) text = noteText('firstWorkout');
    else if (allDone && d.streak >= 2) text = noteText('streak', d.streak);
    else if (allDone) text = noteText('finish');
    else if (sessions.length > 0) text = noteText('welcomeBack');
    else if (d.workoutCount > 0 || d.rows.length > 0) text = noteText('restDay');
    if (!text) return null;
    return (
      <View style={[styles.note, { backgroundColor: theme.accentSoft, borderColor: theme.accent }]}>
        <Text style={{ color: theme.text, fontSize: 15, lineHeight: 22 }}>{text}</Text>
      </View>
    );
  };

  const renderWelcome = () => (
    <View style={card}>
      <Text style={heading}>{t('dashWelcome')}</Text>
      <Text style={[muted, { marginBottom: 4 }]}>{t('dashWelcomeBody')}</Text>
      {bigButton(t('homeCreateWorkout'), () => goToWorkouts('CreateWorkout'))}
      {bigButton(t('planGenerateEntry'), () => goToWorkouts('GeneratePlan'), false)}
    </View>
  );

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {greetingText ? (
        <>
          <Text style={[styles.greeting, { color: theme.accent }]}>{greetingText}</Text>
          <Text style={[styles.tagline, { color: theme.text }]}>{'Urudhi · by ஒளியன் கலைக்கூடம்'}</Text>
        </>
      ) : (
        <>
          <Text style={[styles.title, { color: theme.text }]}>Urudhi</Text>
          <Text style={[styles.tagline, { color: theme.text }]}>{'by ஒளியன் கலைக்கூடம்'}</Text>
        </>
      )}

      {data !== null && renderNote(data)}

      {needsBackup && (
        <View style={[styles.note, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={{ color: theme.text, fontWeight: '800', marginBottom: 4 }}>{t('backupReminderTitle')}</Text>
          <Text style={{ color: theme.text, opacity: 0.8, marginBottom: 10 }}>{t('backupReminderBody')}</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity
              style={[styles.startButton, { backgroundColor: theme.buttonBackground }]}
              onPress={() => navigation.navigate('Settings')}
            >
              <Text style={{ color: theme.buttonText, fontWeight: '700' }}>{t('backupReminderNow')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.startButton, { borderColor: theme.border, borderWidth: 1 }]}
              onPress={() => {
                saveSettings({ backupSnoozedUntil: Date.now() + 7 * 86400000 });
                setNeedsBackup(false);
              }}
            >
              <Text style={{ color: theme.text, fontWeight: '700' }}>{t('backupReminderLater')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {data === null ? null : data.workoutCount === 0 && data.rows.length === 0 ? (
        renderWelcome()
      ) : (
        <>
          {renderToday(data)}
          {renderWeek(data)}
          {renderStats(data)}
          {renderShare(data)}
          {renderRecords(data)}
        </>
      )}

      <TouchableOpacity
        style={[styles.github, { borderColor: theme.border, backgroundColor: theme.card }]}
        onPress={() => Linking.openURL('https://github.com/oliyan/urudhi')}
      >
        <Ionicons name="logo-github" size={18} color={theme.text} style={{ marginRight: 8 }} />
        <Text style={{ color: theme.text, fontWeight: '700' }}>{t('GitHub')}</Text>
      </TouchableOpacity>
      <Onboarding />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: 30 },
  title: { fontSize: 36, fontWeight: '900', textAlign: 'center' },
  greeting: { fontSize: 28, fontWeight: '800', textAlign: 'center' },
  shareButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 24, paddingVertical: 12, marginBottom: 14 },
  note: { borderWidth: 1, borderLeftWidth: 4, borderRadius: 14, padding: 14, marginBottom: 14 },
  tagline: { fontSize: 14, textAlign: 'center', opacity: 0.7, marginBottom: 18 },
  card: { borderWidth: 1, borderRadius: 20, padding: 18, marginBottom: 14 },
  heading: { fontSize: 18, fontWeight: '800', marginBottom: 8 },
  button: { borderRadius: 24, paddingVertical: 12, alignItems: 'center', marginTop: 10 },
  todayRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  todayName: { fontSize: 22, fontWeight: '800' },
  startButton: { borderRadius: 20, paddingVertical: 10, paddingHorizontal: 16 },
  doneBadge: { flexDirection: 'row', alignItems: 'center' },
  weekHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  dayCol: { alignItems: 'center', width: 40 },
  dayLetter: { fontWeight: '700', marginBottom: 6 },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayBar: { height: 3, width: 18, borderRadius: 2, marginTop: 6 },
  statsRow: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, alignItems: 'center', marginBottom: 14 },
  bigNumber: { fontSize: 32, fontWeight: '900' },
  unit: { fontSize: 14, fontWeight: '700' },
  statLabel: { fontSize: 13, fontWeight: '700', textAlign: 'center' },
  prRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  prName: { fontSize: 16, fontWeight: '700' },
  github: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    marginTop: 6,
  },
});
