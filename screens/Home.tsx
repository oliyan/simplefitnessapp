import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { ensureInProgressColumn } from '../utils/workoutProgress';
import { usePersonal } from '../context/PersonalContext';
import { BUILD } from '../config/buildFlags';
import Onboarding from '../components/Onboarding';
import Ring from '../components/goals/Ring';
import WeeklyGoalModal from '../components/goals/WeeklyGoalModal';
import useProgressData from '../components/progress/useProgressData';
import { loadSettings, saveSettings } from '../utils/settingsStorage';
import useGoals from '../utils/useGoals';
import { buildWeek, dayDiff, nextUpcoming, WeekCell, weeklyStreak, WorkoutRow } from '../utils/dashboardStats';
import { consistencyGrid, freshRecord, formatKg } from '../utils/progressStats';
import {
  checklistSteps, homeInsight, partOfDay, pickHomeCard, weekKey, weeklyTarget, HomeCard,
} from '../utils/motivation';
import { loadSessionDetails, SessionDetail } from '../utils/homeDetails';
import { dateToWeekday, WEEKDAY_LETTERS, weekdayShort } from '../utils/weekdays';

interface Dashboard {
  workoutCount: number;
  rows: WorkoutRow[];
  week: WeekCell[];
}

const formatDM = (date: Date) =>
  `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;

// Home: what to do today and whether the week is on track. The long view (graphs, records, streak
// history, badges) lives in My Progress; Home only peeks at it and links there.
export default function Home({ navigation }: any) {
  const db = useSQLiteContext();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { personal, noteText } = usePersonal();
  const { sessions, sets } = useProgressData();
  const { goals, update } = useGoals();

  const today = useMemo(() => new Date(), []);
  // The greeting you wrote, or a time-of-day hello with the name once one is known.
  const name = personal.userName.trim();
  const greetingText = personal.greeting.trim() || (name ? `${partOfDay(today.getHours())}, ${name}!` : '');

  const [data, setData] = useState<Dashboard | null>(null);
  const [details, setDetails] = useState<Record<number, SessionDetail>>({});
  const [needsBackup, setNeedsBackup] = useState(false);
  const [goalModal, setGoalModal] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        try {
          const since = Math.floor(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 730).getTime() / 1000);
          await ensureInProgressColumn(db);
          const [countRow] = await db.getAllAsync<{ c: number }>('SELECT COUNT(*) AS c FROM Workouts;');
          const rows = await db.getAllAsync<WorkoutRow & { workout_name: string }>(
            `SELECT w.workout_log_id, w.workout_date, w.workout_name, w.day_name,
                    (EXISTS(SELECT 1 FROM Weight_Log x WHERE x.workout_log_id = w.workout_log_id)
                      AND COALESCE(w.in_progress, 0) = 0) AS logged,
                    COALESCE(w.in_progress, 0) AS in_progress
             FROM Workout_Log w WHERE w.workout_date >= ?;`,
            [since],
          );
          const week = buildWeek(rows, today);
          const todayCell = week.find((c) => c.isToday);
          const pending = (todayCell?.workouts ?? []).filter((s) => !s.logged);
          const next = pending.length === 0 ? nextUpcoming(rows, today) : null;
          const wanted = [...pending, ...(next ? [next] : [])];
          const info = await loadSessionDetails(db, wanted);
          const saved = await loadSettings();
          // The 30 days count from the last export, or from the first launch if there has been none,
          // so a new install never greets someone with a backup reminder.
          let lastBackup: number = saved?.lastBackup ?? 0;
          if (!lastBackup) {
            lastBackup = Date.now();
            saveSettings({ lastBackup });
          }
          const snoozedUntil: number = saved?.backupSnoozedUntil ?? 0;
          const hasHistory = rows.filter((r) => r.logged).length >= 5;
          if (!active) return;
          setNeedsBackup(hasHistory && Date.now() - lastBackup > 30 * 86400000 && Date.now() > snoozedUntil);
          setDetails(info);
          setData({ workoutCount: countRow?.c ?? 0, rows, week });
        } catch (error) {
          console.error('Error loading dashboard:', error);
        }
      })();
      return () => {
        active = false;
      };
    }, [db]),
  );

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

  const goToCalendar = () => navigation.navigate('My Calendar', { screen: 'MyCalendar' }); // back to the calendar even if a workout screen is open
  const goToWorkouts = (screen: string) => navigation.navigate('My Workouts', { screen, initial: false });
  const goToProgress = () => navigation.navigate('My Progress');
  const goToExercise = (exercise: string) => navigation.navigate('My Progress', { screen: 'ExerciseProgress', params: { name: exercise } });

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

  // What is in a workout, in one or two lines: size, time, muscles and the coach's first line.
  const renderDetail = (id: number) => {
    const d = details[id];
    if (!d || d.exercises === 0) return null;
    return (
      <View style={{ marginTop: 4 }}>
        <Text style={muted}>
          {d.exercises} {d.exercises === 1 ? 'exercise' : 'exercises'}, about {d.minutes} min
          {d.muscles.length > 0 ? `, ${d.muscles.join(', ')}` : ''}
        </Text>
        {d.note ? <Text style={{ color: theme.text, fontStyle: 'italic', marginTop: 4, lineHeight: 20 }}>{`"${d.note}"`}</Text> : null}
      </View>
    );
  };

  const renderToday = (d: Dashboard) => {
    const todayCell = d.week.find((c) => c.isToday);
    const sessionsToday = todayCell?.workouts ?? [];
    const pending = sessionsToday.filter((s) => !s.logged);

    if (sessionsToday.length > 0) {
      return (
        <View style={[card, { backgroundColor: theme.accentSoft, borderColor: theme.accent }]}>
          <Text style={[heading, { color: theme.accent }]}>{t('Today')}</Text>
          {sessionsToday.map((s) => (
            <View key={s.workout_log_id} style={styles.todayRow}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={[styles.todayName, { color: theme.text }]}>{s.day_name}</Text>
                <Text style={muted}>{s.workout_name}</Text>
                {!s.logged && renderDetail(s.workout_log_id)}
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
          <>
            <Text style={{ color: theme.text, fontSize: 16 }}>{t('dashNext', { when: relativeDay(next.workout_date), name: next.day_name })}</Text>
            {renderDetail(next.workout_log_id)}
            <Text style={[muted, { marginTop: 8 }]}>Rest is part of the plan. A relaxed walk counts too.</Text>
          </>
        ) : (
          <>
            <Text style={muted}>{t('dashNothingPlanned')}</Text>
            {bigButton(t('dashSchedule'), () => navigation.navigate('My Calendar', { screen: 'SchedulePlan', initial: false }))}
          </>
        )}
      </View>
    );
  };

  // The week at a glance plus a ring toward this week's goal (the plan's sessions unless one was chosen).
  const renderWeek = (d: Dashboard) => {
    const planned = d.week.flatMap((c) => c.workouts);
    const done = planned.filter((s) => s.logged).length;
    const target = weeklyTarget(planned.length, goals.weeklySessions);
    return (
      <TouchableOpacity style={card} activeOpacity={0.8} onPress={goToCalendar}>
        <View style={styles.weekHeader}>
          <View style={{ flex: 1 }}>
            <Text style={heading}>{t('dashThisWeek')}</Text>
            {target > 0 && (
              <Text style={muted}>
                {done >= target ? `Goal met: ${done} of ${target} sessions` : `${done} of ${target} sessions${goals.weeklySessions ? ' (your goal)' : ''}`}
              </Text>
            )}
          </View>
          {target === 0 && (
            <TouchableOpacity onPress={() => setGoalModal(true)} accessibilityRole="button" style={{ minHeight: 44, justifyContent: 'center' }}>
              <Text style={{ color: theme.accent, fontWeight: '800' }}>Set a weekly goal</Text>
            </TouchableOpacity>
          )}
          {target > 0 && (
            <TouchableOpacity onPress={() => setGoalModal(true)} accessibilityRole="button" accessibilityLabel="Change the weekly goal" style={{ padding: 4 }}>
              <Ring size={52} stroke={6} progress={done / target} color={done >= target ? '#28A745' : undefined}>
                {done >= target ? (
                  <Ionicons name="checkmark" size={22} color="#28A745" />
                ) : (
                  <Text style={{ color: theme.text, fontWeight: '800', fontSize: 13 }}>{done}/{target}</Text>
                )}
              </Ring>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.weekRow}>
          {d.week.map((cell, index) => (
            <View key={index} style={styles.dayCol}>
              <Text style={[styles.dayLetter, { color: theme.text, opacity: cell.isToday ? 1 : 0.6 }]}>{WEEKDAY_LETTERS[index]}</Text>
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

  // One kind card at a time: a welcome back, the streak, a close goal, a plateau, a near badge, or the person's own reason.
  const renderMotivation = (d: Dashboard) => {
    const sessionsToday = d.week.find((c) => c.isToday)?.workouts ?? [];
    const doneToday = sessionsToday.length > 0 && sessionsToday.every((s) => s.logged);
    const pick: HomeCard | null = pickHomeCard({ sessions, sets, today, goals, doneToday });
    if (!pick) return null;
    const base = [styles.card, { backgroundColor: theme.card, borderColor: theme.border }];
    const row = (icon: string, color: string, title: string, body: string, extra?: React.ReactNode, onPress?: () => void) => (
      <TouchableOpacity activeOpacity={onPress ? 0.8 : 1} onPress={onPress} disabled={!onPress} style={base} accessibilityRole={onPress ? 'button' : undefined}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          <Ionicons name={icon as any} size={26} color={color} style={{ marginRight: 12, marginTop: 2 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: theme.text, fontWeight: '800', fontSize: 16 }}>{title}</Text>
            <Text style={{ color: theme.text, opacity: 0.8, lineHeight: 21, marginTop: 2 }}>{body}</Text>
            {extra}
          </View>
        </View>
      </TouchableOpacity>
    );
    const thisWeek = weekKey(today);
    switch (pick.kind) {
      case 'comeback':
        return row('sunny', '#E0A400', 'Welcome back', pick.message);
      case 'guard':
        return row(
          'flame', '#F97316', 'Keep your streak going', pick.message,
          <TouchableOpacity onPress={() => update({ restWeeks: [...goals.restWeeks, thisWeek] })} style={styles.cardLink} accessibilityRole="button">
            <Text style={{ color: theme.accent, fontWeight: '800' }}>Ill or away? Mark this week as a rest week</Text>
          </TouchableOpacity>,
        );
      case 'rested':
        return row(
          'bed', theme.accent, 'Rest week is on', 'Your streak is safe. Rest well and come back strong.',
          <TouchableOpacity onPress={() => update({ restWeeks: goals.restWeeks.filter((w) => w !== thisWeek) })} style={styles.cardLink} accessibilityRole="button">
            <Text style={{ color: theme.accent, fontWeight: '800' }}>Undo</Text>
          </TouchableOpacity>,
        );
      case 'goal':
        return row('flag', theme.accent, `Nearly there: ${pick.name}`, pick.sentence, undefined, () => goToExercise(pick.name));
      case 'plateau':
        return row('bulb', '#E0A400', `A little stuck on ${pick.name}?`, `It happens to everyone. ${pick.tip}`, undefined, () => goToExercise(pick.name));
      case 'milestone':
        return row('ribbon', theme.accent, 'Your next badge', pick.message, undefined, goToProgress);
      case 'why':
        return row('heart', '#E0457B', 'Why you started', `"${pick.text}"`);
      default:
        return null;
    }
  };

  // A small look at progress, with the way into the full page.
  const renderPeek = (d: Dashboard) => {
    if (!d.rows.some((r) => r.logged)) return null;
    const streak = weeklyStreak(d.rows, today, goals.restWeeks);
    const grid = consistencyGrid(sessions, sets, today, 4);
    const fresh = freshRecord(sets, today);
    const cellColor = (level: number, future: boolean) => {
      if (future) return 'transparent';
      if (level === 0) return theme.type === 'dark' ? 'rgba(234,244,242,0.08)' : 'rgba(16,32,30,0.07)';
      const a = [0, 0.3, 0.6, 1][level];
      return theme.type === 'dark' ? `rgba(45,212,191,${a})` : `rgba(15,118,110,${a})`;
    };
    return (
      <View>
        {fresh && (
          <TouchableOpacity onPress={() => goToExercise(fresh.name)} style={[styles.recordChip, { backgroundColor: 'rgba(224,164,0,0.16)', borderColor: '#E0A400' }]} accessibilityRole="button">
            <Ionicons name="trophy" size={18} color="#E0A400" style={{ marginRight: 8 }} />
            <Text style={{ color: theme.text, fontWeight: '800', flex: 1 }} numberOfLines={1}>
              New record: {fresh.name}, {formatKg(fresh.wt)} kg x {fresh.reps}
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={card} activeOpacity={0.8} onPress={goToProgress} accessibilityRole="button" accessibilityLabel="Open My Progress">
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ alignItems: 'center', marginRight: 16 }}>
              <Ionicons name="flame" size={26} color={streak > 0 ? '#F97316' : theme.text} style={{ opacity: streak > 0 ? 1 : 0.35 }} />
              <Text style={{ color: theme.text, fontSize: 28, fontWeight: '900' }}>{streak}</Text>
              <Text style={[muted, { fontSize: 11 }]}>{streak === 1 ? 'week' : 'weeks'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.text, fontWeight: '800', fontSize: 16 }}>Your progress</Text>
              <Text style={{ color: theme.text, opacity: 0.8, lineHeight: 20, marginTop: 2 }}>{homeInsight(sessions, sets, today, goals.restWeeks, !!fresh)}</Text>
            </View>
            <View style={{ flexDirection: 'row', marginLeft: 10 }}>
              {grid.map((col, w) => (
                <View key={w} style={{ marginRight: w === grid.length - 1 ? 0 : 3 }}>
                  {col.map((cell, i) => (
                    <View key={i} style={{ width: 9, height: 9, borderRadius: 3, marginBottom: i === 6 ? 0 : 3, backgroundColor: cellColor(cell.level, cell.future) }} />
                  ))}
                </View>
              ))}
            </View>
          </View>
          <Text style={{ color: theme.accent, fontWeight: '800', marginTop: 10 }}>See my progress</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Fast ways in: a workout without a plan, one from the past, or a generated plan.
  const renderQuick = () => (
    <View style={styles.quickRow}>
      <TouchableOpacity
        style={[styles.quick, { backgroundColor: theme.card, borderColor: theme.border }]}
        onPress={() => navigation.navigate('My Calendar', { screen: 'LogWorkout', params: { selectedDate: new Date().toISOString() }, initial: false })}
        accessibilityRole="button"
      >
        <Ionicons name="flash" size={20} color={theme.accent} />
        <Text style={[styles.quickText, { color: theme.text }]}>Quick workout</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.quick, { backgroundColor: theme.card, borderColor: theme.border }]}
        onPress={() => navigation.navigate('My Calendar', { screen: 'LogWorkout', params: { selectedDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1, 12).toISOString() }, initial: false })}
        accessibilityRole="button"
      >
        <Ionicons name="time-outline" size={20} color={theme.accent} />
        <Text style={[styles.quickText, { color: theme.text }]}>Log a past one</Text>
      </TouchableOpacity>
      {BUILD.showAiPlanGenerator && (
        <TouchableOpacity
          style={[styles.quick, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={() => goToWorkouts('GeneratePlan')}
          accessibilityRole="button"
        >
          <Ionicons name="sparkles-outline" size={20} color={theme.accent} />
          <Text style={[styles.quickText, { color: theme.text }]} numberOfLines={1}>New plan</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // A short list for the first days, which goes away once everything is done (or when hidden).
  const renderChecklist = (d: Dashboard) => {
    if (goals.checklistHidden) return null;
    const steps = checklistSteps({
      plans: d.workoutCount,
      scheduled: d.rows.length,
      logged: d.rows.filter((r) => r.logged).length,
      visitedProgress: goals.progressVisited,
    });
    if (steps.every((s) => s.done)) return null;
    return (
      <View style={card}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={heading}>Getting started</Text>
          <TouchableOpacity onPress={() => update({ checklistHidden: true })} accessibilityRole="button" style={{ minHeight: 44, justifyContent: 'center', paddingLeft: 12 }}>
            <Text style={{ color: theme.accent, fontWeight: '700' }}>Hide</Text>
          </TouchableOpacity>
        </View>
        {steps.map((s) => (
          <View key={s.label} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 5 }}>
            <Ionicons name={s.done ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={s.done ? theme.accent : theme.text} style={{ marginRight: 10, opacity: s.done ? 1 : 0.4 }} />
            <Text style={{ color: theme.text, opacity: s.done ? 0.55 : 1, textDecorationLine: s.done ? 'line-through' : 'none' }}>{s.label}</Text>
          </View>
        ))}
      </View>
    );
  };

  // A short note from the sender, chosen by what is happening today.
  const renderNote = (d: Dashboard) => {
    const sessionsToday = d.week.find((c) => c.isToday)?.workouts ?? [];
    const allDone = sessionsToday.length > 0 && sessionsToday.every((s) => s.logged);
    const recordToday = freshRecord(sets, today) ? dayDiff(freshRecord(sets, today)!.d, today) >= -1 : false;
    const loggedCount = d.rows.filter((r) => r.logged).length;
    const streak = weeklyStreak(d.rows, today, goals.restWeeks);
    let text = '';
    if (recordToday) text = noteText('pr');
    else if (allDone && loggedCount === 1) text = noteText('firstWorkout');
    else if (allDone && streak >= 2) text = noteText('streak', streak);
    else if (allDone) text = noteText('finish');
    else if (sessionsToday.length > 0) text = noteText('welcomeBack');
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
      <Text style={[muted, { marginBottom: 4 }]}>{t(BUILD.mentionAi ? 'dashWelcomeBody' : 'dashWelcomeBodyPlain')}</Text>
      {bigButton(t('homeCreateWorkout'), () => goToWorkouts('CreateWorkout'))}
      {BUILD.showAiPlanGenerator && bigButton(`Generate a plan with ${personal.senderName.trim() || 'AI'}`, () => goToWorkouts('GeneratePlan'), false)}
    </View>
  );

  const plannedPerWeek = data ? data.week.flatMap((c) => c.workouts).length : 0;

  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
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
            <TouchableOpacity style={[styles.startButton, { backgroundColor: theme.buttonBackground }]} onPress={() => navigation.navigate('Settings')}>
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
          {renderMotivation(data)}
          {renderPeek(data)}
          {renderChecklist(data)}
          {renderQuick()}
        </>
      )}

      <WeeklyGoalModal
        visible={goalModal}
        planned={plannedPerWeek}
        current={goals.weeklySessions}
        onPick={(value) => {
          update({ weeklySessions: value });
          setGoalModal(false);
        }}
        onClose={() => setGoalModal(false)}
      />

      <Onboarding />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: 30 },
  title: { fontSize: 36, fontWeight: '900', textAlign: 'center' },
  greeting: { fontSize: 28, fontWeight: '800', textAlign: 'center' },
  note: { borderWidth: 1, borderLeftWidth: 4, borderRadius: 14, padding: 14, marginBottom: 14 },
  tagline: { fontSize: 14, textAlign: 'center', opacity: 0.7, marginBottom: 18 },
  card: { borderWidth: 1, borderRadius: 20, padding: 18, marginBottom: 14 },
  heading: { fontSize: 18, fontWeight: '800', marginBottom: 8 },
  button: { borderRadius: 24, paddingVertical: 12, alignItems: 'center', marginTop: 10 },
  todayRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  todayName: { fontSize: 22, fontWeight: '800' },
  startButton: { borderRadius: 20, paddingVertical: 10, paddingHorizontal: 16 },
  doneBadge: { flexDirection: 'row', alignItems: 'center' },
  weekHeader: { flexDirection: 'row', alignItems: 'center' },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  dayCol: { alignItems: 'center', width: 40 },
  dayLetter: { fontWeight: '700', marginBottom: 6 },
  dayCircle: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  todayBar: { height: 3, width: 18, borderRadius: 2, marginTop: 6 },
  cardLink: { minHeight: 44, justifyContent: 'center', marginTop: 4 },
  recordChip: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 18, paddingVertical: 10, paddingHorizontal: 14, marginBottom: 12, minHeight: 44 },
  quickRow: { flexDirection: 'row', marginBottom: 14 },
  quick: { flex: 1, borderWidth: 1, borderRadius: 18, paddingVertical: 12, alignItems: 'center', marginHorizontal: 4, minHeight: 64, justifyContent: 'center' },
  quickText: { fontSize: 12, fontWeight: '700', marginTop: 4, textAlign: 'center' },
});
