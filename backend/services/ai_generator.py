from __future__ import annotations

import json
import re
from typing import Any

import httpx


class AiGenerationError(Exception):
    pass


SERVICE_VARIANTS: dict[str, list[str]] = {
    "cleaning": [
        "warehouse cleaning",
        "facility cleaning",
        "commercial cleaning",
        "plant cleaning",
        "janitorial",
    ],
    "repair": [
        "emergency repair",
        "home repair",
        "commercial repair",
        "maintenance repair",
    ],
    "roofing": [
        "roof repair",
        "roof replacement",
        "commercial roofing",
        "flat roofing",
    ],
    "plumbing": [
        "drain cleaning",
        "emergency plumbing",
        "commercial plumbing",
        "water heater service",
    ],
    "marketing": [
        "digital marketing",
        "seo marketing",
        "local marketing",
        "growth marketing",
    ],
}

STYLE_MODIFIERS: dict[str, list[str]] = {
    "exact match": [],
    "service based": ["commercial", "local", "professional"],
    "lead generation": ["quotes", "estimates", "pros"],
    "premium geo": ["commercial", "elite", "prime"],
}

BLOCKED_SEED_WORDS = {
    "cheap",
    "free",
    "quotes",
    "quote",
    "coupon",
    "discount",
}


async def generate_ai_domain_ideas(
    *,
    settings: dict[str, Any],
    city: str,
    niche: str,
    tlds: list[str],
    count: int,
    style: str,
) -> list[str]:
    ai_settings = settings.get("ai", {})
    provider = str(ai_settings.get("provider", "openrouter")).lower()
    api_keys = ai_settings.get("api_keys", {})
    api_key = api_keys.get(provider, "")
    if not api_key and provider != "custom":
        return _fallback_ideas(niche=niche, style=style, count=count)

    prompt = _build_prompt(city=city, niche=niche, tlds=tlds, count=count, style=style)
    model = ai_settings.get("model") or _default_model(provider)
    try:
        if provider == "openai":
            content = await _post_openai(api_key, model, prompt)
        elif provider == "gemini":
            content = await _post_gemini(api_key, model, prompt)
        elif provider == "claude":
            content = await _post_claude(api_key, model, prompt)
        elif provider == "custom":
            content = await _post_custom(ai_settings, prompt)
        else:
            content = await _post_openrouter(api_key, model, prompt)
    except Exception:
        return _fallback_ideas(niche=niche, style=style, count=count)
    ideas = build_ai_seed_ideas_from_response(
        content=content,
        niche=niche,
        style=style,
        count=count,
    )
    return ideas or _fallback_ideas(niche=niche, style=style, count=count)


def _build_prompt(*, city: str, niche: str, tlds: list[str], count: int, style: str) -> str:
    return (
        "You are helping a geo-domain generator. "
        "Return JSON only with optional arrays named services, modifiers, related, premium, avoid, and keywords. "
        "These are keyword seeds for domain creation, not final domains. "
        "Do not include TLDs, city names, hyphens, numbers, trademarks, or weird spelling.\n"
        f"City: {city}\n"
        f"Niche: {niche}\n"
        f"TLDs: {', '.join(tlds)}\n"
        f"Number: {count}\n"
        f"Style: {style}\n"
        "Example JSON: "
        '{"services":["warehouse cleaning","facility cleaning"],'
        '"modifiers":["commercial"],'
        '"related":["janitorial"],'
        '"avoid":["cheap","quotes"]}'
    )


async def _post_openrouter(api_key: str, model: str, prompt: str) -> str:
    payload = {
        "model": model or "openrouter/free",
        "messages": [
            {"role": "system", "content": "Return only compact JSON keyword seeds for domain generation."},
            {"role": "user", "content": prompt},
        ],
        "response_format": {"type": "json_object"},
        "temperature": 0.4,
    }
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={"Authorization": f"Bearer {api_key}"},
            json=payload,
        )
        response.raise_for_status()
        data = response.json()
    try:
        return data["choices"][0]["message"]["content"]
    except Exception:
        return str(data) if data is not None else ""


async def _post_openai(api_key: str, model: str, prompt: str) -> str:
    payload = {
        "model": model or "gpt-4.1-mini",
        "messages": [
            {"role": "system", "content": "Return only compact JSON keyword seeds for domain generation."},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.4,
    }
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {api_key}"},
            json=payload,
        )
        response.raise_for_status()
        data = response.json()
    try:
        return data["choices"][0]["message"]["content"]
    except Exception:
        return str(data) if data is not None else ""


async def _post_gemini(api_key: str, model: str, prompt: str) -> str:
    selected = model or "gemini-1.5-flash"
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{selected}:generateContent"
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            url,
            params={"key": api_key},
            json={"contents": [{"parts": [{"text": prompt}]}]},
        )
        response.raise_for_status()
        data = response.json()
    try:
        return data["candidates"][0]["content"]["parts"][0]["text"]
    except Exception:
        return str(data) if data is not None else ""


async def _post_claude(api_key: str, model: str, prompt: str) -> str:
    payload = {
        "model": model or "claude-3-5-haiku-latest",
        "max_tokens": 800,
        "messages": [{"role": "user", "content": prompt}],
    }
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json=payload,
        )
        response.raise_for_status()
        data = response.json()
    try:
        return "".join(part.get("text", "") for part in data.get("content", []))
    except Exception:
        return str(data) if data is not None else ""


async def _post_custom(ai_settings: dict[str, Any], prompt: str) -> str:
    endpoint = ai_settings.get("custom_endpoint")
    if not endpoint:
        raise AiGenerationError("Custom endpoint is not configured.")
    api_key = ai_settings.get("api_keys", {}).get("custom", "")
    headers = {"Authorization": f"Bearer {api_key}"} if api_key else {}
    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(endpoint, json={"prompt": prompt}, headers=headers)
        response.raise_for_status()
        data = response.json()
    if isinstance(data, dict):
        try:
            return str(data.get("content") or data.get("text") or json.dumps(data))
        except Exception:
            return json.dumps(data)
    return str(data)


def build_ai_seed_ideas_from_response(
    *,
    content: str,
    niche: str,
    style: str,
    count: int,
) -> list[str]:
    data = _load_ai_json(content)
    niche_words = _clean_phrase(niche).split()
    if not niche_words:
        return []
    niche_phrase = " ".join(niche_words)
    service = niche_words[-1]
    style_key = style.strip().lower()

    raw_services = _extract_phrases(data, "services")
    raw_related = _extract_phrases(data, "related")
    raw_premium = _extract_phrases(data, "premium")
    raw_keywords = _extract_phrases(data, "keywords")
    raw_modifiers = _extract_phrases(data, "modifiers")
    raw_avoid = _token_set(_extract_phrases(data, "avoid"))
    raw_ideas = _extract_phrases(data, "ideas") + _extract_phrases(data, "domains")

    seeds: list[str] = [niche_phrase]
    seeds.extend(_fallback_variant_seeds(service))
    seeds.extend(raw_services)
    seeds.extend(raw_related)
    seeds.extend(raw_premium)
    seeds.extend(raw_keywords)
    seeds.extend(raw_ideas)

    for modifier in [*STYLE_MODIFIERS.get(style_key, []), *raw_modifiers]:
        clean_modifier = _clean_phrase(modifier)
        if clean_modifier:
            seeds.append(f"{clean_modifier} {service}")

    clean_seeds: list[str] = []
    seen: set[str] = set()
    blocked = raw_avoid | BLOCKED_SEED_WORDS
    for seed in seeds:
        phrase = _clean_phrase(seed)
        if not phrase:
            continue
        words = phrase.split()
        if len(words) > 3:
            continue
        if any(word in blocked for word in words):
            continue
        if phrase in seen:
            continue
        seen.add(phrase)
        clean_seeds.append(phrase)
        if len(clean_seeds) >= max(count, 6):
            break
    return clean_seeds


def _load_ai_json(content: str) -> dict[str, Any] | list[Any]:
    if content is None:
        return {"ideas": []}
    if not isinstance(content, str):
        content = str(content)
    stripped = content.strip()
    if stripped.startswith("```"):
        stripped = re.sub(r"^```(?:json)?", "", stripped).strip()
        stripped = re.sub(r"```$", "", stripped).strip()
    try:
        return json.loads(stripped)
    except json.JSONDecodeError:
        return {"ideas": re.findall(r"[a-zA-Z][a-zA-Z\s]+", stripped)}


def _extract_phrases(data: dict[str, Any] | list[Any], key: str) -> list[str]:
    if isinstance(data, list):
        source = data if key in {"ideas", "domains", "keywords"} else []
    else:
        source = data.get(key) or []
    if not isinstance(source, list):
        return []
    phrases: list[str] = []
    for item in source:
        phrase = _clean_phrase(str(item))
        if phrase:
            phrases.append(phrase)
    return phrases


def _token_set(values: list[str]) -> set[str]:
    tokens: set[str] = set()
    for value in values:
        tokens.update(value.split())
    return tokens


def _clean_phrase(value: str) -> str:
    words = re.findall(r"[a-zA-Z]+", value.lower())
    return " ".join(words)


def _fallback_variant_seeds(service: str) -> list[str]:
    return SERVICE_VARIANTS.get(service, [])


def _fallback_ideas(*, niche: str, style: str, count: int) -> list[str]:
    niche_slug = re.sub(r"[^a-zA-Z\s]", "", niche).lower()
    niche_words = niche_slug.split()
    service = niche_words[-1] if niche_words else niche_slug
    seeds = [niche_slug]
    seeds.extend(_fallback_variant_seeds(service))
    for modifier in STYLE_MODIFIERS.get(style.strip().lower(), []):
        seeds.append(f"{modifier} {service}")
    clean_seeds: list[str] = []
    seen: set[str] = set()
    for seed in seeds:
        phrase = _clean_phrase(seed)
        if not phrase or phrase in seen:
            continue
        seen.add(phrase)
        clean_seeds.append(phrase)
        if len(clean_seeds) >= max(count, 6):
            break
    return clean_seeds


def _default_model(provider: str) -> str:
    return {
        "openai": "gpt-4.1-mini",
        "gemini": "gemini-1.5-flash",
        "claude": "claude-3-5-haiku-latest",
        "openrouter": "openrouter/free",
    }.get(provider, "")
