import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Word, WORD_TYPE_COLORS, WORD_TYPE_LABELS } from '../data/types';

interface Props {
  word: Word;
  onPress: (word: Word) => void;
}

export function WordListItem({ word, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.row} onPress={() => onPress(word)} activeOpacity={0.7}>
      <View style={[styles.typeDot, { backgroundColor: WORD_TYPE_COLORS[word.wordType] }]} />
      <View style={styles.text}>
        <Text style={styles.german}>{word.article ? `${word.article} ` : ''}{word.german}</Text>
        <Text style={styles.english} numberOfLines={1}>{word.english}</Text>
      </View>
      <Text style={styles.typeLabel}>{WORD_TYPE_LABELS[word.wordType]}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', backgroundColor: '#FFF' },
  typeDot: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
  text: { flex: 1 },
  german: { fontSize: 16, fontWeight: '600', color: '#111827' },
  english: { fontSize: 13, color: '#6B7280', marginTop: 1 },
  typeLabel: { fontSize: 11, color: '#9CA3AF' },
});
