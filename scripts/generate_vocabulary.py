"""
generate_vocabulary.py

Generates assets/data/vocabulary.json from scripts/raw_words.json.

Uses the Anthropic API (claude-haiku-4-5) to produce:
  - English translation
  - Theme assignment (one of 14 Goethe B1 themes)
  - Plural form for nouns
  - 6 example sentence pairs (present/past/future + case sentences)

Processes words in batches of 20 with incremental checkpointing so
the script can be safely stopped and resumed.

Usage:
    pip install anthropic
    python scripts/generate_vocabulary.py

Set your API key via environment variable:
    set ANTHROPIC_API_KEY=sk-ant-...

Or pass it as a command-line argument:
    python scripts/generate_vocabulary.py --api-key sk-ant-...
"""

import json
import os
import sys
import time
import argparse
import hashlib
from pathlib import Path

try:
    import anthropic
except ImportError:
    print("ERROR: anthropic package not installed. Run: pip install anthropic")
    sys.exit(1)

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
SCRIPT_DIR = Path(__file__).parent
PROJECT_DIR = SCRIPT_DIR.parent
RAW_WORDS_PATH = SCRIPT_DIR / "raw_words.json"
CHECKPOINT_PATH = SCRIPT_DIR / "vocabulary_checkpoint.json"
OUTPUT_PATH = PROJECT_DIR / "assets" / "data" / "vocabulary.json"

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
BATCH_SIZE = 20
MODEL = "claude-haiku-4-5-20251001"
MAX_RETRIES = 3
RETRY_DELAY = 5  # seconds

THEMES = [
    "daily_life", "work", "travel", "health", "food",
    "education", "technology", "society", "environment",
    "relationships", "culture", "time_numbers", "language_exam", "other"
]

THEME_HINTS = """
- daily_life: home, routines, household items, daily activities
- work: jobs, workplace, employment, career
- travel: transport, directions, accommodation, tourism
- health: body, illness, medical, wellbeing
- food: eating, drinking, cooking, shopping for groceries
- education: school, learning, qualifications, studying
- technology: computers, internet, devices, digital
- society: politics, community, institutions, law
- environment: nature, weather, animals, ecology
- relationships: family, friends, social interaction, emotions
- culture: art, media, entertainment, music, literature
- time_numbers: dates, time expressions, quantities, numbers
- language_exam: exam instructions, abbreviations, meta-language
- other: words that don't fit the above
"""

# ---------------------------------------------------------------------------
# Prompt building
# ---------------------------------------------------------------------------

def build_prompt(words: list[dict]) -> str:
    word_list = json.dumps(words, ensure_ascii=False, indent=2)
    return f"""You are a German language expert generating data for a B1 flashcard app.

For each word in the JSON array below, produce a JSON object with these fields:

For ALL words:
- "german": the word exactly as given (copy from input)
- "english": concise English translation (1-4 words, no articles in translation)
- "theme": one of {THEMES}
- "sentences": object with 6 sentence pairs

Theme guide:
{THEME_HINTS}

Sentence structure for NOUNS (wordType = "noun"):
  "sentences": {{
    "present":    {{"de": "...", "en": "..."}},
    "past":       {{"de": "...", "en": "..."}},
    "future":     {{"de": "...", "en": "..."}},
    "nominative": {{"de": "...", "en": "..."}},
    "accusative": {{"de": "...", "en": "..."}},
    "dative":     {{"de": "...", "en": "..."}}
  }}

Sentence structure for ALL OTHER word types (verbs, adjectives, adverbs, etc.):
  "sentences": {{
    "present":  {{"de": "...", "en": "..."}},
    "past":     {{"de": "...", "en": "..."}},
    "future":   {{"de": "...", "en": "..."}},
    "usage1":   {{"de": "...", "en": "..."}},
    "usage2":   {{"de": "...", "en": "..."}},
    "usage3":   {{"de": "...", "en": "..."}}
  }}

Sentence rules:
- Each sentence must clearly use the target word
- Keep sentences SHORT and simple (B1 level, 6-12 words in German)
- For nouns: nominative/accusative/dative sentences must demonstrate that specific grammatical case
- For verbs: usage1/2/3 can show different contexts or meanings
- All sentences must have accurate English translations

For NOUNS additionally include:
- "plural": German plural form (e.g. "die Häuser"), or null if no plural exists
  (use the pluralHint from input if available, otherwise use your knowledge)

For VERBS additionally include:
- "verbForms": copy exactly from the input (already extracted from PDF)

Words to process:
{word_list}

Return ONLY a JSON array — no markdown, no explanation, no code fences.
Each element must correspond to the input word at the same index.
Include ALL fields: german, english, theme, sentences, plus plural (nouns) or verbForms (verbs).
"""


# ---------------------------------------------------------------------------
# ID generation
# ---------------------------------------------------------------------------

def make_id(german: str, idx: int) -> str:
    slug = german.lower().replace(" ", "_").replace("ä", "ae").replace("ö", "oe").replace("ü", "ue").replace("ß", "ss")
    # Keep only alphanum and underscore
    slug = "".join(c for c in slug if c.isalnum() or c == "_")
    return f"{slug}_{idx}"


# ---------------------------------------------------------------------------
# Word type normalisation
# ---------------------------------------------------------------------------

WORD_TYPE_MAP = {
    "noun": "noun",
    "verb": "verb",
    "adjective": "adjective",
    "adverb": "adverb",
    "preposition": "preposition",
    "conjunction": "conjunction",
    "other": "other",
}

def normalise_word_type(raw_type: str) -> str:
    return WORD_TYPE_MAP.get(raw_type.lower(), "other")


# ---------------------------------------------------------------------------
# Checkpoint helpers
# ---------------------------------------------------------------------------

def load_checkpoint() -> dict:
    if CHECKPOINT_PATH.exists():
        with open(CHECKPOINT_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"completed_ids": [], "results": []}


def save_checkpoint(checkpoint: dict) -> None:
    with open(CHECKPOINT_PATH, "w", encoding="utf-8") as f:
        json.dump(checkpoint, f, ensure_ascii=False, indent=2)


# ---------------------------------------------------------------------------
# API call with retry
# ---------------------------------------------------------------------------

def call_api(client: anthropic.Anthropic, words: list[dict]) -> list[dict]:
    prompt = build_prompt(words)
    last_error = None

    for attempt in range(MAX_RETRIES):
        try:
            message = client.messages.create(
                model=MODEL,
                max_tokens=4096,
                messages=[{"role": "user", "content": prompt}]
            )
            raw = message.content[0].text.strip()

            # Strip markdown code fences if present
            if raw.startswith("```"):
                lines = raw.split("\n")
                raw = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])

            result = json.loads(raw)
            if not isinstance(result, list):
                raise ValueError(f"Expected JSON array, got {type(result)}")
            return result

        except (json.JSONDecodeError, ValueError) as e:
            last_error = e
            print(f"  [attempt {attempt+1}] Parse error: {e}. Retrying...")
            time.sleep(RETRY_DELAY)
        except anthropic.RateLimitError:
            wait = RETRY_DELAY * (attempt + 2)
            print(f"  [attempt {attempt+1}] Rate limit. Waiting {wait}s...")
            time.sleep(wait)
        except anthropic.APIError as e:
            last_error = e
            print(f"  [attempt {attempt+1}] API error: {e}. Retrying...")
            time.sleep(RETRY_DELAY)

    raise RuntimeError(f"Failed after {MAX_RETRIES} attempts. Last error: {last_error}")


# ---------------------------------------------------------------------------
# Merge raw word with API result
# ---------------------------------------------------------------------------

def merge_word(raw: dict, api_result: dict, idx: int) -> dict:
    word_type = normalise_word_type(raw.get("wordType", "other"))

    entry = {
        "id": make_id(raw["german"], idx),
        "german": raw["german"],
        "article": raw.get("article"),
        "english": api_result.get("english", ""),
        "wordType": word_type,
        "plural": None,
        "theme": api_result.get("theme", "other"),
        "sentences": api_result.get("sentences", {}),
    }

    if word_type == "noun":
        entry["plural"] = api_result.get("plural") or raw.get("pluralHint")

    if word_type == "verb":
        # Prefer verbForms from raw (extracted from PDF), fall back to API
        entry["verbForms"] = raw.get("verbForms") or api_result.get("verbForms")

    # Validate theme
    if entry["theme"] not in THEMES:
        entry["theme"] = "other"

    return entry


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Generate vocabulary.json for Deutsch B1 app")
    parser.add_argument("--api-key", help="Anthropic API key (or set ANTHROPIC_API_KEY env var)")
    parser.add_argument("--batch-size", type=int, default=BATCH_SIZE, help=f"Words per API call (default: {BATCH_SIZE})")
    parser.add_argument("--reset", action="store_true", help="Ignore checkpoint and start fresh")
    args = parser.parse_args()

    api_key = args.api_key or os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("ERROR: Anthropic API key required.")
        print("  Set ANTHROPIC_API_KEY environment variable, or use --api-key flag.")
        print("  Get a key at: https://console.anthropic.com/")
        sys.exit(1)

    client = anthropic.Anthropic(api_key=api_key)

    # Load raw words
    with open(RAW_WORDS_PATH, "r", encoding="utf-8") as f:
        raw_words = json.load(f)
    print(f"Loaded {len(raw_words)} raw words from {RAW_WORDS_PATH}")

    # Load or reset checkpoint
    if args.reset and CHECKPOINT_PATH.exists():
        CHECKPOINT_PATH.unlink()
        print("Checkpoint cleared.")

    checkpoint = load_checkpoint()
    completed_ids = set(checkpoint["completed_ids"])
    results = checkpoint["results"]

    # Determine which words still need processing
    pending = [(i, w) for i, w in enumerate(raw_words) if make_id(w["german"], i) not in completed_ids]
    print(f"Already done: {len(completed_ids)} | Remaining: {len(pending)}")

    if not pending:
        print("All words already processed. Writing output...")
    else:
        batch_size = args.batch_size
        total_batches = (len(pending) + batch_size - 1) // batch_size

        for batch_num in range(total_batches):
            batch = pending[batch_num * batch_size : (batch_num + 1) * batch_size]
            batch_indices = [i for i, _ in batch]
            batch_words = [w for _, w in batch]

            print(f"\nBatch {batch_num + 1}/{total_batches} ({len(batch_words)} words): "
                  f"{batch_words[0]['german']} ... {batch_words[-1]['german']}")

            try:
                api_results = call_api(client, batch_words)
            except RuntimeError as e:
                print(f"FATAL: {e}")
                print("Checkpoint saved. Re-run the script to resume.")
                save_checkpoint(checkpoint)
                sys.exit(1)

            # Merge results
            for (idx, raw_word), api_result in zip(batch, api_results):
                try:
                    merged = merge_word(raw_word, api_result, idx)
                    results.append(merged)
                    completed_ids.add(merged["id"])
                except Exception as e:
                    print(f"  WARNING: Failed to merge word '{raw_word['german']}': {e}")
                    # Add a minimal fallback entry so we don't lose the word
                    fallback = merge_word(raw_word, {
                        "english": raw_word["german"],
                        "theme": "other",
                        "sentences": {
                            "present": {"de": "", "en": ""},
                            "past": {"de": "", "en": ""},
                            "future": {"de": "", "en": ""},
                            "nominative": {"de": "", "en": ""} if raw_word.get("wordType") == "noun" else None,
                            "accusative": {"de": "", "en": ""} if raw_word.get("wordType") == "noun" else None,
                            "dative": {"de": "", "en": ""} if raw_word.get("wordType") == "noun" else None,
                            "usage1": {"de": "", "en": ""} if raw_word.get("wordType") != "noun" else None,
                            "usage2": {"de": "", "en": ""} if raw_word.get("wordType") != "noun" else None,
                            "usage3": {"de": "", "en": ""} if raw_word.get("wordType") != "noun" else None,
                        }
                    }, idx)
                    results.append(fallback)
                    completed_ids.add(fallback["id"])

            checkpoint["completed_ids"] = list(completed_ids)
            checkpoint["results"] = results
            save_checkpoint(checkpoint)

            done = len(completed_ids)
            total = len(raw_words)
            print(f"  Progress: {done}/{total} ({100*done//total}%)")

            # Small delay between batches to stay within rate limits
            if batch_num < total_batches - 1:
                time.sleep(1)

    # Write final output
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    # Sort by id for deterministic output
    results_sorted = sorted(results, key=lambda w: w["id"])

    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(results_sorted, f, ensure_ascii=False, indent=2)

    print(f"\nDone! {len(results_sorted)} words written to {OUTPUT_PATH}")
    print(f"Checkpoint at {CHECKPOINT_PATH} can be deleted if satisfied with output.")


if __name__ == "__main__":
    main()
