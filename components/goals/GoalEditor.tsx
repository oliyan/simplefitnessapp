import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { LiftGoal } from '../../utils/motivation';
import { formatKg } from '../../utils/progressStats';

interface Props {
  visible: boolean;
  exercise: string;
  current: number; // heaviest set so far
  existing?: LiftGoal;
  onSave: (goal: LiftGoal) => void;
  onRemove?: () => void;
  onClose: () => void;
}

const DEADLINES: { label: string; weeks: number | null }[] = [
  { label: '4 weeks', weeks: 4 },
  { label: '8 weeks', weeks: 8 },
  { label: '12 weeks', weeks: 12 },
  { label: 'No date', weeks: null },
];

// Set or change a target for the heaviest set of one exercise, with an optional deadline.
export default function GoalEditor({ visible, exercise, current, existing, onSave, onRemove, onClose }: Props) {
  const { theme } = useTheme();
  const [target, setTarget] = useState('');
  const [weeks, setWeeks] = useState<number | null>(8);

  useEffect(() => {
    if (!visible) return;
    setTarget(existing ? String(existing.target) : String(Math.max(5, Math.ceil((current * 1.1) / 2.5) * 2.5)));
    setWeeks(existing ? null : 8);
  }, [visible]);

  const parsed = parseFloat(target.replace(',', '.'));
  const valid = isFinite(parsed) && parsed > 0 && parsed <= 1000;

  const save = () => {
    if (!valid) return;
    const now = Math.floor(new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).getTime() / 1000);
    const keepBy = existing && weeks === null && existing.by ? existing.by : null;
    const by = weeks !== null ? now + weeks * 7 * 86400 : keepBy;
    onSave({ name: exercise, target: parsed, by, createdAt: existing?.createdAt ?? now, startValue: existing?.startValue ?? current });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={{ color: theme.text, fontSize: 20, fontWeight: '900' }}>Goal for {exercise}</Text>
          <Text style={{ color: theme.text, opacity: 0.65, marginTop: 4 }}>
            {current > 0 ? `Your heaviest so far is ${formatKg(current)} kg.` : 'Nothing logged yet, so this is your starting line.'} Pick the weight you want to lift on a single set.
          </Text>

          <Text style={[styles.label, { color: theme.text }]}>Target weight (kg)</Text>
          <TextInput
            value={target}
            onChangeText={setTarget}
            keyboardType="decimal-pad"
            accessibilityLabel="Target weight in kilograms"
            style={[styles.input, { color: theme.text, borderColor: theme.border }]}
          />

          <Text style={[styles.label, { color: theme.text }]}>{existing ? 'Change the date' : 'By when?'}</Text>
          <View style={{ flexDirection: 'row' }}>
            {DEADLINES.map((d) => {
              const on = weeks === d.weeks;
              return (
                <TouchableOpacity
                  key={d.label}
                  onPress={() => setWeeks(d.weeks)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  style={[styles.chip, { borderColor: on ? theme.accent : theme.border, backgroundColor: on ? theme.accentSoft : 'transparent' }]}
                >
                  <Text style={{ color: theme.text, fontWeight: on ? '800' : '500', fontSize: 12 }}>{d.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {existing && weeks === null && <Text style={{ color: theme.text, opacity: 0.55, fontSize: 12, marginTop: 6 }}>Leaving this as it is keeps the date you already set.</Text>}

          <View style={{ flexDirection: 'row', marginTop: 20 }}>
            {existing && onRemove ? (
              <TouchableOpacity onPress={onRemove} style={styles.textButton}>
                <Text style={{ color: '#DC3545', fontWeight: '800' }}>Remove goal</Text>
              </TouchableOpacity>
            ) : null}
            <View style={{ flex: 1 }} />
            <TouchableOpacity onPress={onClose} style={styles.textButton}>
              <Text style={{ color: theme.text, fontWeight: '700' }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={save} disabled={!valid} style={[styles.save, { backgroundColor: theme.buttonBackground, opacity: valid ? 1 : 0.4 }]}>
              <Text style={{ color: theme.buttonText, fontWeight: '800' }}>Save goal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 20 },
  sheet: { borderWidth: 1, borderRadius: 24, padding: 20 },
  label: { fontWeight: '800', marginTop: 16, marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, fontSize: 18 },
  chip: { flex: 1, borderWidth: 1, borderRadius: 14, paddingVertical: 10, alignItems: 'center', marginRight: 6, minHeight: 44, justifyContent: 'center' },
  textButton: { paddingHorizontal: 12, paddingVertical: 12, minHeight: 44, justifyContent: 'center' },
  save: { borderRadius: 16, paddingHorizontal: 18, paddingVertical: 12, minHeight: 44, justifyContent: 'center' },
});
