# scripts/extract_pdf.py
"""
Extracts raw word entries from Goethe-Zertifikat_B1_Wortliste.pdf.
Outputs scripts/raw_words.json with German word, article, word type,
plural hint, and verb conjugation forms parsed from the PDF format.

Run from deutsch-b1/ project root:
    py scripts/extract_pdf.py
"""
import re
import json
import sys
from pathlib import Path

try:
    import fitz  # PyMuPDF
except ImportError:
    sys.exit("Install PyMuPDF first:  pip install pymupdf")

PDF_PATH = Path(__file__).parent.parent.parent / "Goethe-Zertifikat_B1_Wortliste.pdf"
OUTPUT_PATH = Path(__file__).parent / "raw_words.json"

# Alphabetical section: pages 16-104 (0-indexed: 15-103)
ALPHA_START = 15
ALPHA_END = 104

# Patterns for identifying entry types
ARTICLE_RE = re.compile(r'^(der|die|das)\s+([\wÄÖÜäöüß\-]+)(.*)', re.UNICODE)
# Verb pattern: word, conjugated form, past form, hat/ist participle
VERB_RE = re.compile(
    r'^([\wÄÖÜäöüß]+(?:\s*[\wÄÖÜäöüß]*)?),\s+'
    r'([\wÄÖÜäöüß]+(?:\s+[\wÄÖÜäöüß]+)?),\s*'
    r'([\wÄÖÜäöüß]+(?:\s+[\wÄÖÜäöüß]+)?),\s*'
    r'(hat|ist)\s+([\wÄÖÜäöüß]+)',
    re.UNICODE
)
SKIP_RE = re.compile(r'^(WORTLISTE|ZERTIFIKAT|VS_03|B1|B2|A1|A2|C1|C2)$')
PAGE_NUM_RE = re.compile(r'^\d{1,3}$')
SENTENCE_RE = re.compile(r'^\d+\.\s')
SECTION_LETTER_RE = re.compile(r'^[A-ZÄÖÜ]$')


def parse_plural(rest: str) -> str | None:
    """Extract plural hint from the remainder after article + noun."""
    rest = rest.strip()
    if not rest:
        return None
    # Common patterns: -e, -en, -n, -s, ¨-e, ¨-er, - (no change), (Pl.)
    m = re.match(r'^[,\s]*(¨?-[\wäöüß]*|–|\(Pl\.\))', rest)
    if m:
        hint = m.group(1)
        if hint in ('-', '–'):
            return '-'
        return hint
    return None


def extract_all_text() -> str:
    """Extract and join all text from the alphabetical pages."""
    doc = fitz.open(PDF_PATH)
    all_lines = []
    for page_num in range(ALPHA_START, ALPHA_END):
        page = doc[page_num]
        text = page.get_text()
        lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
        all_lines.extend(lines)
    doc.close()
    return all_lines


def join_multiline_entries(lines: list[str]) -> list[str]:
    """Join lines that are continuations of verb entries or other multi-line entries."""
    joined = []
    i = 0
    while i < len(lines):
        line = lines[i]
        # Skip headers, page numbers, sentence examples, section letters
        if SKIP_RE.match(line) or PAGE_NUM_RE.match(line) or SENTENCE_RE.match(line) or SECTION_LETTER_RE.match(line):
            i += 1
            continue

        # Check if next lines are continuations (don't start a new entry)
        combined = line
        while i + 1 < len(lines):
            next_line = lines[i + 1]
            if (SKIP_RE.match(next_line) or PAGE_NUM_RE.match(next_line) or
                SENTENCE_RE.match(next_line) or SECTION_LETTER_RE.match(next_line)):
                break
            # If next line starts with article or looks like a new entry, stop
            if ARTICLE_RE.match(next_line):
                break
            # If next line starts with a lowercase word followed by comma (new verb entry)
            if re.match(r'^[a-zäöüß][\wäöüß]*(?:\s[\wäöüß]+)?,\s', next_line):
                break
            # If the current combined line already has "hat/ist + participle", stop
            if re.search(r'(hat|ist)\s+[\wÄÖÜäöüß]+$', combined):
                break
            # Continuation line
            combined = combined.rstrip() + ' ' + next_line
            i += 1
        joined.append(combined)
        i += 1
    return joined


def extract_words() -> list[dict]:
    raw_lines = extract_all_text()
    entries = join_multiline_entries(raw_lines)

    words: list[dict] = []
    seen: set[str] = set()

    for entry in entries:
        # Try noun pattern
        m = ARTICLE_RE.match(entry)
        if m:
            article, word, rest = m.groups()
            key = f"{article}_{word}"
            if key not in seen:
                seen.add(key)
                words.append({
                    "german": word,
                    "article": article,
                    "wordType": "noun",
                    "pluralHint": parse_plural(rest),
                    "verbForms": None,
                })
            continue

        # Try verb pattern
        m = VERB_RE.match(entry)
        if m:
            infinitive = m.group(1).strip()
            present_3sg = m.group(2).strip()
            simple_past = m.group(3).strip()
            aux = m.group(4)
            participle = m.group(5)
            if infinitive not in seen:
                seen.add(infinitive)
                words.append({
                    "german": infinitive,
                    "article": None,
                    "wordType": "verb",
                    "pluralHint": None,
                    "verbForms": {
                        "present_3sg": present_3sg,
                        "simple_past": simple_past,
                        "perfect": f"{aux} {participle}",
                        "future": f"wird {infinitive}",
                    },
                })
            continue

        # Try to catch other words (adjectives, adverbs, prepositions, etc.)
        # These are typically single words or short entries without articles
        clean = entry.split('(')[0].strip().split('→')[0].strip()
        # Single word or hyphenated
        if re.match(r'^[a-zäöüß][\wäöüß\-]*$', clean) and len(clean) > 1:
            if clean not in seen:
                seen.add(clean)
                words.append({
                    "german": clean,
                    "article": None,
                    "wordType": "other",
                    "pluralHint": None,
                    "verbForms": None,
                })

    print(f"Extracted {len(words)} words from {ALPHA_END - ALPHA_START} pages")
    types = {}
    for w in words:
        t = w['wordType']
        types[t] = types.get(t, 0) + 1
    print(f"Types: {types}")
    return words


if __name__ == "__main__":
    results = extract_words()
    OUTPUT_PATH.write_text(
        json.dumps(results, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"Saved -> {OUTPUT_PATH}")
