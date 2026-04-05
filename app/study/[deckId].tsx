import { View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
export default function StudyScreen() {
  const { deckId } = useLocalSearchParams<{ deckId: string }>();
  return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Study: {deckId}</Text></View>;
}
