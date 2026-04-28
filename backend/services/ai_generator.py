from __future__ import annotations

import json
import re
from typing import Any

import httpx


class AiGenerationError(Exception):
    pass


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
        return _fallback_ideas(city=city, niche=niche, style=style)

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
        return _fallback_ideas(city=city, niche=niche, style=style)
    return _parse_ideas(content)[:count] or _fallback_ideas(city=city, niche=niche, style=style)


def _build_prompt(*, city: str, niche: str, tlds: list[str], count: int, style: str) -> str:
    return (
        "Generate raw GeoDomain base-name ideas only. "
        "Return JSON with an ideas array. Do not include TLDs, hyphens, numbers, trademarks, or weird spelling.\n"
        f"City: {city}\n"
        f"Niche: {niche}\n"
        f"TLDs: {', '.join(tlds)}\n"
        f"Number: {count}\n"
        f"Style: {style}\n"
        "Examples: dallasindustrialcleaning, industrialcleaningdallas, dallaswarehousecleaning"
    )


async def _post_openrouter(api_key: str, model: str, prompt: str) -> str:
    payload = {
        "model": model or "openrouter/free",
        "messages": [
            {"role": "system", "content": "Return only compact JSON."},
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
    return data["choices"][0]["message"]["content"]


async def _post_openai(api_key: str, model: str, prompt: str) -> str:
    payload = {
        "model": model or "gpt-4.1-mini",
        "messages": [
            {"role": "system", "content": "Return only compact JSON."},
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
    return data["choices"][0]["message"]["content"]


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
    return data["candidates"][0]["content"]["parts"][0]["text"]


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
    return "".join(part.get("text", "") for part in data.get("content", []))


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
        return str(data.get("content") or data.get("text") or json.dumps(data))
    return str(data)


def _parse_ideas(content: str) -> list[str]:
    stripped = content.strip()
    if stripped.startswith("```"):
        stripped = re.sub(r"^```(?:json)?", "", stripped).strip()
        stripped = re.sub(r"```$", "", stripped).strip()
    try:
        data = json.loads(stripped)
    except json.JSONDecodeError:
        data = {"ideas": re.findall(r"[a-zA-Z][a-zA-Z\s]+", stripped)}
    if isinstance(data, list):
        raw = data
    else:
        raw = data.get("ideas") or data.get("domains") or []
    ideas: list[str] = []
    for item in raw:
        label = re.sub(r"[^a-zA-Z\s]", "", str(item)).strip().lower()
        if label:
            ideas.append(label)
    return list(dict.fromkeys(ideas))


def _fallback_ideas(*, city: str, niche: str, style: str) -> list[str]:
    city_slug = re.sub(r"[^a-zA-Z\s]", "", city).lower()
    niche_slug = re.sub(r"[^a-zA-Z\s]", "", niche).lower()
    niche_words = niche_slug.split()
    service = niche_words[-1] if niche_words else niche_slug
    return [
        f"{city_slug} {niche_slug}",
        f"{niche_slug} {city_slug}",
        f"{city_slug} {service} pros",
        f"{city_slug} {service} experts",
        f"{city_slug} {service} leads",
    ]


def _default_model(provider: str) -> str:
    return {
        "openai": "gpt-4.1-mini",
        "gemini": "gemini-1.5-flash",
        "claude": "claude-3-5-haiku-latest",
        "openrouter": "openrouter/free",
    }.get(provider, "")

