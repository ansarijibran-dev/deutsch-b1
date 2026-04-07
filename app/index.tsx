import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  SafeAreaView, Modal,
} from 'react-native';
import { useThemeScheme } from '../context/ThemeContext';
import { useRouter } from 'expo-router';
import { useProgress } from '../hooks/useProgress';
import { useTheme } from '../hooks/useTheme';
import { getAllWords, getAllThemes } from '../data/loader';
import { SearchOverlay } from '../components/SearchOverlay';
import {
  THEME_LABELS, WORD_TYPE_LABELS, DIFFICULTY_LABELS,
  WordType, Theme, Difficulty,
} from '../data/types';

const TOTAL = getAllWords().length;

const WORD_TYPES: WordType[] = ['noun', 'verb', 'adjective', 'adverb', 'preposition', 'conjunction'];
const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];

const TYPE_CHIP: Record<WordType, { bg: string; text: string; border: string }> = {
  noun:        { bg: '#C7D2FE', text: '#1D4ED8', border: '#A5B4FC' },
  verb:        { bg: '#F0FDF4', text: '#15803D', border: '#86EFAC' },
  adjective:   { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A' },
  adverb:      { bg: '#F5F3FF', text: '#6D28D9', border: '#C4B5FD' },
  preposition: { bg: '#FBCFE8', text: '#9D174D', border: '#F9A8D4' },
  conjunction: { bg: '#FFF7ED', text: '#C2410C', border: '#FED7AA' },
  other:       { bg: '#F3F4F6', text: '#374151', border: '#E5E7EB' },
};

const DIFF_CHIP = {
  easy:   { bg: '#F0FDF4', text: '#166534', border: '#86EFAC', icon: '🟢' },
  medium: { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A', icon: '🟡' },
  hard:   { bg: '#FFF1F2', text: '#9F1239', border: '#FCA5A5', icon: '🔴' },
};

export default function HomeScreen() {
  const router = useRouter();
  const { totalStudied, reviewIds, languageMode, setLanguageMode } = useProgress();
  const [searchVisible, setSearchVisible] = useState(false);
  const themes = getAllThemes();
  const c = useTheme();
  const { isDark, toggle } = useThemeScheme();

  const progress = TOTAL > 0 ? totalStudied / TOTAL : 0;
  const darkChip = { bg: c.card, text: c.text2, border: c.border };

  return (
    <View style={[styles.root, { backgroundColor: c.navBg }]}>
      <SafeAreaView style={styles.safeArea}>

        {/* ── Navy header ── */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.appName}>Velocitrainer</Text>
            <Text style={styles.appSub}>Deutsch A1–B1 · {TOTAL.toLocaleString()} words</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.miniToggle}>
              <TouchableOpacity
                style={[styles.miniBtn, languageMode === 'de-en' && styles.miniBtnOn]}
                onPress={() => setLanguageMode('de-en')}
              >
                <Text style={[styles.miniBtnTxt, languageMode === 'de-en' && styles.miniBtnTxtOn]}>DE</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.miniBtn, languageMode === 'en-de' && styles.miniBtnOn]}
                onPress={() => setLanguageMode('en-de')}
              >
                <Text style={[styles.miniBtnTxt, languageMode === 'en-de' && styles.miniBtnTxtOn]}>EN</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.themeBtn} onPress={toggle}>
              <Text style={styles.themeBtnTxt}>{isDark ? '☀' : '🌙'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Search bar (still in navy area) ── */}
        <TouchableOpacity style={styles.searchBar} onPress={() => setSearchVisible(true)}>
          <Text style={styles.searchIcon}>🔍</Text>
          <Text style={styles.searchPlaceholder}>Search words…</Text>
        </TouchableOpacity>

        {/* ── Body ── */}
        <ScrollView
          style={[styles.body, { backgroundColor: c.screen }]}
          contentContainerStyle={[styles.bodyContent, { paddingBottom: 8 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Quick Start tiles */}
          <View style={styles.tilesRow}>
            <TouchableOpacity
              style={[styles.tile, { backgroundColor: c.card, borderColor: c.border }]}
              onPress={() => router.push('/study/random')}
            >
              <Text style={styles.tileIcon}>🔀</Text>
              <Text style={[styles.tileName, { color: c.text1 }]}>Randomize</Text>
              <Text style={[styles.tileDesc, { color: c.text3 }]}>All {TOTAL.toLocaleString()} words</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tile, { backgroundColor: c.reviewTileBg, borderColor: c.border }]}
              onPress={() => router.push('/review')}
            >
              <Text style={styles.tileIcon}>⭐</Text>
              <Text style={[styles.tileName, { color: c.text1 }]}>For Review</Text>
              <Text style={[styles.tileDesc, { color: c.text3 }]}>Your saved words</Text>
              {reviewIds.length > 0 && (
                <View style={[styles.tileBadge, { backgroundColor: c.accent }]}>
                  <Text style={styles.tileBadgeTxt}>{reviewIds.length} saved</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* By Word Type */}
          <Text style={[styles.secLbl, { color: c.text3 }]}>By Word Type</Text>
          <View style={styles.chipWrap}>
            {WORD_TYPES.map(type => {
              const col = isDark ? darkChip : TYPE_CHIP[type];
              return (
                <TouchableOpacity
                  key={type}
                  style={[styles.chip, { backgroundColor: col.bg, borderColor: col.border }]}
                  onPress={() => router.push(`/study/type:${type}`)}
                >
                  <Text style={[styles.chipTxt, { color: col.text }]}>{WORD_TYPE_LABELS[type]}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* By Theme */}
          <Text style={[styles.secLbl, { color: c.text3 }]}>By Theme</Text>
          <View style={styles.chipWrap}>
            {themes.map(theme => (
              <TouchableOpacity
                key={theme}
                style={[styles.themeChip, { backgroundColor: c.themeChipBg }]}
                onPress={() => router.push(`/study/theme:${theme}`)}
              >
                <Text style={[styles.themeChipTxt, { color: c.themeChipText }]}>
                  {THEME_LABELS[theme as Theme]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* By Difficulty */}
          <Text style={[styles.secLbl, { color: c.text3 }]}>By Difficulty</Text>
          <View style={styles.diffRow}>
            {DIFFICULTIES.map(d => {
              const col = DIFF_CHIP[d];
              return (
                <TouchableOpacity
                  key={d}
                  style={[
                    styles.diffChip,
                    {
                      backgroundColor: isDark ? c.card : col.bg,
                      borderColor: isDark ? c.border : col.border,
                    },
                  ]}
                  onPress={() => router.push(`/study/difficulty:${d}`)}
                >
                  <Text style={[styles.diffTxt, { color: isDark ? c.text2 : col.text }]}>
                    {col.icon} {DIFFICULTY_LABELS[d]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* ── Progress footer ── */}
        <View style={[styles.footer, { backgroundColor: c.card, borderTopColor: c.border }]}>
          <View style={styles.footerRow}>
            <Text style={[styles.footerLbl, { color: c.text2 }]}>
              {totalStudied} of {TOTAL.toLocaleString()} words known
            </Text>
            <Text style={[styles.footerPct, { color: c.accent }]}>
              {Math.round(progress * 100)}%
            </Text>
          </View>
          <View style={[styles.progTrack, { backgroundColor: c.progressTrack }]}>
            <View
              style={{
                width: `${Math.round(progress * 100)}%`,
                height: '100%',
                backgroundColor: c.progressFill,
                borderRadius: 5,
              }}
            />
          </View>
        </View>

      </SafeAreaView>

      {/* Search Modal */}
      <Modal visible={searchVisible} animationType="slide" presentationStyle="pageSheet">
        <SearchOverlay onClose={() => setSearchVisible(false)} />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safeArea: { flex: 1 },

  // Navy header
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 22,
    paddingTop: 6,
    paddingBottom: 10,
  },
  appName: { fontSize: 27, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  appSub: { fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 3 },

  headerRight: {
    alignItems: 'flex-end',
    gap: 6,
    marginTop: 6,
  },
  miniToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderRadius: 6,
    overflow: 'hidden',
  },
  themeBtn: {
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  themeBtnTxt: { fontSize: 14 },
  miniBtn: { paddingHorizontal: 14, paddingVertical: 5 },
  miniBtnOn: { backgroundColor: 'rgba(255,255,255,0.24)' },
  miniBtnTxt: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.48)' },
  miniBtnTxtOn: { color: '#fff' },

  // Search bar
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.11)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    borderRadius: 11,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginHorizontal: 18,
    marginBottom: 16,
  },
  searchIcon: { fontSize: 14 },
  searchPlaceholder: { fontSize: 14, color: 'rgba(255,255,255,0.38)' },

  // Body
  body: { flex: 1 },
  bodyContent: { padding: 16, gap: 4 },

  // Tiles
  tilesRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  tile: {
    flex: 1,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    gap: 4,
  },
  tileIcon: { fontSize: 26, marginBottom: 2 },
  tileName: { fontSize: 15, fontWeight: '700' },
  tileDesc: { fontSize: 12 },
  tileBadge: {
    marginTop: 4,
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  tileBadgeTxt: { color: '#fff', fontSize: 11, fontWeight: '700' },

  // Section labels
  secLbl: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 4,
    marginBottom: 10,
  },

  // Word type chips
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 20 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  chipTxt: { fontSize: 13, fontWeight: '600' },

  // Theme chips
  themeChip: { paddingHorizontal: 13, paddingVertical: 7, borderRadius: 20 },
  themeChipTxt: { fontSize: 13, fontWeight: '500' },

  // Difficulty chips
  diffRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  diffChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  diffTxt: { fontSize: 13, fontWeight: '600' },

  // Footer
  footer: {
    paddingHorizontal: 20,
    paddingTop: 11,
    paddingBottom: 16,
    borderTopWidth: 1,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  footerLbl: { fontSize: 13, fontWeight: '500' },
  footerPct: { fontSize: 14, fontWeight: '700' },
  progTrack: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
});
