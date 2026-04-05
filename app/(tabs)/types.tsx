import { FlatList, TouchableOpacity, View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { getWordCountByType } from '../../data/loader';
import { WordType, WORD_TYPE_LABELS, WORD_TYPE_COLORS } from '../../data/types';

const ALL_TYPES: WordType[] = ['noun', 'verb', 'adjective', 'adverb', 'preposition', 'conjunction', 'other'];

export default function TypesScreen() {
  const router = useRouter();
  const counts = getWordCountByType();

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Word Types</Text>
      <FlatList
        data={ALL_TYPES}
        keyExtractor={t => t}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.row, { backgroundColor: WORD_TYPE_COLORS[item] }]}
            onPress={() => router.push(`/study/type:${item}`)}
            activeOpacity={0.7}
          >
            <View>
              <Text style={styles.typeLabel}>{WORD_TYPE_LABELS[item]}</Text>
              <Text style={styles.count}>{counts[item] ?? 0} words</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  title: { fontSize: 28, fontWeight: '700', color: '#111827', paddingHorizontal: 16, paddingTop: 24, paddingBottom: 8 },
  list: { paddingHorizontal: 16, paddingBottom: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 12, marginBottom: 10 },
  typeLabel: { fontSize: 17, fontWeight: '600', color: '#111827' },
  count: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  arrow: { fontSize: 22, color: '#9CA3AF' },
});
