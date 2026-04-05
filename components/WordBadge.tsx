import { View, Text, StyleSheet } from 'react-native';
import { WordType, WORD_TYPE_COLORS, WORD_TYPE_LABELS } from '../data/types';

interface Props {
  wordType: WordType;
  gender?: 'masculine' | 'feminine' | 'neuter' | null;
}

const GENDER_LABELS = { masculine: 'der', feminine: 'die', neuter: 'das' };
const GENDER_COLORS = { masculine: '#DBEAFE', feminine: '#FCE7F3', neuter: '#DCFCE7' };

export function WordBadge({ wordType, gender }: Props) {
  return (
    <View style={styles.row}>
      <View style={[styles.badge, { backgroundColor: WORD_TYPE_COLORS[wordType] }]}>
        <Text style={styles.label}>{WORD_TYPE_LABELS[wordType]}</Text>
      </View>
      {gender && (
        <View style={[styles.badge, { backgroundColor: GENDER_COLORS[gender] }]}>
          <Text style={styles.label}>{GENDER_LABELS[gender]}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  label: { fontSize: 11, fontWeight: '600', color: '#374151' },
});
