import React, { useState, useCallback, useRef } from 'react';
import {
  TouchableWithoutFeedback, TouchableOpacity, View, Text,
  ScrollView, StyleSheet, Dimensions, Animated,
} from 'react-native';
import { Word, ARTICLE_GENDER, WORD_TYPE_LABELS } from '../data/types';
import { useTheme } from '../hooks/useTheme';

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
  const rotation = useRef(new Animated.Value(0)).current;
  const [flipped, setFlipped] = useState(false);
  const c = useTheme();

  const handleFlip = useCallback(() => {
    const next = !flipped;
    Animated.timing(rotation, { toValue: next ? 180 : 0, duration: 400, useNativeDriver: true }).start();
    setFlipped(next);
    onFlipped?.(next);
  }, [flipped, rotation, onFlipped]);

  const frontRotation = rotation.interpolate({ inputRange: [0, 180], outputRange: ['0deg', '180deg'] });
  const backRotation = rotation.interpolate({ inputRange: [0, 180], outputRange: ['180deg', '360deg'] });

  const frontText = mode === 'de-en'
    ? `${word.article ? word.article + ' ' : ''}${word.german}`
    : word.english;

  const gender = word.article ? ARTICLE_GENDER[word.article] : null;
  const cardBg = gender ? c.genderColors[gender] : c.card;

  const completionPct = total > 0 ? Math.round((score / total) * 100) : 0;

  return (
    <View style={styles.wrapper}>
      {/* Progress and score */}
      <View style={styles.statsRow}>
        <Text style={[styles.counter, { color: c.text3 }]}>{currentIndex + 1} / {total}</Text>
        <Text style={[styles.score, { color: c.accent }]}>{completionPct}% known</Text>
      </View>

      <TouchableWithoutFeedback onPress={handleFlip}>
        <View style={styles.container}>
          {/* FRONT */}
          <Animated.View style={[styles.card, styles.front, { transform: [{ rotateY: frontRotation }], backfaceVisibility: 'hidden' }, { backgroundColor: c.card }]}>
            <Text style={[styles.mainWord, { color: c.text1 }]}>{frontText}</Text>
            <TouchableOpacity style={styles.skipBtn} onPress={onSkip} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={[styles.skipText, { color: c.textMuted }]}>Skip →</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* BACK */}
          <Animated.View style={[styles.card, styles.back, { backgroundColor: cardBg, transform: [{ rotateY: backRotation }], backfaceVisibility: 'hidden' }]}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.backContent}>
              {/* Badge row */}
              <View style={styles.badgeRow}>
                <View style={[styles.badge, { backgroundColor: 'rgba(255,255,255,0.3)' }]}>
                  <Text style={[styles.badgeText, { color: c.text2 }]}>{WORD_TYPE_LABELS[word.wordType]}</Text>
                </View>
                {gender && (
                  <View style={[styles.badge, { backgroundColor: 'rgba(255,255,255,0.3)' }]}>
                    <Text style={[styles.badgeText, { color: c.text2 }]}>{gender}</Text>
                  </View>
                )}
                {word.wordType === 'verb' && word.nounForm && (
                  <View style={[styles.badge, { backgroundColor: 'rgba(255,255,255,0.3)' }]}>
                    <Text style={[styles.badgeText, { color: c.text2 }]}>{word.nounForm}</Text>
                  </View>
                )}
              </View>

              {/* German → English */}
              <Text style={[styles.backGerman, { color: c.text1 }]}>
                {word.article ? `${word.article} ` : ''}{word.german}
              </Text>
              <Text style={[styles.backEnglish, { color: c.text2 }]}>{word.english}</Text>

              {/* Plural */}
              {word.plural && (
                <Text style={[styles.plural, { color: c.pluralText }]}>Plural: {word.plural}</Text>
              )}

              {/* Action buttons */}
              <View style={styles.actions}>
                <TouchableOpacity style={[styles.seeMoreBtn, { backgroundColor: c.primaryBg }]} onPress={onSeeMore}>
                  <Text style={[styles.seeMoreText, { color: c.primaryText }]}>See More</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.reviewToggleBtn,
                    { borderColor: c.accent },
                    isInReview && { backgroundColor: c.accent },
                  ]}
                  onPress={onReviewToggle}
                >
                  <Text style={[styles.reviewToggleText, { color: isInReview ? c.primaryText : c.accent }]}>
                    {isInReview ? '★ In Review' : '☆ Review'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Pass / Fail */}
              <View style={styles.passFailRow}>
                <TouchableOpacity style={[styles.judgeBtn, { backgroundColor: c.failBg }]} onPress={onFail}>
                  <Text style={[styles.judgeBtnText, { color: c.judgeText }]}>✗ Didn't know</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.judgeBtn, { backgroundColor: c.passBg }]} onPress={onPass}>
                  <Text style={[styles.judgeBtnText, { color: c.judgeText }]}>✓ Knew it</Text>
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
  counter: { fontSize: 13 },
  score: { fontSize: 13, fontWeight: '600' },
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
  },
  front: { justifyContent: 'center', alignItems: 'center' },
  back: {},
  mainWord: { fontSize: 30, fontWeight: '700', textAlign: 'center' },
  skipBtn: { position: 'absolute', bottom: 16, right: 16 },
  skipText: { fontSize: 13, fontWeight: '500' },
  backContent: { paddingBottom: 8 },
  badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: { fontSize: 12, fontWeight: '600' },
  backGerman: { fontSize: 24, fontWeight: '700', marginBottom: 4 },
  backEnglish: { fontSize: 16, marginBottom: 4 },
  plural: { fontSize: 13, marginBottom: 12 },
  actions: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  seeMoreBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  seeMoreText: { fontSize: 14, fontWeight: '600' },
  reviewToggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: 'center',
  },
  reviewToggleText: { fontSize: 13, fontWeight: '600' },
  passFailRow: { flexDirection: 'row', gap: 10 },
  judgeBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  judgeBtnText: { fontSize: 14, fontWeight: '600' },
});
