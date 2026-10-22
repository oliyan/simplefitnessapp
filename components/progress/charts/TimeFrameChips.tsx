import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';

interface Option<T extends string> {
  value: T;
  label: string;
}

// One row of time frame buttons (Week, Month, 3 Months, Year, All). Sits directly above the chart.
export default function TimeFrameChips<T extends string>({ value, options, onChange }: { value: T; options: Option<T>[]; onChange: (v: T) => void }) {
  const { theme } = useTheme();
  return (
    <View style={styles.row}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <TouchableOpacity
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            style={[styles.chip, { backgroundColor: on ? theme.buttonBackground : theme.card, borderColor: theme.border }]}
          >
            <Text numberOfLines={1} adjustsFontSizeToFit style={{ fontSize: 14, fontWeight: on ? 'bold' : '500', color: on ? theme.buttonText : theme.text }}>
              {o.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', marginBottom: 12 },
  chip: { flex: 1, borderRadius: 12, borderWidth: 1, paddingVertical: 10, paddingHorizontal: 4, marginHorizontal: 3, alignItems: 'center', justifyContent: 'center', minHeight: 44 },
});
