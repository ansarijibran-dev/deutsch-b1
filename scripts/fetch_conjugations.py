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
