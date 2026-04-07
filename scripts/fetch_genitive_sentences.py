"""
fetch_genitive_sentences.py

Adds a 'genitive' sentence pair to every noun in vocabulary.json.
Uses rule-based German genitive computation + theme-appropriate templates.
No external API or network access required.

Genitive rules:
  die  → der {noun}           (unchanged)
  der  → des {noun}+s/es      (N-declension: +n/en)
  das  → des {noun}+s/es

Usage:
    py scripts/fetch_genitive_sentences.py
    py scripts/fetch_genitive_sentences.py --dry-run
"""

import json
import re
import argparse
from pathlib import Path

VOCAB_PATH = Path(__file__).parent.parent / "assets/data/vocabulary.json"

# ---------------------------------------------------------------------------
# Theme-based sentence templates  (DE, EN)
# {gp} = genitive phrase  |  {en} = English word from vocab
# ---------------------------------------------------------------------------
THEME_TEMPLATES: dict[str, tuple[str, str]] = {
    "daily_life":    ("Die Qualität {gp} ist sehr gut.",         "The quality of the {en} is very good."),
    "work":          ("Das Ergebnis {gp} war sehr positiv.",     "The result of the {en} was very positive."),
    "travel":        ("Das Ziel {gp} war weit entfernt.",        "The destination of the {en} was far away."),
    "health":        ("Wegen {gp} blieb sie zu Hause.",          "Because of the {en} she stayed home."),
    "food":          ("Der Geschmack {gp} war ausgezeichnet.",   "The taste of the {en} was excellent."),
    "education":     ("Die Bedeutung {gp} ist sehr groß.",       "The significance of the {en} is very great."),
    "technology":    ("Die Funktion {gp} ist sehr nützlich.",    "The function of the {en} is very useful."),
    "society":       ("Der Einfluss {gp} ist bekannt.",          "The influence of the {en} is well known."),
    "environment":   ("Der Schutz {gp} ist sehr wichtig.",       "The protection of the {en} is very important."),
    "relationships": ("Die Meinung {gp} war sehr klar.",         "The opinion of the {en} was very clear."),
    "culture":       ("Die Geschichte {gp} ist interessant.",    "The history of the {en} is interesting."),
    "time_numbers":  ("Das Ende {gp} kam sehr schnell.",         "The end of the {en} came very quickly."),
    "language_exam": ("Die Definition {gp} ist klar.",           "The definition of the {en} is clear."),
    "other":         ("Der Wert {gp} ist bekannt.",              "The value of the {en} is well known."),
}
FALLBACK_TEMPLATE = ("Die Bedeutung {gp} ist groß.", "The significance of the {en} is great.")

# ---------------------------------------------------------------------------
# Nouns with irregular genitives — hand-verified exceptions
# Maps German noun → genitive singular form (full phrase including article)
# ---------------------------------------------------------------------------
EXCEPTIONS: dict[str, str] = {
    # N-declension exceptions not caught by heuristics
    "Mensch":      "des Menschen",
    "Herr":        "des Herrn",
    "Nachbar":     "des Nachbarn",
    "Bauer":       "des Bauern",
    "Graf":        "des Grafen",
    "Held":        "des Helden",
    "Soldat":      "des Soldaten",
    "Präsident":   "des Präsidenten",
    "Kandidat":    "des Kandidaten",
    "Diplomat":    "des Diplomaten",
    "Demokrat":    "des Demokraten",
    # Strong nouns with irregular forms
    "Name":        "des Namens",
    "Buchstabe":   "des Buchstabens",
    "Gedanke":     "des Gedankens",
    "Glaube":      "des Glaubens",
    "Wille":       "des Willens",
    "Friede":      "des Friedens",
    "Funke":       "des Funkens",
    "Herz":        "des Herzens",
    # Nouns ending in -nis: double the s
    "Ereignis":    "des Ereignisses",
    "Ergebnis":    "des Ergebnisses",
    "Erlebnis":    "des Erlebnisses",
    "Geheimnis":   "des Geheimnisses",
    "Gefängnis":   "des Gefängnisses",
    "Tennis":      "des Tennis",
    "Verhältnis":  "des Verhältnisses",
    "Verständnis": "des Verständnisses",
    "Zeugnis":     "des Zeugnisses",
    # Nouns where rule would give wrong suffix
    "Bus":         "des Busses",
    "Fluss":       "des Flusses",
    "Kuss":        "des Kusses",
    "Stress":      "des Stresses",
    "Spaß":        "des Spaßes",
    "Fuß":         "des Fußes",
    "Maß":         "des Maßes",
    "Schloss":     "des Schlosses",
    "Floss":       "des Floßes",
    "Genuss":      "des Genusses",
}


# ---------------------------------------------------------------------------
# Rule-based genitive computation
# ---------------------------------------------------------------------------

def _is_n_declension(article: str, noun: str) -> bool:
    """Heuristic for weak (N-declension) masculine nouns."""
    if article != "der":
        return False
    lower = noun.lower()
    # Nouns ending in -e: der Junge, der Kollege, der Kunde, der Zeuge, der Bote...
    if lower.endswith("e"):
        return True
    # Common Latin/Greek-origin endings
    weak_endings = ("ist", "ent", "ant", "ot", "aut", "nom", "graph", "graf", "soph")
    return any(lower.endswith(s) for s in weak_endings)


def _needs_es(noun: str) -> bool:
    """Does a masc/neut noun require -es in genitive?
    Only sibilant endings require it; elsewhere -s is always acceptable."""
    lower = noun.lower()
    return lower[-1] in "sxzß" or lower.endswith("sch") or lower.endswith("tz")


def genitive_phrase(article: str, noun: str) -> str:
    """Return the genitive singular phrase, e.g. 'des Mannes', 'der Frau'."""
    # Hand-verified exception takes priority
    if noun in EXCEPTIONS:
        return EXCEPTIONS[noun]

    if article == "die":
        return f"der {noun}"

    # der / das
    if _is_n_declension(article, noun):
        lower = noun.lower()
        return f"des {noun}n" if lower.endswith("e") else f"des {noun}en"

    suffix = "es" if _needs_es(noun) else "s"
    return f"des {noun}{suffix}"


# ---------------------------------------------------------------------------
# Sentence builder
# ---------------------------------------------------------------------------

def build_sentence(word: dict) -> tuple[str, str]:
    article = word.get("article", "")
    noun = word["german"]
    theme = word.get("theme", "other")

    gp = genitive_phrase(article, noun)
    de_tmpl, en_tmpl = THEME_TEMPLATES.get(theme, FALLBACK_TEMPLATE)
    en_noun = word.get("english", noun)

    return de_tmpl.format(gp=gp), en_tmpl.format(en=en_noun)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="Print without saving")
    args = parser.parse_args()

    with open(VOCAB_PATH, encoding="utf-8") as f:
        vocab = json.load(f)

    nouns = [w for w in vocab if w["wordType"] == "noun"]
    already = sum(1 for w in nouns if w.get("sentences", {}).get("genitive"))
    pending = [w for w in nouns if not w.get("sentences", {}).get("genitive")]

    print(f"Total nouns: {len(nouns)}  |  already done: {already}  |  pending: {len(pending)}")

    for word in pending:
        de, en = build_sentence(word)
        gp = genitive_phrase(word.get("article", ""), word["german"])
        print(f"  {word['article']} {word['german']:25s}  {gp:30s}  {de}")
        if not args.dry_run:
            word["sentences"]["genitive"] = {"de": de, "en": en}

    if not args.dry_run:
        with open(VOCAB_PATH, "w", encoding="utf-8") as f:
            json.dump(vocab, f, ensure_ascii=False, indent=2)
        print(f"\nSaved {len(pending)} genitive sentences to {VOCAB_PATH}")
    else:
        print(f"\nDry run — {len(pending)} sentences not saved.")


if __name__ == "__main__":
    main()
