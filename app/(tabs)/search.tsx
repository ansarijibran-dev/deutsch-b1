import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSearch } from '../../hooks/useSearch';
import { WordListItem } from '../../components/WordListItem';
import { Word } from '../../data/types';

export default function SearchScreen() {
  const router = useRouter();
  const { query, setQuery, results, clear } = useSearch();

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Search</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Type in German or English…"
          placeholderTextColor="#9CA3AF"
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={clear} style={styles.clearButton}>
            <Text style={styles.clearText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
      {query.length > 0 && results.length === 0 && (
        <Text style={styles.noResults}>No results for "{query}"</Text>
      )}
      <FlatList
        data={results}
        keyExtractor={w => w.id}
        renderItem={({ item }) => <WordListItem word={item} onPress={(w: Word) => router.push(`/word/${w.id}`)} />}
        keyboardShouldPersistTaps="handled"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  title: { fontSize: 28, fontWeight: '700', color: '#111827', paddingHorizontal: 16, paddingTop: 24, paddingBottom: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 8, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 12, backgroundColor: '#F9FAFB' },
  input: { flex: 1, height: 44, fontSize: 16, color: '#111827' },
  clearButton: { padding: 6 },
  clearText: { fontSize: 14, color: '#9CA3AF' },
  noResults: { textAlign: 'center', color: '#9CA3AF', marginTop: 40, fontSize: 15 },
});
