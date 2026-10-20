import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSQLiteContext } from 'expo-sqlite';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { usePersonal } from '../context/PersonalContext';
import { WorkoutStackParamList } from '../App';
import { getApiKey } from '../utils/secureSettings';
import { generateWorkoutPlan, refineWorkoutPlan, getUserFacingErrorMessage } from '../utils/llmClient';
import { INTENSITY_HINTS, PlanRequest } from '../utils/promptTemplates';
import { ExportedWorkout, insertWorkoutData, workoutNameExists } from '../utils/workoutSharingUtils';
import { EQUIPMENT_OPTIONS, loadCoachProfile } from '../utils/coachProfile';
import { weekdayShort } from '../utils/weekdays';
import { loadInBodySnapshots } from '../utils/inbodyStorage';
import { formatBodyComposition } from '../utils/inbodyParser';

type NavProp = StackNavigationProp<WorkoutStackParamList, 'GeneratePlan'>;

const EXPERIENCE = ['Beginner', 'Intermediate', 'Advanced'];
const GOALS = ['Build muscle', 'Lose fat', 'Get stronger', 'General fitness'];
const FOCUS_AREAS = ['Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Glutes', 'Core'];
const SESSION_MINUTES = [30, 45, 60, 90];
const INTENSITIES = Object.keys(INTENSITY_HINTS);
const SPLITS = ['Push / Pull / Legs', 'Upper / Lower', 'Full Body', 'Bro Split', 'Let the coach decide'];
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const EQUIPMENT = EQUIPMENT_OPTIONS;
const SOFT_ROUND_CAP = 5;
const HIGH_SETS = 15;
const HIGH_REPS = 50;

export default function GeneratePlan() {
  const navigation = useNavigation<NavProp>();
  const db = useSQLiteContext();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { personal } = usePersonal();

  const [experience, setExperience] = useState(EXPERIENCE[1]);
  const [mainGoal, setMainGoal] = useState(GOALS[0]);
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [split, setSplit] = useState(SPLITS[4]);
  const [days, setDays] = useState<string[]>([]);
  const [sessionMinutes, setSessionMinutes] = useState<number>(60);
  const [intensity, setIntensity] = useState(INTENSITIES[1]);
  const [equipment, setEquipment] = useState<string[]>(['Full gym']);
  const [notes, setNotes] = useState('');
  const [savedConstraints, setSavedConstraints] = useState('');

  const [draft, setDraft] = useState<ExportedWorkout | null>(null);
  const [previousDraft, setPreviousDraft] = useState<ExportedWorkout | null>(null);
  const [saveName, setSaveName] = useState('');
  const [feedback, setFeedback] = useState('');
  const [rounds, setRounds] = useState(0); // real refine API calls; undo does not decrement
  const [busy, setBusy] = useState(false);

  // Async model results must not touch state or alert after the screen is gone.
  const scrollRef = useRef<ScrollView>(null);
  const mountedRef = useRef(true);
  const savedRef = useRef(false);
  const draftRef = useRef<ExportedWorkout | null>(null);
  draftRef.current = draft;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Both stages render one ScrollView in the same place, so scroll position carries over.
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [draft === null]);

  // Leaving with an unsaved draft asks first. Nothing is persisted to disk.
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (event) => {
      if (savedRef.current || !draftRef.current) return;
      event.preventDefault();
      Alert.alert(t('planDiscardTitle'), t('planDiscardMessage'), [
        { text: t('alertCancel'), style: 'cancel' },
        { text: t('planDiscard'), style: 'destructive', onPress: () => navigation.dispatch(event.data.action) },
      ]);
    });
    return unsubscribe;
  }, [navigation, t]);

  const toggle = (list: string[], setList: (v: string[]) => void, value: string) =>
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  // Equipment starts from the saved profile; toggling it here is for this plan only.
  useEffect(() => {
    loadCoachProfile().then((profile) => {
      if (!mountedRef.current) return;
      setEquipment(profile.equipment);
      setSavedConstraints(profile.standingConstraints);
    });
  }, []);

  // Constraints and body data are re-read from storage on every call, so a refine
  // round can never use stale copies of them.
  const buildRequest = async (): Promise<PlanRequest> => {
    const profile = await loadCoachProfile();
    return {
      experience,
      mainGoal,
      focusAreas,
      split,
      days: WEEKDAYS.filter((d) => days.includes(d)),
      sessionMinutes,
      intensity,
      equipment,
      notes,
      constraints: profile.standingConstraints,
      bodyComposition: formatBodyComposition(await loadInBodySnapshots()),
      userName: personal.userName,
    };
  };

  const handleGenerate = async () => {
    if (!(await getApiKey())) {
      Alert.alert(t('aiCoach'), t('planNeedsKey'));
      return;
    }
    setBusy(true);
    try {
      const plan = await generateWorkoutPlan(await buildRequest());
      if (!mountedRef.current) return;
      setDraft(plan);
      setSaveName(plan.workout_name);
      setPreviousDraft(null);
      setRounds(0);
      setFeedback('');
    } catch (error) {
      if (mountedRef.current) Alert.alert(t('aiCoach'), getUserFacingErrorMessage(error));
    } finally {
      if (mountedRef.current) setBusy(false);
    }
  };

  const handleRefine = async () => {
    if (!draft || !feedback.trim()) return;
    setBusy(true);
    try {
      const plan = await refineWorkoutPlan(draft, feedback, await buildRequest());
      if (!mountedRef.current) return;
      setPreviousDraft(draft);
      setDraft(plan);
      setRounds((r) => r + 1);
      setFeedback('');
    } catch (error) {
      if (mountedRef.current) Alert.alert(t('aiCoach'), getUserFacingErrorMessage(error));
    } finally {
      if (mountedRef.current) setBusy(false);
    }
  };

  const handleUndo = () => {
    if (!previousDraft) return;
    setDraft(previousDraft);
    setPreviousDraft(null); // single level; no API call and the round counter stays
  };

  const handleSave = async () => {
    if (!draft) return;
    const name = saveName.trim();
    if (!name) {
      Alert.alert(t('planSaveFailed'), t('planNameRequired'));
      return;
    }
    setBusy(true);
    try {
      if (await workoutNameExists(db, name)) {
        Alert.alert(t('planSaveFailed'), t('planNameTaken'));
        return;
      }
      const workoutId = await insertWorkoutData(db, { ...draft, workout_name: name });
      savedRef.current = true;
      // The plan is a normal workout now; offer to put it on the calendar right away.
      Alert.alert(t('planSavedTitle'), t('planSavedMessage'), [
        { text: t('planNotNow'), style: 'cancel', onPress: () => navigation.replace('WorkoutDetails', { workout_id: workoutId }) },
        { text: t('planScheduleNow'), onPress: () => navigation.replace('SchedulePlan', { workout_id: workoutId }) },
      ], { cancelable: false });
    } catch (error) {
      console.error('Error saving generated plan:', error);
      if (mountedRef.current) Alert.alert(t('planSaveFailed'), t('planSaveErrorMessage'));
    } finally {
      if (mountedRef.current) setBusy(false);
    }
  };

  const handleStartOver = () => {
    Alert.alert(t('planDiscardTitle'), t('planDiscardMessage'), [
      { text: t('alertCancel'), style: 'cancel' },
      {
        text: t('planDiscard'),
        style: 'destructive',
        onPress: () => {
          setDraft(null);
          setPreviousDraft(null);
          setRounds(0);
        },
      },
    ]);
  };

  const chip = (label: string, selected: boolean, onPress: () => void) => (
    <TouchableOpacity
      key={label}
      onPress={onPress}
      disabled={busy}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? theme.buttonBackground : theme.card,
          borderColor: theme.border,
        },
      ]}
    >
      <Text style={{ color: selected ? theme.buttonText : theme.text, fontWeight: '600' }}>
        {selected ? '✓ ' : ''}
        {label}
      </Text>
    </TouchableOpacity>
  );

  const input = (extra?: object) => [
    styles.input,
    { color: theme.text, backgroundColor: theme.card, borderColor: theme.border },
    extra,
  ];

  const bigButton = (label: string, onPress: () => void, disabled = false, secondary = false) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.bigButton,
        secondary
          ? { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }
          : { backgroundColor: theme.buttonBackground },
        disabled && { opacity: 0.5 },
      ]}
    >
      <Text style={[styles.bigButtonText, { color: secondary ? theme.text : theme.buttonText }]}>{label}</Text>
    </TouchableOpacity>
  );

  const busyIndicator = busy && (
    <View style={styles.busyRow}>
      <ActivityIndicator color={theme.text} />
      <Text style={{ color: theme.text, marginLeft: 10 }}>{t('planWorking')}</Text>
    </View>
  );

  if (!draft) {
    return (
      <ScrollView
        ref={scrollRef}
        style={{ backgroundColor: theme.background }}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.title, { color: theme.text }]}>{t('planGenerateTitle')}</Text>

        <Text style={[styles.section, { color: theme.text }]}>{t('planAboutYou')}</Text>

        <Text style={[styles.label, { color: theme.text }]}>{t('planExperience')}</Text>
        <View style={styles.chipRow}>{EXPERIENCE.map((e) => chip(e, experience === e, () => setExperience(e)))}</View>

        <Text style={[styles.label, { color: theme.text }]}>{t('planMainGoal')}</Text>
        <View style={styles.chipRow}>{GOALS.map((g) => chip(g, mainGoal === g, () => setMainGoal(g)))}</View>

        <Text style={[styles.label, { color: theme.text }]}>{t('planFocus')}</Text>
        <View style={styles.chipRow}>
          {chip(
            t('planFocusAll'),
            focusAreas.length === FOCUS_AREAS.length,
            () => setFocusAreas(focusAreas.length === FOCUS_AREAS.length ? [] : [...FOCUS_AREAS]),
          )}
          {FOCUS_AREAS.map((f) => chip(f, focusAreas.includes(f), () => toggle(focusAreas, setFocusAreas, f)))}
        </View>

        <Text style={[styles.section, { color: theme.text }]}>{t('planYourWeek')}</Text>

        <Text style={[styles.label, { color: theme.text }]}>{t('planDays')}</Text>
        <View style={styles.chipRow}>
          {WEEKDAYS.map((d) => chip(d, days.includes(d), () => toggle(days, setDays, d)))}
        </View>
        <Text style={{ color: theme.text, opacity: 0.6, marginTop: 6 }}>
          {days.length > 0 ? t('planDaysCount', { count: days.length }) : t('planDaysNeeded')}
        </Text>

        <Text style={[styles.label, { color: theme.text }]}>{t('planSessionLength')}</Text>
        <View style={styles.chipRow}>
          {SESSION_MINUTES.map((m) => chip(`${m} min`, sessionMinutes === m, () => setSessionMinutes(m)))}
        </View>

        <Text style={[styles.label, { color: theme.text }]}>{t('planSplit')}</Text>
        <View style={styles.chipRow}>{SPLITS.map((sp) => chip(sp, split === sp, () => setSplit(sp)))}</View>

        <Text style={[styles.section, { color: theme.text }]}>{t('planPreferences')}</Text>

        <Text style={[styles.label, { color: theme.text }]}>{t('planIntensity')}</Text>
        <View style={styles.chipRow}>{INTENSITIES.map((i) => chip(i, intensity === i, () => setIntensity(i)))}</View>

        <Text style={[styles.label, { color: theme.text }]}>{t('planEquipment')}</Text>
        <Text style={{ color: theme.text, opacity: 0.6, marginBottom: 6 }}>{t('planSelectAll')}</Text>
        <View style={styles.chipRow}>
          {EQUIPMENT.map((e) => chip(e, equipment.includes(e), () => toggle(equipment, setEquipment, e)))}
        </View>

        <Text style={[styles.label, { color: theme.text }]}>{t('planInjuriesHeading')}</Text>
        <View style={[styles.infoCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {savedConstraints.trim() ? (
            <>
              <Text style={{ color: theme.text, opacity: 0.6, marginBottom: 4 }}>{t('planInjuriesFrom')}</Text>
              <Text style={{ color: theme.text }}>{savedConstraints.trim()}</Text>
            </>
          ) : (
            <Text style={{ color: theme.text, opacity: 0.6 }}>{t('planInjuriesNone')}</Text>
          )}
        </View>

        <Text style={[styles.label, { color: theme.text }]}>{t('planLikes')}</Text>
        <TextInput
          style={input({ minHeight: 80, textAlignVertical: 'top' })}
          value={notes}
          onChangeText={setNotes}
          placeholder={t('planLikesPlaceholder')}
          placeholderTextColor={theme.text + '55'}
          multiline
          editable={!busy}
        />

        {busyIndicator}
        {bigButton(t('planGenerate'), handleGenerate, busy || days.length === 0)}
      </ScrollView>
    );
  }

  return (
    <ScrollView
      ref={scrollRef}
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.badgeRow}>
        <View style={[styles.badge, { borderColor: theme.text }]}>
          <Text style={{ color: theme.text, fontWeight: '800' }}>{t('planDraftBadge')}</Text>
        </View>
      </View>

      <Text style={[styles.label, { color: theme.text }]}>{t('planName')}</Text>
      <TextInput style={input()} value={saveName} onChangeText={setSaveName} editable={!busy} />

      {draft.days.map((day, dayIndex) => (
        <View key={`${day.day_name}-${dayIndex}`} style={[styles.dayCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.dayTitle, { color: theme.text }]}>
            {day.weekday ? `${day.day_name} · ${weekdayShort(day.weekday)}` : day.day_name}
          </Text>
          {day.exercises.map((ex, i) => {
            const unusual = ex.sets > HIGH_SETS || ex.reps > HIGH_REPS;
            return (
              <View key={`${ex.exercise_name}-${i}`} style={styles.exerciseRow}>
                <Text style={[styles.exerciseName, { color: theme.text }]}>{ex.exercise_name}</Text>
                <Text style={{ color: theme.text }}>
                  {ex.sets} × {ex.reps}
                  {ex.muscle_group ? `  ·  ${ex.muscle_group}` : ''}
                </Text>
                {ex.exercise_notes ? (
                  <Text style={{ color: theme.text, opacity: 0.65, fontStyle: 'italic' }}>{ex.exercise_notes}</Text>
                ) : null}
                {unusual && <Text style={styles.warning}>{t('planUnusualWarning')}</Text>}
              </View>
            );
          })}
        </View>
      ))}

      <Text style={[styles.label, { color: theme.text }]}>{t('planRefine')}</Text>
      <TextInput
        style={input({ minHeight: 70, textAlignVertical: 'top' })}
        value={feedback}
        onChangeText={setFeedback}
        placeholder={t('planRefinePlaceholder')}
        placeholderTextColor={theme.text + '55'}
        multiline
        editable={!busy}
      />
      {rounds >= SOFT_ROUND_CAP && (
        <Text style={{ color: theme.text, opacity: 0.7, marginBottom: 8 }}>
          {t('planManyRounds', { count: rounds })}
        </Text>
      )}

      {busyIndicator}
      {bigButton(t('planRefineButton'), handleRefine, busy || !feedback.trim(), true)}
      {previousDraft && bigButton(t('planUndo'), handleUndo, busy, true)}
      {bigButton(t('planSave'), handleSave, busy)}
      {bigButton(t('planStartOver'), handleStartOver, busy, true)}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingTop: 60, paddingBottom: 60 },
  title: { fontSize: 28, fontWeight: '900', textAlign: 'center', marginBottom: 20 },
  section: { fontSize: 22, fontWeight: '900', marginTop: 26, marginBottom: 2 },
  label: { fontSize: 16, fontWeight: '700', marginTop: 16, marginBottom: 8 },
  infoCard: { borderWidth: 1, borderRadius: 8, padding: 12 },
  input: { borderWidth: 1, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 12, fontSize: 16 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14 },
  bigButton: { borderRadius: 50, paddingVertical: 15, alignItems: 'center', marginTop: 12 },
  bigButtonText: { fontSize: 17, fontWeight: 'bold' },
  busyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  badgeRow: { alignItems: 'center', marginBottom: 6 },
  badge: { borderWidth: 2, borderRadius: 6, paddingVertical: 2, paddingHorizontal: 10 },
  dayCard: { borderWidth: 1, borderRadius: 12, padding: 14, marginTop: 14 },
  dayTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8 },
  exerciseRow: { marginBottom: 10 },
  exerciseName: { fontSize: 16, fontWeight: '700' },
  warning: { color: '#D32F2F', fontWeight: '600', marginTop: 2 },
});
