# Velocitrainer v2 — Design Spec
**Date:** 2026-04-07
**Status:** Approved

---

## Overview

Rebrand and redesign of the Deutsch B1 flashcard app into **Velocitrainer (Deutsch A1-B1)**. Same ~2,400 word vocabulary. Full rewrite of all screens and navigation. Data layer expanded with Wiktionary conjugations and Wikipedia noun images — both sourced by build-time scripts and committed to the repo. No runtime API calls.

---

## Architecture Decision

**Option B: Clean rebuild, same repo.** Keep `vocabulary.json`, `useProgress`, `useStudySession` hooks. Rewrite all screens and navigation from scratch. Build pipeline (GitHub Actions) unchanged.

---

## Navigation Structure

Single stack navigation — no tab bar.

```
app/
  index.tsx           ← Home screen
  study/[deckId].tsx  ← Flashcard study session (front + flipped back)
  details/[wordId].tsx ← Full word details ("See More")
  review.tsx          ← For Review list management
```

**Flow:**
```
Home → Study deck → [tap card to flip]
                  → [swipe right] = Pass
                  → [swipe left]  = Fail
                  → [See More]    → Details page
                                  → [Add to Review / Remove from Review]

Home → [🔍] → Search panel → select word → Details page
```

---

## Screen Designs

### 1. Home Screen

```
┌─────────────────────────────┐
│       Velocitrainer         │  ← header bar
├─────────────────────────────┤
│  [DE→EN]  ████░ 340/2400  🔍│  ← controls bar
│                             │
│  ┌─────────┐  ┌─────────┐  │
│  │Randomize│  │  Review │  │
│  │ (all)   │  │  (12)   │  │
│  └─────────┘  └─────────┘  │
│                             │
│  WORD TYPE                  │
│  [Nouns] [Verbs] [Adverbs]  │
│  [Adjectives] [Other]       │
│                             │
│  THEMATIC                   │
│  [Work] [Health] [Travel]   │
│  [Society] [Culture] ...    │
│                             │
└─────────────────────────────┘
```

**Behaviour:**
- Header bar: app name "Velocitrainer"
- Controls bar: DE→EN / EN→DE language toggle | compact progress pill | search icon
- Language toggle persists into study session
- Randomize: shuffles all ~2,400 words in random order, starts study immediately
- For Review tile: shows count of saved words; tapping starts study session on that list
- Word Type chips: scrollable row; tapping one starts study immediately for that type
- Thematic chips: scrollable row; tapping one starts study immediately for that theme
- Search icon (🔍): slides in search panel overlay

**Search panel:**
- Back arrow dismisses, returns to home
- Live dropdown populates as user types (matches German word, English translation)
- Selecting a result navigates directly to Details page for that word

---

### 2. Flashcard Study Screen (`study/[deckId].tsx`)

**Front (unflipped):**
- Word only (German or English based on home screen language toggle)
- Low-res noun image if available (centered above word)
- "Tap to reveal" hint
- Skip button (advances to next card without marking pass or fail)
- Progress bar + counter (e.g. 12/340) + completion rate at top

**Back (flipped, same card — 3D flip animation):**
- Card background tinted by gender: blue (masculine), pink (feminine), yellow (neuter), white (non-noun)
- Word type badge (Noun / Verb / Adjective / etc.)
- Meaning (translation)
- Plural form (nouns only)
- "See More" button → navigates to Details page
- "Add to Review" / "Remove from Review" toggle button
- Swipe right = Pass (known), Swipe left = Fail (unknown)
- Tap buttons also available for Pass / Fail after flip

---

### 3. Details Page (`details/[wordId].tsx`)

Full word reference — accessible from flashcard back or search. Not part of the study flow (no pass/fail here).

**Contents:**
- Gender-colored header band
- Word type badge
- German word (with article if noun)
- English meaning
- Plural form (nouns only)
- 3 sample sentences with case labels:
  - Nominative
  - Accusative
  - Dative
  - Each sentence shown in German + English
- Full tense tables (verbs only):
  - Present (Präsens)
  - Simple Past (Präteritum)
  - Present Perfect (Perfekt)
  - Past Perfect (Plusquamperfekt)
  - Future (Futur I)
  - Future Perfect (Futur II)
  - Each table: ich / du / er-sie-es / wir / ihr / sie-Sie
- "Add to Review" / "Remove from Review" toggle button

---

### 4. For Review Screen (`review.tsx`)

- List of all words currently in the review list
- Each item shows: German word, article, English meaning, word type badge
- Tap a word → Details page
- Swipe to remove from list (or a remove button)
- "Study Review Words" button → starts study session with `deckId=review`

---

## Data Architecture

### Vocabulary JSON Schema (per word)

```json
{
  "id": "unique-id",
  "german": "Arbeit",
  "article": "die",
  "english": "work, job",
  "wordType": "noun",
  "plural": "Arbeiten",
  "image": "assets/images/nouns/arbeit.jpg",
  "sentences": [
    { "case": "nominative", "de": "Die Arbeit ist wichtig.", "en": "Work is important." },
    { "case": "accusative", "de": "Ich suche die Arbeit.", "en": "I am looking for the work." },
    { "case": "dative",     "de": "Er spricht von der Arbeit.", "en": "He speaks about the work." }
  ],
  "tenses": {
    "present":          { "ich": "arbeite", "du": "arbeitest", "er": "arbeitet", "wir": "arbeiten", "ihr": "arbeitet", "sie": "arbeiten" },
    "simple_past":      { "ich": "arbeitete", ... },
    "present_perfect":  { "ich": "habe gearbeitet", ... },
    "past_perfect":     { "ich": "hatte gearbeitet", ... },
    "future":           { "ich": "werde arbeiten", ... },
    "future_perfect":   { "ich": "werde gearbeitet haben", ... }
  }
}
```

- `image` is omitted for non-nouns and nouns where no image was found
- `tenses` is omitted for non-verbs
- `sentences` targets all 3 cases; may have fewer if data unavailable

### Build-time Scripts (run once, outputs committed)

**`scripts/fetch_images.py`**
- Iterates all words where `wordType === "noun"`
- Queries Wikipedia API for the German word
- Downloads first image result at low resolution (max 200px wide)
- Saves to `assets/images/nouns/<id>.jpg`
- Updates `vocabulary.json` with `image` field
- Skips words where no image found (no fallback shown in UI)

**`scripts/fetch_conjugations.py`**
- Iterates all words where `wordType === "verb"`
- Scrapes Wiktionary German conjugation table for each verb
- Extracts all 6 tenses × 6 persons
- Updates `vocabulary.json` with `tenses` field
- Logs any verbs where data was not found for manual review

### AsyncStorage Keys

| Key | Purpose |
|-----|---------|
| `known_ids` | Set of word IDs marked as known |
| `unknown_ids` | Set of word IDs marked as unknown |
| `review_ids` | Set of word IDs added to Review Later (persistent, manual removal only) |
| `deck_positions` | Map of deckId → last index |
| `language_mode` | `"de-en"` or `"en-de"` (persists across sessions) |

---

## Gender Colour Scheme

| Gender | Article | Card background tint |
|--------|---------|---------------------|
| Masculine | der | Blue (`#DBEAFE`) |
| Feminine | die | Pink (`#FCE7F3`) |
| Neuter | das | Yellow (`#FEF9C3`) |
| Non-noun | — | White (`#FFFFFF`) |

---

## Out of Scope (v2)

- Audio pronunciation
- Spaced repetition algorithm (pass/fail scoring only)
- User accounts or cloud sync
- A1/A2 vocabulary expansion (future version)
