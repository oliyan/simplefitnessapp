import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import { usePersonal } from '../context/PersonalContext';

interface Page {
  icon: string;
  title: string;
  body: string;
  footer?: string;
}

// A short welcome the first time the app opens: an optional dedication, then what the app does.
export default function Onboarding() {
  const { theme } = useTheme();
  const { loaded, personal, onboardingSeen, markOnboardingSeen, coachName } = usePersonal();
  const [index, setIndex] = useState(0);

  if (!loaded || onboardingSeen) return null;

  const pages: Page[] = [];
  if (personal.dedication.trim()) {
    pages.push({
      icon: 'heart',
      title: personal.userName.trim() ? `For ${personal.userName.trim()}` : 'Welcome',
      body: personal.dedication.trim(),
      footer: personal.senderName.trim() ? `— ${personal.senderName.trim()}` : undefined,
    });
  }
  pages.push(
    {
      icon: 'clipboard-outline',
      title: 'Plan your week',
      body: 'Build a workout plan, or let the coach write one for you. Put it on your calendar and it shows up on Home each day.',
    },
    {
      icon: 'barbell',
      title: 'Train, one set at a time',
      body: 'Log weight and reps, tap how the set felt, and the app remembers last time for you. Rest timers do the waiting.',
    },
    {
      icon: 'sparkles',
      title: coachName,
      body: 'Optional: add your Anthropic key in Settings and get a short note before each workout, and plans made for you. Everything stays on your phone.',
    },
  );

  const page = pages[Math.min(index, pages.length - 1)];
  const last = index >= pages.length - 1;

  const finish = () => {
    markOnboardingSeen();
    setIndex(0);
  };

  return (
    <Modal visible animationType="fade" statusBarTranslucent>
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.iconWrap, { backgroundColor: theme.accentSoft }]}>
          <Ionicons name={page.icon} size={56} color={theme.accent} />
        </View>
        <Text style={[styles.title, { color: theme.text }]}>{page.title}</Text>
        <Text style={[styles.body, { color: theme.text }]}>{page.body}</Text>
        {page.footer ? <Text style={[styles.footer, { color: theme.accent }]}>{page.footer}</Text> : null}

        <View style={styles.dots}>
          {pages.map((_, i) => (
            <View key={i} style={[styles.dot, { backgroundColor: i === index ? theme.accent : theme.border }]} />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.buttonBackground }]}
          onPress={last ? finish : () => setIndex(index + 1)}
        >
          <Text style={[styles.buttonText, { color: theme.buttonText }]}>{last ? 'Get started' : 'Next'}</Text>
        </TouchableOpacity>
        {!last && (
          <TouchableOpacity onPress={finish} style={styles.skip}>
            <Text style={{ color: theme.text, opacity: 0.6 }}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  iconWrap: { width: 112, height: 112, borderRadius: 56, alignItems: 'center', justifyContent: 'center', marginBottom: 28 },
  title: { fontSize: 28, fontWeight: '800', textAlign: 'center', marginBottom: 14 },
  body: { fontSize: 17, lineHeight: 26, textAlign: 'center', opacity: 0.85 },
  footer: { fontSize: 18, fontWeight: '700', marginTop: 18 },
  dots: { flexDirection: 'row', gap: 8, marginTop: 36, marginBottom: 28 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  button: { borderRadius: 28, paddingVertical: 14, paddingHorizontal: 48 },
  buttonText: { fontSize: 17, fontWeight: '700' },
  skip: { marginTop: 18, padding: 8 },
});
