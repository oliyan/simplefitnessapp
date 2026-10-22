import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface Props {
  visible: boolean;
  title: string;
  hint: string;
  initial: string;
  placeholder?: string;
  maxLength?: number;
  multiline?: boolean;
  onSave: (value: string) => void;
  onClose: () => void;
}

// A small text prompt (used for "Why I started"). An empty save clears the text.
export default function SimpleEditor({ visible, title, hint, initial, placeholder, maxLength = 300, multiline = true, onSave, onClose }: Props) {
  const { theme } = useTheme();
  const [value, setValue] = useState(initial);
  useEffect(() => {
    if (visible) setValue(initial);
  }, [visible, initial]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={{ color: theme.text, fontSize: 20, fontWeight: '900' }}>{title}</Text>
          <Text style={{ color: theme.text, opacity: 0.65, marginTop: 4, marginBottom: 12 }}>{hint}</Text>
          <TextInput
            value={value}
            onChangeText={setValue}
            placeholder={placeholder}
            placeholderTextColor={theme.text + '80'}
            maxLength={maxLength}
            multiline={multiline}
            accessibilityLabel={title}
            style={[styles.input, { color: theme.text, borderColor: theme.border, minHeight: multiline ? 96 : 48 }]}
            textAlignVertical="top"
          />
          <Text style={{ color: theme.text, opacity: 0.45, fontSize: 12, textAlign: 'right', marginTop: 4 }}>{value.length} / {maxLength}</Text>
          <View style={{ flexDirection: 'row', marginTop: 12 }}>
            <View style={{ flex: 1 }} />
            <TouchableOpacity onPress={onClose} style={styles.textButton}>
              <Text style={{ color: theme.text, fontWeight: '700' }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onSave(value.trim())} style={[styles.save, { backgroundColor: theme.buttonBackground }]}>
              <Text style={{ color: theme.buttonText, fontWeight: '800' }}>Save</Text>
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
  input: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, fontSize: 16 },
  textButton: { paddingHorizontal: 12, paddingVertical: 12, minHeight: 44, justifyContent: 'center' },
  save: { borderRadius: 16, paddingHorizontal: 18, paddingVertical: 12, minHeight: 44, justifyContent: 'center' },
});
