import React, { useState, useCallback } from 'react';
import { TouchableWithoutFeedback, View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, interpolate, Extrapolation,
} from 'react-native-reanimated';
import { Word } from '../data/types';
import { WordBadge } from './WordBadge';
import { SentenceSection } from './SentenceSection';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 48;
const CARD_HEIGHT = 480;
type Mode = 'de-en' | 'en-de';

interface Props {
  word: Word;
  mode: Mode;
  onFlipped?: (flipped: boolean) => void;
}

const ARTICLE_GENDER: Record<string, 'masculine' | 'feminine' | 'neuter'> = {
  der: 'masculine', die: 'feminine', das: 'neuter',
};

export function FlashCard({ word, mode, onFlipped }: Props) {
  const rotation = useSharedValue(0);
  const [flipped, setFlipped] = useState(false);

  const handleFlip = useCallback(() => {
    const next = !flipped;
    rotation.value = withTiming(next ? 180 : 0, { duration: 400 });
    setFlipped(next);
    onFlipped?.(next);
  }, [flipped, rotation, onFlipped]);

  const frontStyle = useAnimatedStyle(() => ({
    transform: [{ rotateY: `${interpolate(rotation.value, [0, 180], [0, 180], Extrapolation.CLAMP)}deg` }],
    backfaceVisibility: 'hidden',
  }));

  const backStyle = useAnimatedStyle(() => ({
    transform: [{ rotateY: `${interpolate(rotation.value, [0, 180], [180, 360], Extrapolation.CLAMP)}deg` }],
    backfaceVisibility: 'hidden',
  }));

  const frontText = mode === 'de-en'
    ? `${word.article ? word.article + ' ' : ''}${word.german}`
    : word.english;

  const gender = word.article ? ARTICLE_GENDER[word.article] : null;
  const isNoun = word.wordType === 'noun';

  return (
    <TouchableWithoutFeedback onPress={handleFlip}>
      <View style={styles.container}>
        <Animated.View style={[styles.card, styles.front, frontStyle]}>
          <WordBadge wordType={word.wordType} gender={gender} />
          <Text style={styles.mainWord}>{frontText}</Text>
          <Text style={styles.hint}>Tap to reveal</Text>
        </Animated.View>

        <Animated.View style={[styles.card, styles.back, backStyle]}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.backContent}>
            <WordBadge wordType={word.wordType} gender={gender} />
            <View style={styles.translationRow}>
              <Text style={styles.backGerman}>{word.article ? word.article + ' ' : ''}{word.german}</Text>
              <Text style={styles.arrow}>→</Text>
              <Text style={styles.backEnglish}>{word.english}</Text>
            </View>
            {isNoun && word.plural && (
              <Text style={styles.plural}>Plural: {word.plural}</Text>
            )}
            {word.verbForms && (
              <View style={styles.verbTable}>
                <Text style={styles.verbTableTitle}>Conjugation</Text>
                <Text style={styles.verbRow}><Text style={styles.verbLabel}>3rd sg: </Text>{word.verbForms.present_3sg}</Text>
                <Text style={styles.verbRow}><Text style={styles.verbLabel}>Simple past: </Text>{word.verbForms.simple_past}</Text>
                <Text style={styles.verbRow}><Text style={styles.verbLabel}>Perfect: </Text>{word.verbForms.perfect}</Text>
              </View>
            )}
            <SentenceSection sentences={word.sentences} isNoun={isNoun} />
          </ScrollView>
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { width: CARD_WIDTH, height: CARD_HEIGHT },
  card: {
    position: 'absolute', width: CARD_WIDTH, height: CARD_HEIGHT,
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
  },
  front: { justifyContent: 'center', alignItems: 'center' },
  back: {},
  mainWord: { fontSize: 32, fontWeight: '700', color: '#111827', textAlign: 'center', marginTop: 16 },
  hint: { fontSize: 13, color: '#D1D5DB', marginTop: 12 },
  backContent: { paddingBottom: 20 },
  translationRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: 12, gap: 6 },
  backGerman: { fontSize: 22, fontWeight: '700', color: '#111827' },
  arrow: { fontSize: 16, color: '#9CA3AF' },
  backEnglish: { fontSize: 18, color: '#374151' },
  plural: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  verbTable: { marginTop: 12, padding: 12, backgroundColor: '#F9FAFB', borderRadius: 8 },
  verbTableTitle: { fontSize: 11, fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  verbRow: { fontSize: 14, color: '#374151', marginBottom: 2 },
  verbLabel: { fontWeight: '600' },
});
