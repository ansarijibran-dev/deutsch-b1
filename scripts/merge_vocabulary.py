"""
merge_vocabulary.py

Merges all batch_XX_output.json files into assets/data/vocabulary.json.

Run this after all 14 batch agents have completed:
    python scripts/merge_vocabulary.py
"""

import json
import os
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
PROJECT_DIR = SCRIPT_DIR.parent
OUTPUT_PATH = PROJECT_DIR / "assets" / "data" / "vocabulary.json"

def main():
    all_words = []
    missing = []

    for i in range(1, 15):
        path = SCRIPT_DIR / f"batch_{i:02d}_output.json"
        if not path.exists():
            missing.append(f"batch_{i:02d}_output.json")
            continue
        with open(path, "r", encoding="utf-8") as f:
            batch = json.load(f)
        all_words.extend(batch)
        print(f"  batch_{i:02d}: {len(batch)} words loaded")

    if missing:
        print(f"\nWARNING: {len(missing)} batch file(s) not yet ready: {missing}")
        print("Wait for those agents to finish and re-run this script.")
        if not all_words:
            return

    print(f"\nTotal words: {len(all_words)}")

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(all_words, f, ensure_ascii=False, indent=2)

    print(f"Written to {OUTPUT_PATH}")
    print("Done! You can now build the app.")

if __name__ == "__main__":
    main()
