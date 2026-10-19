import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { usePersonal } from '../context/PersonalContext';
import { NOTE_LABELS, GENERIC_NOTES, NoteKey } from '../config/personalDefaults';

// Settings: Personalise. The names, the Home greeting, the first-launch dedication and the short
// notes shown at nice moments. Everything is optional.
export default function PersonaliseSection() {
  const { theme } = useTheme();
  const { personal, updatePersonal, replayOnboarding } = usePersonal();

  const inputStyle = [styles.input, { color: theme.text, backgroundColor: theme.card, borderColor: theme.border }];
  const multilineStyle = [...inputStyle, styles.multiline];
  const labelStyle = [styles.label, { color: theme.text }];
  const placeholderColor = theme.type === 'dark' ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)';

  return (
    <View style={styles.section}>
      <Text style={[styles.title, { color: theme.text }]}>Personalise</Text>
      <Text style={[styles.hint, { color: theme.text }]}>
        Optional. Make the app feel like yours: a name, a greeting on Home, and short notes at nice moments.
      </Text>

      <Text style={labelStyle}>Name</Text>
      <TextInput
        style={inputStyle}
        value={personal.userName}
        onChangeText={(v) => updatePersonal({ userName: v })}
        placeholder="Who is training?"
        placeholderTextColor={placeholderColor}
      />

      <Text style={labelStyle}>Notes and advice are signed by</Text>
      <TextInput
        style={inputStyle}
        value={personal.senderName}
        onChangeText={(v) => updatePersonal({ senderName: v })}
        placeholder="Leave empty to call the coach AI Coach"
        placeholderTextColor={placeholderColor}
      />

      <Text style={labelStyle}>Greeting on Home</Text>
      <TextInput
        style={inputStyle}
        value={personal.greeting}
        onChangeText={(v) => updatePersonal({ greeting: v })}
        placeholder="For example: Hi, Alex!"
        placeholderTextColor={placeholderColor}
      />

      <Text style={labelStyle}>Dedication (shown on the first launch)</Text>
      <TextInput
        style={multilineStyle}
        multiline
        value={personal.dedication}
        onChangeText={(v) => updatePersonal({ dedication: v })}
        placeholder="A few warm words"
        placeholderTextColor={placeholderColor}
      />

      <Text style={[styles.subTitle, { color: theme.text }]}>Notes at nice moments</Text>
      {(Object.keys(NOTE_LABELS) as NoteKey[]).map((key) => (
        <View key={key}>
          <Text style={labelStyle}>{NOTE_LABELS[key]}</Text>
          <TextInput
            style={multilineStyle}
            multiline
            value={personal.notes[key]}
            onChangeText={(v) => updatePersonal({ notes: { ...personal.notes, [key]: v } })}
          />
        </View>
      ))}

      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.smallButton, { borderColor: theme.border, backgroundColor: theme.card }]}
          onPress={() => updatePersonal({ notes: { ...GENERIC_NOTES } })}
        >
          <Text style={{ color: theme.text, fontWeight: '600' }}>Reset notes</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.smallButton, { borderColor: theme.border, backgroundColor: theme.card }]}
          onPress={replayOnboarding}
        >
          <Text style={{ color: theme.text, fontWeight: '600' }}>Replay welcome</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 24, width: '100%' },
  title: { fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 6 },
  subTitle: { fontSize: 17, fontWeight: '700', marginTop: 18, marginBottom: 2 },
  hint: { fontSize: 13, opacity: 0.7, textAlign: 'center', marginBottom: 10 },
  label: { fontSize: 13, fontWeight: '600', marginTop: 12, marginBottom: 4, opacity: 0.85 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16 },
  multiline: { minHeight: 64, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 10, marginTop: 16 },
  smallButton: { flex: 1, borderWidth: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
});
