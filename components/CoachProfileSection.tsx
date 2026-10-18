import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import {
  EQUIPMENT_OPTIONS,
  loadCoachProfile,
  saveEquipment,
  saveStandingConstraints,
} from '../utils/coachProfile';
import { clearInBodySnapshots, importInBodyCsv, loadInBodySnapshots } from '../utils/inbodyStorage';

// Standing profile (equipment, injuries) and body-composition data that feed the AI
// coach. Lives in the Settings "AI Coach" section.
export default function CoachProfileSection() {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const [equipment, setEquipment] = useState<string[]>([]);
  const [constraints, setConstraints] = useState('');
  const [scanCount, setScanCount] = useState(0);
  const [latestScan, setLatestScan] = useState<string | null>(null);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);

  const refreshScans = useCallback(async () => {
    const snapshots = await loadInBodySnapshots();
    setScanCount(snapshots.length);
    setLatestScan(snapshots.length > 0 ? snapshots[snapshots.length - 1].scan_date : null);
  }, []);

  useEffect(() => {
    loadCoachProfile().then((profile) => {
      setEquipment(profile.equipment);
      setConstraints(profile.standingConstraints);
    });
    refreshScans();
  }, [refreshScans]);

  const toggleEquipment = (item: string) => {
    const next = equipment.includes(item) ? equipment.filter((e) => e !== item) : [...equipment, item];
    setEquipment(next);
    saveEquipment(next);
  };

  const handleImport = async () => {
    setStatus(null);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', 'application/vnd.ms-excel', 'text/plain', '*/*'],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]?.uri) return;
      const text = await FileSystem.readAsStringAsync(result.assets[0].uri);
      const { addedCount, updatedCount, snapshots } = await importInBodyCsv(text);
      await refreshScans();
      setStatus({
        ok: true,
        text: t('inbodyImported', { added: addedCount, updated: updatedCount, total: snapshots.length }),
      });
    } catch (error) {
      console.error('InBody import failed:', error);
      setStatus({ ok: false, text: error instanceof Error ? error.message : t('inbodyImportFailed') });
    }
  };

  const handleClear = async () => {
    await clearInBodySnapshots();
    await refreshScans();
    setStatus(null);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.heading, { color: theme.text }]}>{t('profileHeading')}</Text>

      <Text style={[styles.label, { color: theme.text }]}>{t('planEquipment')}</Text>
      <View style={styles.chipRow}>
        {EQUIPMENT_OPTIONS.map((item) => {
          const selected = equipment.includes(item);
          return (
            <TouchableOpacity
              key={item}
              onPress={() => toggleEquipment(item)}
              style={[
                styles.chip,
                { backgroundColor: selected ? theme.buttonBackground : theme.card, borderColor: theme.border },
              ]}
            >
              <Text style={{ color: selected ? theme.buttonText : theme.text, fontWeight: '600' }}>
                {selected ? '✓ ' : ''}
                {item}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={[styles.label, { color: theme.text }]}>{t('profileConstraints')}</Text>
      <TextInput
        style={[
          styles.input,
          { color: theme.text, backgroundColor: theme.card, borderColor: theme.border },
        ]}
        value={constraints}
        onChangeText={setConstraints}
        onBlur={() => saveStandingConstraints(constraints)}
        placeholder={t('profileConstraintsPlaceholder')}
        placeholderTextColor={theme.border}
        multiline
      />

      <Text style={[styles.label, { color: theme.text }]}>{t('inbodyHeading')}</Text>
      <Text style={{ color: theme.text, opacity: 0.7, marginBottom: 10 }}>{t('inbodyPrivacy')}</Text>
      <Text style={{ color: theme.text, marginBottom: 10 }}>
        {scanCount > 0 ? t('inbodyStored', { count: scanCount, date: latestScan }) : t('inbodyNone')}
      </Text>
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.buttonBackground }]}
          onPress={handleImport}
        >
          <Text style={[styles.buttonText, { color: theme.buttonText }]}>{t('inbodyImportButton')}</Text>
        </TouchableOpacity>
        {scanCount > 0 && (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }]}
            onPress={handleClear}
          >
            <Text style={[styles.buttonText, { color: theme.text }]}>{t('inbodyClear')}</Text>
          </TouchableOpacity>
        )}
      </View>
      {status && (
        <Text style={{ color: status.ok ? '#2E7D32' : '#D32F2F', textAlign: 'center', marginTop: 12 }}>
          {status.text}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 24 },
  heading: { fontSize: 18, fontWeight: '800', textAlign: 'center', marginBottom: 6 },
  label: { fontSize: 16, fontWeight: '700', marginTop: 14, marginBottom: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14 },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  buttonRow: { flexDirection: 'row', gap: 10 },
  button: { flex: 1, borderRadius: 8, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontSize: 16, fontWeight: '600' },
});
