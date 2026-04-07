#!/usr/bin/env python3
"""
Fetch German verb conjugations from de.wiktionary.org Flexion pages.
Updates assets/data/vocabulary.json with a 'tenses' field for each verb.

Usage: python scripts/fetch_conjugations.py
Run from the repo root directory.
"""

import json
import time
import sys
from pathlib import Path

import requests
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
from bs4 import BeautifulSoup

VOCAB_PATH = Path("assets/data/vocabulary.json")
HEADERS = {"User-Agent": "VelocitrainerApp/2.0 (educational; contact: github.com/ansarijibran-dev/deutsch-b1)"}

# Order matters: check "Futur II" before "Futur I" to avoid substring match
TENSE_SECTION_LABELS = {
    "Präsens":         "present",
    "Präteritum":      "simple_past",
    "Perfekt":         "present_perfect",
    "Plusquamperfekt": "past_perfect",
    "Futur II":        "future_perfect",
    "Futur I":         "future",
}

# Maps de.wiktionary "N. Person Singular/Plural" labels to our person keys
PERSON_MAP = {
    "1. Person Singular": "ich",
    "2. Person Singular": "du",
    "3. Person Singular": "er",
    "1. Person Plural":   "wir",
    "2. Person Plural":   "ihr",
    "3. Person Plural":   "sie",
}

# Pronoun prefixes to strip from the Aktiv Indikativ cell text
PRONOUN_PREFIXES = ["ich ", "du ", "er/sie/es ", "wir ", "ihr ", "sie ", "Sie "]


def strip_pronoun(text: str) -> str:
    for prefix in PRONOUN_PREFIXES:
        if text.startswith(prefix):
            return text[len(prefix):]
    return text


def fetch_flexion_page(verb: str) -> BeautifulSoup | None:
    url = "https://de.wiktionary.org/w/api.php"
    params = {
        "action": "parse",
        "page": f"Flexion:{verb}",
        "prop": "text",
        "format": "json",
    }
    try:
        resp = requests.get(url, params=params, headers=HEADERS, timeout=10, verify=False)
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
    Extract 6 tenses × 6 persons from the Flexion page.

    de.wiktionary structure: wikitables contain tense blocks separated by
    single-cell rows naming the tense (e.g. "Präsens", "Präteritum").
    Person rows are labeled "N. Person Singular/Plural".
    We extract the Aktiv Indikativ column (cells[1]) and strip the pronoun prefix.
    """
    tenses: dict[str, dict[str, str]] = {}

    # Some verbs use class="wikitable", separable verbs use plain tables — check both
    tables = soup.find_all("table", class_="wikitable") or soup.find_all("table")
    for table in tables:
        rows = table.find_all("tr")
        current_tense_key: str | None = None

        for row in rows:
            cells = row.find_all(["td", "th"])
            if not cells:
                continue

            first_text = cells[0].get_text(separator=" ", strip=True)

            # Single-cell row → potential tense header
            if len(cells) == 1:
                for label, key in TENSE_SECTION_LABELS.items():
                    if label in first_text:
                        current_tense_key = key
                        if key not in tenses:
                            tenses[key] = {}
                        break
                continue

            # Person data row
            if current_tense_key and first_text in PERSON_MAP:
                person_key = PERSON_MAP[first_text]
                form_text = cells[1].get_text(separator=" ", strip=True)
                form = strip_pronoun(form_text).strip()
                if form:
                    tenses[current_tense_key][person_key] = form

    # Validate: exactly 6 tenses, each with 6 persons
    if len(tenses) == 6 and all(len(v) == 6 for v in tenses.values()):
        return tenses
    return None


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

        for w in vocab:
            if w["id"] == word_id:
                w["tenses"] = tenses
                break

        print("OK")
        success += 1
        time.sleep(0.3)  # be polite to Wiktionary

    print(f"\nDone: {success} succeeded, {len(failed)} failed.")
    if failed:
        print("Failed verbs (add manually or will show empty in UI):")
        for v in failed:
            print(f"  {v}")

    print(f"Saving {VOCAB_PATH}...")
    with open(VOCAB_PATH, "w", encoding="utf-8") as f:
        json.dump(vocab, f, ensure_ascii=False, indent=2)
    print("Done.")


if __name__ == "__main__":
    main()
