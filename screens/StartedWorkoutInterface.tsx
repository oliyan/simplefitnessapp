import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TouchableWithoutFeedback,
  ScrollView, 
  ActivityIndicator,
  TextInput,
  Alert,
  FlatList,
  Vibration,
  Platform,
  Switch,
  Modal,
  AppState,
  Linking,
  StatusBar
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useSQLiteContext } from 'expo-sqlite';
import { StartWorkoutStackParamList } from '../App';
import * as Notifications from 'expo-notifications';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useSettings } from '../context/SettingsContext';
import { ensureInProgressColumn, setWorkoutInProgress } from '../utils/workoutProgress';
import { loadRestTimerPreferences, saveRestTimerPreferences } from '../utils/startedWorkoutPreferenceUtils';
import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from 'expo-av';
import { getApiKey } from '../utils/secureSettings';
import { generateCoachNote } from '../utils/llmClient';
import { buildCoachNoteContext } from '../utils/coachNoteContext';
import { loadCoachProfile } from '../utils/coachProfile';
import { loadInBodySnapshots } from '../utils/inbodyStorage';
import { formatBodyComposition } from '../utils/inbodyParser';
import { ensureCoachNotesTable, getCachedCoachNote, saveCoachNote, CoachNote } from '../utils/coachNotesUtils';
import {
  useTimerPersistence,
  createTimerState,
  updateTimerState,
  timerCalculations,
  TimerState
} from '../utils/timerPersistenceUtils';
import { AutoSizeText, ResizeTextMode } from 'react-native-auto-size-text';
import WeightSuggestionBadge from '../components/WeightSuggestionBadge';
import {
    DifficultyLevel,
    analyzeDifficultyAndSuggestWeight,
    saveSuggestedWeight,
    getSuggestedWeight,
    getDifficultyColor,
    getDifficultyEmoji,
    DEFAULT_WEIGHT_INCREMENT
} from '../utils/difficultyUtils';
import {
  WorkoutSet as ExerciseSet,
  groupStats,
  groupIndices,
  exerciseDone,
  firstUnloggedIndex,
  dropUnloggedExtras,
  addExtraSet,
  renameExtraSet,
  previousSetHint,
  nextUnloggedExerciseId,
  unloggedCount,
  restoreLoggedSets,
  LoggedSetRow,
} from '../utils/workoutSets';

type StartedWorkoutRouteProps = RouteProp<
  StartWorkoutStackParamList,
  'StartedWorkoutInterface'
>;

// Define interfaces for workout data
interface Exercise {
  exercise_name: string;
  sets: number;
  reps: number;
  logged_exercise_id: number;
  exercise_fully_logged: boolean;
  web_link: string | null;
  muscle_group: string | null;
  exercise_notes: string | null;
}

// One earlier session of an exercise, shown on the "previous workout" card.
interface HistorySession {
  workoutDate: number;
  sets: Array<{ reps: number; weight: number; difficulty: string | null; comments: string | null }>;
}

const MAX_HISTORY_SESSIONS = 8;

export default function StartedWorkoutInterface() {
  const navigation = useNavigation();
  const route = useRoute<StartedWorkoutRouteProps>();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const db = useSQLiteContext();
  const { notificationPermissionGranted, requestNotificationPermission, weightFormat } = useSettings();
  
  const { workout_log_id } = route.params;
  
  // States for workout data
  const [loading, setLoading] = useState(true);
  const [workout, setWorkout] = useState<{
    workout_name: string;
    workout_date: number;
    day_name: string;
  } | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  // Coach note shown in the overview: 'loading' while the model is called, 'ready'
  // when there is text to show; anything else (cached NONE, failure, no key) shows nothing.
  const [coachNote, setCoachNote] = useState<{ status: 'idle' | 'loading' | 'ready'; note: CoachNote | null }>({
    status: 'idle',
    note: null,
  });

  // Workout flow states
  const [restTime, setRestTime] = useState('30');
  const [exerciseRestTime, setExerciseRestTime] = useState('60');
  const [isExerciseListModalVisible, setIsExerciseListModalVisible] = useState(false);

  // Workout behaviour is fixed: weights and reps are filled from the last log, and rest
  // timers vibrate, play a sound and notify (when the notification permission is granted).
  const autoFillWeight = true;
  const autoFillReps = true;
  const useLogsForRepInput = true;
  const enableSetSwitchSound = true;
  const enableVibration = true;
  const enableNotifications = notificationPermissionGranted;

  // Sets data for tracking workout
  const [allSets, setAllSets] = useState<ExerciseSet[]>([]);

  // State for notes modal (the overview and rest screens still open notes in a pop-up)
  const [isNotesModalVisible, setIsNotesModalVisible] = useState(false);
  const [notesModalContent, setNotesModalContent] = useState('');
  const [notesModalTitle, setNotesModalTitle] = useState('');

  // Timer state using the new utility
  const [timerState, setTimerState] = useState<TimerState>(createTimerState());
  const [isCompletingSet, setIsCompletingSet] = useState(false);

  // Fixing a set that was already logged (weight and reps only).
  const [editingSetIndex, setEditingSetIndex] = useState<number | null>(null);
  const [editWeight, setEditWeight] = useState('');
  const [editReps, setEditReps] = useState('');

  const [weightIncrement, setWeightIncrement] = useState(DEFAULT_WEIGHT_INCREMENT);
  const [suggestedWeights, setSuggestedWeights] = useState<Map<number, number>>(new Map());

  // Timer refs for intervals
  const workoutTimerRef = useRef<NodeJS.Timeout | null>(null);
  const restTimerRef = useRef<NodeJS.Timeout | null>(null);
  const weightMapRef = useRef(new Map<string, string>());
  const repsMapRef = useRef(new Map<string, string>());
  
  const updateExerciseLoggedStatus = (exerciseId: number, currentSets: ExerciseSet[]) => {
    const exerciseSets = currentSets.filter(s => s.exercise_id === exerciseId);
    const allSetsLogged = exerciseSets.every(s => s.set_logged);

    setExercises(prevExercises =>
      prevExercises.map(ex =>
        ex.logged_exercise_id === exerciseId
          ? { ...ex, exercise_fully_logged: allSetsLogged }
          : ex
      )
    );
  };

  // Earlier sessions of each exercise name (newest first, at most MAX_HISTORY_SESSIONS), and
  // which of them the "previous workout" card is showing (0 = the most recent).
  const [previousWorkoutHistory, setPreviousWorkoutHistory] = useState<Map<string, HistorySession[]>>(new Map());
  const [historyOffset, setHistoryOffset] = useState(0);
  const historyRequestedRef = useRef(new Set<string>());

  // Fetch suggested weights for exercises
  const fetchSuggestedWeights = async (workoutData?: { workout_name: string; day_name: string }, exercisesList?: Exercise[]) => {
    const workoutToUse = workoutData || workout;
    const exercisesToUse = exercisesList || exercises;

    if (!workoutToUse) return;

    try {
      const suggestions = new Map<number, number>();

      for (const exercise of exercisesToUse) {
        const suggested = await getSuggestedWeight(
          db,
          workoutToUse.workout_name,
          workoutToUse.day_name,
          exercise.exercise_name
        );

        if (suggested !== null) {
          suggestions.set(exercise.logged_exercise_id, suggested);
        }
      }

      setSuggestedWeights(suggestions);
    } catch (error) {
      console.error('Error fetching suggested weights:', error);
    }
  };

  // Fetch earlier sessions of an exercise (this workout excluded), newest first
  const fetchPreviousWorkoutHistory = async (exerciseName: string): Promise<HistorySession[]> => {
    try {
      const rows = await db.getAllAsync<{
        workout_log_id: number;
        reps_logged: number;
        weight_logged: number;
        difficulty: string | null;
        workout_date: number;
        comments: string | null;
      }>(
        `SELECT wl.workout_log_id, wl.reps_logged, wl.weight_logged, wl.difficulty, wl.comments, w.workout_date
         FROM Weight_Log wl
         JOIN Workout_Log w ON wl.workout_log_id = w.workout_log_id
         WHERE wl.exercise_name = ?
         AND wl.workout_log_id != ?
         ORDER BY w.workout_date DESC, wl.workout_log_id DESC, wl.weight_log_id ASC
         LIMIT 400`,
        [exerciseName.trim(), workout_log_id]
      );

      const sessions: HistorySession[] = [];
      let lastLogId = -1;
      for (const row of rows) {
        if (row.workout_log_id !== lastLogId) {
          if (sessions.length === MAX_HISTORY_SESSIONS) break;
          sessions.push({ workoutDate: row.workout_date, sets: [] });
          lastLogId = row.workout_log_id;
        }
        sessions[sessions.length - 1].sets.push({
          reps: row.reps_logged,
          weight: row.weight_logged,
          difficulty: row.difficulty || 'Medium',
          comments: row.comments || null,
        });
      }
      return sessions;
    } catch (error) {
      console.error('Error fetching previous workout history:', error);
      return [];
    }
  };

  // Log the current set (weight, reps and difficulty are already on the screen).
  const completeSet = async (setIndex: number, isFinishingWorkout: boolean = false) => {
    const currentSet = allSets[setIndex];
    if (!currentSet || currentSet.set_logged) return;

    const weight = parseFloat(currentSet.weight);
    const reps = parseInt(currentSet.reps_done);
    if (!currentSet.exercise_name.trim()) {
      Alert.alert(t('missingInformation'), t('exerciseNameRequired'));
      return;
    }
    if (isNaN(weight) || weight < 0 || isNaN(reps) || reps <= 0 || !currentSet.difficulty) {
      Alert.alert(t('missingInformation'), t('enterRepsAndWeight'));
      return;
    }

    setIsCompletingSet(true);
    try {
      // Planned sets keep their position as the set number. The table allows one row per
      // (workout, planned exercise, set number), so an extra set takes the next free number
      // even when it was renamed to a different exercise.
      let setNumber = groupStats(allSets, setIndex).number;
      if (currentSet.is_extra) {
        const next = await db.getFirstAsync<{ n: number }>(
          `SELECT COALESCE(MAX(set_number), 0) + 1 AS n FROM Weight_Log WHERE workout_log_id = ? AND logged_exercise_id = ?;`,
          [workout_log_id, currentSet.exercise_id]
        );
        setNumber = next?.n ?? setNumber;
      }

      const result = await db.runAsync(
        `INSERT INTO Weight_Log (workout_log_id, logged_exercise_id, exercise_name, set_number, weight_logged, reps_logged, muscle_group, difficulty, comments)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          workout_log_id,
          currentSet.exercise_id,
          currentSet.exercise_name.trim(),
          setNumber,
          weight,
          reps,
          currentSet.muscle_group,
          currentSet.difficulty,
          currentSet.comments || ''
        ]
      );

      // The workout counts as "in progress" (resumable) from its first logged set until it is finished.
      await setWorkoutInProgress(db, workout_log_id, true);

      const loggedSet: ExerciseSet = {
        ...currentSet,
        exercise_name: currentSet.exercise_name.trim(),
        set_logged: true,
        reps_done: reps.toString(),
        weight: weight.toString(),
        weight_log_id: result.lastInsertRowId,
      };
      const updatedSets = allSets.map((s, i) => (i === setIndex ? loggedSet : s));
      setAllSets(updatedSets);
      updateExerciseLoggedStatus(currentSet.exercise_id, updatedSets);

      if (exerciseDone(updatedSets, currentSet.exercise_id)) {
        await refreshSuggestedWeight(currentSet.exercise_id);
      }

      if (enableVibration) {
        Vibration.vibrate(100);
      }

      if (isFinishingWorkout) {
        setIsCompletingSet(false);
        stopWorkoutTimer();
        setTimerState(prev => updateTimerState(prev, { workoutStage: 'completed' }));
        return;
      }

      // More sets left in this exercise: rest, then carry on. Otherwise stay on the screen,
      // which then offers "Add extra set" and "Next exercise" without a timer running.
      const nextIndex = updatedSets.findIndex(
        (s, i) => i > setIndex && !s.set_logged && s.exercise_id === currentSet.exercise_id
      );
      setIsCompletingSet(false);
      if (nextIndex === -1) return;

      const restSeconds = parseInt(restTime);
      if (restSeconds > 0) {
        setTimerState(prev => updateTimerState(prev, {
          workoutStage: 'rest',
          isExerciseRest: false,
          currentSetIndex: nextIndex,
          isResting: true,
          restRemaining: restSeconds,
          restStartTime: Date.now()
        }));
        stopRestTimer();
        startRestTimer(restSeconds);
      } else {
        setTimerState(prev => updateTimerState(prev, { workoutStage: 'exercise', currentSetIndex: nextIndex }));
      }
    } catch (error) {
      console.error('Error completing set:', error);
      Alert.alert(t('errorTitle') || 'Error', t('errorLoggingSet') || 'Failed to log set. Please try again.');
      setIsCompletingSet(false);
    }
  };

  // Next-time weight suggestion for an exercise: saved when every set was Easy, cleared otherwise.
  const refreshSuggestedWeight = async (exerciseId: number) => {
    const suggestedWeight = await analyzeDifficultyAndSuggestWeight(db, workout_log_id, exerciseId, weightIncrement);
    if (suggestedWeight !== null) {
      await saveSuggestedWeight(db, exerciseId, suggestedWeight);
    } else {
      await db.runAsync(`UPDATE Logged_Exercises SET suggested_weight = NULL WHERE logged_exercise_id = ?;`, [exerciseId]);
    }
  };

  // Handle timer restoration from background
  const handleTimerRestore = (savedState: TimerState, elapsedSeconds: number) => {
    console.log('=== RESTORING TIMER STATE ===');
    console.log('Saved state:', savedState);
    console.log('Elapsed seconds:', elapsedSeconds);
    
    // Restore workout timer
    if (savedState.workoutStartTime) {
      const newDuration = savedState.workoutDuration + elapsedSeconds;
      const newStartTime = Date.now() - (newDuration * 1000);
      
      setTimerState(prev => updateTimerState(prev, {
        workoutDuration: newDuration,
        workoutStartTime: newStartTime,
        currentSetIndex: savedState.currentSetIndex,
        workoutStage: savedState.workoutStage,
        workoutStarted: savedState.workoutStarted
      }));
      
      // Restart workout timer
      stopWorkoutTimer();
      startWorkoutTimer();
    }
    
    // Restore rest timer if needed
    if (savedState.isResting && savedState.restRemaining !== null && savedState.restRemaining > 0) {
      const newRestTime = Math.max(0, savedState.restRemaining - elapsedSeconds);
      
      if (newRestTime <= 0) {
        // Rest completed in background
        console.log('Rest completed during background');
        handleRestComplete(savedState.isExerciseRest);
      } else {
        // Continue rest timer
        setTimerState(prev => updateTimerState(prev, {
          restRemaining: newRestTime,
          isResting: true,
          isExerciseRest: savedState.isExerciseRest,
          restStartTime: Date.now()
        }));
        
        stopRestTimer();
        startRestTimer(newRestTime);
      }
    }
  };
  
  // Setup timer persistence
  useTimerPersistence(timerState, {
    onRestore: handleTimerRestore,
    onError: (error) => {
      console.error('Timer persistence error:', error);
      Alert.alert('Timer Error', 'There was an issue with timer persistence.');
    }
  }, {
    enabled: timerState.workoutStarted,
    debugMode: __DEV__
  });
  
  // Handle AppState changes for notifications
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: string) => {
      // Going to background - schedule notification if workout is active and notifications are enabled
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        // Stop active intervals when going to background
        // Let useTimerPersistence handle saving the actual current state
        stopWorkoutTimer();
        stopRestTimer();
        // clearRestTimerState(); // Clear timer state when going background // REMOVED

        if (timerState.workoutStarted && 
            timerState.workoutStage !== 'completed' && 
            enableNotifications && 
            notificationPermissionGranted) {
          
          console.log('App going to background - scheduling notification');
          
          try {
            // Clear any existing notifications first
            await Notifications.dismissAllNotificationsAsync();
            
            // Schedule workout progress notification
            await Notifications.scheduleNotificationAsync({
              content: {
                title: t("Workout in Progress"),
                body: t("Workout in Progress Message"),
                priority: 'min',
                data: { 
                  startTime: timerState.workoutStartTime,
                  type: 'workout_timer'
                },
              },
              trigger: null,
            });
            
          } catch (error) {
            console.error('Error scheduling notifications:', error);
          }
        }
      } 
      // Coming to foreground - clear notifications
      else if (nextAppState === 'active') {
        // clearRestTimerState(); // Clear timer state when coming to foreground // REMOVED
        if (enableNotifications) {
          console.log('App returning to foreground - clearing notifications');
          try {
            await Notifications.dismissAllNotificationsAsync();
          } catch (error) {
            console.error('Error clearing notifications:', error);
          }
        }
      }
    };
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      // clearRestTimerState(); // Clear on unmount // This was already correctly removed/commented
      subscription.remove();
    };
  }, [
    timerState.workoutStarted, 
    timerState.workoutStage, 
    enableNotifications, 
    notificationPermissionGranted,
    t,
    timerState.workoutStartTime
  ]);
  
  useEffect(() => {
    const loadInitialData = async () => {
        try {
            const preferences = await loadRestTimerPreferences();
            setRestTime(preferences.restTimeBetweenSets);
            setExerciseRestTime(preferences.restTimeBetweenExercises);

            await fetchWorkoutDetails(autoFillWeight, autoFillReps, useLogsForRepInput);
        } catch (error) {
            console.error('Error loading initial data:', error);
            setLoading(false);
        }
    };

    loadInitialData();

    return () => {
        stopWorkoutTimer();
        stopRestTimer();
        deactivateKeepAwake();
    };
  }, [notificationPermissionGranted]);

  // Coach note: show a cached note for any date; generate a new one only for today's
  // workout. Gated on !loading because workout and exercises are set in separate updates.
  useEffect(() => {
    if (loading || !workout || exercises.length === 0) return;
    let cancelled = false;

    const loadCoachNote = async () => {
      try {
        await ensureCoachNotesTable(db);
        const cached = await getCachedCoachNote(db, workout.workout_name, workout.day_name, workout.workout_date);
        if (cancelled) return;
        if (cached.found) {
          setCoachNote(cached.note ? { status: 'ready', note: cached.note } : { status: 'idle', note: null });
          return;
        }

        const todayMidnight = Math.floor(new Date().setHours(0, 0, 0, 0) / 1000);
        if (workout.workout_date !== todayMidnight) return;
        if (!(await getApiKey())) return;

        const profile = await loadCoachProfile();
        const bodyComposition = formatBodyComposition(await loadInBodySnapshots());
        const context = await buildCoachNoteContext(db, {
          workoutLogId: workout_log_id,
          workoutName: workout.workout_name,
          dayName: workout.day_name,
          workoutDate: workout.workout_date,
          exercises,
          weightUnit: weightFormat,
          standingConstraints: profile.standingConstraints,
          bodyComposition,
        });
        if (cancelled) return;
        if (!context) {
          // No history to coach from; remember that so we don't re-check.
          await saveCoachNote(db, workout.workout_name, workout.day_name, workout.workout_date, null);
          return;
        }

        setCoachNote({ status: 'loading', note: null });
        const note = await generateCoachNote(context);
        // Cache even when the user has left or started: the call is already paid for.
        await saveCoachNote(db, workout.workout_name, workout.day_name, workout.workout_date, note);
        if (cancelled) return;
        setCoachNote(note ? { status: 'ready', note } : { status: 'idle', note: null });
      } catch (error) {
        // A failed attempt is not cached, so the next open tries again.
        console.error('Coach note failed:', error);
        if (!cancelled) setCoachNote({ status: 'idle', note: null });
      }
    };

    loadCoachNote();
    return () => {
      cancelled = true;
    };
  }, [loading, workout?.workout_name, workout?.day_name, workout?.workout_date, exercises.length]);

  // Setup notification handler and keep awake
  useEffect(() => {
    const configureNotifications = async () => {
      await Notifications.setNotificationHandler({
        handleNotification: async (notification) => {
          // Handle different notification types
          const notificationType = notification.request.content.data?.type;
          
          return {
            shouldShowAlert: true,
            shouldPlaySound: notificationType === 'rest_complete',
            shouldSetBadge: false,
          };
        },
      });
    };
    
    if (timerState.workoutStarted) {
      activateKeepAwakeAsync();
      configureNotifications();
    }
    
    return () => {
      deactivateKeepAwake();
      // Clear notifications when component unmounts
      if (enableNotifications) {
        Notifications.dismissAllNotificationsAsync().catch(console.error);
      }
    };
  }, [timerState.workoutStarted, enableNotifications]);

  // Finished: no longer resumable.
  // The summary screen saves the workout time itself, so there is nothing left to press to save.
  useEffect(() => {
    if (timerState.workoutStage === 'completed') {
      setWorkoutInProgress(db, workout_log_id, false);
      db.runAsync('UPDATE Workout_Log SET completion_time = ? WHERE workout_log_id = ?;', [
        timerState.workoutDuration,
        workout_log_id,
      ]).catch(error => console.error('Error saving workout time:', error));
    }
  }, [timerState.workoutStage]);

  // Handle back press when workout is started
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (!timerState.workoutStarted || timerState.workoutStage === 'completed') {
        return;
      }

      e.preventDefault();

      Alert.alert(
        t('exitWorkout'),
        t('exitWorkoutMessage'),
        [
          { text: t('Cancel'), style: 'cancel', onPress: () => {} },
          {
            text: t('exit'),
            style: 'destructive',
            onPress: () => navigation.dispatch(e.data.action),
          },
        ]
      );
    });

    return unsubscribe;
  }, [navigation, timerState.workoutStarted, timerState.workoutStage, t]);
  
  const showNotes = (notes: string, exerciseName: string) => {
    setNotesModalContent(notes);
    setNotesModalTitle(exerciseName);
    setIsNotesModalVisible(true);
  };

  const handleLinkPress = async (url: string | null) => {
    if (!url) {
      Alert.alert(t('noLinkAvailable'));
      return;
    }
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(`${t('cannotOpenURL')}: ${url}`);
      }
    } catch (error) {
      console.error('Error opening URL:', error);
      Alert.alert(t('errorOpeningURL'));
    }
  };
  
  const fetchWorkoutDetails = async (
    shouldAutoFill: boolean, 
    shouldAutoFillReps: boolean, 
    shouldUseLogsForReps: boolean
  ) => {
    try {
      setLoading(true);
      await ensureInProgressColumn(db);
      
      const workoutResult = await db.getAllAsync<{
        workout_name: string;
        workout_date: number;
        day_name: string;
      }>(
        `SELECT workout_name, workout_date, day_name 
         FROM Workout_Log 
         WHERE workout_log_id = ?;`,
        [workout_log_id]
      );
      
      if (workoutResult.length > 0) {
        setWorkout(workoutResult[0]);
        
        const exercisesResult = await db.getAllAsync<Exercise>(
          `SELECT exercise_name, sets, reps, logged_exercise_id, web_link, muscle_group, exercise_notes
           FROM Logged_Exercises 
           WHERE workout_log_id = ?;`,
          [workout_log_id]
        );
        
        setExercises(exercisesResult.map(e => ({ ...e, exercise_fully_logged: false })));
        
        weightMapRef.current.clear();
        repsMapRef.current.clear();

        if (exercisesResult.length > 0) {
            const exerciseNames = exercisesResult.map(e => e.exercise_name);
            const placeholders = exerciseNames.map(() => '?').join(',');
        
            const lastLogResult = await db.getAllAsync<{ exercise_name: string; set_number: number; weight_logged: number; reps_logged: number }>(
                `SELECT wl.exercise_name, wl.set_number, wl.weight_logged, wl.reps_logged
                 FROM Weight_Log wl
                 INNER JOIN (
                   SELECT exercise_name, set_number, MAX(workout_log_id) as max_log_id
                   FROM Weight_Log
                   WHERE exercise_name IN (${placeholders})
                   GROUP BY exercise_name, set_number
                 ) as latest_logs
                 ON wl.exercise_name = latest_logs.exercise_name 
                 AND wl.set_number = latest_logs.set_number 
                 AND wl.workout_log_id = latest_logs.max_log_id;`,
                exerciseNames
              );
        
              lastLogResult.forEach(row => {
                weightMapRef.current.set(`${row.exercise_name}-${row.set_number}`, row.weight_logged.toString());
                repsMapRef.current.set(`${row.exercise_name}-${row.set_number}`, row.reps_logged.toString());
              });
        }
        
        // Prepare all sets data structure
        const setsData: ExerciseSet[] = [];
        exercisesResult.forEach(exercise => {
          for (let i = 1; i <= exercise.sets; i++) {
            const weight = shouldAutoFill ? (weightMapRef.current.get(`${exercise.exercise_name}-${i}`) || '') : '';
            
            let reps_done = '';
            if (shouldAutoFillReps) {
                if (shouldUseLogsForReps) {
                    reps_done = repsMapRef.current.get(`${exercise.exercise_name}-${i}`) || '';
                } else {
                    reps_done = exercise.reps.toString();
                }
            }

            setsData.push({
              exercise_name: exercise.exercise_name,
              exercise_id: exercise.logged_exercise_id,
              reps_goal: exercise.reps,
              reps_done: reps_done,
              weight: weight,
              set_logged: false,
              web_link: exercise.web_link || null,
              muscle_group: exercise.muscle_group || null,
              exercise_notes: exercise.exercise_notes || null,
              comments: '',
              difficulty: null,
              is_extra: false,
              base_name: exercise.exercise_name,
              base_notes: exercise.exercise_notes || null,
              base_link: exercise.web_link || null,
              weight_log_id: null,
            });
          }
        });
        
        // Sets that were already logged (the workout was opened before) are marked as done.
        const loggedRows = await db.getAllAsync<LoggedSetRow>(
          `SELECT weight_log_id, logged_exercise_id, exercise_name, weight_logged, reps_logged, difficulty, comments
           FROM Weight_Log WHERE workout_log_id = ? ORDER BY weight_log_id;`,
          [workout_log_id]
        );
        const restoredSets = restoreLoggedSets(setsData, loggedRows);
        setAllSets(restoredSets);
        setExercises(prev => prev.map(ex => ({ ...ex, exercise_fully_logged: exerciseDone(restoredSets, ex.logged_exercise_id) })));

        // Fetch suggested weights for exercises
        const exercisesWithStatus = exercisesResult.map(e => ({ ...e, exercise_fully_logged: false }));
        await fetchSuggestedWeights(workoutResult[0], exercisesWithStatus);

        // Fetch previous workout history for each exercise
        const historyMap = new Map<string, HistorySession[]>();
        for (const exercise of exercisesResult) {
          historyRequestedRef.current.add(exercise.exercise_name);
          const history = await fetchPreviousWorkoutHistory(exercise.exercise_name);
          if (history.length > 0) {
            historyMap.set(exercise.exercise_name, history);
          }
        }
        setPreviousWorkoutHistory(historyMap);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching workout details:', error);
      setLoading(false);
    }
  };
  
  // Timer functions
  const startWorkoutTimer = () => {
    const startTime = Date.now() - (timerState.workoutDuration * 1000);
    setTimerState(prev => updateTimerState(prev, { workoutStartTime: startTime }));
    
    workoutTimerRef.current = setInterval(() => {
      setTimerState(prev => updateTimerState(prev, {
        workoutDuration: prev.workoutDuration + 1
      }));
    }, 1000);
  };
  
  const stopWorkoutTimer = () => {
    if (workoutTimerRef.current) {
      clearInterval(workoutTimerRef.current);
      workoutTimerRef.current = null;
    }
  };
  
  const startRestTimer = (seconds: number) => {
    // We're explicitly setting a number here, not null
    setTimerState(prev => updateTimerState(prev, {
      restRemaining: seconds,  // This is a number
      restStartTime: Date.now(),
      isResting: true
    }));
    
    restTimerRef.current = setInterval(() => {
      setTimerState(prev => {
        if (prev.restRemaining === null) {
          stopRestTimer();
          return prev;
        }
        const newRestTime = prev.restRemaining - 1;
        
        if (newRestTime <= 0) {
          stopRestTimer();
          handleRestComplete(prev.isExerciseRest);
          return updateTimerState(prev, {
            restRemaining: null,  // Only set to null when complete
            isResting: false,
            isExerciseRest: false
          });
        }
        
        return updateTimerState(prev, { restRemaining: newRestTime });
      });
    }, 1000);
  };
  
  const stopRestTimer = () => {
    if (restTimerRef.current) {
      clearInterval(restTimerRef.current);
      restTimerRef.current = null;
    }
  };
  
  const handleRestComplete = (wasExerciseRest: boolean) => {
  
    clearRestTimerState(); // Clear rest timer state before new set
    setTimerState(prev => updateTimerState(prev, {
      workoutStage: 'exercise'
    }));
    
    if (enableVibration) {
      Vibration.vibrate([500, 300, 500]);
    }
    if (enableSetSwitchSound) {
      playSound();
    }
  };
  
  // Workout flow functions
  const startWorkout = async () => {
    const setRestSeconds = parseInt(restTime);
    const exerciseRestSeconds = parseInt(exerciseRestTime);
    
    if (isNaN(setRestSeconds) || setRestSeconds < 0) {
      Alert.alert(t('invalidRestTime'), t('pleaseEnterValidSeconds'));
      return;
    }
    
    if (isNaN(exerciseRestSeconds) || exerciseRestSeconds < 0) {
      Alert.alert(t('invalidExerciseRestTime'), t('pleaseEnterValidSeconds'));
      return;
    }

    try {
      await saveRestTimerPreferences({
        restTimeBetweenSets: restTime,
        restTimeBetweenExercises: exerciseRestTime,
      });
    } catch (error) {
      console.error('Error saving rest timer preferences:', error);
    }

    // Rest-timer alerts need the notification permission; ask the first time.
    if (!notificationPermissionGranted) {
      await requestNotificationPermission();
    }

    // Carry on from the first set that is not logged yet (set 1 for a fresh workout).
    const firstOpen = allSets.findIndex(set => !set.set_logged);
    setTimerState(prev => updateTimerState(prev, {
      workoutStarted: true,
      workoutStage: 'exercise',
      currentSetIndex: firstOpen !== -1 ? firstOpen : Math.max(allSets.length - 1, 0)
    }));
    
    startWorkoutTimer();
  };
  
  const muscleGroupData = [
    { label: t('Unspecified'), value: null },
    { label: t('Chest'), value: 'chest' },
    { label: t('Back'), value: 'back' },
    { label: t('Shoulders'), value: 'shoulders' },
    { label: t('Biceps'), value: 'biceps' },
    { label: t('Triceps'), value: 'triceps' },
    { label: t('Forearms'), value: 'forearms' },
    { label: t('Abs'), value: 'abs' },
    { label: t('Legs'), value: 'legs' },
    { label: t('Glutes'), value: 'glutes' },
    { label: t('Hamstrings'), value: 'hamstrings' },
    { label: t('Calves'), value: 'calves' },
    { label: t('Quads'), value: 'quads' },
  ];
  
  // Rest of the render functions remain the same...
  const renderOverview = () => {
    return (
      <View style={styles.overviewContainer}>
        <View style={[styles.workoutHeaderCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.workoutName, { color: theme.text }]}>{workout?.workout_name}</Text>
          <Text style={[styles.workoutDay, { color: theme.text }]}>{workout?.day_name}</Text>
          <View style={styles.workoutStats}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.text }]}>{exercises.length}</Text>
              <Text style={[styles.statLabel, { color: theme.text }]}>{t('exercises')}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.text }]}>
                {allSets.length}
              </Text>
              <Text style={[styles.statLabel, { color: theme.text }]}>{t('totalSets')}</Text>
            </View>
          </View>
        </View>

        {(coachNote.status === 'loading' || !!coachNote.note?.summary) && (
          <View style={[styles.coachNoteCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.coachNoteTitle, { color: theme.text }]}>{t('coachNoteTitle')}</Text>
            <Text style={[styles.coachNoteText, { color: theme.text, opacity: coachNote.status === 'loading' ? 0.5 : 1 }]}>
              {coachNote.status === 'loading' ? t('coachNoteLoading') : coachNote.note?.summary}
            </Text>
          </View>
        )}

        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('exercises')}</Text>
        <FlatList
          data={exercises}
          keyExtractor={(item) => item.logged_exercise_id.toString()}
          renderItem={({ item }) => {
            const muscleGroupInfo = muscleGroupData.find(mg => mg.value === item.muscle_group);
            return (
              <View style={[styles.exerciseItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1,}}>
                    <Text style={[styles.exerciseName, { color: theme.text, marginRight: 8 }]}>{item.exercise_name}</Text>
                    {muscleGroupInfo && muscleGroupInfo.value && (
                      <View style={[styles.muscleGroupBadgeOverview, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        <Text style={[styles.muscleGroupBadgeText, { color: theme.text }]}>
                          {t(muscleGroupInfo.label)}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {item.exercise_notes && (
                      <TouchableOpacity onPress={() => showNotes(item.exercise_notes!, item.exercise_name)} style={{ marginLeft: 10 }}>
                        <Ionicons name="bookmark-outline" size={22} color={theme.text} />
                      </TouchableOpacity>
                    )}
                    {item.web_link && (
                      <TouchableOpacity onPress={() => handleLinkPress(item.web_link)} style={{ marginLeft: 10 }}>
                        <Ionicons name="link-outline" size={22} color={theme.text} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
                <Text style={[styles.exerciseDetails, { color: theme.text, marginTop: 4 }]}>
                  {item.sets} {t('Sets')} × {item.reps} {t('Reps')}
                </Text>
              </View>
            )
          }}
          scrollEnabled={false}
          style={styles.exercisesList}
        />
        
        <View style={styles.setupSection}>
          <Text style={[styles.setupLabel, { color: theme.text }]}>{t('restTimeBetweenSets')}:</Text>
          <TextInput
            style={[styles.restTimeInput, { 
              backgroundColor: theme.card,
              color: theme.text,
              borderColor: theme.border
            }]}
            value={restTime}
            onChangeText={setRestTime}
            keyboardType="number-pad"
            maxLength={4}
            placeholderTextColor={theme.type === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'}
          />
          
          <Text style={[styles.setupLabel, { color: theme.text }]}>{t('restTimeBetweenExercises')}:</Text>
          <TextInput
            style={[styles.restTimeInput, { 
              backgroundColor: theme.card,
              color: theme.text,
              borderColor: theme.border
            }]}
            value={exerciseRestTime}
            onChangeText={setExerciseRestTime}
            keyboardType="number-pad"
            maxLength={4}
            placeholderTextColor={theme.type === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'}
          />
          
          <TouchableOpacity
            style={[styles.startButton, { backgroundColor: theme.buttonBackground }]}
            onPress={startWorkout}
          >
            <Ionicons name="stopwatch-outline" size={20} color={theme.buttonText} style={styles.buttonIcon} />
            <Text style={[styles.buttonText, { color: theme.buttonText }]}>{t('startWorkout')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  
  const formatHistoryDate = (unixSeconds: number) => {
    const d = new Date(unixSeconds * 1000);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  };

  const renderExerciseScreen = () => {
    const index = timerState.currentSetIndex;
    const currentSet = allSets[index];
    if (!currentSet) return null;

    const muscleGroupInfo = muscleGroupData.find(mg => mg.value === currentSet.muscle_group);
    const placeholderColor = theme.type === 'dark' ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)';

    const isDone = currentSet.set_logged;
    const groupSetIndices = groupIndices(allSets, index);
    const exerciseId = currentSet.exercise_id;
    const isLastExercise = exerciseOrder.indexOf(exerciseId) === exerciseOrder.length - 1;
    const canAddExtra = exerciseDone(allSets, exerciseId);
    const nothingLeftToDo = isDone && nextUnloggedExerciseId(exerciseOrder, allSets, exerciseId) === null;
    const hint = previousSetHint(allSets, index);
    const canComplete =
      !isCompletingSet && !isDone &&
      currentSet.weight !== '' && !isNaN(parseFloat(currentSet.weight)) &&
      parseInt(currentSet.reps_done) > 0 && !!currentSet.difficulty;

    const loggedSetsCount = allSets.filter(s => s.set_logged).length;
    const progress = allSets.length > 0 ? (loggedSetsCount / allSets.length) * 100 : 0;

    // Coach lines are keyed by the planned exercise name, so renaming a set doesn't hide them.
    // It also goes away once the set is renamed to a different exercise.
    const exerciseCoachLine = currentSet.exercise_name.trim().toLowerCase() === currentSet.base_name.trim().toLowerCase()
      ? Object.entries(coachNote.note?.exercises ?? {}).find(
          ([name]) => name.trim().toLowerCase() === currentSet.base_name.trim().toLowerCase()
        )?.[1]
      : undefined;

    const sessions = previousWorkoutHistory.get(currentSet.exercise_name) ?? [];
    const sessionIndex = Math.min(historyOffset, Math.max(sessions.length - 1, 0));
    const session = sessions[sessionIndex];
    const canGoOlder = sessionIndex < sessions.length - 1;
    const canGoNewer = sessionIndex > 0;

    return (
      <View style={styles.exerciseScreenContainer}>
        {currentSet.is_extra && !isDone && (
          <View style={styles.extraNameBlock}>
            <Text style={[styles.inputLabel, { color: theme.text }]}>{t('exerciseNameLabel')}</Text>
            <TextInput
              style={[styles.currentExerciseNameInput, {
                color: theme.text,
                backgroundColor: theme.card,
                borderColor: theme.border
              }]}
              value={currentSet.exercise_name}
              onChangeText={handleExtraNameChange}
              maxLength={80}
            />
            <Text style={[styles.extraNameHint, { color: theme.text }]}>{t('extraNameHint')}</Text>
          </View>
        )}

        {/* Form notes, with the video link as a small icon in the corner */}
        <View style={[styles.formCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.formTitle, { color: theme.text }]}>{t('formNotes')}</Text>
          <Text style={[styles.exerciseNotesText, { color: theme.text, opacity: currentSet.exercise_notes ? 1 : 0.5 }]}>
            {currentSet.exercise_notes || t('noFormNotes')}
          </Text>
          <TouchableOpacity
            style={[styles.formVideoButton, !currentSet.web_link && { opacity: 0.3 }]}
            disabled={!currentSet.web_link}
            onPress={() => handleLinkPress(currentSet.web_link)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="logo-youtube" size={24} color={currentSet.web_link ? '#E53935' : theme.text} />
          </TouchableOpacity>
        </View>

        {exerciseCoachLine && (
          <View style={[styles.coachNoteCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.coachNoteTitle, { color: theme.text }]}>{t('coachNoteTitle')}</Text>
            <Text style={[styles.coachNoteText, { color: theme.text }]}>{exerciseCoachLine}</Text>
          </View>
        )}

        <View style={[styles.currentExerciseCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {/* Suggested Weight Badge */}
          {suggestedWeights.has(currentSet.exercise_id) && (
            <View style={{ marginBottom: 12, alignItems: 'center' }}>
              <WeightSuggestionBadge
                suggestedWeight={suggestedWeights.get(currentSet.exercise_id)!}
                onIncrementChange={setWeightIncrement}
              />
            </View>
          )}

          {muscleGroupInfo && muscleGroupInfo.value && (
            <View style={styles.badgeAndIconsContainer}>
              <View style={[styles.muscleGroupBadgeMain, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Text style={[styles.muscleGroupBadgeText, { color: theme.text }]}>
                  {t(muscleGroupInfo.label)}
                </Text>
              </View>
            </View>
          )}

          {/* One chip per set: tap a logged one to correct its weight or reps */}
          <View style={styles.chipsRow}>
            {groupSetIndices.map((setIndex, position) => {
              const chipSet = allSets[setIndex];
              const isCurrent = setIndex === index;
              return (
                <TouchableOpacity
                  key={`${setIndex}-${position}`}
                  disabled={!chipSet.set_logged}
                  onPress={() => openEditSet(setIndex)}
                  style={[
                    styles.setChip,
                    { borderColor: theme.border, backgroundColor: theme.background },
                    chipSet.set_logged && { backgroundColor: theme.card },
                    isCurrent && { borderColor: theme.buttonBackground, borderWidth: 2 },
                  ]}
                >
                  <Text style={[styles.setChipText, { color: theme.text }]}>
                    {chipSet.set_logged ? '✓ ' : ''}{position + 1}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={[styles.repInfo, { color: theme.text }]}>
            {t('goal')}: {currentSet.reps_goal} {t('Reps')}
            {groupSetIndices.some(i => allSets[i].set_logged) ? `  ·  ${t('tapSetToEdit')}` : ''}
          </Text>

          {isDone ? (
            <View style={[styles.doneCard, { borderColor: theme.border, backgroundColor: theme.background }]}>
              <Ionicons name="checkmark-circle" size={28} color={theme.buttonBackground} />
              <Text style={[styles.doneText, { color: theme.text }]}>
                {currentSet.weight} {weightFormat} × {currentSet.reps_done} {t('Reps')}
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.inputContainer}>
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.text }]}> {t('Weight')} ({weightFormat})</Text>
                  <TextInput
                    style={[styles.input, {
                      backgroundColor: theme.card,
                      color: theme.text,
                      borderColor: theme.border
                    }]}
                    value={currentSet.weight}
                    onChangeText={(text) => updateCurrentSet({ weight: text })}
                    keyboardType="numeric"
                    placeholder={hint ? hint.weight : '0.0'}
                    placeholderTextColor={placeholderColor}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.text }]}>{t('repsDone')}</Text>
                  <TextInput
                    style={[styles.input, {
                      backgroundColor: theme.card,
                      color: theme.text,
                      borderColor: theme.border
                    }]}
                    value={currentSet.reps_done}
                    onChangeText={(text) => updateCurrentSet({ reps_done: text })}
                    keyboardType="number-pad"
                    maxLength={4}
                    placeholder={hint ? hint.reps : '0'}
                    placeholderTextColor={placeholderColor}
                  />
                </View>
              </View>

              {/* How the set felt: required, and one tap on the screen itself */}
              <Text style={[styles.inputLabel, { color: theme.text, marginTop: 4 }]}>{t('howWasThisSet')}</Text>
              <View style={styles.difficultyRow}>
                {(['Easy', 'Medium', 'Hard'] as const).map(level => {
                  const selected = currentSet.difficulty === level;
                  return (
                    <TouchableOpacity
                      key={level}
                      onPress={() => updateCurrentSet({ difficulty: selected ? null : level })}
                      style={[
                        styles.difficultyChip,
                        { borderColor: theme.border, backgroundColor: theme.background },
                        selected && { backgroundColor: getDifficultyColor(level), borderColor: getDifficultyColor(level) },
                      ]}
                    >
                      <Text style={styles.difficultyEmoji}>{getDifficultyEmoji(level)}</Text>
                      <Text style={[styles.difficultyLabel, { color: selected ? '#FFFFFF' : theme.text }]}>
                        {t(`difficulty${level}`)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.commentsContainer}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>{t('Comments')} ({t('optional')})</Text>
                <TextInput
                  style={[styles.commentsInput, {
                    backgroundColor: theme.card,
                    color: theme.text,
                    borderColor: theme.border
                  }]}
                  value={currentSet.comments}
                  onChangeText={(text) => updateCurrentSet({ comments: text })}
                  maxLength={500}
                  multiline
                  numberOfLines={2}
                />
              </View>
            </>
          )}
        </View>

        <View style={styles.controlsContainer}>
          {isDone ? (
            <TouchableOpacity
              style={[styles.completeButton, { backgroundColor: theme.buttonBackground }]}
              onPress={handleNextExercise}
            >
              <Text style={[styles.buttonText, { color: theme.buttonText }]}>
                {nothingLeftToDo ? t('finishWorkout') : t('nextExercise')}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.completeButton, { backgroundColor: canComplete ? theme.buttonBackground : theme.inactivetint }]}
              onPress={() => completeSet(index)}
              disabled={!canComplete}
            >
              <Text style={[styles.buttonText, { color: theme.buttonText }]}>
                {isCompletingSet ? `${t('completing')}...` : t('completeSet')}
              </Text>
            </TouchableOpacity>
          )}

          {/* Add Extra Set: only once every set of this exercise is logged */}
          <TouchableOpacity
            style={[
              styles.addExtraSetButton,
              { backgroundColor: theme.card, borderColor: theme.border },
              !canAddExtra && { opacity: 0.4 },
            ]}
            onPress={handleAddExtraSet}
            disabled={!canAddExtra}
          >
            <Text style={[styles.addExtraSetButtonText, { color: theme.text }]}>
              + {t('addExtraSet')}
            </Text>
          </TouchableOpacity>

          {!(isDone && nothingLeftToDo) && (
            <View style={styles.secondaryControlsContainer}>
              {!isLastExercise && !isDone && (
                <TouchableOpacity
                  style={[styles.secondaryButton, { backgroundColor: theme.card, borderColor: theme.border }]}
                  onPress={handleSkipToNextExercise}
                >
                  <AutoSizeText
                    fontSize={16}
                    numberOfLines={3}
                    mode={ResizeTextMode.max_lines}
                    style={[styles.secondaryButtonText, { color: theme.text }]}
                  >
                    {t('skipToNextExercise')}
                  </AutoSizeText>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[
                  styles.secondaryButton,
                  { backgroundColor: theme.card, borderColor: theme.border },
                  (isLastExercise || isDone) && { width: '100%' },
                ]}
                onPress={handleFinishWorkout}
              >
                <AutoSizeText
                  fontSize={16}
                  numberOfLines={3}
                  mode={ResizeTextMode.max_lines}
                  style={[styles.secondaryButtonText, { color: theme.text }]}
                >
                  {t('finishWorkout')}
                </AutoSizeText>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.progressContainer}>
          <Text style={[styles.progressText, { color: theme.text }]}>
          %{Math.round(progress)}
          </Text>
          <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: theme.buttonBackground,
                  width: `${progress}%`
                }
              ]}
            />
          </View>
        </View>
        <Text style={[styles.tipText, { color: theme.text }]}>{t('startedWorkoutTip')}</Text>

        {/* Previous workouts of this exercise, newest first; the arrows step back through them */}
        <View style={[styles.historyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.historyHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.historyTitle, { color: theme.text, marginBottom: 0 }]}>
                📊 {t('previousWorkout') || 'Previous Workout'}
              </Text>
              {session && (
                <Text style={[styles.historyDate, { color: theme.text }]}>
                  {formatHistoryDate(session.workoutDate)} · {sessionIndex + 1}/{sessions.length}
                </Text>
              )}
            </View>
            <TouchableOpacity
              disabled={!canGoOlder}
              onPress={() => setHistoryOffset(sessionIndex + 1)}
              style={[styles.historyArrow, !canGoOlder && { opacity: 0.25 }]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="chevron-back" size={24} color={theme.text} />
            </TouchableOpacity>
            <TouchableOpacity
              disabled={!canGoNewer}
              onPress={() => setHistoryOffset(sessionIndex - 1)}
              style={[styles.historyArrow, !canGoNewer && { opacity: 0.25 }]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="chevron-forward" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>
          {session ? (
            <ScrollView style={styles.historyScrollView} nestedScrollEnabled={true}>
              {session.sets.map((historySet, setPosition) => {
                const difficultyEmoji =
                  historySet.difficulty === 'Easy' ? '😊' :
                  historySet.difficulty === 'Hard' ? '😓' : '😐';

                return (
                  <View key={setPosition} style={[styles.historySetRow, { borderBottomColor: theme.border }]}>
                    <Text style={[styles.historySetText, { color: theme.text }]}>
                      Set {setPosition + 1}: {historySet.weight} {weightFormat} × {historySet.reps} reps {difficultyEmoji}
                    </Text>
                    {historySet.comments && (
                      <Text style={[styles.historyCommentText, { color: theme.text }]}>
                        💬 {historySet.comments}
                      </Text>
                    )}
                  </View>
                );
              })}
            </ScrollView>
          ) : (
            <Text style={[styles.historyDate, { color: theme.text, marginTop: 8 }]}>{t('noEarlierSessions')}</Text>
          )}
        </View>
      </View>
    );
  };

  const renderRestScreen = () => {
    const nextSet = allSets[timerState.currentSetIndex];
    
    const muscleGroupInfo = nextSet ? muscleGroupData.find(mg => mg.value === nextSet.muscle_group) : null;

    let previousSetReps = null;
    let previousSetWeight = null;
    if (nextSet) {
      const setKey = `${nextSet.exercise_name}-${groupStats(allSets, timerState.currentSetIndex).number}`;
      previousSetReps = repsMapRef.current.get(setKey) || null;
      previousSetWeight = weightMapRef.current.get(setKey) || null;
    }
    
    return (
      <View style={styles.restScreenContainer}>
        <View style={[styles.restCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.restTitle, { color: theme.text }]}>{t('restTime')}</Text>
          
          <View style={styles.restTimerContainer}>
            <Text style={[styles.restTimerText, { color: theme.text }]}>
              {timerState.restRemaining}
            </Text>
            <Text style={[styles.restTimerUnit, { color: theme.text }]}>{t('sec')}</Text>
          </View>
          
          <TouchableOpacity
              style={[styles.addTimeButton, { backgroundColor: theme.type === 'dark' ? 'rgba(255,255,255,0.15)' : theme.border }]}
            onPress={() => setTimerState(prev => updateTimerState(prev, { 
              restRemaining: (prev.restRemaining ?? 0) + 15 
            }))}
          >
            <Text style={[styles.addTimeButtonText, { color: theme.type === 'dark' ? 'white' : 'rgba(255, 255, 255, 0.8)' }]}>{t('addTime')}</Text>
          </TouchableOpacity>
          
          <Text style={[styles.restMessage, { color: theme.text }]}>
            {t('takeBreath')}
          </Text>
        </View>
        
        {nextSet && (
          <View style={[styles.upNextCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.upNextLabel, { color: theme.text }]}>{t('upNext')}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1 }}>
                <Text style={[styles.upNextExercise, { color: theme.text, marginRight: 8 }]}>
                  {nextSet.exercise_name}
                </Text>
                {muscleGroupInfo && muscleGroupInfo.value && (
                  <View style={[styles.muscleGroupBadgeModal, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <Text style={[styles.muscleGroupBadgeText, { color: theme.text }]}>
                      {t(muscleGroupInfo.label)}
                    </Text>
                  </View>
                )}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {nextSet.exercise_notes && (
                  <TouchableOpacity onPress={() => showNotes(nextSet.exercise_notes!, nextSet.exercise_name)} style={{ marginLeft: 10 }}>
                    <Ionicons name="bookmark-outline" size={22} color={theme.text} />
                  </TouchableOpacity>
                )}
                {nextSet.web_link && (
                  <TouchableOpacity onPress={() => handleLinkPress(nextSet.web_link)} style={{ marginLeft: 10 }}>
                    <Ionicons name="link-outline" size={22} color={theme.text} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
            <Text style={[styles.upNextSetInfo, { color: theme.text }]}>
              {t('upcomingSet')}: {groupStats(allSets, timerState.currentSetIndex).number}
            </Text>
            {(previousSetReps || previousSetWeight) && (
              <Text style={[styles.upNextSetInfo, { color: theme.text }]}>
                {t('lastWorkoutInfo')}:{' '}
                {previousSetReps ? `${previousSetReps} ${t('Reps')}` : ''}
                {previousSetReps && previousSetWeight ? ' / ' : ''}
                {previousSetWeight ? `${previousSetWeight} ${weightFormat}` : ''}
              </Text>
            )}
          </View>
        )}
        
        <TouchableOpacity
          style={[styles.skipRestButton, { backgroundColor: theme.buttonBackground }]}
          onPress={() => {
            clearRestTimerState(); // Clear rest timer state when skipping
            setTimerState(prev => updateTimerState(prev, {
              workoutStage: 'exercise'
            }));
          }}
        >
          <Text style={[styles.buttonText, { color: theme.buttonText }]}>{t('skipRest')}</Text>
        </TouchableOpacity>
      </View>
    );
  };
  
  const renderCompletedScreen = () => {
    const loggedSets = allSets.filter(set => set.set_logged);
    
    return (
      <View style={styles.completedContainer}>
        <Ionicons name="checkmark-circle" size={80} color={theme.buttonBackground} style={styles.completedIcon} />
        
        <Text style={[styles.completedTitle, { color: theme.text }]}>{t('workoutCompleted')}</Text>
        
        <View style={[styles.completedCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.completedWorkoutName, { color: theme.text }]}>
            {workout?.workout_name}
          </Text>
          
          <View style={styles.completedStats}>
            <View style={styles.completedStatItem}>
              <Text style={[styles.completedStatValue, { color: theme.text }]}>
                {timerCalculations.formatTime(timerState.workoutDuration)}
              </Text>
              <Text style={[styles.completedStatLabel, { color: theme.text }]}>{t('totalTime')}</Text>
            </View>
            
            <View style={styles.completedStatItem}>
              <Text style={[styles.completedStatValue, { color: theme.text }]}>
                {loggedSets.length}
              </Text>
              <Text style={[styles.completedStatLabel, { color: theme.text }]}>{t('setsCompleted')}</Text>
            </View>
          </View>
        </View>
        
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: theme.buttonBackground }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[styles.buttonText, { color: theme.buttonText }]}>
            {t('workoutDoneButton')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };
  
  const renderExerciseListModal = () => {
    const current = allSets[timerState.currentSetIndex];

    // One row per exercise as it is being logged (a renamed extra set is a row of its own).
    const groups: Array<{ key: string; firstIndex: number; count: number; logged: number; set: ExerciseSet }> = [];
    allSets.forEach((set, i) => {
      const key = `${set.exercise_id}|${set.exercise_name}`;
      const existing = groups.find(g => g.key === key);
      if (existing) {
        existing.count += 1;
        if (set.set_logged) existing.logged += 1;
      } else {
        groups.push({ key, firstIndex: i, count: 1, logged: set.set_logged ? 1 : 0, set });
      }
    });

    return (
      <Modal
        visible={isExerciseListModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setIsExerciseListModalVisible(false);
        }}
      >
    {isExerciseListModalVisible && (
          <StatusBar
            backgroundColor={theme.type === 'light' ? "rgba(0, 0, 0, 0.5)" : "black"}
            barStyle={'light-content'}          />
        )}

        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPressOut={() => setIsExerciseListModalVisible(false)}
        >
          <View
            style={[styles.modalContainer, { backgroundColor: theme.card, borderColor: theme.border }]}
            onStartShouldSetResponder={() => true}
          >
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>{workout?.day_name }</Text>
              <TouchableOpacity onPress={() => setIsExerciseListModalVisible(false)} style={styles.modalCloseButton}>
                <Ionicons name="close-outline" size={28} color={theme.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              showsVerticalScrollIndicator={false}
              data={groups}
              keyExtractor={(item) => item.key}
              renderItem={({ item }) => {
                const isCurrent = !!current && current.exercise_id === item.set.exercise_id && current.exercise_name === item.set.exercise_name;
                const fullyLogged = item.logged === item.count;
                const muscleGroupInfo = muscleGroupData.find(mg => mg.value === item.set.muscle_group);
                const textColor = isCurrent ? theme.buttonText : theme.text;

                return (
                  <TouchableOpacity onPress={() => goToGroup(item.firstIndex)}>
                    <View style={[
                      styles.modalExerciseItem,
                      { borderColor: theme.border },
                      { backgroundColor: isCurrent ? theme.buttonBackground : theme.card },
                    ]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1 }}>
                          {fullyLogged && (
                            <Ionicons name="checkmark-circle" size={20} color={isCurrent ? theme.buttonText : theme.buttonBackground} style={{ marginRight: 8 }} />
                          )}
                          <Text style={[styles.modalExerciseName, { color: textColor, marginRight: 8 }]}>{item.set.exercise_name}</Text>
                          {muscleGroupInfo && muscleGroupInfo.value && (
                            <View style={[
                              styles.muscleGroupBadgeModal,
                              {
                                backgroundColor: isCurrent ? theme.text : theme.card,
                                borderColor: isCurrent ? theme.buttonText : theme.border,
                              }
                            ]}>
                              <Text style={[
                                styles.muscleGroupBadgeText,
                                { color: isCurrent ? (theme.type === 'dark' ? '#000' : '#fff') : theme.text }
                              ]}>
                                {t(muscleGroupInfo.label)}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                      <Text style={[styles.modalExerciseDetails, { color: textColor, marginTop: 4 }]}>
                        {item.logged}/{item.count} {t('Sets')} × {item.set.reps_goal} {t('Reps')}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  const renderEditSetModal = () => {
    const set = editingSetIndex !== null ? allSets[editingSetIndex] : null;
    return (
      <Modal
        visible={editingSetIndex !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setEditingSetIndex(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]} numberOfLines={1}>
                {t('editSetTitle')}{editingSetIndex !== null ? ` ${groupStats(allSets, editingSetIndex).number}` : ''}
              </Text>
              <TouchableOpacity onPress={() => setEditingSetIndex(null)} style={styles.modalCloseButton}>
                <Ionicons name="close-outline" size={28} color={theme.text} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.extraNameHint, { color: theme.text, marginBottom: 8 }]} numberOfLines={1}>
              {set?.exercise_name}
            </Text>
            <View style={styles.inputContainer}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>{t('Weight')} ({weightFormat})</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                  value={editWeight}
                  onChangeText={setEditWeight}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.text }]}>{t('repsDone')}</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                  value={editReps}
                  onChangeText={setEditReps}
                  keyboardType="number-pad"
                  maxLength={4}
                />
              </View>
            </View>
            <TouchableOpacity
              style={[styles.completeButton, { backgroundColor: theme.buttonBackground, marginTop: 16 }]}
              onPress={saveEditedSet}
            >
              <Text style={[styles.buttonText, { color: theme.buttonText }]}>{t('saveChanges')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  const renderNotesModal = () => {
    return (
      <Modal
        visible={isNotesModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setIsNotesModalVisible(false);
        }}
      >

        
    {isNotesModalVisible && (
          <StatusBar
            backgroundColor={theme.type === 'light' ? "rgba(0, 0, 0, 0.5)" : "black"}
            barStyle={'light-content'}          />
        )}



        
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPressOut={() => setIsNotesModalVisible(false)}
        >
          <View 
            style={[styles.modalContainer, { backgroundColor: theme.card, borderColor: theme.border }]}
            onStartShouldSetResponder={() => true} // Prevents modal from closing on inner press
          >
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>{notesModalTitle}</Text>
              <TouchableOpacity onPress={() => setIsNotesModalVisible(false)} style={styles.modalCloseButton}>
                <Ionicons name="close-outline" size={28} color={theme.text} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.notesSubHeader, { color: theme.text }]}>{t('exerciseNotes')}</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={[styles.notesModalText, { color: theme.text }]}>{notesModalContent}</Text>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  const clearRestTimerState = () => {
    stopRestTimer(); // Clear the interval
    setTimerState(prev => updateTimerState(prev, {
      isResting: false,
      isExerciseRest: false,
      restRemaining: null,
      restStartTime: null
    }));
  };
  
  // Load the earlier sessions for a name the user typed into an extra set (the planned names
  // are loaded with the workout). Debounced so each keystroke doesn't hit the database.
  const currentSetName = allSets[timerState.currentSetIndex]?.exercise_name;
  useEffect(() => {
    setHistoryOffset(0);
    if (!currentSetName || !currentSetName.trim() || historyRequestedRef.current.has(currentSetName)) return;
    const timeout = setTimeout(async () => {
      historyRequestedRef.current.add(currentSetName);
      const history = await fetchPreviousWorkoutHistory(currentSetName);
      setPreviousWorkoutHistory(prev => new Map(prev).set(currentSetName, history));
    }, 400);
    return () => clearTimeout(timeout);
  }, [currentSetName]);

  useEffect(() => {
    const configureAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
          interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
          playThroughEarpieceAndroid: false,
        });
      } catch (error) {
        console.error("Error configuring audio mode: ", error);
      }
    };

    configureAudio();
  }, []);

  const playSound = async () => {
    
    try {
      const { sound } = await Audio.Sound.createAsync(
         require('../assets/sounds/switch.mp3')
      );
      sound.setOnPlaybackStatusUpdate(async (status) => {
        if (status.isLoaded && status.didJustFinish) {
          await sound.unloadAsync();
        }
      });
      await sound.playAsync();
    } catch (error) {
        console.log('Error playing sound', error);
    }
  };

  const exerciseOrder = exercises.map(e => e.logged_exercise_id);

  // "Skip to next exercise" from an unfinished set. An extra set that was never logged is dropped.
  const handleSkipToNextExercise = () => {
    const current = allSets[timerState.currentSetIndex];
    if (!current) return;
    const cleaned = dropUnloggedExtras(allSets);

    const at = exerciseOrder.indexOf(current.exercise_id);
    let targetId: number | null = null;
    for (let i = at + 1; i < exerciseOrder.length; i++) {
      if (cleaned.some(s => s.exercise_id === exerciseOrder[i] && !s.set_logged)) {
        targetId = exerciseOrder[i];
        break;
      }
    }

    if (targetId === null) {
      Alert.alert(t('noMoreExercises'), t('allFollowingExercisesLogged'));
      return;
    }

    const targetIndex = firstUnloggedIndex(cleaned, targetId);
    setAllSets(cleaned);
    clearRestTimerState();
    setTimerState(prev => updateTimerState(prev, { currentSetIndex: targetIndex, workoutStage: 'exercise' }));
  };

  // "Next exercise" once every set of the current exercise is logged: rest, then move on.
  const handleNextExercise = () => {
    const current = allSets[timerState.currentSetIndex];
    if (!current) return;
    const targetId = nextUnloggedExerciseId(exerciseOrder, allSets, current.exercise_id);
    if (targetId === null) {
      handleFinishWorkout();
      return;
    }

    const targetIndex = firstUnloggedIndex(allSets, targetId);
    const restSeconds = parseInt(exerciseRestTime);
    if (restSeconds > 0) {
      setTimerState(prev => updateTimerState(prev, {
        workoutStage: 'rest',
        isExerciseRest: true,
        currentSetIndex: targetIndex,
        isResting: true,
        restRemaining: restSeconds,
        restStartTime: Date.now()
      }));
      stopRestTimer();
      startRestTimer(restSeconds);
    } else {
      setTimerState(prev => updateTimerState(prev, { workoutStage: 'exercise', currentSetIndex: targetIndex }));
    }
  };

  // Jump to an exercise group from the list: its first unlogged set, or (when it is finished)
  // its last set, where extra sets can be added and logged sets corrected.
  const goToGroup = (groupIndex: number) => {
    const cleaned = dropUnloggedExtras(allSets);
    const reference = allSets[groupIndex];
    const indices = cleaned
      .map((_, i) => i)
      .filter(i => cleaned[i].exercise_id === reference.exercise_id && cleaned[i].exercise_name === reference.exercise_name);
    if (indices.length === 0) {
      setIsExerciseListModalVisible(false);
      return;
    }
    const firstOpen = indices.find(i => !cleaned[i].set_logged);
    setAllSets(cleaned);
    clearRestTimerState();
    setTimerState(prev => updateTimerState(prev, {
      currentSetIndex: firstOpen !== undefined ? firstOpen : indices[indices.length - 1],
      workoutStage: 'exercise',
    }));
    setIsExerciseListModalVisible(false);
  };

  // "+ Add extra set": only reachable when every set of the exercise is logged.
  const handleAddExtraSet = () => {
    const added = addExtraSet(allSets, timerState.currentSetIndex);
    if (!added) return;
    setAllSets(added.sets);
    setTimerState(prev => updateTimerState(prev, { currentSetIndex: added.index, workoutStage: 'exercise' }));
  };

  const updateCurrentSet = (changes: Partial<ExerciseSet>) => {
    const index = timerState.currentSetIndex;
    setAllSets(prev => prev.map((s, i) => (i === index ? { ...s, ...changes } : s)));
  };

  const handleExtraNameChange = (text: string) => {
    const index = timerState.currentSetIndex;
    setAllSets(prev => prev.map((s, i) => (i === index ? renameExtraSet(s, text) : s)));
  };

  // Correct the weight or reps of a set that was already logged.
  const openEditSet = (index: number) => {
    const set = allSets[index];
    if (!set || !set.set_logged) return;
    setEditingSetIndex(index);
    setEditWeight(set.weight);
    setEditReps(set.reps_done);
  };

  const saveEditedSet = async () => {
    if (editingSetIndex === null) return;
    const set = allSets[editingSetIndex];
    const weight = parseFloat(editWeight);
    const reps = parseInt(editReps);
    if (!set || set.weight_log_id === null || isNaN(weight) || weight < 0 || isNaN(reps) || reps <= 0) {
      Alert.alert(t('errorTitle') || 'Error', t('invalidWeightReps') || 'Please enter valid weight and reps');
      return;
    }
    try {
      await db.runAsync(
        `UPDATE Weight_Log SET weight_logged = ?, reps_logged = ? WHERE weight_log_id = ?;`,
        [weight, reps, set.weight_log_id]
      );
      const updated = allSets.map((s, i) =>
        i === editingSetIndex ? { ...s, weight: weight.toString(), reps_done: reps.toString() } : s
      );
      setAllSets(updated);
      setEditingSetIndex(null);
      if (exerciseDone(updated, set.exercise_id)) {
        await refreshSuggestedWeight(set.exercise_id);
      }
    } catch (error) {
      console.error('Error updating set:', error);
      Alert.alert(t('errorTitle') || 'Error', t('errorLoggingSet') || 'Failed to save the change. Please try again.');
    }
  };

  const handleFinishWorkout = () => {
    const index = timerState.currentSetIndex;
    const current = allSets[index];

    // A set that is fully filled in on screen is logged together with the finish.
    const currentIsReady =
      !!current && !current.set_logged && current.weight !== '' && parseInt(current.reps_done) > 0 && !!current.difficulty;
    const notDone = allSets.filter(s => !s.set_logged && !s.is_extra).length
      - (currentIsReady && !current.is_extra ? 1 : 0);

    const finish = async () => {
      if (currentIsReady) {
        await completeSet(index, true);
        return;
      }
      stopWorkoutTimer();
      clearRestTimerState();
      setAllSets(dropUnloggedExtras(allSets));
      setTimerState(prev => updateTimerState(prev, { workoutStage: 'completed' }));
    };

    if (notDone > 0) {
      Alert.alert(
        t('finishWithUnloggedTitle'),
        t('finishWithUnloggedMessage', { count: notDone }),
        [
          { text: t('finishGoBack'), style: 'cancel' },
          { text: t('finishAnyway'), style: 'destructive', onPress: finish },
        ]
      );
    } else {
      finish();
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.text} />
        <Text style={[styles.loadingText, { color: theme.text }]}>{t('loadingWorkout')}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            navigation.goBack();
          }}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        {timerState.workoutStarted && timerState.workoutStage === 'exercise' && allSets[timerState.currentSetIndex] ? (
          <View style={styles.floatingInfo}>
            <Text style={[styles.floatingName, { color: theme.text }]} numberOfLines={1}>
              {allSets[timerState.currentSetIndex].exercise_name || ' '}
            </Text>
            <Text style={[styles.floatingMeta, { color: theme.text }]}>
              {timerCalculations.formatTime(timerState.workoutDuration)}
              {'  ·  '}
              {groupStats(allSets, timerState.currentSetIndex).logged}/{groupStats(allSets, timerState.currentSetIndex).total} {t('Sets')}
            </Text>
          </View>
        ) : (
          <Text style={[styles.title, { color: theme.text }]}>
            {timerState.workoutStarted ? (workout ? `${workout.workout_name} - ${workout.day_name}` : 'Workout') : t("startWorkout")}
          </Text>
        )}
        {timerState.workoutStarted ? (
          <TouchableOpacity 
            onPress={() => setIsExerciseListModalVisible(true)} 
            style={styles.headerListIcon}
          >
            <Ionicons name="reorder-three-outline" size={23} color={theme.text} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 23 + (styles.headerListIcon.padding * 2), marginLeft: styles.headerListIcon.marginLeft }} />
        )}
      </View>
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        style={styles.content} 
        contentContainerStyle={[
          styles.scrollContent,
          timerState.workoutStage === 'rest' && styles.restScrollContent
        ]}
      >
        {timerState.workoutStage === 'overview' && renderOverview()}
        {timerState.workoutStage === 'exercise' && renderExerciseScreen()}
        {timerState.workoutStage === 'rest' && renderRestScreen()}
        {timerState.workoutStage === 'completed' && renderCompletedScreen()}
      </ScrollView>
      {renderExerciseListModal()}
      {renderNotesModal()}

      {renderEditSetModal()}
    </View>
  );
}

// Styles remain the same...
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 5,
    marginRight: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  headerListIcon: {
    padding: 5,
    marginLeft: 15,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  restScrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    justifyContent: 'center',
    flex: 1
  },
  
  // Floating header block while logging sets
  floatingInfo: {
    flex: 1,
    alignItems: 'center',
  },
  floatingName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  floatingMeta: {
    fontSize: 14,
    marginTop: 2,
    opacity: 0.75,
  },
  extraNameBlock: {
    marginBottom: 12,
  },
  extraNameHint: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 4,
  },
  formCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    paddingRight: 48,
    marginBottom: 12,
  },
  formTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  formVideoButton: {
    position: 'absolute',
    top: 10,
    right: 12,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  setChip: {
    minWidth: 48,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
  },
  setChipText: {
    fontSize: 16,
    fontWeight: '600',
  },
  doneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginTop: 12,
  },
  doneText: {
    fontSize: 18,
    fontWeight: '600',
  },
  difficultyRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
    marginBottom: 8,
  },
  difficultyChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  difficultyEmoji: {
    fontSize: 18,
  },
  difficultyLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  historyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyDate: {
    fontSize: 12,
    opacity: 0.65,
    marginTop: 2,
  },
  historyArrow: {
    paddingHorizontal: 6,
  },

  // Toggle styles
  toggleRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingVertical: 10, 
    paddingHorizontal: 15, 
    borderRadius: 8, 
    borderWidth: 1, 
    marginBottom: 10 
  },
  toggleText: { 
    fontSize: 16, 
    fontWeight: '600' 
  },
  
  // Overview screen styles
  overviewContainer: {
    width: '100%',
  },
  coachNoteCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  coachNoteTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  coachNoteText: {
    fontSize: 15,
    lineHeight: 21,
  },
  workoutHeaderCard: {
    borderRadius: 15,
    borderWidth: 1,
    padding: 20,
    marginBottom: 25,
    alignItems: 'center',
  },
  workoutName: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  workoutDay: {
    fontSize: 18,
    marginBottom: 15,
    textAlign: 'center',
  },
  workoutStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 10,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 14,
    marginTop: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  exercisesList: {
    marginBottom: 20,
  },
  exerciseItem: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 15,
    marginBottom: 10,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  exerciseDetails: {
    fontSize: 14,
  },
  setupSection: {
    marginTop: 15,
    marginBottom: 20,
  },
  setupLabel: {
    fontSize: 16,
    marginBottom: 10,
  },
  restTimeInput: {
    height: 50,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 18,
    marginBottom: 15,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    paddingVertical: 15,
    marginTop: 10,
  },
  buttonIcon: {
    marginRight: 10,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  
  // Exercise screen styles
  exerciseScreenContainer: {
    width: '100%',
  },
  timerDisplay: {
    alignItems: 'center',
    paddingVertical: 15,
    borderRadius: 15,
    borderWidth: 1,
    marginBottom: 20,
  },
  timerLabel: {
    fontSize: 14,
    marginBottom: 5,
  },
  workoutTimerText: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  badgeAndIconsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 10,
    minHeight: 24, // To prevent layout shifts
  },
  currentExerciseCard: {
    borderRadius: 15,
    borderWidth: 1,
    padding: 20,
    marginBottom: 20,
  },
  currentExerciseName: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  currentExerciseNameInput: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  exerciseNotesContainer: {
    marginTop: 12,
    marginBottom: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  exerciseNotesText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  setInfo: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 8,
  },
  repInfo: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  inputGroup: {
    width: '48%',
  },
  commentsContainer: {
    marginTop: 15,
    width: '100%',
  },
  commentsInput: {
    height: 60,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 18,
  },
  controlsContainer: {
    marginTop: 10,
    marginBottom: 20,
  },
  completeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    paddingVertical: 15,
  },
  addExtraSetButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 10,
    borderWidth: 1,
  },
  addExtraSetButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    width: '100%',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  secondaryControlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 50,
  },
  secondaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    width: '48%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  tipText: {
    marginTop: 15,
    textAlign: 'center',
    fontSize: 14,
    fontStyle: 'italic',
  },
  
  // Rest screen styles
  restScreenContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  restCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 25,
    alignItems: 'center',
    marginBottom: 30,
    width: '100%',
  },
  restTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  restTimerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  restTimerText: {
    fontSize: 70,
    fontWeight: 'bold',
    lineHeight: 70,
  },
  restTimerUnit: {
    fontSize: 24,
    marginBottom: 10,
    marginLeft: 5,
  },
  addTimeButton: {
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  addTimeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  restMessage: {
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
    maxWidth: '90%',
  },
  upNextCard: {
    borderRadius: 15,
    borderWidth: 1,
    padding: 20,
    width: '100%',
    marginBottom: 30,
  },
  upNextLabel: {
    fontSize: 14,
    marginBottom: 5,
  },
  upNextExercise: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  upNextSetInfo: {
    fontSize: 16,
    fontWeight: '600',
  },
  skipRestButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    paddingVertical: 15,
    paddingHorizontal: 30,
  },
  
  // Completed screen styles
  completedContainer: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 30,
  },
  completedIcon: {
    marginBottom: 20,
  },
  completedTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  completedCard: {
    borderRadius: 15,
    borderWidth: 1,
    padding: 20,
    width: '100%',
    alignItems: 'center',
    marginBottom: 30,
  },
  completedWorkoutName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  completedStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  completedStatItem: {
    alignItems: 'center',
  },
  completedStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  completedStatLabel: {
    fontSize: 14,
    marginTop: 5,
  },
  saveButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    paddingVertical: 15,
    paddingHorizontal: 40,
    marginTop: 20,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '70%',
    borderRadius: 15,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalCloseButton: {
    padding: 5,
  },
  modalExerciseItem: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginBottom: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  modalExerciseName: {
    fontSize: 17,
    fontWeight: '600',
  },
  modalExerciseDetails: {
    fontSize: 14,
  },
  muscleGroupBadgeMain: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 15,
    borderWidth: 1,
    alignSelf: 'center',
  },
  muscleGroupBadgeOverview: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 15,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  muscleGroupBadgeModal: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 15,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  muscleGroupBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  notesModalText: {
    fontSize: 16,
    lineHeight: 24,
  },
  notesSubHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  historyCard: {
    marginTop: 20,
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    maxHeight: 200,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  historyScrollView: {
    maxHeight: 150,
  },
  historySetRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  historySetText: {
    fontSize: 14,
  },
  historyCommentText: {
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 4,
    marginLeft: 8,
    opacity: 0.8,
  },
});
