import React, { useState, useCallback } from 'react';
import {
  TouchableWithoutFeedback, TouchableOpacity, View, Text, ScrollView, StyleSheet, Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, interpolate, Extrapolation,
} from 'react-native-reanimated';
import { Word } from '../data/types';
import { WordBadge } from './WordBadge';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 48;
const CARD_HEIGHT = 500;
type Mode = 'de-en' | 'en-de';

interface Props {
  word: Word;
  mode: Mode;
  currentIndex: number;
  total: number;
  score: number;
  onSkip: () => void;
  onPass: () => void;
  onFail: () => void;
  onSeeMore: () => void;
  onReviewToggle: () => void;
  isInReview: boolean;
}

const ARTICLE_GENDER: Record<string, 'masculine' | 'feminine' | 'neuter'> = {
  der: 'masculine', die: 'feminine', das: 'neuter',
};

export function FlashCard({
  word, mode, currentIndex, total, score,
  onSkip, onPass, onFail, onSeeMore, onReviewToggle, isInReview,
}: Props) {
  const rotation = useSharedValue(0);
  const [flipped, setFlipped] = useState(false);

  const handleFlip = useCallback(() => {
    const next = !flipped;
    rotation.value = withTiming(next ? 180 : 0, { duration: 400 });
    setFlipped(next);
  }, [flipped, rotation]);

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
    <View style={styles.wrapper}>
      {/* Counter row */}
      <View style={styles.counterRow}>
        <Text style={styles.counter}>{currentIndex + 1} / {total}</Text>
        <Text style={styles.scoreLabel}>✓ {score}</Text>
        <TouchableOpacity onPress={onReviewToggle} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={[styles.starBtn, isInReview && styles.starActive]}>
            {isInReview ? '★' : '☆'}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableWithoutFeedback onPress={handleFlip}>
        <View style={styles.container}>
          {/* Front face */}
          <Animated.View style={[styles.card, styles.front, frontStyle]}>
            <WordBadge wordType={word.wordType} gender={gender} />
            <Text style={styles.mainWord}>{frontText}</Text>
            <Text style={styles.hint}>Tap to reveal</Text>
          </Animated.View>

          {/* Back face */}
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
              {word.sentences && (
                <View style={styles.sentences}>
                  {Object.values(word.sentences).filter(Boolean).map((s, i) => (
                    <View key={i} style={styles.sentenceRow}>
                      <Text style={styles.sentenceDe}>{s.de}</Text>
                      <Text style={styles.sentenceEn}>{s.en}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Action buttons — rendered on back face */}
              <View style={styles.actions}>
                <TouchableOpacity style={[styles.actionBtn, styles.failBtn]} onPress={onFail}>
                  <Text style={styles.actionBtnText}>✗ Didn't know</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, styles.passBtn]} onPress={onPass}>
                  <Text style={styles.actionBtnText}>✓ Knew it</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.secondaryActions}>
                <TouchableOpacity onPress={onSkip}>
                  <Text style={styles.skipText}>Skip</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={onSeeMore}>
                  <Text style={styles.seeMoreText}>See full details →</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center' },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
    width: CARD_WIDTH,
  },
  counter: { fontSize: 13, color: '#6B7280', flex: 1 },
  scoreLabel: { fontSize: 13, color: '#059669', fontWeight: '600' },
  starBtn: { fontSize: 22, color: '#9CA3AF' },
  starActive: { color: '#F59E0B' },
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
  sentences: { marginTop: 12 },
  sentenceRow: { marginBottom: 6 },
  sentenceDe: { fontSize: 13, color: '#374151', fontStyle: 'italic' },
  sentenceEn: { fontSize: 12, color: '#9CA3AF' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  actionBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  failBtn: { backgroundColor: '#FEE2E2' },
  passBtn: { backgroundColor: '#DCFCE7' },
  actionBtnText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  secondaryActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  skipText: { fontSize: 13, color: '#9CA3AF' },
  seeMoreText: { fontSize: 13, color: '#003781', fontWeight: '500' },
});
