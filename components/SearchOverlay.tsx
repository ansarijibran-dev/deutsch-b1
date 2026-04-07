import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet,
  SafeAreaView, Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { searchWords } from '../data/loader';
import { Word, ARTICLE_GENDER, WordType } from '../data/types';
import { useTheme } from '../hooks/useTheme';

const TYPE_DOT_COLORS: Record<WordType | 'other', string> = {
  noun:        '#A5B4FC',
  verb:        '#86EFAC',
  adjective:   '#FDE68A',
  adverb:      '#C4B5FD',
  preposition: '#F9A8D4',
  conjunction: '#FED7AA',
  other:       '#E5E7EB',
};

interface Props {
  onClose: () => void;
}

export function SearchOverlay({ onClose }: Props) {
  const [query, setQuery] = useState('');
  const router = useRouter();
  const c = useTheme();

  const results = query.length >= 1 ? searchWords(query).slice(0, 20) : [];

  const handleSelect = useCallback((word: Word) => {
    Keyboard.dismiss();
    onClose();
    router.push(`/details/${word.id}`);
  }, [onClose, router]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.screen }]}>
      <View style={[styles.searchBar, { borderBottomColor: c.border }]}>
        <TouchableOpacity onPress={onClose} style={styles.backBtn}>
          <Text style={[styles.backText, { color: c.accent }]}>‹</Text>
        </TouchableOpacity>
        <TextInput
          style={[styles.input, { backgroundColor: c.input, color: c.text1 }]}
          placeholder="Search words..."
          placeholderTextColor={c.textMuted}
          value={query}
          onChangeText={setQuery}
          autoFocus
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
      </View>

      {results.length > 0 && (
        <FlatList
          data={results}
          keyExtractor={w => w.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const gender = item.article ? ARTICLE_GENDER[item.article] : null;
            const dotColor = gender
              ? c.genderColors[gender]
              : TYPE_DOT_COLORS[item.wordType] ?? TYPE_DOT_COLORS.other;
            return (
              <TouchableOpacity
                style={[styles.result, { backgroundColor: c.card, borderColor: c.border }]}
                onPress={() => handleSelect(item)}
              >
                <View style={[styles.dot, { backgroundColor: dotColor }]} />
                <View style={styles.resultText}>
                  <Text style={[styles.german, { color: c.text1 }]}>
                    {item.article ? `${item.article} ` : ''}{item.german}
                  </Text>
                  <Text style={[styles.english, { color: c.text3 }]}>{item.english}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {query.length >= 1 && results.length === 0 && (
        <View style={styles.noResults}>
          <Text style={[styles.noResultsText, { color: c.textMuted }]}>No results for "{query}"</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  backBtn: { paddingRight: 4 },
  backText: { fontSize: 24, lineHeight: 28 },
  input: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 16,
  },
  list: { paddingHorizontal: 16, paddingTop: 8, gap: 8 },
  result: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    gap: 12,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    flexShrink: 0,
  },
  resultText: { flex: 1 },
  german: { fontSize: 16, fontWeight: '700' },
  english: { fontSize: 13, marginTop: 2 },
  noResults: { padding: 24, alignItems: 'center' },
  noResultsText: { fontSize: 15 },
});
