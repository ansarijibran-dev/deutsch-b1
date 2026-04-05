import { ScrollView, View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getWordById } from '../../data/loader';
import { WordBadge } from '../../components/WordBadge';
import { SentenceSection } from '../../components/SentenceSection';

const ARTICLE_GENDER: Record<string, 'masculine' | 'feminine' | 'neuter'> = {
  der: 'masculine', die: 'feminine', das: 'neuter',
};

export default function WordDetailScreen() {
  const { wordId } = useLocalSearchParams<{ wordId: string }>();
  const router = useRouter();
  const word = getWordById(wordId);

  if (!word) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.error}>Word not found.</Text>
      </SafeAreaView>
    );
  }

  const gender = word.article ? ARTICLE_GENDER[word.article] : null;
  const isNoun = word.wordType === 'noun';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹ Back</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <WordBadge wordType={word.wordType} gender={gender} />
        <Text style={styles.german}>{word.article ? word.article + ' ' : ''}{word.german}</Text>
        <Text style={styles.english}>{word.english}</Text>
        {isNoun && word.plural && <Text style={styles.plural}>Plural: {word.plural}</Text>}
        {word.verbForms && (
          <View style={styles.verbTable}>
            <Text style={styles.sectionTitle}>Conjugation</Text>
            {([
              ['3rd person present', word.verbForms.present_3sg],
              ['Simple past', word.verbForms.simple_past],
              ['Perfect', word.verbForms.perfect],
              ['Future', word.verbForms.future],
            ] as [string, string][]).map(([label, value]) => (
              <View key={label} style={styles.verbRow}>
                <Text style={styles.verbLabel}>{label}</Text>
                <Text style={styles.verbValue}>{value}</Text>
              </View>
            ))}
          </View>
        )}
        <SentenceSection sentences={word.sentences} isNoun={isNoun} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: { paddingHorizontal: 16, paddingVertical: 12 },
  back: { fontSize: 17, color: '#003781' },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  german: { fontSize: 32, fontWeight: '700', color: '#111827', marginTop: 8 },
  english: { fontSize: 20, color: '#374151', marginTop: 4 },
  plural: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  verbTable: { marginTop: 16, padding: 14, backgroundColor: '#F9FAFB', borderRadius: 10 },
  verbRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  verbLabel: { fontSize: 14, color: '#6B7280' },
  verbValue: { fontSize: 14, fontWeight: '600', color: '#111827' },
  error: { textAlign: 'center', marginTop: 80, fontSize: 16, color: '#6B7280' },
});
