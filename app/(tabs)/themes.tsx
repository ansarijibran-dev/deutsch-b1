import { FlatList, View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemeCard } from '../../components/ThemeCard';
import { getAllThemes, getWordCountByTheme } from '../../data/loader';
import { Theme } from '../../data/types';

export default function ThemesScreen() {
  const router = useRouter();
  const themes = getAllThemes();
  const counts = getWordCountByTheme();

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Themes</Text>
      <FlatList
        data={themes}
        keyExtractor={t => t}
        numColumns={2}
        contentContainerStyle={styles.grid}
        renderItem={({ item }) => (
          <ThemeCard theme={item} wordCount={counts[item] ?? 0} onPress={(t: Theme) => router.push(`/study/theme:${t}`)} />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  title: { fontSize: 28, fontWeight: '700', color: '#111827', paddingHorizontal: 16, paddingTop: 24, paddingBottom: 8 },
  grid: { paddingHorizontal: 10, paddingBottom: 20 },
});
