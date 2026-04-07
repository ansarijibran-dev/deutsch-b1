import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet,
  SafeAreaView, Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { searchWords } from '../data/loader';
import { Word, ARTICLE_GENDER } from '../data/types';
import { useTheme } from '../hooks/useTheme';

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
            const bg = gender ? c.genderColors[gender] : c.rowBg;
            return (
              <TouchableOpacity style={[styles.result, { backgroundColor: bg }]} onPress={() => handleSelect(item)}>
                <Text style={[styles.german, { color: c.text1 }]}>
                  {item.article ? `${item.article} ` : ''}{item.german}
                </Text>
                <Text style={[styles.english, { color: c.text3 }]}>{item.english}</Text>
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
    padding: 14,
    borderRadius: 10,
  },
  german: { fontSize: 16, fontWeight: '700' },
  english: { fontSize: 13, marginTop: 2 },
  noResults: { padding: 24, alignItems: 'center' },
  noResultsText: { fontSize: 15 },
});
