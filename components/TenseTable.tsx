import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TenseConjugation } from '../data/types';

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
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>{label}</Text>
      {ROWS.map(({ key, pronoun }) => (
        <View key={key} style={styles.row}>
          <Text style={styles.pronoun}>{pronoun}</Text>
          <Text style={styles.form}>{conjugation[key] ?? '—'}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
  },
  heading: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  pronoun: { fontSize: 13, color: '#6B7280', width: 100 },
  form: { fontSize: 13, color: '#111827', fontWeight: '500', flex: 1, textAlign: 'right' },
});
