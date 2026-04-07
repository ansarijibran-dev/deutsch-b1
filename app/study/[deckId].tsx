import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  PanResponder, Animated as RNAnimated, Dimensions, SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FlashCard } from '../../components/FlashCard';
import { useStudySession } from '../../hooks/useStudySession';
import { useProgress } from '../../hooks/useProgress';
import { getAllWords, getWordsByTheme, getWordsByType, getWeakWords } from '../../data/loader';
import { Theme, WordType } from '../../data/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = 100;

function resolveDeckIds(deckId: string, unknownIds: string[]): string[] {
  if (deckId === 'all') return getAllWords().map(w => w.id);
  if (deckId === 'weak') return unknownIds;
  if (deckId.startsWith('theme:')) return getWordsByTheme(deckId.slice(6) as Theme).map(w => w.id);
  if (deckId.startsWith('type:')) return getWordsByType(deckId.slice(5) as WordType).map(w => w.id);
  return [];
}

export default function StudyScreen() {
  const { deckId } = useLocalSearchParams<{ deckId: string }>();
  const router = useRouter();
  const { unknownIds, markKnown, markUnknown, getDeckPosition, saveDeckPosition } = useProgress();

  const wordIds = resolveDeckIds(deckId, unknownIds);
  const startIndex = getDeckPosition(deckId);
  const { currentWord, currentIndex, isFinished, score, total, progressFraction, advance } =
    useStudySession(wordIds, startIndex);

  const [mode, setMode] = useState<'de-en' | 'en-de'>('de-en');
  const [cardFlipped, setCardFlipped] = useState(false);
  const translateX = useRef(new RNAnimated.Value(0)).current;

  const handleSwipe = useCallback(async (knew: boolean) => {
    if (!currentWord) return;
    RNAnimated.timing(translateX, {
      toValue: knew ? SCREEN_WIDTH : -SCREEN_WIDTH,
      duration: 250, useNativeDriver: true,
    }).start(async () => {
      translateX.setValue(0);
      setCardFlipped(false);
      if (knew) await markKnown(currentWord.id);
      else await markUnknown(currentWord.id);
      await saveDeckPosition(deckId, currentIndex + 1);
      advance(knew);
    });
  }, [currentWord, currentIndex, deckId, translateX, markKnown, markUnknown, saveDeckPosition, advance]);

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
      <SafeAreaView style={styles.container}>
        <View style={styles.summary}>
          <Text style={styles.summaryEmoji}>🎉</Text>
          <Text style={styles.summaryTitle}>Session Complete!</Text>
          <Text style={styles.summaryScore}>{score} / {total} known</Text>
          <TouchableOpacity style={styles.doneButton} onPress={() => router.back()}>
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.counter}>{currentIndex + 1} / {total}</Text>
        <TouchableOpacity style={styles.modeToggle} onPress={() => setMode(m => m === 'de-en' ? 'en-de' : 'de-en')}>
          <Text style={styles.modeText}>{mode === 'de-en' ? 'DE → EN' : 'EN → DE'}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progressFraction * 100}%` as any }]} />
      </View>
      <View style={styles.cardArea}>
        <RNAnimated.View style={{ transform: [{ translateX }] }} {...panResponder.panHandlers}>
          {currentWord && <FlashCard word={currentWord} mode={mode} onFlipped={setCardFlipped} />}
        </RNAnimated.View>
      </View>
      {cardFlipped ? (
        <View style={styles.actions}>
          <TouchableOpacity style={[styles.actionButton, styles.unknownButton]} onPress={() => handleSwipe(false)}>
            <Text style={styles.actionText}>✗ Didn't know</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.knownButton]} onPress={() => handleSwipe(true)}>
            <Text style={styles.actionText}>✓ Knew it</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Text style={styles.swipeHint}>Tap card to reveal • Swipe to judge</Text>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  back: { fontSize: 17, color: '#003781' },
  counter: { fontSize: 14, color: '#6B7280' },
  modeToggle: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#EFF6FF', borderRadius: 8 },
  modeText: { fontSize: 12, fontWeight: '600', color: '#003781' },
  cardArea: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  actions: { flexDirection: 'row', gap: 12, paddingHorizontal: 24, paddingBottom: 32 },
  actionButton: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  unknownButton: { backgroundColor: '#FEE2E2' },
  knownButton: { backgroundColor: '#DCFCE7' },
  actionText: { fontSize: 15, fontWeight: '600', color: '#374151' },
  progressTrack: { height: 4, backgroundColor: '#E5E7EB', marginHorizontal: 16 },
  progressFill: { height: 4, backgroundColor: '#003781', borderRadius: 2 },
  swipeHint: { textAlign: 'center', color: '#D1D5DB', fontSize: 13, paddingBottom: 32 },
  summary: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  summaryEmoji: { fontSize: 56 },
  summaryTitle: { fontSize: 28, fontWeight: '700', color: '#111827' },
  summaryScore: { fontSize: 20, color: '#6B7280' },
  doneButton: { marginTop: 24, backgroundColor: '#003781', paddingHorizontal: 40, paddingVertical: 14, borderRadius: 12 },
  doneButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});
