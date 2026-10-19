import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import WeekdayPicker from '../components/WeekdayPicker';
import { computeOccurrences, midnight, PlanDay, scheduleOccurrences } from '../utils/schedulePlan';
import { scheduleWorkoutNotification } from '../utils/notificationUtils';
import { weekdayShort } from '../utils/weekdays';

const WEEK_OPTIONS = [4, 8, 12];
const PREVIEW_LIMIT = 8;

const formatDate = (date: Date) =>
  `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;

// Spreads one plan over the calendar: each day of the plan lands on its weekday, every
// week, for the chosen number of weeks. Weekdays can be set or changed here too.
export default function SchedulePlan() {
  const db = useSQLiteContext();
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useTheme();
  const { t } = useTranslation();

  const [workouts, setWorkouts] = useState<{ workout_id: number; workout_name: string }[]>([]);
  const [workoutId, setWorkoutId] = useState<number | null>(
    (route.params as { workout_id?: number } | undefined)?.workout_id ?? null,
  );
  const [workoutName, setWorkoutName] = useState('');
  const [days, setDays] = useState<PlanDay[]>([]);
  const [startDate, setStartDate] = useState<Date>(() => midnight(new Date()));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [weeks, setWeeks] = useState(4);
  const [saving, setSaving] = useState(false);
  const [remind, setRemind] = useState(false);
  const [remindTime, setRemindTime] = useState<Date>(() => {
    const d = new Date();
    d.setHours(18, 0, 0, 0);
    return d;
  });
  const [showTimePicker, setShowTimePicker] = useState(false);

  useFocusEffect(
    useCallback(() => {
      db.getAllAsync<{ workout_id: number; workout_name: string }>('SELECT * FROM Workouts;')
        .then(setWorkouts)
        .catch((error) => console.error('Error fetching workouts:', error));
    }, [db]),
  );

  // Load the plan's days whenever a plan is chosen.
  React.useEffect(() => {
    if (workoutId === null) return;
    (async () => {
      try {
        const [workout] = await db.getAllAsync<{ workout_name: string }>(
          'SELECT workout_name FROM Workouts WHERE workout_id = ?;',
          [workoutId],
        );
        setWorkoutName(workout?.workout_name ?? '');
        setDays(
          await db.getAllAsync<PlanDay>(
            'SELECT day_id, day_name, weekday FROM Days WHERE workout_id = ? ORDER BY day_id;',
            [workoutId],
          ),
        );
      } catch (error) {
        console.error('Error loading plan days:', error);
      }
    })();
  }, [db, workoutId]);

  const occurrences = useMemo(() => computeOccurrences(days, startDate, weeks), [days, startDate, weeks]);
  const unassignedCount = days.filter((d) => !d.weekday).length;

  const setDayWeekday = (dayId: number, weekday: number | null) =>
    setDays((prev) => prev.map((d) => (d.day_id === dayId ? { ...d, weekday } : d)));

  const handleConfirm = async () => {
    if (occurrences.length === 0) return;
    setSaving(true);
    try {
      // Remember the weekdays chosen here so the plan keeps them.
      for (const day of days) {
        await db.runAsync('UPDATE Days SET weekday = ? WHERE day_id = ?;', [day.weekday, day.day_id]);
      }
      const { added, skipped } = await scheduleOccurrences(
        db,
        workoutName,
        occurrences,
        remind ? { time: remindTime, schedule: scheduleWorkoutNotification } : undefined,
      );
      Alert.alert(
        t('schedulePlanDoneTitle'),
        skipped > 0 ? t('schedulePlanDoneSkipped', { added, skipped }) : t('schedulePlanDone', { added }),
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    } catch (error) {
      console.error('Error scheduling plan:', error);
      Alert.alert(t('errorTitle'), t('schedulePlanFailed'));
    } finally {
      setSaving(false);
    }
  };

  const header = (
    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
      <Ionicons name="arrow-back" size={24} color={theme.text} />
    </TouchableOpacity>
  );

  // Step 1 (only when opened from the calendar): choose which plan to schedule.
  if (workoutId === null) {
    return (
      <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.container}>
        {header}
        <Text style={[styles.title, { color: theme.text }]}>{t('schedulePlanPick')}</Text>
        {workouts.length === 0 && (
          <Text style={{ color: theme.text, textAlign: 'center', opacity: 0.7 }}>{t('schedulePlanNoPlans')}</Text>
        )}
        {workouts.map((w) => (
          <TouchableOpacity
            key={w.workout_id}
            style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => setWorkoutId(w.workout_id)}
          >
            <Text style={[styles.cardText, { color: theme.text }]}>{w.workout_name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  }

  const last = occurrences.length > 0 ? occurrences[occurrences.length - 1].date : null;

  return (
    <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.container}>
      {header}
      <Text style={[styles.title, { color: theme.text }]}>{t('schedulePlanTitle')}</Text>
      <Text style={[styles.subtitle, { color: theme.text }]}>{workoutName}</Text>

      <Text style={[styles.section, { color: theme.text }]}>{t('schedulePlanWeekdays')}</Text>
      {days.map((day) => (
        <View key={day.day_id} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardText, { color: theme.text, marginBottom: 10 }]}>{day.day_name}</Text>
          <WeekdayPicker value={day.weekday} onChange={(weekday) => setDayWeekday(day.day_id, weekday)} />
        </View>
      ))}

      <Text style={[styles.section, { color: theme.text }]}>{t('schedulePlanStart')}</Text>
      <TouchableOpacity
        style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
        onPress={() => setShowDatePicker(true)}
      >
        <Text style={[styles.cardText, { color: theme.text, textAlign: 'center' }]}>{formatDate(startDate)}</Text>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display="default"
          minimumDate={midnight(new Date())}
          onChange={(_event, date) => {
            setShowDatePicker(false);
            if (date) setStartDate(midnight(date));
          }}
        />
      )}

      <Text style={[styles.section, { color: theme.text }]}>{t('schedulePlanLength')}</Text>
      <View style={styles.chipRow}>
        {WEEK_OPTIONS.map((option) => {
          const selected = weeks === option;
          return (
            <TouchableOpacity
              key={option}
              onPress={() => setWeeks(option)}
              style={[
                styles.chip,
                { backgroundColor: selected ? theme.buttonBackground : theme.card, borderColor: theme.border },
              ]}
            >
              <Text style={{ color: selected ? theme.buttonText : theme.text, fontWeight: '700' }}>
                {t('schedulePlanWeeksOption', { count: option })}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={[styles.section, { color: theme.text }]}>{t('schedulePlanReminder')}</Text>
      <View style={styles.chipRow}>
        {[false, true].map((value) => {
          const selected = remind === value;
          return (
            <TouchableOpacity
              key={String(value)}
              onPress={() => setRemind(value)}
              style={[
                styles.chip,
                { backgroundColor: selected ? theme.buttonBackground : theme.card, borderColor: theme.border },
              ]}
            >
              <Text style={{ color: selected ? theme.buttonText : theme.text, fontWeight: '700' }}>
                {value ? t('schedulePlanRemindYes') : t('schedulePlanRemindNo')}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {remind && (
        <TouchableOpacity
          style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, marginTop: 12 }]}
          onPress={() => setShowTimePicker(true)}
        >
          <Text style={[styles.cardText, { color: theme.text, textAlign: 'center' }]}>
            {remindTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}
          </Text>
        </TouchableOpacity>
      )}
      {remind && showTimePicker && (
        <DateTimePicker
          value={remindTime}
          mode="time"
          display="default"
          onChange={(_event, date) => {
            setShowTimePicker(false);
            if (date) setRemindTime(date);
          }}
        />
      )}

      <Text style={[styles.section, { color: theme.text }]}>{t('schedulePlanPreviewTitle')}</Text>
      {occurrences.length === 0 ? (
        <Text style={{ color: theme.text, opacity: 0.7 }}>{t('schedulePlanNothing')}</Text>
      ) : (
        <View>
          <Text style={{ color: theme.text, marginBottom: 8 }}>
            {t('schedulePlanSummary', {
              count: occurrences.length,
              from: formatDate(occurrences[0].date),
              to: formatDate(last as Date),
            })}
          </Text>
          {occurrences.slice(0, PREVIEW_LIMIT).map((o, i) => (
            <Text key={i} style={{ color: theme.text, paddingVertical: 2 }}>
              {weekdayShort(o.day.weekday)} {formatDate(o.date).slice(0, 5)} · {o.day.day_name}
            </Text>
          ))}
          {occurrences.length > PREVIEW_LIMIT && (
            <Text style={{ color: theme.text, opacity: 0.7, paddingTop: 4 }}>
              {t('schedulePlanMore', { count: occurrences.length - PREVIEW_LIMIT })}
            </Text>
          )}
        </View>
      )}
      {unassignedCount > 0 && occurrences.length > 0 && (
        <Text style={{ color: theme.text, opacity: 0.7, marginTop: 8 }}>
          {t('schedulePlanUnassigned', { count: unassignedCount })}
        </Text>
      )}

      <TouchableOpacity
        style={[
          styles.confirm,
          { backgroundColor: theme.buttonBackground, opacity: occurrences.length === 0 || saving ? 0.4 : 1 },
        ]}
        disabled={occurrences.length === 0 || saving}
        onPress={handleConfirm}
      >
        <Text style={{ color: theme.buttonText, fontWeight: '700', fontSize: 18 }}>
          {t('schedulePlanConfirm', { count: occurrences.length })}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingBottom: 60 },
  backButton: { padding: 8, marginTop: 40, alignSelf: 'flex-start' },
  title: { fontSize: 28, fontWeight: '800', textAlign: 'center', marginVertical: 12 },
  subtitle: { fontSize: 18, textAlign: 'center', opacity: 0.7, marginBottom: 12 },
  section: { fontSize: 20, fontWeight: '800', marginTop: 22, marginBottom: 10 },
  card: { borderWidth: 1, borderRadius: 12, padding: 16, marginBottom: 12 },
  cardText: { fontSize: 18, fontWeight: '700' },
  chipRow: { flexDirection: 'row', gap: 10 },
  chip: { borderWidth: 1, borderRadius: 20, paddingVertical: 10, paddingHorizontal: 18 },
  confirm: { borderRadius: 12, paddingVertical: 18, alignItems: 'center', marginTop: 28 },
});
