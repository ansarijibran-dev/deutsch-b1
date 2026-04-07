import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getWordById } from '../../data/loader';
import { useProgress } from '../../hooks/useProgress';
import { TenseTable } from '../../components/TenseTable';
import {
  ARTICLE_GENDER, GENDER_COLORS, WORD_TYPE_LABELS, TENSE_LABELS, TenseForms,
} from '../../data/types';

export default function DetailsScreen() {
  const { wordId } = useLocalSearchParams<{ wordId: string }>();
  const router = useRouter();
  const word = getWordById(wordId);
  const { isInReview, addToReview, removeFromReview } = useProgress();

  if (!word) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{ padding: 20 }}>Word not found.</Text>
      </SafeAreaView>
    );
  }

  const gender = word.article ? ARTICLE_GENDER[word.article] : null;
  const cardBg = gender ? GENDER_COLORS[gender] : '#FFFFFF';
  const inReview = isInReview(word.id);

  const handleReviewToggle = async () => {
    if (inReview) await removeFromReview(word.id);
    else await addToReview(word.id);
  };

  const tenseKeys = word.tenses
    ? (Object.keys(word.tenses) as (keyof TenseForms)[])
    : [];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: cardBg }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹ Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.reviewBtn, inReview && styles.reviewBtnActive]} onPress={handleReviewToggle}>
          <Text style={[styles.reviewBtnText, inReview && styles.reviewBtnTextActive]}>
            {inReview ? '★ In Review' : '☆ Add to Review'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Word badge */}
        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{WORD_TYPE_LABELS[word.wordType]}</Text>
          </View>
          {gender && (
            <View style={[styles.badge, styles.genderBadge]}>
              <Text style={styles.badgeText}>{gender}</Text>
            </View>
          )}
        </View>

        {/* Main word */}
        <Text style={styles.german}>
          {word.article ? `${word.article} ` : ''}{word.german}
        </Text>
        <Text style={styles.english}>{word.english}</Text>

        {/* Plural */}
        {word.plural && (
          <Text style={styles.plural}>Plural: {word.plural}</Text>
        )}

        {/* Sentences */}
        <Text style={styles.sectionHeading}>Example Sentences</Text>
        {word.wordType === 'noun' ? (
          <>
            {word.sentences.nominative && (
              <SentenceRow label="Nominative" pair={word.sentences.nominative} />
            )}
            {word.sentences.accusative && (
              <SentenceRow label="Accusative" pair={word.sentences.accusative} />
            )}
            {word.sentences.dative && (
              <SentenceRow label="Dative" pair={word.sentences.dative} />
            )}
          </>
        ) : (
          <>
            <SentenceRow label="Present" pair={word.sentences.present} />
            {word.sentences.past && <SentenceRow label="Past" pair={word.sentences.past} />}
            {word.sentences.future && <SentenceRow label="Future" pair={word.sentences.future} />}
          </>
        )}

        {/* Tense tables (verbs only) */}
        {word.tenses && (
          <>
            <Text style={styles.sectionHeading}>Conjugation Tables</Text>
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

function SentenceRow({ label, pair }: { label: string; pair: { de: string; en: string } }) {
  return (
    <View style={styles.sentenceRow}>
      <Text style={styles.sentenceLabel}>{label}</Text>
      <Text style={styles.sentenceDe}>{pair.de}</Text>
      <Text style={styles.sentenceEn}>{pair.en}</Text>
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
  back: { fontSize: 17, color: '#003781' },
  reviewBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#003781',
  },
  reviewBtnActive: { backgroundColor: '#003781' },
  reviewBtnText: { fontSize: 13, fontWeight: '600', color: '#003781' },
  reviewBtnTextActive: { color: '#FFF' },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
  },
  genderBadge: { backgroundColor: '#D1FAE5' },
  badgeText: { fontSize: 12, fontWeight: '600', color: '#374151' },
  german: { fontSize: 30, fontWeight: '700', color: '#111827', marginBottom: 4 },
  english: { fontSize: 18, color: '#374151', marginBottom: 4 },
  plural: { fontSize: 14, color: '#6B7280', marginBottom: 16 },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 20,
    marginBottom: 10,
  },
  sentenceRow: { marginBottom: 14 },
  sentenceLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  sentenceDe: { fontSize: 14, color: '#111827' },
  sentenceEn: { fontSize: 13, color: '#6B7280', fontStyle: 'italic', marginTop: 2 },
});
