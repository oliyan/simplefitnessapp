import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';

interface Props {
  onOpenAll: () => void;
  onOpenWorkout: (workoutName: string) => void;
  onChanged: () => void;
}

// The raw log of every session: one entry for everything, one per plan. Each plan row has a visible
// menu for deleting its logs, so it no longer depends on knowing about the long-press.
export default function HistoryTab({ onOpenAll, onOpenWorkout, onChanged }: Props) {
  const db = useSQLiteContext();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [workouts, setWorkouts] = useState<string[]>([]);

  const load = useCallback(async () => {
    try {
      const rows = await db.getAllAsync<{ workout_name: string }>(
        `SELECT DISTINCT Workout_Log.workout_name FROM Weight_Log
         INNER JOIN Workout_Log ON Weight_Log.workout_log_id = Workout_Log.workout_log_id;`,
      );
      setWorkouts(rows.map((r) => r.workout_name));
    } catch (error) {
      console.error('Error fetching workouts with logs:', error);
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const deleteLogs = async (workoutName: string) => {
    try {
      const logs = await db.getAllAsync<{ workout_log_id: number }>('SELECT workout_log_id FROM Workout_Log WHERE workout_name = ?', [workoutName]);
      const ids = logs.map((l) => l.workout_log_id);
      if (ids.length > 0) await db.runAsync(`DELETE FROM Weight_Log WHERE workout_log_id IN (${ids.join(',')});`);
      await load();
      onChanged();
    } catch (error) {
      console.error('Error deleting associated days:', error);
      Alert.alert(t('errorTitle'), t('failedToDeleteDays'));
    }
  };

  const confirmDelete = (workoutName: string) =>
    Alert.alert(t('deleteLogsTitle'), t('deleteLogsMessage'), [
      { text: t('alertCancel'), style: 'cancel' },
      { text: t('alertDelete'), style: 'destructive', onPress: () => deleteLogs(workoutName) },
    ]);

  const rowStyle = [styles.row, { backgroundColor: theme.card, borderColor: theme.border }];

  return (
    <View>
      <TouchableOpacity style={rowStyle} onPress={onOpenAll} accessibilityRole="button">
        <Ionicons name="list" size={22} color={theme.accent} style={{ marginRight: 12 }} />
        <Text style={[styles.name, { color: theme.text }]}>{t('allTracks')}</Text>
        <Ionicons name="chevron-forward" size={20} color={theme.text} />
      </TouchableOpacity>

      {workouts.length === 0 && <Text style={{ color: theme.text, opacity: 0.6, textAlign: 'center', marginTop: 16 }}>{t('notTracking')}</Text>}

      {workouts.map((w) => (
        <View key={w} style={rowStyle}>
          <TouchableOpacity style={styles.main} onPress={() => onOpenWorkout(w)} onLongPress={() => confirmDelete(w)} accessibilityRole="button">
            <Ionicons name="clipboard-outline" size={22} color={theme.accent} style={{ marginRight: 12 }} />
            <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>{w}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => confirmDelete(w)} accessibilityRole="button" accessibilityLabel={`Delete logs of ${w}`} style={styles.menu}>
            <Ionicons name="trash-outline" size={20} color={theme.text} style={{ opacity: 0.6 }} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onOpenWorkout(w)} accessibilityLabel={`Open ${w}`} style={styles.menu}>
            <Ionicons name="chevron-forward" size={20} color={theme.text} />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 18, paddingHorizontal: 14, marginBottom: 10, minHeight: 60 },
  main: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  name: { flex: 1, fontSize: 17, fontWeight: '700' },
  menu: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
