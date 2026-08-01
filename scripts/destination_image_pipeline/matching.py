from __future__ import annotations

import math
import re
import unicodedata

from .models import Candidate, Destination

STOPWORDS = {"the", "of", "and", "in", "at", "ethiopia", "ethiopian", "public", "historic", "center", "centre", "complex", "site", "grand", "royal", "hotel", "conference", "meeting", "rooms", "apartments", "facilities", "luxury", "wellness", "projects"}
BLOCKED = {"logo", "flag", "map", "diagram", "drawing", "painting", "poster", "icon", "coat of arms", "sign"}
ALIAS_FILLER = STOPWORDS | {"active","agriculture","artisans","base","belts","boating","center","city","communities","community","conservation","cultural","dock","education","executive","facilities","farming","field","grounds","hazards","high","highlands","altitude","hospital","hub","lakefront","market","memorial","metropolitan","natural","northern","outskirts","palace","pastoral","referral","rehabilitation","relief","retreat","ridge","rural","saturday","sauna","services","sports","stargazing","town","training","trek","tribal","urban","wilderness"}
CATEGORY_TERMS = {
    "religious": {"church", "cathedral", "monastery", "mosque", "religious", "sacred"},
    "nature": {"nature", "mountain", "lake", "river", "forest", "waterfall", "landscape"},
    "wildlife": {"wildlife", "animal", "sanctuary", "national park", "safari"},
    "historical": {"historical", "heritage", "palace", "castle", "monument", "archaeological"},
    "museum": {"museum", "gallery", "exhibition"},
    "urban": {"city", "urban", "square", "building", "hotel"},
    "agritourism": {"farm", "coffee", "agriculture", "plantation", "orchard"},
}
EXPERIENCE_SUFFIXES = re.compile(
    r"\b(?:big game safari|boating shore|ferry terminal|accessible seating gate|"
    r"community health centers?|desert night sky encampment|bush trekking|"
    r"off road trek|stargazing ridge|wellness retreats?|conference suites?|"
    r"convention center|meeting rooms?|public town hillside|highland hamlets?)\b",
    re.I,
)


def normalize(value: str) -> str:
    value = unicodedata.normalize("NFKD", value or "").encode("ascii", "ignore").decode()
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9]+", " ", value.casefold())).strip()


def tokens(value: str) -> set[str]:
    return {x for x in normalize(value).split() if len(x) > 2 and x not in STOPWORDS}


def aliases(d: Destination) -> list[str]:
    base = re.sub(r"\([^)]*\)", "", d.name).strip()
    subject = re.sub(r"\s+", " ", EXPERIENCE_SUFFIXES.sub("",base)).strip(" &,-")
    anchor=" ".join(x for x in normalize(base).split() if x not in ALIAS_FILLER)
    variants = [d.name, subject, base, anchor]
    substitutions = {"asella": "asela", "assosa": "asosa", "gondar": "gonder", "tana": "lake tana", "simien": "semen"}
    lowered = normalize(base)
    for old, new in substitutions.items():
        if old in lowered:
            variants.append(re.sub(old, new, base, flags=re.I))
    places = [x for x in (d.city, d.region, "Ethiopia") if x]
    result = variants + [f"{base}, {place}" for place in places]
    return list(dict.fromkeys(x.strip() for x in result if x.strip()))[:8]


def haversine_km(a: float, b: float, c: float, d: float) -> float:
    p1, p2 = math.radians(a), math.radians(c)
    dp, dl = math.radians(c - a), math.radians(d - b)
    h = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 6371.0 * 2 * math.atan2(math.sqrt(h), math.sqrt(1 - h))


def score(destination: Destination, candidate: Candidate, search_aliases: list[str]) -> float:
    title = normalize(candidate.title)
    subject_text=normalize(" ".join([candidate.title,*candidate.category_terms]))
    expected = tokens(destination.name)
    actual = tokens(candidate.title)
    exact = 1.0 if normalize(destination.name) == title else (0.8 if expected and expected <= actual else 0.0)
    overlap = len(expected & actual) / max(1, len(expected))
    alias = max((len(tokens(a) & actual) / max(1, len(tokens(a))) for a in search_aliases), default=0.0)
    proximity = 0.0
    if None not in (destination.latitude, destination.longitude, candidate.latitude, candidate.longitude):
        distance = haversine_km(destination.latitude, destination.longitude, candidate.latitude, candidate.longitude)
        proximity = 1.0 if distance <= 2 else 0.8 if distance <= 10 else 0.5 if distance <= 50 else 0.0
        if distance > 150:
            candidate.rejection_reasons.append(f"coordinates are {distance:.0f} km away")
    terms = CATEGORY_TERMS.get(normalize(destination.category), {normalize(destination.category)})
    haystack = normalize(" ".join([candidate.title, *candidate.category_terms]))
    category = 1.0 if any(normalize(t) in haystack for t in terms if t) else 0.0
    reliability = {"wikimedia": 1.0, "wikidata": 0.98, "wikipedia": 0.95, "google_places": 0.92, "openstreetmap": 0.85, "flickr": 0.75, "unsplash": 0.6}.get(candidate.source, 0.5)
    if any(word in subject_text for word in BLOCKED):
        candidate.rejection_reasons.append("blocked non-photographic subject")
    if candidate.width and candidate.height and min(candidate.width, candidate.height) < 400:
        candidate.rejection_reasons.append("image dimensions are too small")
    # Identity evidence remains useful when catalog files lack EXIF coordinates.
    # Missing coordinates cap a candidate below automatic approval (0.85), but do
    # not hide an otherwise strong candidate from manual review.
    total = exact * 0.15 + max(overlap, alias) * 0.50 + proximity * 0.20 + category * 0.05 + reliability * 0.10
    candidate.score_breakdown = {"exact_name": exact, "name_or_alias": max(overlap, alias), "proximity": proximity, "category": category, "source": reliability}
    candidate.score = round(total, 4)
    if overlap < 0.34 and alias < 0.5:
        candidate.rejection_reasons.append("insufficient name or alias overlap")
    if candidate.license.casefold() in {"", "unknown", "all rights reserved"} and candidate.source not in {"google_places", "unsplash"}:
        candidate.rejection_reasons.append("license is missing or incompatible")
    return candidate.score
