import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { getMonthlyLimit, getUsage, setMonthlyLimit, Usage } from '../utils/aiUsage';

const MAX_LIMIT_USD = 1000;

// Shows this month's estimated AI spend and lets the user change the monthly cap.
// refreshSignal: change it (e.g. after a request made on the same screen) to reload the numbers.
export default function AiBudgetSection({ refreshSignal }: { refreshSignal?: unknown }) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const [usage, setUsage] = useState<Usage | null>(null);
  const [limit, setLimit] = useState<number | null>(null);
  const [limitInput, setLimitInput] = useState('');
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(() => {
    let active = true;
    Promise.all([getUsage(), getMonthlyLimit()]).then(([u, l]) => {
      if (!active) return;
      setUsage(u);
      setLimit(l);
      setLimitInput((current) => (current === '' ? l.toFixed(2) : current));
    });
    return () => {
      active = false;
    };
  }, []);

  // Refresh whenever the Settings tab comes into view, since AI calls happen elsewhere,
  // and again whenever the parent signals that a request just finished.
  useFocusEffect(load);
  useEffect(load, [load, refreshSignal]);

  const handleSave = async () => {
    const value = Number(limitInput.replace(',', '.'));
    if (!Number.isFinite(value) || value <= 0 || value > MAX_LIMIT_USD) {
      setStatus({ ok: false, text: t('aiLimitInvalid', { max: MAX_LIMIT_USD }) });
      return;
    }
    await setMonthlyLimit(value);
    setLimit(value);
    setLimitInput(value.toFixed(2));
    setStatus({ ok: true, text: t('aiLimitSaved') });
  };

  if (!usage || limit === null) return null;

  return (
    <View style={styles.container}>
      <Text style={[styles.heading, { color: theme.text }]}>{t('aiLimitHeading')}</Text>
      <Text style={{ color: theme.text, textAlign: 'center', marginBottom: 10 }}>
        {t('aiUsageThisMonth', {
          spend: usage.spendUsd.toFixed(2),
          limit: limit.toFixed(2),
          calls: usage.calls,
        })}
      </Text>
      <View style={styles.row}>
        <Text style={{ color: theme.text, fontSize: 18, marginRight: 6 }}>$</Text>
        <TextInput
          style={[
            styles.input,
            { color: theme.text, backgroundColor: theme.card, borderColor: theme.border },
          ]}
          value={limitInput}
          onChangeText={setLimitInput}
          keyboardType="decimal-pad"
        />
        <TouchableOpacity style={[styles.button, { backgroundColor: theme.buttonBackground }]} onPress={handleSave}>
          <Text style={{ color: theme.buttonText, fontWeight: '600', fontSize: 16 }}>{t('aiLimitSave')}</Text>
        </TouchableOpacity>
      </View>
      <Text style={{ color: theme.text, opacity: 0.65, marginTop: 10 }}>{t('aiLimitNote')}</Text>
      {status && (
        <Text style={{ color: status.ok ? '#2E7D32' : '#D32F2F', textAlign: 'center', marginTop: 8 }}>
          {status.text}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 24 },
  heading: { fontSize: 18, fontWeight: '800', textAlign: 'center', marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center' },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 16,
    marginRight: 10,
  },
  button: { borderRadius: 8, paddingVertical: 12, paddingHorizontal: 20 },
});
