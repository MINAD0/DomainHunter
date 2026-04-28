#!/usr/bin/env python3
"""Generate brandable domains and check availability with API-first fallback."""

from __future__ import annotations

import argparse
import asyncio
import json
import os
import random
import re
import sys
import time
from dataclasses import dataclass
from enum import Enum
from pathlib import Path
from typing import AsyncIterator, Iterable, Protocol, Sequence, TextIO


TOOL_NAME = "Domain Hunter"
VERSION = "1.0.0"
TAGLINE = "Trend-based domain discovery automation"
CHECK_MARK = "✔"
NOT_FOUND_MARKERS = (
    "no match",
    "not found",
    "no data found",
    "no entries found",
    "domain not found",
    "status: free",
    "is available",
)


class AvailabilityState(str, Enum):
    AVAILABLE = "available"
    TAKEN = "taken"
    UNKNOWN = "unknown"


@dataclass(frozen=True)
class AvailabilityResult:
    domain: str
    state: AvailabilityState
    source: str
    detail: str = ""

    @property
    def available(self) -> bool:
        return self.state == AvailabilityState.AVAILABLE


@dataclass(frozen=True)
class AiTermSuggestion:
    niches: list[str]
    keywords: list[str]


class ProviderError(Exception):
    def __init__(self, message: str, *, retryable: bool = False):
        super().__init__(message)
        self.retryable = retryable


class AvailabilityProvider(Protocol):
    name: str

    async def check(self, domain: str) -> AvailabilityResult:
        ...


def format_banner() -> str:
    line = "=" * max(len(TOOL_NAME) + len(VERSION) + 1, len(TAGLINE))
    return f"{line}\n{TOOL_NAME} {VERSION}\n{TAGLINE}\n{line}"


class AsyncRateLimiter:
    """Spaces request starts across concurrent workers."""

    def __init__(self, delay_seconds: float):
        self.delay_seconds = max(0.0, delay_seconds)
        self._lock = asyncio.Lock()
        self._next_at = 0.0

    async def wait(self) -> None:
        if self.delay_seconds <= 0:
            return

        async with self._lock:
            now = time.monotonic()
            if now < self._next_at:
                await asyncio.sleep(self._next_at - now)
            self._next_at = time.monotonic() + self.delay_seconds


class AvailabilityChecker:
    def __init__(
        self,
        providers: Sequence[AvailabilityProvider],
        *,
        concurrency: int = 5,
        delay_seconds: float = 0.25,
        max_retries: int = 2,
        backoff_seconds: float = 1.0,
        verbose: bool = False,
    ):
        if not providers:
            raise ValueError("At least one availability provider is required.")

        self.providers = list(providers)
        self.concurrency = max(1, concurrency)
        self.max_retries = max(0, max_retries)
        self.backoff_seconds = max(0.0, backoff_seconds)
        self.verbose = verbose
        self.rate_limiter = AsyncRateLimiter(delay_seconds)

    async def check_domain(self, domain: str) -> AvailabilityResult:
        last_error = ""

        for provider in self.providers:
            for attempt in range(self.max_retries + 1):
                try:
                    await self.rate_limiter.wait()
                    result = await provider.check(domain)
                    if result.state != AvailabilityState.UNKNOWN:
                        return result
                    last_error = result.detail
                    break
                except ProviderError as exc:
                    last_error = f"{provider.name}: {exc}"
                    if self.verbose:
                        print(last_error, file=sys.stderr)
                    if not exc.retryable or attempt >= self.max_retries:
                        break
                    await asyncio.sleep(self.backoff_seconds * (2**attempt))

        return AvailabilityResult(
            domain=domain,
            state=AvailabilityState.UNKNOWN,
            source="none",
            detail=last_error,
        )

    async def iter_results(
        self, domains: Iterable[str]
    ) -> AsyncIterator[AvailabilityResult]:
        semaphore = asyncio.Semaphore(self.concurrency)

        async def run_one(domain: str) -> AvailabilityResult:
            async with semaphore:
                return await self.check_domain(domain)

        tasks = [asyncio.create_task(run_one(domain)) for domain in domains]
        for task in asyncio.as_completed(tasks):
            yield await task


class WhoisXmlProvider:
    name = "whoisxml"

    def __init__(self, api_key: str, *, timeout_seconds: float = 15):
        self.api_key = api_key
        self.timeout_seconds = timeout_seconds

    async def check(self, domain: str) -> AvailabilityResult:
        httpx = _require_httpx()
        url = "https://domain-availability.whoisxmlapi.com/api/v1"
        params = {"apiKey": self.api_key, "domainName": domain, "outputFormat": "JSON"}

        async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
            response = await client.get(url, params=params)
            data = _decode_json_response(response, self.name)

        info = data.get("DomainInfo") or data.get("domainInfo") or data
        value = str(
            info.get("domainAvailability")
            or info.get("availability")
            or info.get("status")
            or ""
        ).lower()

        if value in {"available", "yes", "true"}:
            state = AvailabilityState.AVAILABLE
        elif value in {"unavailable", "registered", "taken", "no", "false"}:
            state = AvailabilityState.TAKEN
        else:
            state = AvailabilityState.UNKNOWN

        return AvailabilityResult(
            domain=domain,
            state=state,
            source=self.name,
            detail=value or "Unrecognized WhoisXML response.",
        )


class GoDaddyProvider:
    name = "godaddy"

    def __init__(
        self,
        api_key: str,
        api_secret: str,
        *,
        timeout_seconds: float = 15,
    ):
        self.api_key = api_key
        self.api_secret = api_secret
        self.timeout_seconds = timeout_seconds

    async def check(self, domain: str) -> AvailabilityResult:
        httpx = _require_httpx()
        url = "https://api.godaddy.com/v1/domains/available"
        headers = {
            "Authorization": f"sso-key {self.api_key}:{self.api_secret}",
            "Accept": "application/json",
        }
        params = {"domain": domain, "checkType": "FAST"}

        async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
            response = await client.get(url, params=params, headers=headers)
            data = _decode_json_response(response, self.name)

        if "available" not in data:
            return AvailabilityResult(
                domain=domain,
                state=AvailabilityState.UNKNOWN,
                source=self.name,
                detail="GoDaddy response did not include availability.",
            )

        return AvailabilityResult(
            domain=domain,
            state=(
                AvailabilityState.AVAILABLE
                if bool(data["available"])
                else AvailabilityState.TAKEN
            ),
            source=self.name,
            detail=str(data.get("price", "")),
        )


class RapidApiProvider:
    """Generic RapidAPI adapter for domain APIs with common response shapes."""

    name = "rapidapi"

    def __init__(
        self,
        api_key: str,
        host: str,
        url: str,
        *,
        domain_param: str = "domain",
        timeout_seconds: float = 15,
    ):
        self.api_key = api_key
        self.host = host
        self.url = url
        self.domain_param = domain_param
        self.timeout_seconds = timeout_seconds

    async def check(self, domain: str) -> AvailabilityResult:
        httpx = _require_httpx()
        headers = {
            "x-rapidapi-key": self.api_key,
            "x-rapidapi-host": self.host,
        }
        params = {self.domain_param: domain}

        async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
            response = await client.get(self.url, params=params, headers=headers)
            data = _decode_json_response(response, self.name)

        state = _parse_common_availability(data)
        return AvailabilityResult(
            domain=domain,
            state=state,
            source=self.name,
            detail="Parsed generic RapidAPI response.",
        )


class OpenRouterTermGenerator:
    def __init__(
        self,
        api_key: str,
        *,
        model: str = "openrouter/auto",
        referer: str | None = None,
        title: str = TOOL_NAME,
        timeout_seconds: float = 30,
        temperature: float = 0.4,
    ):
        self.api_key = api_key
        self.model = normalize_openrouter_model_id(model)
        self.referer = referer
        self.title = title
        self.timeout_seconds = timeout_seconds
        self.temperature = temperature

    async def generate(
        self,
        *,
        topic: str,
        niche_count: int,
        keyword_count: int,
    ) -> AiTermSuggestion:
        httpx = _require_httpx()
        payload = build_openrouter_term_payload(
            topic=topic,
            niche_count=niche_count,
            keyword_count=keyword_count,
            model=self.model,
            temperature=self.temperature,
        )
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "X-OpenRouter-Title": self.title,
        }
        if self.referer:
            headers["HTTP-Referer"] = self.referer

        async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
            response = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers=headers,
                json=payload,
            )
            data = _decode_json_response(response, "openrouter")

        choices = data.get("choices")
        if not isinstance(choices, list) or not choices:
            raise ProviderError("OpenRouter response did not include choices.")

        message = choices[0].get("message", {})
        content = message.get("content") if isinstance(message, dict) else None
        if not isinstance(content, str) or not content.strip():
            raise ProviderError("OpenRouter response did not include text content.")

        return parse_ai_terms_response(content)


class PythonWhoisProvider:
    name = "python-whois"

    async def check(self, domain: str) -> AvailabilityResult:
        return await asyncio.to_thread(self._check_sync, domain)

    def _check_sync(self, domain: str) -> AvailabilityResult:
        try:
            import whois  # type: ignore
        except ImportError as exc:
            raise ProviderError(
                "python-whois is not installed. Run: pip install python-whois",
                retryable=False,
            ) from exc

        try:
            result = whois.whois(domain)
        except Exception as exc:  # python-whois raises provider-specific errors.
            message = str(exc).lower()
            if any(marker in message for marker in NOT_FOUND_MARKERS):
                return AvailabilityResult(
                    domain=domain,
                    state=AvailabilityState.AVAILABLE,
                    source=self.name,
                    detail=str(exc),
                )
            raise ProviderError(str(exc), retryable=_looks_retryable(message)) from exc

        domain_name = getattr(result, "domain_name", None)
        if isinstance(result, dict):
            domain_name = result.get("domain_name", domain_name)

        if not domain_name:
            return AvailabilityResult(
                domain=domain,
                state=AvailabilityState.AVAILABLE,
                source=self.name,
                detail="WHOIS returned no domain_name.",
            )

        return AvailabilityResult(
            domain=domain,
            state=AvailabilityState.TAKEN,
            source=self.name,
            detail="WHOIS returned registration data.",
        )


def generate_domains(
    *,
    niches: Sequence[str],
    keywords: Sequence[str],
    tlds: Sequence[str],
    count: int,
    prefixes: Sequence[str] | None = None,
    suffixes: Sequence[str] | None = None,
    rng: random.Random | None = None,
) -> list[str]:
    clean_niches = _unique_clean(niches)
    clean_keywords = _unique_clean(keywords)
    clean_tlds = _unique_clean_tlds(tlds)
    clean_prefixes = _unique_clean(prefixes or [])
    clean_suffixes = _unique_clean(suffixes or [])
    labels: list[str] = []

    def add_label(label: str) -> None:
        if _is_readable_label(label):
            labels.append(label)

    for left, right in _pairs(clean_keywords, clean_niches):
        add_label(f"{left}{right}")
    for left, right in _pairs(clean_niches, clean_keywords):
        add_label(f"{left}{right}")
    for left, right in _pairs(clean_keywords, clean_keywords):
        add_label(f"{left}{right}")
    for left, right in _pairs(clean_niches, clean_niches):
        add_label(f"{left}{right}")

    base_labels = _dedupe(labels)
    extended_labels = list(base_labels)
    for label in base_labels:
        for prefix in clean_prefixes:
            add_candidate = f"{prefix}{label}"
            if _is_readable_label(add_candidate):
                extended_labels.append(add_candidate)
        for suffix in clean_suffixes:
            add_candidate = f"{label}{suffix}"
            if _is_readable_label(add_candidate):
                extended_labels.append(add_candidate)

    domains = [
        f"{label}.{tld}"
        for label in _dedupe(extended_labels)
        for tld in clean_tlds
    ]
    domains = _dedupe(domains)

    shuffler = rng or random.SystemRandom()
    shuffler.shuffle(domains)
    return domains[: max(0, count)]


def build_openrouter_term_payload(
    *,
    topic: str,
    niche_count: int,
    keyword_count: int,
    model: str,
    temperature: float,
) -> dict:
    system_prompt = (
        "You generate short, clean domain-name seed terms. "
        "Return only valid JSON with keys niches and keywords. "
        "Each item must be lowercase, readable, brandable, and one compact token "
        "with no spaces, punctuation, hyphens, underscores, or TLDs."
    )
    user_prompt = (
        f"Topic: {topic}\n"
        f"Generate {niche_count} niches and {keyword_count} keywords for high-value "
        "domain hunting. Favor trends, buyer intent, infrastructure, AI agents, "
        "automation, robotics, cloud, security, developer tooling, and startup names "
        "when relevant. Avoid random junk, trademarks, adult terms, and exact company names."
    )
    return {
        "model": normalize_openrouter_model_id(model),
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": temperature,
        "max_tokens": 600,
        "response_format": {"type": "json_object"},
    }


def normalize_openrouter_model_id(model: str) -> str:
    value = model.strip()
    if "/" in value or value == "openrouter/free":
        return value

    match = re.fullmatch(r"([^:]+):\s*(.+?)(?:\s*\((free)\))?", value, re.IGNORECASE)
    if not match:
        return value

    provider, model_name, free_marker = match.groups()
    provider_slug = _slugify_model_part(provider)
    model_slug = _slugify_model_part(model_name)
    suffix = ":free" if free_marker else ""
    if provider_slug and model_slug:
        return f"{provider_slug}/{model_slug}{suffix}"
    return value


def parse_ai_terms_response(content: str) -> AiTermSuggestion:
    data = _load_ai_json(content)
    niches = _unique_clean(_require_string_list(data, "niches"))
    keywords = _unique_clean(_require_string_list(data, "keywords"))

    if not niches:
        raise ProviderError("AI response did not include usable niches.")
    if not keywords:
        raise ProviderError("AI response did not include usable keywords.")

    return AiTermSuggestion(niches=niches, keywords=keywords)


def emit_available_result(
    result: AvailabilityResult,
    *,
    output_path: Path,
    stream: TextIO = sys.stdout,
    use_color: bool = True,
) -> bool:
    if result.state != AvailabilityState.AVAILABLE:
        return False

    line = f"{CHECK_MARK} {result.domain}"
    if use_color:
        line = _green(line)
    print(line, file=stream, flush=True)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("a", encoding="utf-8") as available_file:
        available_file.write(f"{result.domain}\n")

    return True


def interactive_menu(
    args: argparse.Namespace,
    *,
    input_func=input,
    stream: TextIO = sys.stdout,
) -> argparse.Namespace | None:
    print(format_banner(), file=stream)
    print("Configure the hunt, preview candidates, then start when ready.", file=stream)
    print("API keys can be supplied here, with CLI flags, or via environment variables.", file=stream)

    while True:
        print("\nMain Menu", file=stream)
        print("1. Start domain hunt", file=stream)
        print("2. Configure keywords, niches, TLDs", file=stream)
        print("3. Configure AI generator and model", file=stream)
        print("4. Configure availability providers", file=stream)
        print("5. Configure speed and output", file=stream)
        print("6. Preview generated domains", file=stream)
        print("7. Show current settings", file=stream)
        print("8. Exit", file=stream)

        choice = input_func("Choose an option [1-8]: ").strip().lower()
        if choice in {"1", "start", "s"}:
            return args
        if choice in {"2", "inputs", "seeds", "domain", "domains"}:
            _prompt_domain_inputs(args, input_func=input_func, stream=stream)
            continue
        if choice in {"3", "ai", "model", "models"}:
            _prompt_ai_settings(args, input_func=input_func, stream=stream)
            continue
        if choice in {"4", "providers", "provider", "availability"}:
            _prompt_provider_settings(args, input_func=input_func, stream=stream)
            continue
        if choice in {"5", "performance", "speed", "output"}:
            _prompt_performance_settings(args, input_func=input_func, stream=stream)
            continue
        if choice in {"6", "preview", "p"}:
            print(format_domain_preview(args), file=stream)
            continue
        if choice in {"7", "show", "settings", "config"}:
            print(format_settings(args), file=stream)
            continue
        if choice in {"8", "exit", "q", "quit"}:
            print("Exiting without running checks.", file=stream)
            return None
        print("Please choose a number from 1 to 8.", file=stream)


def format_settings(args: argparse.Namespace) -> str:
    return "\n".join(
        [
            "",
            "Current Settings",
            "Domain seeds",
            f"  Niches: {_join_or_dash(args.niches)}",
            f"  Keywords: {_join_or_dash(args.keywords)}",
            f"  TLDs: {_join_or_dash(args.tlds)}",
            f"  Prefixes: {_join_or_dash(args.prefixes)}",
            f"  Suffixes: {_join_or_dash(args.suffixes)}",
            f"  Domain count: {args.count}",
            "AI generator",
            f"  Enabled: {'yes' if args.ai_generate else 'no'}",
            f"  Topic: {args.ai_topic}",
            f"  Model: {normalize_openrouter_model_id(args.openrouter_model)}",
            f"  AI niches/keywords: {args.ai_niche_count}/{args.ai_keyword_count}",
            f"  Replace manual seeds: {'yes' if args.ai_replace else 'no'}",
            f"  OpenRouter key: {_secret_status(args.openrouter_api_key, 'OPENROUTER_API_KEY')}",
            "Availability checks",
            f"  Providers: {_join_or_dash(args.provider)}",
            f"  WhoisXML key: {_secret_status(args.whoisxml_api_key, 'WHOISXML_API_KEY')}",
            f"  GoDaddy key: {_secret_status(args.godaddy_api_key, 'GODADDY_API_KEY')}",
            f"  GoDaddy secret: {_secret_status(args.godaddy_api_secret, 'GODADDY_API_SECRET')}",
            f"  RapidAPI key: {_secret_status(args.rapidapi_key, 'RAPIDAPI_KEY')}",
            f"  RapidAPI host: {args.rapidapi_host or os.getenv('RAPIDAPI_HOST') or '-'}",
            f"  RapidAPI URL: {args.rapidapi_url or os.getenv('RAPIDAPI_URL') or '-'}",
            f"  WHOIS fallback disabled: {'yes' if args.no_whois_fallback else 'no'}",
            "Speed and output",
            f"  Concurrency: {args.concurrency}",
            f"  Delay: {args.delay}s",
            f"  Retries/backoff: {args.retries}/{args.backoff}s",
            f"  Timeout: {args.timeout}s",
            f"  Output file: {args.output}",
            f"  Append mode: {'yes' if args.append else 'no'}",
        ]
    )


def format_domain_preview(args: argparse.Namespace, *, limit: int = 20) -> str:
    domains = generate_domains(
        niches=args.niches,
        keywords=args.keywords,
        tlds=args.tlds,
        count=min(max(limit, 1), max(args.count, 1)),
        prefixes=args.prefixes,
        suffixes=args.suffixes,
        rng=random.Random(11),
    )
    lines = ["", "Preview Domains"]
    if args.ai_generate:
        lines.append("  Note: preview uses current local seeds; AI terms are fetched when the hunt starts.")
    lines.extend(f"  {index}. {domain}" for index, domain in enumerate(domains, start=1))
    if not domains:
        lines.append("  No domains generated yet. Add at least one keyword/niche and TLD.")
    return "\n".join(lines)


async def run(args: argparse.Namespace) -> int:
    if args.ai_generate:
        suggestion = await generate_ai_terms(args)
        if args.ai_replace:
            args.niches = suggestion.niches
            args.keywords = suggestion.keywords
        else:
            args.niches = _dedupe([*args.niches, *suggestion.niches])
            args.keywords = _dedupe([*args.keywords, *suggestion.keywords])

        if args.verbose:
            print(
                "AI terms: "
                f"{len(suggestion.niches)} niches, "
                f"{len(suggestion.keywords)} keywords.",
                file=sys.stderr,
            )

    domains = generate_domains(
        niches=args.niches,
        keywords=args.keywords,
        tlds=args.tlds,
        count=args.count,
        prefixes=args.prefixes,
        suffixes=args.suffixes,
    )

    if args.verbose:
        print(f"Generated {len(domains)} candidate domains.", file=sys.stderr)

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    if not args.append:
        output_path.write_text("", encoding="utf-8")

    providers = build_providers(args)
    checker = AvailabilityChecker(
        providers,
        concurrency=args.concurrency,
        delay_seconds=args.delay,
        max_retries=args.retries,
        backoff_seconds=args.backoff,
        verbose=args.verbose,
    )

    use_color = not args.no_color
    async for result in checker.iter_results(domains):
        emit_available_result(result, output_path=output_path, use_color=use_color)

    return 0


async def generate_ai_terms(args: argparse.Namespace) -> AiTermSuggestion:
    api_key = args.openrouter_api_key or os.getenv("OPENROUTER_API_KEY")
    _require_config("OPENROUTER_API_KEY", api_key, "openrouter")

    generator = OpenRouterTermGenerator(
        api_key,
        model=args.openrouter_model,
        referer=args.openrouter_referer or os.getenv("OPENROUTER_REFERER"),
        title=args.openrouter_title,
        timeout_seconds=args.timeout,
        temperature=args.ai_temperature,
    )
    return await generator.generate(
        topic=args.ai_topic,
        niche_count=args.ai_niche_count,
        keyword_count=args.ai_keyword_count,
    )


def build_providers(args: argparse.Namespace) -> list[AvailabilityProvider]:
    provider_names = [name.lower() for name in args.provider]
    use_auto = "auto" in provider_names
    providers: list[AvailabilityProvider] = []

    whoisxml_key = args.whoisxml_api_key or os.getenv("WHOISXML_API_KEY")
    godaddy_key = args.godaddy_api_key or os.getenv("GODADDY_API_KEY")
    godaddy_secret = args.godaddy_api_secret or os.getenv("GODADDY_API_SECRET")
    rapidapi_key = args.rapidapi_key or os.getenv("RAPIDAPI_KEY")
    rapidapi_host = args.rapidapi_host or os.getenv("RAPIDAPI_HOST")
    rapidapi_url = args.rapidapi_url or os.getenv("RAPIDAPI_URL")

    if (use_auto and whoisxml_key) or "whoisxml" in provider_names:
        _require_config("WHOISXML_API_KEY", whoisxml_key, "whoisxml")
        providers.append(
            WhoisXmlProvider(whoisxml_key, timeout_seconds=args.timeout)
        )

    if (use_auto and godaddy_key and godaddy_secret) or "godaddy" in provider_names:
        _require_config("GODADDY_API_KEY", godaddy_key, "godaddy")
        _require_config("GODADDY_API_SECRET", godaddy_secret, "godaddy")
        providers.append(
            GoDaddyProvider(
                godaddy_key,
                godaddy_secret,
                timeout_seconds=args.timeout,
            )
        )

    rapidapi_configured = rapidapi_key and rapidapi_host and rapidapi_url
    if (use_auto and rapidapi_configured) or "rapidapi" in provider_names:
        _require_config("RAPIDAPI_KEY", rapidapi_key, "rapidapi")
        _require_config("RAPIDAPI_HOST", rapidapi_host, "rapidapi")
        _require_config("RAPIDAPI_URL", rapidapi_url, "rapidapi")
        providers.append(
            RapidApiProvider(
                rapidapi_key,
                rapidapi_host,
                rapidapi_url,
                domain_param=args.rapidapi_domain_param,
                timeout_seconds=args.timeout,
            )
        )

    if (use_auto and not args.no_whois_fallback) or "whois" in provider_names:
        providers.append(PythonWhoisProvider())

    if not providers:
        raise SystemExit(
            "No provider configured. Set an API key, choose --provider whois, "
            "or remove --no-whois-fallback."
        )

    return providers


def parse_args(argv: Sequence[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=f"{TOOL_NAME} {VERSION} - generate trend-based domain names."
    )
    parser.add_argument(
        "--version",
        action="version",
        version=f"{TOOL_NAME} {VERSION}",
    )
    parser.add_argument(
        "--menu",
        action="store_true",
        help="Open an interactive menu before running checks.",
    )
    parser.add_argument(
        "--niches",
        nargs="+",
        default=["ai", "robot", "cloud"],
        help="Niches to combine, space or comma separated.",
    )
    parser.add_argument(
        "--keywords",
        nargs="+",
        default=["agent", "store", "hub", "infra"],
        help="Keywords to combine, space or comma separated.",
    )
    parser.add_argument(
        "--tlds",
        nargs="+",
        default=["com", "ai", "io"],
        help="TLDs to check, with or without leading dots.",
    )
    parser.add_argument(
        "--count",
        type=int,
        default=100,
        help="Maximum number of domains to generate and check.",
    )
    parser.add_argument(
        "--prefixes",
        nargs="*",
        default=[],
        help="Optional prefixes to prepend to generated labels.",
    )
    parser.add_argument(
        "--suffixes",
        nargs="*",
        default=[],
        help="Optional suffixes to append to generated labels.",
    )
    parser.add_argument(
        "--ai-generate",
        action="store_true",
        help="Use OpenRouter to generate extra niches and keywords before hunting.",
    )
    parser.add_argument(
        "--ai-topic",
        default="AI infrastructure, agents, automation, robotics, cloud developer tools",
        help="Trend or market prompt for AI-generated niches and keywords.",
    )
    parser.add_argument(
        "--ai-niche-count",
        type=int,
        default=10,
        help="Number of AI niches to request.",
    )
    parser.add_argument(
        "--ai-keyword-count",
        type=int,
        default=16,
        help="Number of AI keywords to request.",
    )
    parser.add_argument(
        "--ai-replace",
        action="store_true",
        help="Use only AI-generated niches and keywords instead of merging them.",
    )
    parser.add_argument(
        "--ai-temperature",
        type=float,
        default=0.4,
        help="OpenRouter generation temperature.",
    )
    parser.add_argument("--openrouter-api-key", default=None)
    parser.add_argument("--openrouter-model", default="openrouter/free")
    parser.add_argument("--openrouter-referer", default=None)
    parser.add_argument("--openrouter-title", default=TOOL_NAME)
    parser.add_argument(
        "--provider",
        nargs="+",
        choices=["auto", "whoisxml", "godaddy", "rapidapi", "whois"],
        default=["auto"],
        help="Availability providers, tried in order.",
    )
    parser.add_argument("--whoisxml-api-key", default=None)
    parser.add_argument("--godaddy-api-key", default=None)
    parser.add_argument("--godaddy-api-secret", default=None)
    parser.add_argument("--rapidapi-key", default=None)
    parser.add_argument("--rapidapi-host", default=None)
    parser.add_argument("--rapidapi-url", default=None)
    parser.add_argument("--rapidapi-domain-param", default="domain")
    parser.add_argument("--concurrency", type=int, default=5)
    parser.add_argument(
        "--delay",
        type=float,
        default=0.25,
        help="Minimum seconds between request starts across all workers.",
    )
    parser.add_argument("--retries", type=int, default=2)
    parser.add_argument("--backoff", type=float, default=1.0)
    parser.add_argument("--timeout", type=float, default=15.0)
    parser.add_argument("--output", default="available.txt")
    parser.add_argument("--append", action="store_true")
    parser.add_argument("--no-color", action="store_true")
    parser.add_argument("--no-whois-fallback", action="store_true")
    parser.add_argument("--verbose", action="store_true")

    args = parser.parse_args(argv)
    args.niches = _flatten_cli_values(args.niches)
    args.keywords = _flatten_cli_values(args.keywords)
    args.tlds = _flatten_cli_values(args.tlds)
    args.prefixes = _flatten_cli_values(args.prefixes)
    args.suffixes = _flatten_cli_values(args.suffixes)
    return args


def main(argv: Sequence[str] | None = None) -> int:
    raw_args = list(sys.argv[1:] if argv is None else argv)
    try:
        args = parse_args(raw_args)
        if args.menu or not raw_args:
            menu_args = interactive_menu(args)
            if menu_args is None:
                return 0
            args = menu_args
        return asyncio.run(run(args))
    except ProviderError as exc:
        print(f"Error: {exc}", file=sys.stderr)
        hint = _provider_error_hint(str(exc))
        if hint:
            print(hint, file=sys.stderr)
        return 1
    except KeyboardInterrupt:
        return 130


def _prompt_domain_inputs(
    args: argparse.Namespace,
    *,
    input_func=input,
    stream: TextIO = sys.stdout,
) -> None:
    print("\nEdit domain inputs. Press Enter to keep the current value.", file=stream)
    args.niches = _prompt_list("Niches", args.niches, input_func)
    args.keywords = _prompt_list("Keywords", args.keywords, input_func)
    args.tlds = _prompt_list("TLDs", args.tlds, input_func)
    args.prefixes = _prompt_list("Prefixes", args.prefixes, input_func)
    args.suffixes = _prompt_list("Suffixes", args.suffixes, input_func)
    args.count = _prompt_int("Number of domains", args.count, input_func)
    print("Domain seed settings saved.", file=stream)


def _prompt_ai_settings(
    args: argparse.Namespace,
    *,
    input_func=input,
    stream: TextIO = sys.stdout,
) -> None:
    print("\nConfigure AI generator. Press Enter to keep the current value.", file=stream)
    args.ai_generate = _prompt_bool(
        "Use OpenRouter AI to generate terms",
        args.ai_generate,
        input_func,
    )
    topic = input_func(f"AI topic [{args.ai_topic}]: ").strip()
    if topic:
        args.ai_topic = topic
    model = input_func(f"OpenRouter model [{args.openrouter_model}]: ").strip()
    if model:
        args.openrouter_model = normalize_openrouter_model_id(model)
    args.ai_niche_count = _prompt_int(
        "AI niche count",
        args.ai_niche_count,
        input_func,
    )
    args.ai_keyword_count = _prompt_int(
        "AI keyword count",
        args.ai_keyword_count,
        input_func,
    )
    args.ai_temperature = _prompt_float(
        "AI temperature",
        args.ai_temperature,
        input_func,
    )
    args.ai_replace = _prompt_bool(
        "Replace manual inputs with AI terms",
        args.ai_replace,
        input_func,
    )
    args.openrouter_api_key = _prompt_secret(
        "OpenRouter API key",
        args.openrouter_api_key,
        "OPENROUTER_API_KEY",
        input_func,
    )
    print("AI generator settings saved.", file=stream)


def _prompt_provider_settings(
    args: argparse.Namespace,
    *,
    input_func=input,
    stream: TextIO = sys.stdout,
) -> None:
    print("\nConfigure availability providers. Press Enter to keep the current value.", file=stream)
    print("Provider order: auto, whoisxml, godaddy, rapidapi, whois", file=stream)
    args.provider = _prompt_providers(args.provider, input_func)
    args.whoisxml_api_key = _prompt_secret(
        "WhoisXML API key",
        args.whoisxml_api_key,
        "WHOISXML_API_KEY",
        input_func,
    )
    args.godaddy_api_key = _prompt_secret(
        "GoDaddy API key",
        args.godaddy_api_key,
        "GODADDY_API_KEY",
        input_func,
    )
    args.godaddy_api_secret = _prompt_secret(
        "GoDaddy API secret",
        args.godaddy_api_secret,
        "GODADDY_API_SECRET",
        input_func,
    )
    args.rapidapi_key = _prompt_secret(
        "RapidAPI key",
        args.rapidapi_key,
        "RAPIDAPI_KEY",
        input_func,
    )
    rapidapi_host = input_func(
        f"RapidAPI host [{args.rapidapi_host or os.getenv('RAPIDAPI_HOST') or '-'}]: "
    ).strip()
    if rapidapi_host:
        args.rapidapi_host = rapidapi_host
    rapidapi_url = input_func(
        f"RapidAPI URL [{args.rapidapi_url or os.getenv('RAPIDAPI_URL') or '-'}]: "
    ).strip()
    if rapidapi_url:
        args.rapidapi_url = rapidapi_url
    rapidapi_param = input_func(
        f"RapidAPI domain param [{args.rapidapi_domain_param}]: "
    ).strip()
    if rapidapi_param:
        args.rapidapi_domain_param = rapidapi_param
    args.no_whois_fallback = _prompt_bool(
        "Disable WHOIS fallback",
        args.no_whois_fallback,
        input_func,
    )
    print("Availability provider settings saved.", file=stream)


def _prompt_performance_settings(
    args: argparse.Namespace,
    *,
    input_func=input,
    stream: TextIO = sys.stdout,
) -> None:
    print("\nEdit performance settings. Press Enter to keep the current value.", file=stream)
    args.concurrency = _prompt_int("Concurrency", args.concurrency, input_func)
    args.delay = _prompt_float("Delay seconds", args.delay, input_func)
    args.retries = _prompt_int("Retries", args.retries, input_func)
    args.backoff = _prompt_float("Backoff seconds", args.backoff, input_func)
    output = input_func(f"Output file [{args.output}]: ").strip()
    if output:
        args.output = output
    args.append = _prompt_bool("Append to existing output file", args.append, input_func)
    args.verbose = _prompt_bool("Verbose error logging", args.verbose, input_func)
    args.no_color = _prompt_bool("Disable colored output", args.no_color, input_func)
    print("Speed and output settings saved.", file=stream)


def _prompt_list(label: str, current: Sequence[str], input_func) -> list[str]:
    current_text = ", ".join(current)
    value = input_func(f"{label} [{current_text}]: ").strip()
    return _flatten_cli_values([value]) if value else list(current)


def _prompt_int(label: str, current: int, input_func) -> int:
    while True:
        value = input_func(f"{label} [{current}]: ").strip()
        if not value:
            return current
        try:
            parsed = int(value)
        except ValueError:
            print("Please enter a whole number.")
            continue
        if parsed < 1:
            print("Please enter a number greater than zero.")
            continue
        return parsed


def _prompt_float(label: str, current: float, input_func) -> float:
    while True:
        value = input_func(f"{label} [{current}]: ").strip()
        if not value:
            return current
        try:
            parsed = float(value)
        except ValueError:
            print("Please enter a number.")
            continue
        if parsed < 0:
            print("Please enter zero or a positive number.")
            continue
        return parsed


def _prompt_bool(label: str, current: bool, input_func) -> bool:
    suffix = "Y/n" if current else "y/N"
    while True:
        value = input_func(f"{label} [{suffix}]: ").strip().lower()
        if not value:
            return current
        if value in {"y", "yes", "true", "1", "on"}:
            return True
        if value in {"n", "no", "false", "0", "off"}:
            return False
        print("Please enter yes or no.")


def _prompt_secret(
    label: str,
    current: str | None,
    env_name: str,
    input_func,
) -> str | None:
    status = _secret_status(current, env_name)
    value = input_func(f"{label} [{status}; Enter keep, '-' clear]: ").strip()
    if not value:
        return current
    if value == "-":
        return None
    return value


def _prompt_providers(current: Sequence[str], input_func) -> list[str]:
    valid = {"auto", "whoisxml", "godaddy", "rapidapi", "whois"}
    current_text = ", ".join(current)
    while True:
        value = input_func(
            f"Providers ({', '.join(sorted(valid))}) [{current_text}]: "
        ).strip()
        if not value:
            return list(current)
        providers = [provider.lower() for provider in _flatten_cli_values([value])]
        invalid = [provider for provider in providers if provider not in valid]
        if invalid:
            print(f"Unknown provider: {', '.join(invalid)}")
            continue
        return providers


def _load_ai_json(content: str) -> dict:
    text = content.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
        text = re.sub(r"\s*```$", "", text)

    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        text = text[start : end + 1]

    try:
        data = json.loads(text)
    except json.JSONDecodeError as exc:
        raise ProviderError("AI response was not valid JSON.") from exc

    if not isinstance(data, dict):
        raise ProviderError("AI response JSON must be an object.")
    return data


def _require_string_list(data: dict, key: str) -> list[str]:
    value = data.get(key)
    if not isinstance(value, list):
        raise ProviderError(f"AI response must include a {key} array.")
    return [item for item in value if isinstance(item, str)]


def _decode_json_response(response, provider_name: str) -> dict:
    status = response.status_code
    error_detail = _response_error_detail(response)
    if status == 429 or 500 <= status <= 599:
        raise ProviderError(
            f"HTTP {status} from {provider_name}{error_detail}; retrying may help.",
            retryable=True,
        )
    if status >= 400:
        raise ProviderError(
            f"HTTP {status} from {provider_name}{error_detail}.",
            retryable=False,
        )

    try:
        data = response.json()
    except ValueError as exc:
        raise ProviderError(
            f"{provider_name} did not return valid JSON.", retryable=False
        ) from exc

    if not isinstance(data, dict):
        raise ProviderError(
            f"{provider_name} response JSON was not an object.", retryable=False
        )
    return data


def _response_error_detail(response) -> str:
    try:
        data = response.json()
    except ValueError:
        return ""

    if not isinstance(data, dict):
        return ""

    message = ""
    error = data.get("error")
    if isinstance(error, dict):
        value = error.get("message") or error.get("code")
        message = str(value) if value is not None else ""
    elif isinstance(error, str):
        message = error
    elif data.get("message") is not None:
        message = str(data["message"])

    message = " ".join(message.split())
    return f": {message}" if message else ""


def _provider_error_hint(message: str) -> str:
    lowered = message.lower()
    if "http 402 from openrouter" in lowered:
        return (
            "OpenRouter 402 means the account or API key has insufficient credits. "
            "Add credits at https://openrouter.ai/settings/credits, or try an "
            "available free model with --openrouter-model."
        )
    if "http 400 from openrouter" in lowered and "not a valid model id" in lowered:
        return (
            "Use a real OpenRouter model ID. For free experiments, try "
            '--openrouter-model "openrouter/free".'
        )
    return ""


def _parse_common_availability(data: dict) -> AvailabilityState:
    candidates = [
        data.get("available"),
        data.get("is_available"),
        data.get("availability"),
        data.get("domainAvailability"),
        data.get("status"),
    ]
    nested = data.get("DomainInfo") or data.get("domainInfo")
    if isinstance(nested, dict):
        candidates.extend(
            [
                nested.get("available"),
                nested.get("availability"),
                nested.get("domainAvailability"),
                nested.get("status"),
            ]
        )

    for value in candidates:
        if isinstance(value, bool):
            return AvailabilityState.AVAILABLE if value else AvailabilityState.TAKEN
        text = str(value).lower()
        if text in {"available", "yes", "true", "free"}:
            return AvailabilityState.AVAILABLE
        if text in {"unavailable", "registered", "taken", "no", "false"}:
            return AvailabilityState.TAKEN

    return AvailabilityState.UNKNOWN


def _green(text: str) -> str:
    try:
        from colorama import Fore, Style, init
    except ImportError:
        return text

    init(autoreset=True)
    return f"{Fore.GREEN}{text}{Style.RESET_ALL}"


def _require_httpx():
    try:
        import httpx  # type: ignore
    except ImportError as exc:
        raise ProviderError("httpx is not installed. Run: pip install httpx") from exc
    return httpx


def _require_config(name: str, value: str | None, provider: str) -> None:
    if not value:
        raise SystemExit(f"{provider} requires {name}.")


def _looks_retryable(message: str) -> bool:
    retry_markers = ("timeout", "temporarily", "try again", "rate", "429")
    return any(marker in message for marker in retry_markers)


def _join_or_dash(values: Sequence[str]) -> str:
    return ", ".join(values) if values else "-"


def _secret_status(current: str | None, env_name: str) -> str:
    if current:
        return _mask_secret(current)
    if os.getenv(env_name):
        return f"set in {env_name}"
    return "not set"


def _mask_secret(value: str) -> str:
    if len(value) <= 8:
        return "*" * len(value)
    return f"{value[:4]}...{value[-4:]}"


def _flatten_cli_values(values: Sequence[str]) -> list[str]:
    flattened: list[str] = []
    for value in values:
        flattened.extend(piece.strip() for piece in value.split(",") if piece.strip())
    return flattened


def _unique_clean(values: Sequence[str]) -> list[str]:
    return _dedupe(
        cleaned for value in values if (cleaned := _clean_label_piece(value))
    )


def _unique_clean_tlds(values: Sequence[str]) -> list[str]:
    return _dedupe(cleaned for value in values if (cleaned := _clean_tld(value)))


def _clean_label_piece(value: str) -> str:
    return re.sub(r"[^a-z0-9]", "", value.strip().lower())


def _clean_tld(value: str) -> str:
    return re.sub(r"[^a-z0-9-]", "", value.strip().lower().lstrip("."))


def _slugify_model_part(value: str) -> str:
    slug = value.strip().lower()
    slug = re.sub(r"\s+", "-", slug)
    slug = re.sub(r"[^a-z0-9._-]", "", slug)
    slug = re.sub(r"-+", "-", slug).strip("-")
    return slug


def _pairs(left_values: Sequence[str], right_values: Sequence[str]):
    for left in left_values:
        for right in right_values:
            if left != right:
                yield left, right


def _is_readable_label(label: str) -> bool:
    if not 4 <= len(label) <= 63:
        return False
    if not re.fullmatch(r"[a-z0-9]+", label):
        return False
    if re.search(r"(.)\1{3,}", label):
        return False
    return True


def _dedupe(values: Iterable[str]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for value in values:
        if value not in seen:
            seen.add(value)
            result.append(value)
    return result


if __name__ == "__main__":
    raise SystemExit(main())
