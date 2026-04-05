import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Theme, THEME_LABELS } from '../data/types';

const THEME_ICONS: Record<Theme, string> = {
  daily_life: '🏠', work: '💼', travel: '✈️', health: '🏥',
  food: '🛒', education: '🎓', technology: '💻', society: '🏛️',
  environment: '🌿', relationships: '👥', culture: '🎭',
  time_numbers: '🕐', language_exam: '📝', other: '📖',
};

interface Props {
  theme: Theme;
  wordCount: number;
  onPress: (theme: Theme) => void;
}

export function ThemeCard({ theme, wordCount, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(theme)} activeOpacity={0.7}>
      <Text style={styles.icon}>{THEME_ICONS[theme]}</Text>
      <Text style={styles.label}>{THEME_LABELS[theme]}</Text>
      <Text style={styles.count}>{wordCount} words</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, margin: 6, padding: 14, backgroundColor: '#F9FAFB', borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  icon: { fontSize: 28, marginBottom: 6 },
  label: { fontSize: 13, fontWeight: '600', color: '#111827', textAlign: 'center' },
  count: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
});
