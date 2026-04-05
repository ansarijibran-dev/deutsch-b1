import { View, StyleSheet } from 'react-native';

interface Props { fraction: number; }

export function ProgressBar({ fraction }: Props) {
  const clamped = Math.max(0, Math.min(1, fraction));
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { flex: clamped }]} />
      <View style={{ flex: 1 - clamped }} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 4, flexDirection: 'row', backgroundColor: '#E5E7EB', borderRadius: 2, overflow: 'hidden' },
  fill: { backgroundColor: '#003781', borderRadius: 2 },
});
