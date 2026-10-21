import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { loadSettings, saveSettings } from '../../utils/settingsStorage';

// A small hint shown once. Closing it (Got it) is remembered, so it never comes back.
export default function FirstVisitTip({ id, text }: { id: string; text: string }) {
  const { theme } = useTheme();
  const [show, setShow] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const saved = await loadSettings();
      const seen: string[] = Array.isArray(saved?.progressTipsSeen) ? saved.progressTipsSeen : [];
      if (active && !seen.includes(id)) setShow(true);
    })();
    return () => {
      active = false;
    };
  }, [id]);

  if (!show) return null;

  const dismiss = async () => {
    setShow(false);
    const saved = await loadSettings();
    const seen: string[] = Array.isArray(saved?.progressTipsSeen) ? saved.progressTipsSeen : [];
    saveSettings({ progressTipsSeen: [...seen, id] });
  };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.accentSoft, borderRadius: 16, padding: 12, marginBottom: 14 }}>
      <Ionicons name="bulb-outline" size={22} color={theme.accent} style={{ marginRight: 10 }} />
      <Text style={{ flex: 1, color: theme.text, lineHeight: 19 }}>{text}</Text>
      <TouchableOpacity onPress={dismiss} accessibilityRole="button" accessibilityLabel="Dismiss tip" style={{ paddingHorizontal: 10, paddingVertical: 10, minHeight: 44, justifyContent: 'center' }}>
        <Text style={{ color: theme.accent, fontWeight: '800' }}>Got it</Text>
      </TouchableOpacity>
    </View>
  );
}
