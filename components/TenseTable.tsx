import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TenseConjugation } from '../data/types';
import { useTheme } from '../hooks/useTheme';

interface Props {
  label: string;
  conjugation: TenseConjugation;
}

const ROWS: { key: keyof TenseConjugation; pronoun: string }[] = [
  { key: 'ich', pronoun: 'ich' },
  { key: 'du', pronoun: 'du' },
  { key: 'er', pronoun: 'er / sie / es' },
  { key: 'wir', pronoun: 'wir' },
  { key: 'ihr', pronoun: 'ihr' },
  { key: 'sie', pronoun: 'sie / Sie' },
];

export function TenseTable({ label, conjugation }: Props) {
  const c = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: c.tableBg }]}>
      <Text style={[styles.heading, { color: c.text2 }]}>{label}</Text>
      {ROWS.map(({ key, pronoun }) => (
        <View key={key} style={[styles.row, { borderBottomColor: c.border }]}>
          <Text style={[styles.pronoun, { color: c.text3 }]}>{pronoun}</Text>
          <Text style={[styles.form, { color: c.text1 }]}>{conjugation[key] ?? '—'}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    borderRadius: 10,
    padding: 12,
  },
  heading: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pronoun: { fontSize: 13, width: 100 },
  form: { fontSize: 13, fontWeight: '500', flex: 1, textAlign: 'right' },
});
