"""
fetch_genitive_sentences.py

Adds a 'genitive' sentence pair to every noun in vocabulary.json.
Uses claude-haiku to generate B1-level example sentences showing
the genitive case for each noun.

Usage:
    set ANTHROPIC_API_KEY=sk-ant-...
    py scripts/fetch_genitive_sentences.py

Resumes automatically from checkpoint if interrupted.
"""

import json
import os
import sys
import time
import argparse
from pathlib import Path

try:
    import anthropic
except ImportError:
    print("ERROR: anthropic package not installed. Run: pip install anthropic")
    sys.exit(1)

VOCAB_PATH = Path(__file__).parent.parent / "assets/data/vocabulary.json"
CHECKPOINT_PATH = Path(__file__).parent / "genitive_checkpoint.json"

BATCH_SIZE = 50
MODEL = "claude-haiku-4-5-20251001"
MAX_RETRIES = 3
RETRY_DELAY = 5


def build_prompt(nouns: list[dict]) -> str:
    items = json.dumps(
        [{"id": n["id"], "german": n["german"], "article": n["article"]} for n in nouns],
        ensure_ascii=False, indent=2
    )
    return f"""You are a German language expert writing example sentences for a B1 flashcard app.

For each noun below, write one short German sentence (6-12 words) that clearly demonstrates
the GENITIVE CASE for that noun, plus its English translation.

Rules:
- The noun must appear in the genitive case in the sentence (e.g. "des Mannes", "der Frau", "eines Kindes")
- Keep sentences simple and natural — B1 level
- Common genitive patterns: possession ("das Auto des Mannes"), after prepositions (wegen, trotz, während, statt, aufgrund), after certain adjectives
- The English translation must be accurate and natural

Input:
{items}

Return ONLY a JSON array in the same order as the input. Each element:
{{"id": "...", "de": "...", "en": "..."}}

No markdown, no explanation, no code fences.
"""


def call_api(client: anthropic.Anthropic, nouns: list[dict]) -> list[dict]:
    prompt = build_prompt(nouns)
    last_error = None

    for attempt in range(MAX_RETRIES):
        try:
            message = client.messages.create(
                model=MODEL,
                max_tokens=4096,
                messages=[{"role": "user", "content": prompt}]
            )
            raw = message.content[0].text.strip()
            if raw.startswith("```"):
                lines = raw.split("\n")
                raw = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
            result = json.loads(raw)
            if not isinstance(result, list):
                raise ValueError(f"Expected list, got {type(result)}")
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


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--api-key")
    parser.add_argument("--reset", action="store_true")
    args = parser.parse_args()

    api_key = args.api_key or os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("ERROR: Set ANTHROPIC_API_KEY or use --api-key")
        sys.exit(1)

    client = anthropic.Anthropic(api_key=api_key)

    with open(VOCAB_PATH, encoding="utf-8") as f:
        vocab = json.load(f)

    nouns = [w for w in vocab if w["wordType"] == "noun"]
    print(f"Total nouns: {len(nouns)}")

    # Load checkpoint
    if args.reset and CHECKPOINT_PATH.exists():
        CHECKPOINT_PATH.unlink()
        print("Checkpoint cleared.")

    checkpoint: dict = {"done_ids": []}
    if CHECKPOINT_PATH.exists():
        with open(CHECKPOINT_PATH, encoding="utf-8") as f:
            checkpoint = json.load(f)
    done_ids = set(checkpoint["done_ids"])

    # Build index for fast lookup
    vocab_by_id = {w["id"]: w for w in vocab}

    pending = [n for n in nouns if n["id"] not in done_ids]
    print(f"Already done: {len(done_ids)} | Remaining: {len(pending)}")

    total_batches = (len(pending) + BATCH_SIZE - 1) // BATCH_SIZE

    for batch_num in range(total_batches):
        batch = pending[batch_num * BATCH_SIZE : (batch_num + 1) * BATCH_SIZE]
        print(f"\nBatch {batch_num+1}/{total_batches} ({len(batch)} nouns): "
              f"{batch[0]['german']} ... {batch[-1]['german']}")

        try:
            results = call_api(client, batch)
        except RuntimeError as e:
            print(f"FATAL: {e}")
            _save_checkpoint(checkpoint, CHECKPOINT_PATH)
            _save_vocab(vocab, VOCAB_PATH)
            sys.exit(1)

        for item in results:
            word_id = item.get("id")
            de = item.get("de", "").strip()
            en = item.get("en", "").strip()
            if word_id and de and en and word_id in vocab_by_id:
                vocab_by_id[word_id]["sentences"]["genitive"] = {"de": de, "en": en}
                done_ids.add(word_id)
            else:
                print(f"  WARNING: bad result for id={word_id!r}")

        checkpoint["done_ids"] = list(done_ids)
        _save_checkpoint(checkpoint, CHECKPOINT_PATH)

        done_total = len(done_ids)
        total_nouns = len(nouns)
        print(f"  Progress: {done_total}/{total_nouns} ({100*done_total//total_nouns}%)")

        if batch_num < total_batches - 1:
            time.sleep(1)

    _save_vocab(vocab, VOCAB_PATH)
    print(f"\nDone! Genitive sentences added to {VOCAB_PATH}")
    print(f"Checkpoint at {CHECKPOINT_PATH} can be deleted if satisfied.")


def _save_checkpoint(checkpoint: dict, path: Path) -> None:
    with open(path, "w", encoding="utf-8") as f:
        json.dump(checkpoint, f, ensure_ascii=False, indent=2)


def _save_vocab(vocab: list, path: Path) -> None:
    print(f"Saving {path}...")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(vocab, f, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    main()
