import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useProgress } from '../../hooks/useProgress';
import { getAllWords } from '../../data/loader';

const TOTAL = getAllWords().length;

export default function HomeScreen() {
  const router = useRouter();
  const { totalStudied, unknownIds } = useProgress();
  const hasWeakWords = unknownIds.length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Deutsch B1</Text>
      <Text style={styles.subtitle}>Goethe-Zertifikat Vocabulary</Text>
      <View style={styles.progressCard}>
        <Text style={styles.progressNumber}>{totalStudied}</Text>
        <Text style={styles.progressLabel}>of {TOTAL} words studied</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { flex: TOTAL > 0 ? totalStudied / TOTAL : 0 }]} />
          <View style={{ flex: TOTAL > 0 ? (TOTAL - totalStudied) / TOTAL : 1 }} />
        </View>
      </View>
      <View style={styles.buttons}>
        <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/study/all')}>
          <Text style={styles.primaryButtonText}>Study All Words</Text>
        </TouchableOpacity>
        {hasWeakWords && (
          <TouchableOpacity style={styles.weakButton} onPress={() => router.push('/study/weak')}>
            <Text style={styles.weakButtonText}>Study Weak Words ({unknownIds.length})</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF', paddingHorizontal: 20 },
  title: { fontSize: 34, fontWeight: '700', color: '#111827', marginTop: 32 },
  subtitle: { fontSize: 15, color: '#6B7280', marginTop: 4, marginBottom: 24 },
  progressCard: { backgroundColor: '#F9FAFB', borderRadius: 14, padding: 20, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 24 },
  progressNumber: { fontSize: 48, fontWeight: '700', color: '#003781' },
  progressLabel: { fontSize: 14, color: '#6B7280', marginTop: 2, marginBottom: 12 },
  progressBar: { height: 6, flexDirection: 'row', backgroundColor: '#E5E7EB', borderRadius: 3, overflow: 'hidden' },
  progressFill: { backgroundColor: '#003781', borderRadius: 3 },
  buttons: { gap: 12 },
  primaryButton: { backgroundColor: '#003781', padding: 16, borderRadius: 12, alignItems: 'center' },
  primaryButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  weakButton: { backgroundColor: '#FEF9C3', padding: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#FDE68A' },
  weakButtonText: { color: '#92400E', fontSize: 15, fontWeight: '600' },
});
