import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { WEEKDAY_LETTERS, WEEKDAY_SHORT } from '../utils/weekdays';

// Seven small buttons, Monday to Sunday. Tap a day to pick it, tap it again to clear.
export default function WeekdayPicker({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (weekday: number | null) => void;
}) {
  const { theme } = useTheme();

  return (
    <View style={styles.row}>
      {WEEKDAY_LETTERS.map((letter, index) => {
        const weekday = index + 1;
        const selected = value === weekday;
        return (
          <TouchableOpacity
            key={weekday}
            accessibilityLabel={WEEKDAY_SHORT[index]}
            onPress={() => onChange(selected ? null : weekday)}
            style={[
              styles.button,
              { backgroundColor: selected ? theme.buttonBackground : theme.card, borderColor: theme.border },
            ]}
          >
            <Text style={{ color: selected ? theme.buttonText : theme.text, fontWeight: '700' }}>{letter}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
