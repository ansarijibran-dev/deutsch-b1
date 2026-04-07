import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  View, StyleSheet, PanResponder, Animated as RNAnimated, Dimensions, SafeAreaView, Text, TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FlashCard } from '../../components/FlashCard';
import { useStudySession } from '../../hooks/useStudySession';
import { useProgress } from '../../hooks/useProgress';
import { useTheme } from '../../hooks/useTheme';
import { getAllWords, getWordsByTheme, getWordsByType } from '../../data/loader';
import { Theme, WordType } from '../../data/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = 100;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function resolveDeckIds(deckId: string, reviewIds: string[]): string[] {
  if (deckId === 'random') return shuffle(getAllWords().map(w => w.id));
  if (deckId === 'review') return reviewIds;
  if (deckId.startsWith('theme:')) return getWordsByTheme(deckId.slice(6) as Theme).map(w => w.id);
  if (deckId.startsWith('type:')) return getWordsByType(deckId.slice(5) as WordType).map(w => w.id);
  return [];
}

export default function StudyScreen() {
  const { deckId } = useLocalSearchParams<{ deckId: string }>();
  const router = useRouter();
  const c = useTheme();
  const {
    reviewIds, markKnown, markUnknown, saveDeckPosition, getDeckPosition,
    isInReview, addToReview, removeFromReview, languageMode,
  } = useProgress();

  const wordIds = useMemo(() => resolveDeckIds(deckId, reviewIds), [deckId, reviewIds]);
  const startIndex = deckId === 'random' ? 0 : getDeckPosition(deckId);

  const { currentWord, currentIndex, isFinished, score, total, progressFraction, advance } =
    useStudySession(wordIds, startIndex);

  const translateX = useRef(new RNAnimated.Value(0)).current;

  const handleSwipe = useCallback(async (knew: boolean) => {
    if (!currentWord) return;
    RNAnimated.timing(translateX, {
      toValue: knew ? SCREEN_WIDTH : -SCREEN_WIDTH,
      duration: 250,
      useNativeDriver: true,
    }).start(async () => {
      translateX.setValue(0);
      if (knew) await markKnown(currentWord.id);
      else await markUnknown(currentWord.id);
      if (deckId !== 'random') await saveDeckPosition(deckId, currentIndex + 1);
      advance(knew);
    });
  }, [currentWord, currentIndex, deckId, translateX, markKnown, markUnknown, saveDeckPosition, advance]);

  const handleSkip = useCallback(() => {
    if (!currentWord) return;
    advance(false);
  }, [currentWord, advance]);

  const panResponder = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 10,
    onPanResponderMove: (_, g) => translateX.setValue(g.dx),
    onPanResponderRelease: (_, g) => {
      if (g.dx > SWIPE_THRESHOLD) handleSwipe(true);
      else if (g.dx < -SWIPE_THRESHOLD) handleSwipe(false);
      else RNAnimated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
    },
  })).current;

  if (isFinished || wordIds.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.screen }]}>
        <View style={styles.summary}>
          <Text style={styles.summaryEmoji}>🎉</Text>
          <Text style={[styles.summaryTitle, { color: c.text1 }]}>Session Complete!</Text>
          <Text style={[styles.summaryScore, { color: c.text3 }]}>{score} / {total} known</Text>
          <TouchableOpacity style={[styles.doneButton, { backgroundColor: c.primaryBg }]} onPress={() => router.replace('/')}>
            <Text style={[styles.doneButtonText, { color: c.primaryText }]}>Done</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.screen }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/')}>
          <Text style={[styles.back, { color: c.accent }]}>‹ Back</Text>
        </TouchableOpacity>
        <View style={[styles.progressBarTrack, { backgroundColor: c.progressTrack }]}>
          <View style={[styles.progressBarFill, { flex: progressFraction, backgroundColor: c.progressFill }]} />
          <View style={{ flex: 1 - progressFraction }} />
        </View>
      </View>

      <View style={styles.cardArea}>
        <RNAnimated.View style={{ transform: [{ translateX }] }} {...panResponder.panHandlers}>
          {currentWord && (
            <FlashCard
              word={currentWord}
              mode={languageMode}
              currentIndex={currentIndex}
              total={total}
              score={score}
              onSkip={handleSkip}
              onPass={() => handleSwipe(true)}
              onFail={() => handleSwipe(false)}
              onSeeMore={() => router.push(`/details/${currentWord.id}`)}
              onReviewToggle={async () => {
                if (isInReview(currentWord.id)) await removeFromReview(currentWord.id);
                else await addToReview(currentWord.id);
              }}
              isInReview={isInReview(currentWord.id)}
            />
          )}
        </RNAnimated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  back: { fontSize: 17 },
  progressBarTrack: {
    flex: 1,
    height: 6,
    flexDirection: 'row',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: { borderRadius: 3 },
  cardArea: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  summary: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  summaryEmoji: { fontSize: 56 },
  summaryTitle: { fontSize: 28, fontWeight: '700' },
  summaryScore: { fontSize: 20 },
  doneButton: {
    marginTop: 24,
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 12,
  },
  doneButtonText: { fontSize: 16, fontWeight: '600' },
});
