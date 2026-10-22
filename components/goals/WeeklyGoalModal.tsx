import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface Props {
  visible: boolean;
  planned: number; // sessions the plan has in a typical week
  current: number | null; // the person's own number, or null for "follow my plan"
  onPick: (value: number | null) => void;
  onClose: () => void;
}

// Choose how many sessions a week to aim for: follow the plan (the default) or a number from 1 to 7.
export default function WeeklyGoalModal({ visible, planned, current, onPick, onClose }: Props) {
  const { theme } = useTheme();
  const chip = (label: string, value: number | null) => {
    const on = current === value;
    return (
      <TouchableOpacity
        key={label}
        onPress={() => onPick(value)}
        accessibilityRole="button"
        accessibilityState={{ selected: on }}
        style={[styles.chip, { borderColor: on ? theme.accent : theme.border, backgroundColor: on ? theme.accentSoft : 'transparent' }]}
      >
        <Text style={{ color: theme.text, fontWeight: on ? '900' : '600', fontSize: 16 }}>{label}</Text>
      </TouchableOpacity>
    );
  };
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={{ color: theme.text, fontSize: 20, fontWeight: '900' }}>Sessions per week</Text>
          <Text style={{ color: theme.text, opacity: 0.65, marginTop: 4, marginBottom: 14 }}>
            By default the goal is what your plan puts in the week{planned > 0 ? ` (${planned} at the moment)` : ''}. Pick a number if you want your own.
          </Text>
          <TouchableOpacity
            onPress={() => onPick(null)}
            accessibilityRole="button"
            accessibilityState={{ selected: current === null }}
            style={[styles.follow, { borderColor: current === null ? theme.accent : theme.border, backgroundColor: current === null ? theme.accentSoft : 'transparent' }]}
          >
            <Text style={{ color: theme.text, fontWeight: current === null ? '900' : '600' }}>Follow my plan</Text>
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', marginTop: 10 }}>{[1, 2, 3, 4].map((n) => chip(String(n), n))}</View>
          <View style={{ flexDirection: 'row' }}>{[5, 6, 7].map((n) => chip(String(n), n))}</View>
          <TouchableOpacity onPress={onClose} style={{ alignSelf: 'flex-end', paddingVertical: 12, paddingHorizontal: 8, minHeight: 44, marginTop: 6 }}>
            <Text style={{ color: theme.text, fontWeight: '700' }}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 20 },
  sheet: { borderWidth: 1, borderRadius: 24, padding: 20 },
  follow: { borderWidth: 1, borderRadius: 14, paddingVertical: 12, alignItems: 'center', minHeight: 48, justifyContent: 'center' },
  chip: { flex: 1, borderWidth: 1, borderRadius: 14, paddingVertical: 12, alignItems: 'center', marginRight: 6, marginTop: 6, minHeight: 48, justifyContent: 'center' },
});
