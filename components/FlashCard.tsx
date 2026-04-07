import React, { useState, useCallback } from 'react';
import {
  TouchableWithoutFeedback, TouchableOpacity, View, Text, Image,
  ScrollView, StyleSheet, Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, interpolate, Extrapolation,
} from 'react-native-reanimated';
import { Word, ARTICLE_GENDER, GENDER_COLORS, WORD_TYPE_LABELS } from '../data/types';
import imageMap from '../assets/data/imageMap';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 48;
const CARD_HEIGHT = 480;

interface Props {
  word: Word;
  mode: 'de-en' | 'en-de';
  onFlipped?: (flipped: boolean) => void;
  onSeeMore?: () => void;
  onSkip?: () => void;
  onPass?: () => void;
  onFail?: () => void;
  onReviewToggle?: () => void;
  isInReview?: boolean;
  currentIndex: number;
  total: number;
  score: number;
}

export function FlashCard({
  word, mode, onFlipped, onSeeMore, onSkip,
  onPass, onFail, onReviewToggle, isInReview,
  currentIndex, total, score,
}: Props) {
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
  const cardBg = gender ? GENDER_COLORS[gender] : '#FFFFFF';
  const nounImage = word.wordType === 'noun' && word.image ? imageMap[word.id] : null;

  const completionPct = total > 0 ? Math.round((score / total) * 100) : 0;

  return (
    <View style={styles.wrapper}>
      {/* Progress and score */}
      <View style={styles.statsRow}>
        <Text style={styles.counter}>{currentIndex + 1} / {total}</Text>
        <Text style={styles.score}>{completionPct}% known</Text>
      </View>

      <TouchableWithoutFeedback onPress={handleFlip}>
        <View style={styles.container}>
          {/* FRONT */}
          <Animated.View style={[styles.card, styles.front, frontStyle]}>
            {nounImage && (
              <Image source={nounImage} style={styles.nounImage} resizeMode="contain" />
            )}
            <Text style={styles.mainWord}>{frontText}</Text>
            <Text style={styles.hint}>Tap to reveal</Text>
            <TouchableOpacity style={styles.skipBtn} onPress={onSkip} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.skipText}>Skip →</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* BACK */}
          <Animated.View style={[styles.card, styles.back, { backgroundColor: cardBg }, backStyle]}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.backContent}>
              {/* Badge row */}
              <View style={styles.badgeRow}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{WORD_TYPE_LABELS[word.wordType]}</Text>
                </View>
                {gender && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{gender}</Text>
                  </View>
                )}
              </View>

              {/* German → English */}
              <Text style={styles.backGerman}>
                {word.article ? `${word.article} ` : ''}{word.german}
              </Text>
              <Text style={styles.backEnglish}>{word.english}</Text>

              {/* Plural */}
              {word.plural && (
                <Text style={styles.plural}>Plural: {word.plural}</Text>
              )}

              {/* Action buttons */}
              <View style={styles.actions}>
                <TouchableOpacity style={styles.seeMoreBtn} onPress={onSeeMore}>
                  <Text style={styles.seeMoreText}>See More</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.reviewToggleBtn, isInReview && styles.reviewToggleBtnActive]}
                  onPress={onReviewToggle}
                >
                  <Text style={[styles.reviewToggleText, isInReview && styles.reviewToggleTextActive]}>
                    {isInReview ? '★ In Review' : '☆ Review'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Pass / Fail */}
              <View style={styles.passFailRow}>
                <TouchableOpacity style={[styles.judgeBtn, styles.failBtn]} onPress={onFail}>
                  <Text style={styles.judgeBtnText}>✗ Didn't know</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.judgeBtn, styles.passBtn]} onPress={onPass}>
                  <Text style={styles.judgeBtnText}>✓ Knew it</Text>
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
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: CARD_WIDTH,
    marginBottom: 8,
  },
  counter: { fontSize: 13, color: '#6B7280' },
  score: { fontSize: 13, color: '#003781', fontWeight: '600' },
  container: { width: CARD_WIDTH, height: CARD_HEIGHT },
  card: {
    position: 'absolute',
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    backgroundColor: '#FFFFFF',
  },
  front: { justifyContent: 'center', alignItems: 'center' },
  back: {},
  nounImage: { width: 120, height: 100, marginBottom: 12, borderRadius: 8 },
  mainWord: { fontSize: 30, fontWeight: '700', color: '#111827', textAlign: 'center' },
  hint: { fontSize: 12, color: '#D1D5DB', marginTop: 10 },
  skipBtn: { position: 'absolute', bottom: 16, right: 16 },
  skipText: { fontSize: 13, color: '#9CA3AF', fontWeight: '500' },
  backContent: { paddingBottom: 8 },
  badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 6,
  },
  badgeText: { fontSize: 12, fontWeight: '600', color: '#374151' },
  backGerman: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 4 },
  backEnglish: { fontSize: 16, color: '#374151', marginBottom: 4 },
  plural: { fontSize: 13, color: '#6B7280', marginBottom: 12 },
  actions: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  seeMoreBtn: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#003781',
    borderRadius: 10,
    alignItems: 'center',
  },
  seeMoreText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  reviewToggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#003781',
    borderRadius: 10,
    alignItems: 'center',
  },
  reviewToggleBtnActive: { backgroundColor: '#003781' },
  reviewToggleText: { color: '#003781', fontSize: 13, fontWeight: '600' },
  reviewToggleTextActive: { color: '#FFF' },
  passFailRow: { flexDirection: 'row', gap: 10 },
  judgeBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  failBtn: { backgroundColor: '#FEE2E2' },
  passBtn: { backgroundColor: '#DCFCE7' },
  judgeBtnText: { fontSize: 14, fontWeight: '600', color: '#374151' },
});
