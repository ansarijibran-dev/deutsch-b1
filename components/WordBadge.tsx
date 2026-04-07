import { View, Text, StyleSheet } from 'react-native';
import { WordType, WORD_TYPE_LABELS } from '../data/types';
import { useTheme } from '../hooks/useTheme';

interface Props {
  wordType: WordType;
  gender?: 'masculine' | 'feminine' | 'neuter' | null;
}

const GENDER_LABELS = { masculine: 'der', feminine: 'die', neuter: 'das' };

export function WordBadge({ wordType, gender }: Props) {
  const c = useTheme();
  return (
    <View style={styles.row}>
      <View style={[styles.badge, { backgroundColor: c.chipBg }]}>
        <Text style={[styles.label, { color: c.text2 }]}>{WORD_TYPE_LABELS[wordType]}</Text>
      </View>
      {gender && (
        <View style={[styles.badge, { backgroundColor: c.genderColors[gender] }]}>
          <Text style={[styles.label, { color: c.text2 }]}>{GENDER_LABELS[gender]}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  label: { fontSize: 11, fontWeight: '600' },
});
