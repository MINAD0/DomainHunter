from __future__ import annotations

import re


COMMERCIAL_TERMS = {
    "cleaning",
    "repair",
    "install",
    "installation",
    "roofing",
    "plumbing",
    "hvac",
    "fence",
    "law",
    "lawyer",
    "dentist",
    "medical",
    "contractor",
    "remodel",
    "landscaping",
    "pest",
    "moving",
    "storage",
    "security",
    "marketing",
    "insurance",
}


def score_domain(*, domain: str, city: str, niche: str) -> int:
    label, _, tld = domain.lower().partition(".")
    city_slug = _slug(city)
    niche_words = [_slug(part) for part in re.findall(r"[a-zA-Z]+", niche)]
    score = 0

    if tld == "com":
        score += 25
    if label.startswith(city_slug):
        score += 15
    elif city_slug and city_slug in label:
        score += 3
    if all(word and word in label for word in niche_words):
        score += 20
    score += _length_score(len(label))
    if any(word in COMMERCIAL_TERMS for word in niche_words):
        score += 15
    if _easy_to_read(label):
        score += 10
    return min(score, 100)


def _length_score(length: int) -> int:
    if length <= 16:
        return 15
    if length <= 20:
        return 10
    if length <= 24:
        return 3
    if length <= 30:
        return 1
    return 0


def _easy_to_read(label: str) -> bool:
    return not re.search(r"([a-z])\1{2,}", label) and not re.search(r"[aeiou]{4,}", label)


def _slug(value: str) -> str:
    return re.sub(r"[^a-z0-9]", "", value.lower())

