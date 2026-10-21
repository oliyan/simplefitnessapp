import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import { usePersonal } from '../context/PersonalContext';
import { ONBOARDING_TEXT } from '../config/personalDefaults';

interface Page {
  icon: string;
  title: string;
  body: string;
  footer?: string;
}

// A short welcome the first time the app opens: an optional dedication, then what the app does.
export default function Onboarding() {
  const { theme } = useTheme();
  const { loaded, personal, updatePersonal, onboardingSeen, markOnboardingSeen, coachName } = usePersonal();
  const [index, setIndex] = useState(0);
  const [typedName, setTypedName] = useState('');
  const asksForName = !personal.userName.trim();

  if (!loaded || onboardingSeen) return null;

  const pages: Page[] = [];
  if (personal.dedication.trim()) {
    pages.push({
      icon: 'heart',
      title: ONBOARDING_TEXT.dedicationTitle || (personal.userName.trim() ? `For ${personal.userName.trim()}` : 'Welcome'),
      body: personal.dedication.trim(),
      footer: personal.senderName.trim() ? `- ${personal.senderName.trim()}` : undefined,
    });
  }
  if (asksForName) {
    pages.push({
      icon: 'person-circle-outline',
      title: 'How do I call you?',
      body: 'Optional. Your name is used in greetings and by the coach.',
    });
  }
  pages.push(
    {
      icon: 'clipboard-outline',
      title: 'Plan your week',
      body: ONBOARDING_TEXT.planBody,
    },
    {
      icon: 'barbell',
      title: 'Train, one set at a time',
      body: 'Log weight and reps, tap how the set felt, and the app remembers last time for you. Rest timers do the waiting.',
    },
    {
      icon: 'sparkles',
      title: coachName,
      body: ONBOARDING_TEXT.coachBody,
    },
  );

  const page = pages[Math.min(index, pages.length - 1)];
  const last = index >= pages.length - 1;

  const saveName = () => {
    if (asksForName && typedName.trim()) updatePersonal({ userName: typedName.trim() });
  };

  const finish = () => {
    saveName();
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
        {asksForName && index === 0 && !personal.dedication.trim() ? (
          <TextInput
            style={[styles.nameInput, { color: theme.text, backgroundColor: theme.card, borderColor: theme.border }]}
            value={typedName}
            onChangeText={setTypedName}
            placeholder="Your name"
            placeholderTextColor={theme.text + '55'}
            autoCapitalize="words"
            returnKeyType="next"
            onSubmitEditing={() => { saveName(); setIndex(index + 1); }}
          />
        ) : null}
        {page.footer ? <Text style={[styles.footer, { color: theme.accent }]}>{page.footer}</Text> : null}

        <View style={styles.dots}>
          {pages.map((_, i) => (
            <View key={i} style={[styles.dot, { backgroundColor: i === index ? theme.accent : theme.border }]} />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.buttonBackground }]}
          onPress={last ? finish : () => { if (index === 0) saveName(); setIndex(index + 1); }}
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
  nameInput: { width: '100%', borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, fontSize: 18, marginTop: 22, textAlign: 'center' },
  dots: { flexDirection: 'row', gap: 8, marginTop: 36, marginBottom: 28 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  button: { borderRadius: 28, paddingVertical: 14, paddingHorizontal: 48 },
  buttonText: { fontSize: 17, fontWeight: '700' },
  skip: { marginTop: 18, padding: 8 },
});
