import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  SafeAreaView, Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useProgress } from '../hooks/useProgress';
import { getAllWords, getAllThemes } from '../data/loader';
import { SearchOverlay } from '../components/SearchOverlay';
import { THEME_LABELS, WORD_TYPE_LABELS, WordType, Theme } from '../data/types';

const TOTAL = getAllWords().length;

const WORD_TYPES: WordType[] = ['noun', 'verb', 'adjective', 'adverb', 'preposition', 'conjunction', 'other'];

export default function HomeScreen() {
  const router = useRouter();
  const { totalStudied, reviewIds, languageMode, setLanguageMode } = useProgress();
  const [searchVisible, setSearchVisible] = useState(false);
  const themes = getAllThemes();

  const progress = TOTAL > 0 ? totalStudied / TOTAL : 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerBar}>
        <Text style={styles.appName}>Velocitrainer</Text>
      </View>

      {/* Controls bar */}
      <View style={styles.controlsBar}>
        <TouchableOpacity
          style={styles.langToggle}
          onPress={() => setLanguageMode(languageMode === 'de-en' ? 'en-de' : 'de-en')}
        >
          <Text style={styles.langToggleText}>
            {languageMode === 'de-en' ? 'DE → EN' : 'EN → DE'}
          </Text>
        </TouchableOpacity>

        <View style={styles.progressPill}>
          <View style={[styles.progressFill, { flex: progress }]} />
          <View style={{ flex: 1 - progress }} />
        </View>
        <Text style={styles.progressText}>{totalStudied}/{TOTAL}</Text>

        <TouchableOpacity onPress={() => setSearchVisible(true)} style={styles.searchIcon}>
          <Text style={styles.searchIconText}>🔍</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick action tiles */}
        <View style={styles.tilesRow}>
          <TouchableOpacity style={styles.tile} onPress={() => router.push('/study/random')}>
            <Text style={styles.tileIcon}>🔀</Text>
            <Text style={styles.tileLabel}>Randomize</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tile, styles.reviewTile]} onPress={() => router.push('/review')}>
            <Text style={styles.tileIcon}>⭐</Text>
            <Text style={styles.tileLabel}>For Review</Text>
            {reviewIds.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{reviewIds.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Word Type section */}
        <Text style={styles.sectionLabel}>WORD TYPE</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {WORD_TYPES.map(type => (
            <TouchableOpacity
              key={type}
              style={styles.chip}
              onPress={() => router.push(`/study/type:${type}`)}
            >
              <Text style={styles.chipText}>{WORD_TYPE_LABELS[type]}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Thematic section */}
        <Text style={styles.sectionLabel}>THEMATIC</Text>
        <View style={styles.themeGrid}>
          {themes.map(theme => (
            <TouchableOpacity
              key={theme}
              style={styles.themeChip}
              onPress={() => router.push(`/study/theme:${theme}`)}
            >
              <Text style={styles.themeChipText}>{THEME_LABELS[theme as Theme]}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Search modal */}
      <Modal visible={searchVisible} animationType="slide" presentationStyle="pageSheet">
        <SearchOverlay onClose={() => setSearchVisible(false)} />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  headerBar: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
    alignItems: 'center',
  },
  appName: { fontSize: 20, fontWeight: '800', color: '#003781', letterSpacing: 0.5 },
  controlsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  langToggle: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
  },
  langToggleText: { fontSize: 12, fontWeight: '700', color: '#003781' },
  progressPill: {
    flex: 1,
    height: 6,
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: { backgroundColor: '#003781', borderRadius: 3 },
  progressText: { fontSize: 11, color: '#6B7280', fontWeight: '500' },
  searchIcon: { padding: 4 },
  searchIconText: { fontSize: 18 },
  content: { padding: 16, gap: 4 },
  tilesRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  tile: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    gap: 6,
  },
  reviewTile: { backgroundColor: '#FEF9C3' },
  tileIcon: { fontSize: 24 },
  tileLabel: { fontSize: 14, fontWeight: '700', color: '#111827' },
  badge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#003781',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 4,
  },
  chips: { paddingBottom: 16, gap: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
  },
  chipText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  themeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  themeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
  },
  themeChipText: { fontSize: 13, fontWeight: '600', color: '#003781' },
});
