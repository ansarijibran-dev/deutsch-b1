import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getWordById } from '../../data/loader';
import { useProgress } from '../../hooks/useProgress';
import { useTheme } from '../../hooks/useTheme';
import { TenseTable } from '../../components/TenseTable';
import {
  ARTICLE_GENDER, WORD_TYPE_LABELS, TENSE_LABELS, TenseForms,
} from '../../data/types';

export default function DetailsScreen() {
  const { wordId } = useLocalSearchParams<{ wordId: string }>();
  const router = useRouter();
  const word = getWordById(wordId);
  const { isInReview, addToReview, removeFromReview } = useProgress();
  const c = useTheme();

  if (!word) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.screen }]}>
        <Text style={[{ padding: 20 }, { color: c.text2 }]}>Word not found.</Text>
      </SafeAreaView>
    );
  }

  const gender = word.article ? ARTICLE_GENDER[word.article] : null;
  const screenBg = gender ? c.genderColors[gender] : c.screen;
  const inReview = isInReview(word.id);

  const handleReviewToggle = async () => {
    if (inReview) await removeFromReview(word.id);
    else await addToReview(word.id);
  };

  const tenseKeys = word.tenses
    ? (Object.keys(word.tenses) as (keyof TenseForms)[])
    : [];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: screenBg }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.back, { color: c.accent }]}>‹ Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.reviewBtn, { borderColor: c.accent }, inReview && { backgroundColor: c.accent }]}
          onPress={handleReviewToggle}
        >
          <Text style={[styles.reviewBtnText, { color: inReview ? c.primaryText : c.accent }]}>
            {inReview ? '★ In Review' : '☆ Add to Review'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Word badge */}
        <View style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: c.card }]}>
            <Text style={[styles.badgeText, { color: c.text2 }]}>{WORD_TYPE_LABELS[word.wordType]}</Text>
          </View>
          {gender && (
            <View style={[styles.badge, { backgroundColor: c.card }]}>
              <Text style={[styles.badgeText, { color: c.text2 }]}>{gender}</Text>
            </View>
          )}
          {word.wordType === 'verb' && word.nounForm && (
            <View style={[styles.badge, { backgroundColor: c.card }]}>
              <Text style={[styles.badgeText, { color: c.text2 }]}>{word.nounForm}</Text>
            </View>
          )}
        </View>

        {/* Main word */}
        <Text style={[styles.german, { color: c.text1 }]}>
          {word.article ? `${word.article} ` : ''}{word.german}
        </Text>
        <Text style={[styles.english, { color: c.text2 }]}>{word.english}</Text>

        {/* Plural */}
        {word.plural && (
          <Text style={[styles.plural, { color: c.text3 }]}>Plural: {word.plural}</Text>
        )}

        {/* Sentences */}
        <Text style={[styles.sectionHeading, { color: c.text2 }]}>Example Sentences</Text>
        {word.wordType === 'noun' ? (
          <>
            {word.sentences.nominative && (
              <SentenceRow label="Nominative" pair={word.sentences.nominative} c={c} />
            )}
            {word.sentences.accusative && (
              <SentenceRow label="Accusative" pair={word.sentences.accusative} c={c} />
            )}
            {word.sentences.dative && (
              <SentenceRow label="Dative" pair={word.sentences.dative} c={c} />
            )}
          </>
        ) : (
          <>
            <SentenceRow label="Present" pair={word.sentences.present} c={c} />
            {word.sentences.past && <SentenceRow label="Past" pair={word.sentences.past} c={c} />}
            {word.sentences.future && <SentenceRow label="Future" pair={word.sentences.future} c={c} />}
          </>
        )}

        {/* Tense tables (verbs only) */}
        {word.tenses && (
          <>
            <Text style={[styles.sectionHeading, { color: c.text2 }]}>Conjugation Tables</Text>
            {tenseKeys.map(tenseKey => (
              <TenseTable
                key={tenseKey}
                label={TENSE_LABELS[tenseKey]}
                conjugation={word.tenses![tenseKey]}
              />
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function SentenceRow({
  label, pair, c,
}: { label: string; pair: { de: string; en: string }; c: ReturnType<typeof useTheme> }) {
  return (
    <View style={styles.sentenceRow}>
      <Text style={[styles.sentenceLabel, { color: c.textMuted }]}>{label}</Text>
      <Text style={[styles.sentenceDe, { color: c.text1 }]}>{pair.de}</Text>
      <Text style={[styles.sentenceEn, { color: c.text3 }]}>{pair.en}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  back: { fontSize: 17 },
  reviewBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  reviewBtnText: { fontSize: 13, fontWeight: '600' },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: { fontSize: 12, fontWeight: '600' },
  german: { fontSize: 30, fontWeight: '700', marginBottom: 4 },
  english: { fontSize: 18, marginBottom: 4 },
  plural: { fontSize: 14, marginBottom: 16 },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 20,
    marginBottom: 10,
  },
  sentenceRow: { marginBottom: 14 },
  sentenceLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  sentenceDe: { fontSize: 14 },
  sentenceEn: { fontSize: 13, fontStyle: 'italic', marginTop: 2 },
});
