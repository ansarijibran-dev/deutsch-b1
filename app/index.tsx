import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  SafeAreaView, Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useProgress } from '../hooks/useProgress';
import { useTheme } from '../hooks/useTheme';
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
  const c = useTheme();

  const progress = TOTAL > 0 ? totalStudied / TOTAL : 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.screen }]}>
      {/* Header */}
      <View style={[styles.headerBar, { borderBottomColor: c.border }]}>
        <Text style={[styles.appName, { color: c.accent }]}>Velocitrainer</Text>
      </View>

      {/* Controls bar */}
      <View style={[styles.controlsBar, { borderBottomColor: c.border }]}>
        <TouchableOpacity
          style={[styles.langToggle, { backgroundColor: c.accentLight }]}
          onPress={() => setLanguageMode(languageMode === 'de-en' ? 'en-de' : 'de-en')}
        >
          <Text style={[styles.langToggleText, { color: c.accentLightText }]}>
            {languageMode === 'de-en' ? 'DE → EN' : 'EN → DE'}
          </Text>
        </TouchableOpacity>

        <View style={[styles.progressPill, { backgroundColor: c.progressTrack }]}>
          <View style={[styles.progressFill, { flex: progress, backgroundColor: c.progressFill }]} />
          <View style={{ flex: 1 - progress }} />
        </View>
        <Text style={[styles.progressText, { color: c.text3 }]}>{totalStudied}/{TOTAL}</Text>

        <TouchableOpacity onPress={() => setSearchVisible(true)} style={styles.searchIcon}>
          <Text style={styles.searchIconText}>🔍</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick action tiles */}
        <View style={styles.tilesRow}>
          <TouchableOpacity style={[styles.tile, { backgroundColor: c.tileBg }]} onPress={() => router.push('/study/random')}>
            <Text style={styles.tileIcon}>🔀</Text>
            <Text style={[styles.tileLabel, { color: c.text1 }]}>Randomize</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tile, { backgroundColor: c.reviewTileBg }]} onPress={() => router.push('/review')}>
            <Text style={styles.tileIcon}>⭐</Text>
            <Text style={[styles.tileLabel, { color: c.text1 }]}>For Review</Text>
            {reviewIds.length > 0 && (
              <View style={[styles.badge, { backgroundColor: c.accent }]}>
                <Text style={styles.badgeText}>{reviewIds.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Word Type section */}
        <Text style={[styles.sectionLabel, { color: c.textMuted }]}>WORD TYPE</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {WORD_TYPES.map(type => (
            <TouchableOpacity
              key={type}
              style={[styles.chip, { backgroundColor: c.chipBg }]}
              onPress={() => router.push(`/study/type:${type}`)}
            >
              <Text style={[styles.chipText, { color: c.chipText }]}>{WORD_TYPE_LABELS[type]}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Thematic section */}
        <Text style={[styles.sectionLabel, { color: c.textMuted }]}>THEMATIC</Text>
        <View style={styles.themeGrid}>
          {themes.map(theme => (
            <TouchableOpacity
              key={theme}
              style={[styles.themeChip, { backgroundColor: c.themeChipBg }]}
              onPress={() => router.push(`/study/theme:${theme}`)}
            >
              <Text style={[styles.themeChipText, { color: c.themeChipText }]}>{THEME_LABELS[theme as Theme]}</Text>
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
  container: { flex: 1 },
  headerBar: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  appName: { fontSize: 20, fontWeight: '800', letterSpacing: 0.5 },
  controlsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  langToggle: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  langToggleText: { fontSize: 12, fontWeight: '700' },
  progressPill: {
    flex: 1,
    height: 6,
    flexDirection: 'row',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: { borderRadius: 3 },
  progressText: { fontSize: 11, fontWeight: '500' },
  searchIcon: { padding: 4 },
  searchIconText: { fontSize: 18 },
  content: { padding: 16, gap: 4 },
  tilesRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  tile: {
    flex: 1,
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    gap: 6,
  },
  tileIcon: { fontSize: 24 },
  tileLabel: { fontSize: 14, fontWeight: '700' },
  badge: {
    position: 'absolute',
    top: 10,
    right: 10,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 4,
  },
  chips: { paddingBottom: 16, gap: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chipText: { fontSize: 14, fontWeight: '600' },
  themeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  themeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  themeChipText: { fontSize: 13, fontWeight: '600' },
});
