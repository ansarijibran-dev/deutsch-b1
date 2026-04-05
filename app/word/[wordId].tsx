import { View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
export default function WordDetailScreen() {
  const { wordId } = useLocalSearchParams<{ wordId: string }>();
  return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Word: {wordId}</Text></View>;
}
