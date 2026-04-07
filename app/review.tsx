import React from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useProgress } from '../hooks/useProgress';
import { getReviewWords } from '../data/loader';
import { WORD_TYPE_LABELS, ARTICLE_GENDER, GENDER_COLORS } from '../data/types';

export default function ReviewScreen() {
  const router = useRouter();
  const { reviewIds, removeFromReview } = useProgress();
  const words = getReviewWords(reviewIds);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>For Review ({words.length})</Text>
        <View style={{ width: 50 }} />
      </View>

      {words.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No words in review list yet.</Text>
          <Text style={styles.emptySubtext}>Tap ☆ on any flashcard to add it here.</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={words}
            keyExtractor={w => w.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => {
              const gender = item.article ? ARTICLE_GENDER[item.article] : null;
              const bg = gender ? GENDER_COLORS[gender] : '#F9FAFB';
              return (
                <TouchableOpacity
                  style={[styles.wordRow, { backgroundColor: bg }]}
                  onPress={() => router.push(`/details/${item.id}`)}
                >
                  <View style={styles.wordInfo}>
                    <Text style={styles.german}>
                      {item.article ? `${item.article} ` : ''}{item.german}
                    </Text>
                    <Text style={styles.english}>{item.english}</Text>
                  </View>
                  <View style={styles.rowRight}>
                    <View style={styles.typeBadge}>
                      <Text style={styles.typeBadgeText}>{WORD_TYPE_LABELS[item.wordType]}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => removeFromReview(item.id)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Text style={styles.removeBtn}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.studyBtn}
              onPress={() => router.push('/study/review')}
            >
              <Text style={styles.studyBtnText}>Study Review Words ({words.length})</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  back: { fontSize: 17, color: '#003781', width: 50 },
  title: { fontSize: 17, fontWeight: '700', color: '#111827' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  emptyText: { fontSize: 17, color: '#374151', fontWeight: '600' },
  emptySubtext: { fontSize: 14, color: '#9CA3AF' },
  list: { padding: 16, gap: 10 },
  wordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
  },
  wordInfo: { flex: 1 },
  german: { fontSize: 16, fontWeight: '700', color: '#111827' },
  english: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 5,
  },
  typeBadgeText: { fontSize: 11, fontWeight: '600', color: '#374151' },
  removeBtn: { fontSize: 16, color: '#9CA3AF', fontWeight: '700' },
  footer: { padding: 16 },
  studyBtn: {
    backgroundColor: '#003781',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  studyBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});
