import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../../context/ThemeContext';

// The (i) button next to a chart title. The explanation stays hidden until it is tapped.
export function ChartInfoButton({ open, onPress }: { open: boolean; onPress: () => void }) {
  const { theme } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} accessibilityRole="button" accessibilityLabel="What does this chart show?" style={styles.info}>
      <Ionicons name={open ? 'information-circle' : 'information-circle-outline'} size={24} color={theme.accent} />
    </TouchableOpacity>
  );
}

export function ChartHelpBox({ title, text }: { title: string; text: string }) {
  const { theme } = useTheme();
  return (
    <View style={[styles.box, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Text style={{ color: theme.text, fontSize: 16, fontWeight: 'bold', marginBottom: 5 }}>{title}</Text>
      <Text style={{ color: theme.text, fontSize: 14, lineHeight: 20 }}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  info: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  box: { borderRadius: 10, borderWidth: 1, padding: 15, marginTop: 10 },
});
