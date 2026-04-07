import React from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useProgress } from '../hooks/useProgress';
import { useTheme } from '../hooks/useTheme';
import { getReviewWords } from '../data/loader';
import { WORD_TYPE_LABELS, ARTICLE_GENDER } from '../data/types';

export default function ReviewScreen() {
  const router = useRouter();
  const { reviewIds, removeFromReview } = useProgress();
  const words = getReviewWords(reviewIds);
  const c = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.screen }]}>
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.back, { color: c.accent }]}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: c.text1 }]}>For Review ({words.length})</Text>
        <View style={{ width: 50 }} />
      </View>

      {words.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: c.text2 }]}>No words in review list yet.</Text>
          <Text style={[styles.emptySubtext, { color: c.textMuted }]}>Tap ☆ on any flashcard to add it here.</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={words}
            keyExtractor={w => w.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => {
              const gender = item.article ? ARTICLE_GENDER[item.article] : null;
              const bg = gender ? c.genderColors[gender] : c.rowBg;
              return (
                <TouchableOpacity
                  style={[styles.wordRow, { backgroundColor: bg }]}
                  onPress={() => router.push(`/details/${item.id}`)}
                >
                  <View style={styles.wordInfo}>
                    <Text style={[styles.german, { color: c.text1 }]}>
                      {item.article ? `${item.article} ` : ''}{item.german}
                    </Text>
                    <Text style={[styles.english, { color: c.text3 }]}>{item.english}</Text>
                  </View>
                  <View style={styles.rowRight}>
                    <View style={[styles.typeBadge, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                      <Text style={[styles.typeBadgeText, { color: c.text2 }]}>{WORD_TYPE_LABELS[item.wordType]}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => removeFromReview(item.id)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Text style={[styles.removeBtn, { color: c.textMuted }]}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
          <View style={[styles.footer, { borderTopColor: c.border }]}>
            <TouchableOpacity
              style={[styles.studyBtn, { backgroundColor: c.primaryBg }]}
              onPress={() => router.push('/study/review')}
            >
              <Text style={[styles.studyBtnText, { color: c.primaryText }]}>Study Review Words ({words.length})</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
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
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  back: { fontSize: 17, width: 50 },
  title: { fontSize: 17, fontWeight: '700' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 8 },
  emptyText: { fontSize: 17, fontWeight: '600' },
  emptySubtext: { fontSize: 14 },
  list: { padding: 16, gap: 10 },
  wordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
  },
  wordInfo: { flex: 1 },
  german: { fontSize: 16, fontWeight: '700' },
  english: { fontSize: 13, marginTop: 2 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  typeBadgeText: { fontSize: 11, fontWeight: '600' },
  removeBtn: { fontSize: 16, fontWeight: '700' },
  footer: { padding: 16, borderTopWidth: StyleSheet.hairlineWidth },
  studyBtn: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  studyBtnText: { fontSize: 16, fontWeight: '600' },
});
