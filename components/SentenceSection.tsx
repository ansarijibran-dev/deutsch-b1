import { View, Text, StyleSheet } from 'react-native';
import { Sentences } from '../data/types';

interface Props {
  sentences: Sentences;
  isNoun: boolean;
}

function SentenceRow({ label, pair }: { label: string; pair: { de: string; en: string } }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.de}>{pair.de}</Text>
      <Text style={styles.en}>{pair.en}</Text>
    </View>
  );
}

export function SentenceSection({ sentences, isNoun }: Props) {
  return (
    <View>
      <Text style={styles.heading}>Example Sentences</Text>
      <SentenceRow label="Present" pair={sentences.present} />
      <SentenceRow label="Past" pair={sentences.past} />
      <SentenceRow label="Future" pair={sentences.future} />
      {isNoun ? (
        <>
          {sentences.nominative && <SentenceRow label="Nominative" pair={sentences.nominative} />}
          {sentences.accusative && <SentenceRow label="Accusative" pair={sentences.accusative} />}
          {sentences.dative && <SentenceRow label="Dative" pair={sentences.dative} />}
        </>
      ) : (
        <>
          {sentences.usage1 && <SentenceRow label="Usage 1" pair={sentences.usage1} />}
          {sentences.usage2 && <SentenceRow label="Usage 2" pair={sentences.usage2} />}
          {sentences.usage3 && <SentenceRow label="Usage 3" pair={sentences.usage3} />}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: 13, fontWeight: '700', color: '#374151', marginTop: 16, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  row: { marginBottom: 12 },
  label: { fontSize: 11, fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  de: { fontSize: 14, color: '#111827', marginBottom: 1 },
  en: { fontSize: 13, color: '#6B7280', fontStyle: 'italic' },
});
