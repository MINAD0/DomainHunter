from __future__ import annotations

import re

from backend.models import DomainCandidate, GeoStyle


TRADEMARK_RISK_WORDS = {
    "amazon",
    "apple",
    "facebook",
    "google",
    "instagram",
    "meta",
    "microsoft",
    "netflix",
    "tesla",
    "tiktok",
    "twitter",
    "xbox",
    "youtube",
}

STYLE_KEYWORDS: dict[GeoStyle, list[str]] = {
    GeoStyle.EXACT_MATCH: [],
    GeoStyle.SERVICE_BASED: ["service", "repair", "install"],
    GeoStyle.LEAD_GENERATION: ["leads", "quotes", "pros"],
    GeoStyle.PREMIUM_GEO: ["experts", "pros", "company"],
}


def generate_geo_domains(
    *,
    country: str,
    cities: list[str],
    niche: str,
    tlds: list[str],
    count: int,
    style: GeoStyle,
    ai_ideas: list[str] | None = None,
) -> list[DomainCandidate]:
    candidates: list[DomainCandidate] = []
    seen: set[str] = set()
    clean_tlds = [_normalize_tld(tld) for tld in tlds]

    for city in cities:
        city_words = _words(city)
        niche_words = _words(niche)
        service = niche_words[-1:] or niche_words
        keyword = niche_words[:-1] or niche_words
        patterns = _patterns_for(style, city_words, niche_words, service, keyword)

        for idea in ai_ideas or []:
            idea_words = _words(idea)
            if idea_words:
                patterns.append(idea_words)

        for words in patterns:
            label = _clean_label(words)
            if not label:
                continue
            for tld in clean_tlds:
                domain = f"{label}{tld}"
                if domain in seen:
                    continue
                seen.add(domain)
                candidates.append(
                    DomainCandidate(domain=domain, city=city, niche=niche, tld=tld)
                )
                if len(candidates) >= count:
                    return candidates
    return candidates


def _patterns_for(
    style: GeoStyle,
    city_words: list[str],
    niche_words: list[str],
    service: list[str],
    keyword: list[str],
) -> list[list[str]]:
    exact = [
        [*city_words, *niche_words],
        [*niche_words, *city_words],
    ]
    service_based = [
        [*city_words, *service],
        [*service, *city_words],
        [*city_words, *keyword, *service],
    ]
    lead_generation = [
        [*city_words, *service, "leads"],
        [*city_words, *service, "quotes"],
        [*service, *city_words],
    ]
    premium = [
        [*city_words, *niche_words],
        [*niche_words, *city_words],
        [*city_words, *service, "pros"],
        [*city_words, *service, "experts"],
    ]
    if style == GeoStyle.EXACT_MATCH:
        return exact
    if style == GeoStyle.SERVICE_BASED:
        return [*exact, *service_based]
    if style == GeoStyle.LEAD_GENERATION:
        return [*exact, *lead_generation]
    return [*premium, *service_based]


def _words(value: str) -> list[str]:
    return [word.lower() for word in re.findall(r"[a-zA-Z]+", value)]


def _clean_label(words: list[str]) -> str | None:
    clean_words = [_slug(word) for word in words]
    clean_words = [word for word in clean_words if word]
    if not clean_words:
        return None
    if any(word in TRADEMARK_RISK_WORDS for word in clean_words):
        return None
    if len(clean_words) > 4:
        return None
    label = "".join(clean_words)
    if len(label) > 32:
        return None
    if not re.fullmatch(r"[a-z]+", label):
        return None
    if re.search(r"([a-z])\1{3,}", label):
        return None
    return label


def _slug(value: str) -> str:
    return re.sub(r"[^a-z]", "", value.lower())


def _normalize_tld(value: str) -> str:
    cleaned = value.strip().lower()
    if not cleaned.startswith("."):
        cleaned = f".{cleaned}"
    return cleaned

