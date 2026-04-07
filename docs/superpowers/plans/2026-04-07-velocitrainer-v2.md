# Velocitrainer v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Deutsch B1 flashcard app as Velocitrainer — new name, single-home navigation, gender-coloured flashcards with noun images, full verb tense tables, and a persistent Review Later list.

**Architecture:** Clean rewrite of all screens and navigation in the same repo; `vocabulary.json`, `useProgress`, and `useStudySession` hooks are kept and extended. Two Python scripts run once at dev time to enrich `vocabulary.json` with Wiktionary conjugations and Wikipedia noun images; outputs are committed to the repo. No runtime API calls.

**Tech Stack:** React Native 0.83.4 + Expo SDK 55, Expo Router (Stack), react-native-reanimated 4, AsyncStorage, Python 3 + requests + BeautifulSoup4 (build-time scripts only)

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `data/types.ts` | Add `TenseConjugation`, `TenseForms`; add `image?`, `tenses?` to `Word` |
| Modify | `data/loader.ts` | Add `getReviewWords()` |
| Modify | `hooks/useProgress.ts` | Add `reviewIds`, `addToReview`, `removeFromReview`, `languageMode`, `setLanguageMode` |
| Create | `scripts/fetch_conjugations.py` | Scrape de.wiktionary.org Flexion pages → populate `tenses` in vocabulary.json |
| Create | `scripts/fetch_images.py` | Fetch Wikipedia thumbnail images for nouns → save to `assets/images/nouns/`, generate `assets/data/imageMap.ts`, populate `image` in vocabulary.json |
| Create | `assets/data/imageMap.ts` | Auto-generated: `Record<wordId, require()>` for bundled noun images |
| Rewrite | `app/index.tsx` | Home screen: header, controls bar, Randomize/Review tiles, Word Type chips, Thematic chips |
| Create | `components/SearchOverlay.tsx` | Fullscreen search panel with live dropdown; selecting a word navigates to Details |
| Rewrite | `components/FlashCard.tsx` | Front: word + noun image + skip. Back: gender tint, badge, meaning, plural, See More, Add to Review, Pass/Fail |
| Rewrite | `app/study/[deckId].tsx` | Study session: handles all deckId types including 'review' and 'random' |
| Create | `app/details/[wordId].tsx` | Full word reference: gender header, meaning, plural, sentences, tense tables |
| Create | `components/TenseTable.tsx` | Renders one tense's 6-person conjugation table |
| Create | `app/review.tsx` | For Review list: shows words, remove button, Study Review Words button |
| Delete | `app/(tabs)/` | Remove old tab screens (index, search, themes, types, _layout) |
| Delete | `components/SentenceSection.tsx` | Replaced inline in Details page |
| Delete | `components/ThemeCard.tsx` | Replaced by chip UI |
| Delete | `components/WordListItem.tsx` | No longer used |
| Delete | `components/ProgressBar.tsx` | Replaced inline in study screen |
| Modify | `__tests__/hooks/useProgress.test.ts` | Add tests for reviewIds and languageMode |
| Create | `__tests__/data/loader.test.ts` | Add test for `getReviewWords` |

---

## Task 1: Update TypeScript data types

**Files:**
- Modify: `data/types.ts`
- Modify: `__tests__/data/loader.test.ts` (add type-aware test)

- [ ] **Step 1: Add `TenseConjugation` and `TenseForms` interfaces, and new `Word` fields**

Replace the contents of `data/types.ts` with:

```typescript
// data/types.ts

export type WordType =
  | 'noun'
  | 'verb'
  | 'adjective'
  | 'adverb'
  | 'preposition'
  | 'conjunction'
  | 'other';

export type Theme =
  | 'daily_life'
  | 'work'
  | 'travel'
  | 'health'
  | 'food'
  | 'education'
  | 'technology'
  | 'society'
  | 'environment'
  | 'relationships'
  | 'culture'
  | 'time_numbers'
  | 'language_exam'
  | 'other';

export interface SentencePair {
  de: string;
  en: string;
}

export interface Sentences {
  present: SentencePair;
  past: SentencePair;
  future: SentencePair;
  nominative?: SentencePair;
  accusative?: SentencePair;
  dative?: SentencePair;
  usage1?: SentencePair;
  usage2?: SentencePair;
  usage3?: SentencePair;
}

export interface TenseConjugation {
  ich: string;
  du: string;
  er: string;   // represents er/sie/es
  wir: string;
  ihr: string;
  sie: string;  // represents sie/Sie
}

export interface TenseForms {
  present: TenseConjugation;
  simple_past: TenseConjugation;
  present_perfect: TenseConjugation;
  past_perfect: TenseConjugation;
  future: TenseConjugation;
  future_perfect: TenseConjugation;
}

export interface VerbForms {
  present_3sg: string;
  simple_past: string;
  perfect: string;
  future: string;
}

export interface Word {
  id: string;
  german: string;
  article: 'der' | 'die' | 'das' | null;
  english: string;
  wordType: WordType;
  plural: string | null;
  theme: Theme;
  image?: string;        // relative path e.g. "assets/images/nouns/hund_001.jpg"
  verbForms?: VerbForms; // legacy — kept for backward compat
  tenses?: TenseForms;   // full conjugation table for verbs
  sentences: Sentences;
}

export interface StudyProgress {
  knownIds: string[];
  unknownIds: string[];
  reviewIds: string[];
  deckPositions: Record<string, number>;
  languageMode: 'de-en' | 'en-de';
}

export type Gender = 'masculine' | 'feminine' | 'neuter' | null;

export const ARTICLE_GENDER: Record<string, Gender> = {
  der: 'masculine',
  die: 'feminine',
  das: 'neuter',
};

export const GENDER_COLORS: Record<string, string> = {
  masculine: '#DBEAFE',   // blue-100
  feminine:  '#FCE7F3',   // pink-100
  neuter:    '#FEF9C3',   // yellow-100
};

export const THEME_LABELS: Record<Theme, string> = {
  daily_life: 'Daily Life',
  work: 'Work',
  travel: 'Travel',
  health: 'Health',
  food: 'Food & Shopping',
  education: 'Education',
  technology: 'Technology',
  society: 'Society',
  environment: 'Environment',
  relationships: 'Relationships',
  culture: 'Culture',
  time_numbers: 'Time & Numbers',
  language_exam: 'Exam Language',
  other: 'Other',
};

export const WORD_TYPE_LABELS: Record<WordType, string> = {
  noun: 'Noun',
  verb: 'Verb',
  adjective: 'Adjective',
  adverb: 'Adverb',
  preposition: 'Preposition',
  conjunction: 'Conjunction',
  other: 'Other',
};

export const WORD_TYPE_COLORS: Record<WordType, string> = {
  noun: '#DBEAFE',
  verb: '#DCFCE7',
  adjective: '#FEF9C3',
  adverb: '#EDE9FE',
  preposition: '#FCE7F3',
  conjunction: '#FFE4E6',
  other: '#F3F4F6',
};

export const TENSE_LABELS: Record<keyof TenseForms, string> = {
  present: 'Präsens (Present)',
  simple_past: 'Präteritum (Simple Past)',
  present_perfect: 'Perfekt (Present Perfect)',
  past_perfect: 'Plusquamperfekt (Past Perfect)',
  future: 'Futur I (Future)',
  future_perfect: 'Futur II (Future Perfect)',
};
```

- [ ] **Step 2: Run TypeScript check**

```bash
cd "deutsch-b1" && npx tsc --noEmit
```

Expected: no errors (or only pre-existing errors unrelated to `data/types.ts`).

- [ ] **Step 3: Commit**

```bash
git add data/types.ts
git commit -m "feat: add TenseForms, Gender types and image/tenses fields to Word"
```

---

## Task 2: Extend useProgress hook

**Files:**
- Modify: `hooks/useProgress.ts`
- Modify: `__tests__/hooks/useProgress.test.ts`

- [ ] **Step 1: Write the new failing tests**

Add to the bottom of `__tests__/hooks/useProgress.test.ts`, inside the `describe` block:

```typescript
  test('starts with empty reviewIds', async () => {
    const { result } = renderHook(() => useProgress());
    await act(async () => {});
    expect(result.current.reviewIds).toEqual([]);
  });

  test('addToReview adds id to reviewIds', async () => {
    const { result } = renderHook(() => useProgress());
    await act(async () => {});
    await act(async () => { await result.current.addToReview('hund_001'); });
    expect(result.current.reviewIds).toContain('hund_001');
  });

  test('removeFromReview removes id from reviewIds', async () => {
    const { result } = renderHook(() => useProgress());
    await act(async () => {});
    await act(async () => { await result.current.addToReview('hund_001'); });
    await act(async () => { await result.current.removeFromReview('hund_001'); });
    expect(result.current.reviewIds).not.toContain('hund_001');
  });

  test('isInReview returns true when id is in reviewIds', async () => {
    const { result } = renderHook(() => useProgress());
    await act(async () => {});
    await act(async () => { await result.current.addToReview('hund_001'); });
    expect(result.current.isInReview('hund_001')).toBe(true);
    expect(result.current.isInReview('other_id')).toBe(false);
  });

  test('starts with de-en language mode', async () => {
    const { result } = renderHook(() => useProgress());
    await act(async () => {});
    expect(result.current.languageMode).toBe('de-en');
  });

  test('setLanguageMode updates language mode', async () => {
    const { result } = renderHook(() => useProgress());
    await act(async () => {});
    await act(async () => { await result.current.setLanguageMode('en-de'); });
    expect(result.current.languageMode).toBe('en-de');
  });
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx jest __tests__/hooks/useProgress.test.ts --no-coverage
```

Expected: FAIL — `addToReview is not a function` (or similar)

- [ ] **Step 3: Update useProgress to add reviewIds and languageMode**

Replace the full contents of `hooks/useProgress.ts`:

```typescript
// hooks/useProgress.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@velocitrainer_progress';

interface ProgressState {
  knownIds: string[];
  unknownIds: string[];
  reviewIds: string[];
  deckPositions: Record<string, number>;
  languageMode: 'de-en' | 'en-de';
}

const DEFAULT_STATE: ProgressState = {
  knownIds: [],
  unknownIds: [],
  reviewIds: [],
  deckPositions: {},
  languageMode: 'de-en',
};

export function useProgress() {
  const [progress, setProgress] = useState<ProgressState>(DEFAULT_STATE);
  const progressRef = useRef(progress);
  progressRef.current = progress;

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as Partial<ProgressState>;
          const merged: ProgressState = { ...DEFAULT_STATE, ...parsed };
          setProgress(merged);
          progressRef.current = merged;
        } catch {
          // corrupted data — reset
        }
      }
    });
  }, []);

  const persist = useCallback(async (next: ProgressState) => {
    setProgress(next);
    progressRef.current = next;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const markKnown = useCallback(async (id: string) => {
    const c = progressRef.current;
    await persist({
      ...c,
      knownIds: [...new Set([...c.knownIds, id])],
      unknownIds: c.unknownIds.filter(x => x !== id),
    });
  }, [persist]);

  const markUnknown = useCallback(async (id: string) => {
    const c = progressRef.current;
    await persist({
      ...c,
      unknownIds: [...new Set([...c.unknownIds, id])],
      knownIds: c.knownIds.filter(x => x !== id),
    });
  }, [persist]);

  const addToReview = useCallback(async (id: string) => {
    const c = progressRef.current;
    await persist({ ...c, reviewIds: [...new Set([...c.reviewIds, id])] });
  }, [persist]);

  const removeFromReview = useCallback(async (id: string) => {
    const c = progressRef.current;
    await persist({ ...c, reviewIds: c.reviewIds.filter(x => x !== id) });
  }, [persist]);

  const isInReview = useCallback(
    (id: string) => progressRef.current.reviewIds.includes(id),
    []
  );

  const saveDeckPosition = useCallback(async (deckId: string, index: number) => {
    const c = progressRef.current;
    await persist({ ...c, deckPositions: { ...c.deckPositions, [deckId]: index } });
  }, [persist]);

  const getDeckPosition = useCallback(
    (deckId: string): number => progressRef.current.deckPositions[deckId] ?? 0,
    []
  );

  const setLanguageMode = useCallback(async (mode: 'de-en' | 'en-de') => {
    await persist({ ...progressRef.current, languageMode: mode });
  }, [persist]);

  const totalStudied = new Set([...progress.knownIds, ...progress.unknownIds]).size;

  return {
    knownIds: progress.knownIds,
    unknownIds: progress.unknownIds,
    reviewIds: progress.reviewIds,
    languageMode: progress.languageMode,
    markKnown,
    markUnknown,
    addToReview,
    removeFromReview,
    isInReview,
    saveDeckPosition,
    getDeckPosition,
    setLanguageMode,
    totalStudied,
  };
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx jest __tests__/hooks/useProgress.test.ts --no-coverage
```

Expected: PASS (all tests including new ones)

- [ ] **Step 5: Commit**

```bash
git add hooks/useProgress.ts __tests__/hooks/useProgress.test.ts
git commit -m "feat: add reviewIds and languageMode to useProgress"
```

---

## Task 3: Extend data loader

**Files:**
- Modify: `data/loader.ts`
- Modify: `__tests__/data/loader.test.ts`

- [ ] **Step 1: Write the failing test**

Open `__tests__/data/loader.test.ts` and add inside the existing describe block (or create a new describe block at the bottom):

```typescript
describe('getReviewWords', () => {
  test('returns words matching given ids', () => {
    const allWords = getAllWords();
    const first = allWords[0];
    const second = allWords[1];
    const result = getReviewWords([first.id, second.id]);
    expect(result).toHaveLength(2);
    expect(result.map(w => w.id)).toContain(first.id);
    expect(result.map(w => w.id)).toContain(second.id);
  });

  test('returns empty array for empty input', () => {
    expect(getReviewWords([])).toEqual([]);
  });

  test('ignores unknown ids', () => {
    expect(getReviewWords(['does-not-exist'])).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npx jest __tests__/data/loader.test.ts --no-coverage
```

Expected: FAIL — `getReviewWords is not exported`

- [ ] **Step 3: Add `getReviewWords` to loader**

Add to the bottom of `data/loader.ts`:

```typescript
export function getReviewWords(reviewIds: string[]): Word[] {
  const idSet = new Set(reviewIds);
  return words.filter(w => idSet.has(w.id));
}
```

Also add `getReviewWords` to the import in the test file:
```typescript
import { getAllWords, getReviewWords } from '../../data/loader';
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
npx jest __tests__/data/loader.test.ts --no-coverage
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add data/loader.ts __tests__/data/loader.test.ts
git commit -m "feat: add getReviewWords to data loader"
```

---

## Task 4: Write fetch_conjugations.py

**Files:**
- Create: `scripts/fetch_conjugations.py`

This script scrapes de.wiktionary.org Flexion pages to extract full conjugation tables for all verbs in vocabulary.json. Run it once; commit the result.

- [ ] **Step 1: Install script dependencies**

```bash
pip install requests beautifulsoup4 lxml
```

- [ ] **Step 2: Create the script**

Create `scripts/fetch_conjugations.py`:

```python
#!/usr/bin/env python3
"""
Fetch German verb conjugations from de.wiktionary.org Flexion pages.
Updates assets/data/vocabulary.json with a 'tenses' field for each verb.

Usage: python scripts/fetch_conjugations.py
Run from the repo root directory.
"""

import json
import re
import time
import sys
from pathlib import Path

import requests
from bs4 import BeautifulSoup

VOCAB_PATH = Path("assets/data/vocabulary.json")
HEADERS = {"User-Agent": "VelocitrainerApp/2.0 (educational; contact: github.com/ansarijibran-dev/deutsch-b1)"}

TENSE_SECTION_LABELS = {
    "Präsens":            "present",
    "Präteritum":         "simple_past",
    "Perfekt":            "present_perfect",
    "Plusquamperfekt":    "past_perfect",
    "Futur I":            "future",
    "Futur II":           "future_perfect",
}

PERSON_LABELS = ["ich", "du", "er", "wir", "ihr", "sie"]


def clean_form(text: str) -> str:
    """Strip auxiliary hints like 'habe' → keep only the conjugated form."""
    text = re.sub(r'\[.*?\]', '', text)   # remove bracketed notes
    text = re.sub(r'\(.*?\)', '', text)   # remove parenthetical notes
    return text.strip()


def fetch_flexion_page(verb: str) -> BeautifulSoup | None:
    url = f"https://de.wiktionary.org/w/api.php"
    params = {
        "action": "parse",
        "page": f"Flexion:{verb}",
        "prop": "text",
        "format": "json",
    }
    try:
        resp = requests.get(url, params=params, headers=HEADERS, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        html = data.get("parse", {}).get("text", {}).get("*", "")
        if not html:
            return None
        return BeautifulSoup(html, "lxml")
    except Exception as e:
        print(f"  ERROR fetching {verb}: {e}", file=sys.stderr)
        return None


def parse_tenses(soup: BeautifulSoup) -> dict | None:
    """
    Extract the 6 tenses × 6 persons from the Flexion page.
    de.wiktionary Flexion tables have one table per tense with rows:
      ich / du / er·sie·es / wir / ihr / sie·Sie
    Returns a dict keyed by our tense names, each a dict of 6 persons.
    """
    tenses: dict[str, dict[str, str]] = {}

    # Each tense is in its own wikitable. The heading above it names the tense.
    tables = soup.find_all("table", class_="wikitable")
    for table in tables:
        # Find the heading that precedes this table
        prev = table.find_previous(["h3", "h4", "b", "th"])
        heading_text = ""
        caption = table.find("caption")
        if caption:
            heading_text = caption.get_text(strip=True)
        if not heading_text and prev:
            heading_text = prev.get_text(strip=True)

        tense_key = None
        for label, key in TENSE_SECTION_LABELS.items():
            if label in heading_text:
                tense_key = key
                break
        if tense_key is None:
            continue

        rows = table.find_all("tr")
        persons_found: dict[str, str] = {}
        for row in rows:
            cells = row.find_all(["td", "th"])
            if len(cells) < 2:
                continue
            person_cell = cells[0].get_text(strip=True).lower()
            form_cell = cells[1].get_text(" ", strip=True)
            form = clean_form(form_cell)
            if not form:
                continue
            # Map German person label to our key.
            # de.wiktionary rows: ich | du | er/sie/es | wir | ihr | sie/Sie
            # We match greedily — "er" row always starts with "er",
            # "sie/Sie" (3rd plural) only matches after "wir" and "ihr" are set.
            if person_cell.startswith("ich"):
                persons_found["ich"] = form
            elif person_cell.startswith("du"):
                persons_found["du"] = form
            elif person_cell.startswith("er"):          # "er/sie/es"
                persons_found["er"] = form
            elif person_cell.startswith("wir"):
                persons_found["wir"] = form
            elif person_cell.startswith("ihr"):
                persons_found["ihr"] = form
            elif "sie" in person_cell:                  # "sie/Sie" (3rd plural)
                if "sie" not in persons_found:
                    persons_found["sie"] = form

        if len(persons_found) == 6:
            tenses[tense_key] = persons_found

    return tenses if len(tenses) == 6 else None


def main():
    print(f"Loading {VOCAB_PATH}...")
    with open(VOCAB_PATH, encoding="utf-8") as f:
        vocab = json.load(f)

    verbs = [w for w in vocab if w.get("wordType") == "verb"]
    print(f"Found {len(verbs)} verbs to process.")

    success = 0
    failed = []

    for i, word in enumerate(verbs):
        german = word["german"]
        word_id = word["id"]

        if word.get("tenses"):
            print(f"  [{i+1}/{len(verbs)}] {german} — already has tenses, skipping")
            success += 1
            continue

        print(f"  [{i+1}/{len(verbs)}] {german}...", end=" ", flush=True)
        soup = fetch_flexion_page(german)
        if soup is None:
            print("FAILED (no page)")
            failed.append(german)
            time.sleep(0.5)
            continue

        tenses = parse_tenses(soup)
        if tenses is None:
            print("FAILED (parse error)")
            failed.append(german)
            time.sleep(0.5)
            continue

        # Update the word in the full vocab list
        for w in vocab:
            if w["id"] == word_id:
                w["tenses"] = tenses
                break

        print("OK")
        success += 1
        time.sleep(0.3)  # be polite to Wiktionary

    print(f"\nDone: {success} succeeded, {len(failed)} failed.")
    if failed:
        print("Failed verbs (add manually):")
        for v in failed:
            print(f"  {v}")

    print(f"Saving {VOCAB_PATH}...")
    with open(VOCAB_PATH, "w", encoding="utf-8") as f:
        json.dump(vocab, f, ensure_ascii=False, indent=2)
    print("Done.")


if __name__ == "__main__":
    main()
```

- [ ] **Step 3: Commit the script**

```bash
git add scripts/fetch_conjugations.py
git commit -m "feat: add fetch_conjugations.py script for Wiktionary verb data"
```

---

## Task 5: Run conjugation script and commit enriched vocabulary

- [ ] **Step 1: Run the script from repo root**

```bash
cd "C:\Users\dk75apw\OneDrive - Allianz\Desktop\New folder (2)\deutsch-b1"
py scripts/fetch_conjugations.py
```

Expected output: progress lines like `[1/450] arbeiten... OK`, final summary like `Done: 380 succeeded, 70 failed.`

This will take 5-10 minutes (rate-limited to ~3 requests/second).

- [ ] **Step 2: Review failed verbs**

Check the printed list of failed verbs. For any that are critical (common verbs), look them up manually at `https://de.wiktionary.org/wiki/Flexion:<verb>` and add `tenses` data manually to `vocabulary.json`.

- [ ] **Step 3: Commit enriched vocabulary**

```bash
git add assets/data/vocabulary.json
git commit -m "data: add Wiktionary conjugation tenses for all verbs"
```

---

## Task 6: Write fetch_images.py

**Files:**
- Create: `scripts/fetch_images.py`
- Creates: `assets/images/nouns/` directory with JPEG files
- Creates: `assets/data/imageMap.ts` (auto-generated)

- [ ] **Step 1: Create the images directory**

```bash
mkdir -p "assets/images/nouns"
```

- [ ] **Step 2: Create the script**

Create `scripts/fetch_images.py`:

```python
#!/usr/bin/env python3
"""
Fetch low-resolution Wikipedia thumbnail images for German nouns.
Saves JPEGs to assets/images/nouns/<word_id>.jpg
Generates assets/data/imageMap.ts with static require() calls for React Native.
Updates assets/data/vocabulary.json with 'image' field.

Usage: python scripts/fetch_images.py
Run from the repo root directory.
"""

import json
import time
import sys
from pathlib import Path

import requests

VOCAB_PATH = Path("assets/data/vocabulary.json")
IMAGES_DIR = Path("assets/images/nouns")
IMAGE_MAP_PATH = Path("assets/data/imageMap.ts")
HEADERS = {"User-Agent": "VelocitrainerApp/2.0 (educational; contact: github.com/ansarijibran-dev/deutsch-b1)"}
THUMB_SIZE = 200  # pixels wide


def search_wikipedia_image(german_word: str) -> str | None:
    """Returns the thumbnail URL for the first Wikipedia article matching the German word."""
    api = "https://en.wikipedia.org/w/api.php"
    # First try the exact German word (many German nouns have English Wikipedia articles)
    params = {
        "action": "query",
        "titles": german_word,
        "prop": "pageimages",
        "format": "json",
        "pithumbsize": THUMB_SIZE,
        "pilicense": "any",
    }
    try:
        resp = requests.get(api, params=params, headers=HEADERS, timeout=10)
        resp.raise_for_status()
        pages = resp.json().get("query", {}).get("pages", {})
        for page in pages.values():
            if page.get("pageid", -1) != -1 and "thumbnail" in page:
                return page["thumbnail"]["source"]
    except Exception:
        pass
    return None


def download_image(url: str, dest: Path) -> bool:
    try:
        resp = requests.get(url, headers=HEADERS, timeout=15)
        resp.raise_for_status()
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(resp.content)
        return True
    except Exception as e:
        print(f"  Download failed: {e}", file=sys.stderr)
        return False


def generate_image_map(image_ids: list[str]) -> None:
    """Generate assets/data/imageMap.ts with static require() calls."""
    lines = [
        "// AUTO-GENERATED by scripts/fetch_images.py — do not edit manually",
        "// Maps word IDs to bundled noun images for React Native",
        "const imageMap: Record<string, any> = {",
    ]
    for word_id in sorted(image_ids):
        lines.append(f"  '{word_id}': require('../images/nouns/{word_id}.jpg'),")
    lines.append("};")
    lines.append("export default imageMap;")
    IMAGE_MAP_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main():
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)

    print(f"Loading {VOCAB_PATH}...")
    with open(VOCAB_PATH, encoding="utf-8") as f:
        vocab = json.load(f)

    nouns = [w for w in vocab if w.get("wordType") == "noun"]
    print(f"Found {len(nouns)} nouns to process.")

    success_ids = []
    failed = []

    # Collect already-downloaded ids to allow re-runs
    already_done = {w["id"] for w in vocab if w.get("image")}

    for i, word in enumerate(nouns):
        word_id = word["id"]
        german = word["german"]
        # Strip article if present in the german field
        bare = german.split()[-1] if " " in german else german

        if word_id in already_done:
            print(f"  [{i+1}/{len(nouns)}] {german} — already downloaded, skipping")
            success_ids.append(word_id)
            continue

        dest = IMAGES_DIR / f"{word_id}.jpg"
        print(f"  [{i+1}/{len(nouns)}] {german}...", end=" ", flush=True)

        img_url = search_wikipedia_image(bare)
        if img_url is None:
            print("no image found")
            failed.append(german)
            time.sleep(0.3)
            continue

        ok = download_image(img_url, dest)
        if not ok:
            failed.append(german)
            time.sleep(0.3)
            continue

        # Update vocabulary entry
        for w in vocab:
            if w["id"] == word_id:
                w["image"] = f"assets/images/nouns/{word_id}.jpg"
                break

        success_ids.append(word_id)
        print("OK")
        time.sleep(0.3)

    print(f"\nDone: {len(success_ids)} images, {len(failed)} failed.")
    if failed:
        print("Failed nouns (no image will be shown):")
        for n in failed:
            print(f"  {n}")

    print(f"Generating {IMAGE_MAP_PATH}...")
    generate_image_map(success_ids)

    print(f"Saving {VOCAB_PATH}...")
    with open(VOCAB_PATH, "w", encoding="utf-8") as f:
        json.dump(vocab, f, ensure_ascii=False, indent=2)
    print("All done.")


if __name__ == "__main__":
    main()
```

- [ ] **Step 3: Commit the script**

```bash
git add scripts/fetch_images.py
git commit -m "feat: add fetch_images.py script for Wikipedia noun images"
```

---

## Task 7: Run images script and commit assets

- [ ] **Step 1: Run the script from repo root**

```bash
py scripts/fetch_images.py
```

Expected: progress lines, ~60-80% of nouns will find images. This takes 5-15 minutes.

- [ ] **Step 2: Add assets/images/nouns/ to git tracking**

Add `.gitattributes` to store images efficiently:

```bash
echo "assets/images/nouns/*.jpg binary" >> .gitattributes
```

- [ ] **Step 3: Commit images and generated files**

```bash
git add assets/images/nouns/ assets/data/imageMap.ts assets/data/vocabulary.json .gitattributes
git commit -m "data: add Wikipedia noun images and generated imageMap"
```

---

## Task 8: Remove old tab screens

**Files:**
- Delete: `app/(tabs)/index.tsx`
- Delete: `app/(tabs)/search.tsx`
- Delete: `app/(tabs)/themes.tsx`
- Delete: `app/(tabs)/types.tsx`
- Delete: `app/(tabs)/_layout.tsx`
- Delete: `components/SentenceSection.tsx`
- Delete: `components/ThemeCard.tsx`
- Delete: `components/WordListItem.tsx`
- Delete: `components/ProgressBar.tsx`
- Delete: `app/word/[wordId].tsx` (old word detail screen)

- [ ] **Step 1: Delete old files**

```bash
cd "C:\Users\dk75apw\OneDrive - Allianz\Desktop\New folder (2)\deutsch-b1"
rm -rf app/\(tabs\) app/word
rm -f components/SentenceSection.tsx components/ThemeCard.tsx components/WordListItem.tsx components/ProgressBar.tsx
```

- [ ] **Step 2: Commit deletion**

```bash
git add -A
git commit -m "refactor: remove old tab screens and unused components"
```

---

## Task 9: Build TenseTable component

**Files:**
- Create: `components/TenseTable.tsx`

- [ ] **Step 1: Create the component**

Create `components/TenseTable.tsx`:

```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TenseConjugation } from '../data/types';

interface Props {
  label: string;
  conjugation: TenseConjugation;
}

const ROWS: { key: keyof TenseConjugation; pronoun: string }[] = [
  { key: 'ich', pronoun: 'ich' },
  { key: 'du', pronoun: 'du' },
  { key: 'er', pronoun: 'er / sie / es' },
  { key: 'wir', pronoun: 'wir' },
  { key: 'ihr', pronoun: 'ihr' },
  { key: 'sie', pronoun: 'sie / Sie' },
];

export function TenseTable({ label, conjugation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>{label}</Text>
      {ROWS.map(({ key, pronoun }) => (
        <View key={key} style={styles.row}>
          <Text style={styles.pronoun}>{pronoun}</Text>
          <Text style={styles.form}>{conjugation[key] ?? '—'}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 12,
  },
  heading: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  pronoun: { fontSize: 13, color: '#6B7280', width: 100 },
  form: { fontSize: 13, color: '#111827', fontWeight: '500', flex: 1, textAlign: 'right' },
});
```

- [ ] **Step 2: Commit**

```bash
git add components/TenseTable.tsx
git commit -m "feat: add TenseTable component"
```

---

## Task 10: Build Details page

**Files:**
- Create: `app/details/[wordId].tsx`

- [ ] **Step 1: Create the Details page**

Create `app/details/[wordId].tsx`:

```typescript
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
  const { isInReview, addToReview, removeFromReview, reviewIds } = useProgress();

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
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add app/details/[wordId].tsx
git commit -m "feat: add Details page with sentences and tense tables"
```

---

## Task 11: Rewrite FlashCard component

**Files:**
- Modify: `components/FlashCard.tsx`

- [ ] **Step 1: Rewrite FlashCard**

Replace the full contents of `components/FlashCard.tsx`:

```typescript
import React, { useState, useCallback } from 'react';
import {
  TouchableWithoutFeedback, TouchableOpacity, View, Text, Image,
  ScrollView, StyleSheet, Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, interpolate, Extrapolation,
} from 'react-native-reanimated';
import { Word, ARTICLE_GENDER, GENDER_COLORS, WORD_TYPE_LABELS } from '../data/types';
import imageMap from '../assets/data/imageMap';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 48;
const CARD_HEIGHT = 480;

interface Props {
  word: Word;
  mode: 'de-en' | 'en-de';
  onFlipped?: (flipped: boolean) => void;
  onSeeMore?: () => void;
  onSkip?: () => void;
  onPass?: () => void;
  onFail?: () => void;
  onReviewToggle?: () => void;
  isInReview?: boolean;
  currentIndex: number;
  total: number;
  score: number;
}

export function FlashCard({
  word, mode, onFlipped, onSeeMore, onSkip,
  onPass, onFail, onReviewToggle, isInReview,
  currentIndex, total, score,
}: Props) {
  const rotation = useSharedValue(0);
  const [flipped, setFlipped] = useState(false);

  const handleFlip = useCallback(() => {
    const next = !flipped;
    rotation.value = withTiming(next ? 180 : 0, { duration: 400 });
    setFlipped(next);
    onFlipped?.(next);
  }, [flipped, rotation, onFlipped]);

  const frontStyle = useAnimatedStyle(() => ({
    transform: [{ rotateY: `${interpolate(rotation.value, [0, 180], [0, 180], Extrapolation.CLAMP)}deg` }],
    backfaceVisibility: 'hidden',
  }));

  const backStyle = useAnimatedStyle(() => ({
    transform: [{ rotateY: `${interpolate(rotation.value, [0, 180], [180, 360], Extrapolation.CLAMP)}deg` }],
    backfaceVisibility: 'hidden',
  }));

  const frontText = mode === 'de-en'
    ? `${word.article ? word.article + ' ' : ''}${word.german}`
    : word.english;

  const gender = word.article ? ARTICLE_GENDER[word.article] : null;
  const cardBg = gender ? GENDER_COLORS[gender] : '#FFFFFF';
  const nounImage = word.wordType === 'noun' && word.image ? imageMap[word.id] : null;

  const completionPct = total > 0 ? Math.round((score / total) * 100) : 0;

  return (
    <View style={styles.wrapper}>
      {/* Progress and score */}
      <View style={styles.statsRow}>
        <Text style={styles.counter}>{currentIndex + 1} / {total}</Text>
        <Text style={styles.score}>{completionPct}% known</Text>
      </View>

      <TouchableWithoutFeedback onPress={handleFlip}>
        <View style={styles.container}>
          {/* FRONT */}
          <Animated.View style={[styles.card, styles.front, frontStyle]}>
            {nounImage && (
              <Image source={nounImage} style={styles.nounImage} resizeMode="contain" />
            )}
            <Text style={styles.mainWord}>{frontText}</Text>
            <Text style={styles.hint}>Tap to reveal</Text>
            <TouchableOpacity style={styles.skipBtn} onPress={onSkip} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.skipText}>Skip →</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* BACK */}
          <Animated.View style={[styles.card, styles.back, { backgroundColor: cardBg }, backStyle]}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.backContent}>
              {/* Badge row */}
              <View style={styles.badgeRow}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{WORD_TYPE_LABELS[word.wordType]}</Text>
                </View>
                {gender && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{gender}</Text>
                  </View>
                )}
              </View>

              {/* German → English */}
              <Text style={styles.backGerman}>
                {word.article ? `${word.article} ` : ''}{word.german}
              </Text>
              <Text style={styles.backEnglish}>{word.english}</Text>

              {/* Plural */}
              {word.plural && (
                <Text style={styles.plural}>Plural: {word.plural}</Text>
              )}

              {/* Action buttons */}
              <View style={styles.actions}>
                <TouchableOpacity style={styles.seeMoreBtn} onPress={onSeeMore}>
                  <Text style={styles.seeMoreText}>See More</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.reviewToggleBtn, isInReview && styles.reviewToggleBtnActive]}
                  onPress={onReviewToggle}
                >
                  <Text style={[styles.reviewToggleText, isInReview && styles.reviewToggleTextActive]}>
                    {isInReview ? '★ In Review' : '☆ Review'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Pass / Fail */}
              <View style={styles.passFailRow}>
                <TouchableOpacity style={[styles.judgeBtn, styles.failBtn]} onPress={onFail}>
                  <Text style={styles.judgeBtnText}>✗ Didn't know</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.judgeBtn, styles.passBtn]} onPress={onPass}>
                  <Text style={styles.judgeBtnText}>✓ Knew it</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center' },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: CARD_WIDTH,
    marginBottom: 8,
  },
  counter: { fontSize: 13, color: '#6B7280' },
  score: { fontSize: 13, color: '#003781', fontWeight: '600' },
  container: { width: CARD_WIDTH, height: CARD_HEIGHT },
  card: {
    position: 'absolute',
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    backgroundColor: '#FFFFFF',
  },
  front: { justifyContent: 'center', alignItems: 'center' },
  back: {},
  nounImage: { width: 120, height: 100, marginBottom: 12, borderRadius: 8 },
  mainWord: { fontSize: 30, fontWeight: '700', color: '#111827', textAlign: 'center' },
  hint: { fontSize: 12, color: '#D1D5DB', marginTop: 10 },
  skipBtn: { position: 'absolute', bottom: 16, right: 16 },
  skipText: { fontSize: 13, color: '#9CA3AF', fontWeight: '500' },
  backContent: { paddingBottom: 8 },
  badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 6,
  },
  badgeText: { fontSize: 12, fontWeight: '600', color: '#374151' },
  backGerman: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 4 },
  backEnglish: { fontSize: 16, color: '#374151', marginBottom: 4 },
  plural: { fontSize: 13, color: '#6B7280', marginBottom: 12 },
  actions: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  seeMoreBtn: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#003781',
    borderRadius: 10,
    alignItems: 'center',
  },
  seeMoreText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  reviewToggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#003781',
    borderRadius: 10,
    alignItems: 'center',
  },
  reviewToggleBtnActive: { backgroundColor: '#003781' },
  reviewToggleText: { color: '#003781', fontSize: 13, fontWeight: '600' },
  reviewToggleTextActive: { color: '#FFF' },
  passFailRow: { flexDirection: 'row', gap: 10 },
  judgeBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  failBtn: { backgroundColor: '#FEE2E2' },
  passBtn: { backgroundColor: '#DCFCE7' },
  judgeBtnText: { fontSize: 14, fontWeight: '600', color: '#374151' },
});
```

- [ ] **Step 2: Commit**

```bash
git add components/FlashCard.tsx
git commit -m "feat: rewrite FlashCard with gender colors, noun images, skip, See More"
```

---

## Task 12: Rewrite study screen

**Files:**
- Modify: `app/study/[deckId].tsx`

- [ ] **Step 1: Rewrite the study screen**

Replace the full contents of `app/study/[deckId].tsx`:

```typescript
import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  View, StyleSheet, PanResponder, Animated as RNAnimated, Dimensions, SafeAreaView, Text, TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FlashCard } from '../../components/FlashCard';
import { useStudySession } from '../../hooks/useStudySession';
import { useProgress } from '../../hooks/useProgress';
import { getAllWords, getWordsByTheme, getWordsByType } from '../../data/loader';
import { Theme, WordType } from '../../data/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = 100;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function resolveDeckIds(deckId: string, reviewIds: string[]): string[] {
  if (deckId === 'random') return shuffle(getAllWords().map(w => w.id));
  if (deckId === 'review') return reviewIds;
  if (deckId.startsWith('theme:')) return getWordsByTheme(deckId.slice(6) as Theme).map(w => w.id);
  if (deckId.startsWith('type:')) return getWordsByType(deckId.slice(5) as WordType).map(w => w.id);
  return [];
}

export default function StudyScreen() {
  const { deckId } = useLocalSearchParams<{ deckId: string }>();
  const router = useRouter();
  const {
    reviewIds, markKnown, markUnknown, saveDeckPosition, getDeckPosition,
    isInReview, addToReview, removeFromReview, languageMode,
  } = useProgress();

  const wordIds = useMemo(() => resolveDeckIds(deckId, reviewIds), [deckId, reviewIds]);
  const startIndex = deckId === 'random' ? 0 : getDeckPosition(deckId);

  const { currentWord, currentIndex, isFinished, score, total, progressFraction, advance } =
    useStudySession(wordIds, startIndex);

  const translateX = useRef(new RNAnimated.Value(0)).current;

  const handleSwipe = useCallback(async (knew: boolean) => {
    if (!currentWord) return;
    RNAnimated.timing(translateX, {
      toValue: knew ? SCREEN_WIDTH : -SCREEN_WIDTH,
      duration: 250,
      useNativeDriver: true,
    }).start(async () => {
      translateX.setValue(0);
      if (knew) await markKnown(currentWord.id);
      else await markUnknown(currentWord.id);
      if (deckId !== 'random') await saveDeckPosition(deckId, currentIndex + 1);
      advance(knew);
    });
  }, [currentWord, currentIndex, deckId, translateX, markKnown, markUnknown, saveDeckPosition, advance]);

  const handleSkip = useCallback(() => {
    if (!currentWord) return;
    advance(false); // skip without marking
  }, [currentWord, advance]);

  const panResponder = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 10,
    onPanResponderMove: (_, g) => translateX.setValue(g.dx),
    onPanResponderRelease: (_, g) => {
      if (g.dx > SWIPE_THRESHOLD) handleSwipe(true);
      else if (g.dx < -SWIPE_THRESHOLD) handleSwipe(false);
      else RNAnimated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
    },
  })).current;

  if (isFinished || wordIds.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.summary}>
          <Text style={styles.summaryEmoji}>🎉</Text>
          <Text style={styles.summaryTitle}>Session Complete!</Text>
          <Text style={styles.summaryScore}>{score} / {total} known</Text>
          <TouchableOpacity style={styles.doneButton} onPress={() => router.replace('/')}>
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/')}>
          <Text style={styles.back}>‹ Back</Text>
        </TouchableOpacity>
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { flex: progressFraction }]} />
          <View style={{ flex: 1 - progressFraction }} />
        </View>
      </View>

      <View style={styles.cardArea}>
        <RNAnimated.View style={{ transform: [{ translateX }] }} {...panResponder.panHandlers}>
          {currentWord && (
            <FlashCard
              word={currentWord}
              mode={languageMode}
              currentIndex={currentIndex}
              total={total}
              score={score}
              onSkip={handleSkip}
              onPass={() => handleSwipe(true)}
              onFail={() => handleSwipe(false)}
              onSeeMore={() => router.push(`/details/${currentWord.id}`)}
              onReviewToggle={async () => {
                if (isInReview(currentWord.id)) await removeFromReview(currentWord.id);
                else await addToReview(currentWord.id);
              }}
              isInReview={isInReview(currentWord.id)}
            />
          )}
        </RNAnimated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  back: { fontSize: 17, color: '#003781' },
  progressBarTrack: {
    flex: 1,
    height: 6,
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: { backgroundColor: '#003781', borderRadius: 3 },
  cardArea: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  summary: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  summaryEmoji: { fontSize: 56 },
  summaryTitle: { fontSize: 28, fontWeight: '700', color: '#111827' },
  summaryScore: { fontSize: 20, color: '#6B7280' },
  doneButton: {
    marginTop: 24,
    backgroundColor: '#003781',
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 12,
  },
  doneButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});
```

- [ ] **Step 2: Commit**

```bash
git add app/study/[deckId].tsx
git commit -m "feat: rewrite study screen with skip, review toggle, random deck support"
```

---

## Task 13: Build For Review screen

**Files:**
- Create: `app/review.tsx`

- [ ] **Step 1: Create the review screen**

Create `app/review.tsx`:

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add app/review.tsx
git commit -m "feat: add For Review screen with word list and study button"
```

---

## Task 14: Build SearchOverlay component

**Files:**
- Create: `components/SearchOverlay.tsx`

- [ ] **Step 1: Create the component**

Create `components/SearchOverlay.tsx`:

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add components/SearchOverlay.tsx
git commit -m "feat: add SearchOverlay component with live dropdown"
```

---

## Task 15: Build Home Screen

**Files:**
- Rewrite: `app/index.tsx`

- [ ] **Step 1: Rewrite the home screen**

Replace the full contents of `app/index.tsx`:

```typescript
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
```

- [ ] **Step 2: Run TypeScript check across all new files**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Run all tests**

```bash
npx jest --no-coverage
```

Expected: all pass.

- [ ] **Step 4: Commit**

```bash
git add app/index.tsx
git commit -m "feat: build Velocitrainer home screen with controls bar and study modes"
```

---

## Task 16: Push and trigger GitHub Actions build

- [ ] **Step 1: Final check — ensure old tab imports are gone**

```bash
grep -r "from.*tabs" app/ components/ --include="*.tsx" --include="*.ts"
```

Expected: no output.

- [ ] **Step 2: Push to GitHub**

```bash
git push origin main
```

- [ ] **Step 3: Monitor the build**

Go to `https://github.com/ansarijibran-dev/deutsch-b1/actions` and watch the workflow. It should complete in ~15-20 minutes.

- [ ] **Step 4: Download the IPA**

When the workflow succeeds, download `DeutschB1.ipa` from the GitHub Actions artifacts and install via Sideloadly.

---

## Troubleshooting

**`imageMap` import error:** If `assets/data/imageMap.ts` doesn't exist yet (before running fetch_images.py), create a stub:
```typescript
// assets/data/imageMap.ts
const imageMap: Record<string, any> = {};
export default imageMap;
```

**TypeScript error on `word.tenses![tenseKey]`:** Ensure `TenseForms` is a `Record`-compatible type — the `keyof TenseForms` cast handles this.

**Wiktionary rate limiting:** If the conjugation script gets HTTP 429, increase the sleep delay from `0.3` to `1.0` seconds.

**Wikipedia returns wrong image:** Wikipedia matches the exact German word — some nouns will get irrelevant images (e.g. a person's name matching). Review the `assets/images/nouns/` directory and delete bad images, then remove those entries from `imageMap.ts` and the `image` field in `vocabulary.json`.
