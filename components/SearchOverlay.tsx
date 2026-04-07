import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet,
  SafeAreaView, Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { searchWords } from '../data/loader';
import { Word, ARTICLE_GENDER, GENDER_COLORS } from '../data/types';

interface Props {
  onClose: () => void;
}

export function SearchOverlay({ onClose }: Props) {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const results = query.length >= 1 ? searchWords(query).slice(0, 20) : [];

  const handleSelect = useCallback((word: Word) => {
    Keyboard.dismiss();
    onClose();
    router.push(`/details/${word.id}`);
  }, [onClose, router]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchBar}>
        <TouchableOpacity onPress={onClose} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="Search words..."
          placeholderTextColor="#9CA3AF"
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
            const bg = gender ? GENDER_COLORS[gender] : '#F9FAFB';
            return (
              <TouchableOpacity style={[styles.result, { backgroundColor: bg }]} onPress={() => handleSelect(item)}>
                <Text style={styles.german}>
                  {item.article ? `${item.article} ` : ''}{item.german}
                </Text>
                <Text style={styles.english}>{item.english}</Text>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {query.length >= 1 && results.length === 0 && (
        <View style={styles.noResults}>
          <Text style={styles.noResultsText}>No results for "{query}"</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
    gap: 8,
  },
  backBtn: { paddingRight: 4 },
  backText: { fontSize: 24, color: '#003781', lineHeight: 28 },
  input: {
    flex: 1,
    height: 40,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#111827',
  },
  list: { paddingHorizontal: 16, paddingTop: 8, gap: 8 },
  result: {
    padding: 14,
    borderRadius: 10,
  },
  german: { fontSize: 16, fontWeight: '700', color: '#111827' },
  english: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  noResults: { padding: 24, alignItems: 'center' },
  noResultsText: { fontSize: 15, color: '#9CA3AF' },
});
