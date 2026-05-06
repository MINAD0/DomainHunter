from __future__ import annotations

import asyncio
import base64
import os
import re
import xml.etree.ElementTree as ET
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Protocol

import httpx

from backend.models import DomainCandidate, DomainResult, DomainStatus
from backend.services.domain_scoring import score_domain


@dataclass(frozen=True)
class AvailabilityResult:
    domain: str
    status: DomainStatus
    source: str
    detail: str = ""
    price: float | None = None
    currency: str | None = None
    purchase_url: str | None = None


class AvailabilityProvider(Protocol):
    name: str

    async def check(self, domain: str) -> AvailabilityResult:
        ...


class DomainChecker:
    def __init__(self, providers: list[AvailabilityProvider], *, delay_seconds: float = 0.25):
        if not providers:
            raise ValueError("At least one availability provider is required.")
        self.providers = providers
        self.delay_seconds = max(0.0, delay_seconds)

    async def check_candidates(
        self,
        candidates: list[DomainCandidate],
        *,
        available_only: bool = False,
    ) -> list[DomainResult]:
        results: list[DomainResult] = []
        for index, candidate in enumerate(candidates):
            if index and self.delay_seconds:
                await asyncio.sleep(self.delay_seconds)
            availability = await self.check_domain(candidate.domain)
            if available_only and availability.status != DomainStatus.AVAILABLE:
                continue
            results.append(
                DomainResult(
                    domain=candidate.domain,
                    city=candidate.city,
                    niche=candidate.niche,
                    tld=candidate.tld,
                    status=availability.status,
                    score=score_domain(
                        domain=candidate.domain,
                        city=candidate.city,
                        niche=candidate.niche,
                    ),
                    source=availability.source,
                    checked_at=datetime.now(UTC).isoformat().replace("+00:00", "Z"),
                )
            )
        return results

    async def check_domain(self, domain: str) -> AvailabilityResult:
        last = AvailabilityResult(domain=domain, status=DomainStatus.UNKNOWN, source="none")
        for provider in self.providers:
            try:
                result = await provider.check(domain)
            except Exception as exc:
                last = AvailabilityResult(
                    domain=domain,
                    status=DomainStatus.ERROR,
                    source=provider.name,
                    detail=str(exc),
                )
                continue
            if result.status != DomainStatus.UNKNOWN:
                return result
            last = result
        return last


class NamecheapProvider:
    name = "namecheap"

    def __init__(
        self,
        *,
        api_user: str,
        api_key: str,
        username: str,
        client_ip: str,
        timeout_seconds: float = 15,
    ):
        self.api_user = api_user
        self.api_key = api_key
        self.username = username
        self.client_ip = client_ip
        self.timeout_seconds = timeout_seconds

    async def check(self, domain: str) -> AvailabilityResult:
        params = {
            "ApiUser": self.api_user,
            "ApiKey": self.api_key,
            "UserName": self.username,
            "ClientIp": self.client_ip,
            "Command": "namecheap.domains.check",
            "DomainList": domain,
        }
        async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
            response = await client.get("https://api.namecheap.com/xml.response", params=params)
            response.raise_for_status()
        root = ET.fromstring(response.text)
        check = root.find(".//{*}DomainCheckResult")
        if check is None:
            return AvailabilityResult(domain, DomainStatus.UNKNOWN, self.name, "Missing DomainCheckResult")
        premium_price = _coerce_price(
            check.attrib.get("PremiumRegistrationPrice") or check.attrib.get("PremiumRenewalPrice")
        )
        if check.attrib.get("IsPremiumName", "").lower() == "true":
            return AvailabilityResult(
                domain,
                DomainStatus.PREMIUM,
                self.name,
                price=premium_price,
                currency="USD" if premium_price is not None else None,
            )
        available = check.attrib.get("Available", "").lower()
        if available == "true":
            return AvailabilityResult(domain, DomainStatus.AVAILABLE, self.name)
        if available == "false":
            return AvailabilityResult(domain, DomainStatus.TAKEN, self.name)
        return AvailabilityResult(domain, DomainStatus.UNKNOWN, self.name)


class WhoisXmlProvider:
    name = "whoisxml"

    def __init__(self, api_key: str, *, timeout_seconds: float = 15):
        self.api_key = api_key
        self.timeout_seconds = timeout_seconds

    async def check(self, domain: str) -> AvailabilityResult:
        params = {"apiKey": self.api_key, "domainName": domain, "outputFormat": "JSON"}
        async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
            response = await client.get(
                "https://domain-availability.whoisxmlapi.com/api/v1",
                params=params,
            )
            response.raise_for_status()
            data = response.json()
        info = data.get("DomainInfo") or data.get("domainInfo") or data
        value = str(
            info.get("domainAvailability")
            or info.get("availability")
            or info.get("status")
            or ""
        ).lower()
        if value in {"available", "yes", "true"}:
            return AvailabilityResult(domain, DomainStatus.AVAILABLE, self.name)
        if value in {"unavailable", "registered", "taken", "no", "false"}:
            return AvailabilityResult(domain, DomainStatus.TAKEN, self.name)
        return AvailabilityResult(domain, DomainStatus.UNKNOWN, self.name, value)


class RdapProvider:
    name = "rdap"

    def __init__(self, *, timeout_seconds: float = 15):
        self.timeout_seconds = timeout_seconds

    async def check(self, domain: str) -> AvailabilityResult:
        async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
            response = await client.get(f"https://rdap.org/domain/{domain}")
        if response.status_code == 404:
            return AvailabilityResult(domain, DomainStatus.AVAILABLE, self.name)
        if response.status_code == 200:
            return AvailabilityResult(domain, DomainStatus.TAKEN, self.name)
        return AvailabilityResult(domain, DomainStatus.UNKNOWN, self.name, f"HTTP {response.status_code}")


class WhoisProvider:
    name = "whois"

    async def check(self, domain: str) -> AvailabilityResult:
        return await asyncio.to_thread(self._check_sync, domain)

    def _check_sync(self, domain: str) -> AvailabilityResult:
        try:
            import whois  # type: ignore
        except ImportError:
            return AvailabilityResult(domain, DomainStatus.UNKNOWN, self.name, "python-whois not installed")
        try:
            result = whois.whois(domain)
        except Exception as exc:
            message = str(exc).lower()
            if any(marker in message for marker in ("no match", "not found", "no data found")):
                return AvailabilityResult(domain, DomainStatus.AVAILABLE, self.name, str(exc))
            return AvailabilityResult(domain, DomainStatus.UNKNOWN, self.name, str(exc))
        domain_name = getattr(result, "domain_name", None)
        if isinstance(result, dict):
            domain_name = result.get("domain_name", domain_name)
        if domain_name:
            return AvailabilityResult(domain, DomainStatus.TAKEN, self.name)
        return AvailabilityResult(domain, DomainStatus.AVAILABLE, self.name)


class GoDaddyProvider:
    name = "godaddy"

    def __init__(self, *, api_key: str, api_secret: str, timeout_seconds: float = 15):
        self.api_key = api_key
        self.api_secret = api_secret
        self.timeout_seconds = timeout_seconds

    async def check(self, domain: str) -> AvailabilityResult:
        headers = {
            "Authorization": f"sso-key {self.api_key}:{self.api_secret}",
            "Accept": "application/json",
        }
        async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
            response = await client.get(
                "https://api.godaddy.com/v1/domains/available",
                params={"domain": domain, "checkType": "FAST"},
                headers=headers,
            )
            response.raise_for_status()
            data = response.json()
        if "available" not in data:
            return AvailabilityResult(domain, DomainStatus.UNKNOWN, self.name)
        price = _coerce_price(data.get("price"))
        currency = data.get("currency") or data.get("currencyCode") or ("USD" if price is not None else None)
        return AvailabilityResult(
            domain,
            DomainStatus.AVAILABLE if data["available"] else DomainStatus.TAKEN,
            self.name,
            price=price,
            currency=currency,
        )


class DynadotProvider:
    name = "dynadot"

    def __init__(self, *, api_key: str, currency: str = "USD", timeout_seconds: float = 15):
        self.api_key = api_key
        self.currency = currency
        self.timeout_seconds = timeout_seconds

    async def check(self, domain: str) -> AvailabilityResult:
        params = {
            "key": self.api_key,
            "command": "search",
            "domain0": domain,
            "show_price": "1",
            "currency": self.currency,
        }
        async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
            response = await client.get("https://api.dynadot.com/api3.json", params=params)
            response.raise_for_status()
            data = response.json()
        results = (data.get("SearchResponse") or {}).get("SearchResults") or []
        if not results:
            return AvailabilityResult(domain, DomainStatus.UNKNOWN, self.name, "Missing search results")
        result = results[0]
        available = str(result.get("Available", "")).lower()
        price_text = str(result.get("Price", ""))
        price, currency = _parse_embedded_price(price_text)
        if available == "yes":
            status = DomainStatus.PREMIUM if "premium" in price_text.lower() and "not premium" not in price_text.lower() else DomainStatus.AVAILABLE
            return AvailabilityResult(
                domain,
                status,
                self.name,
                price=price,
                currency=currency or self.currency,
                detail=price_text if price_text and price is None else "",
            )
        if available == "no":
            return AvailabilityResult(domain, DomainStatus.TAKEN, self.name)
        return AvailabilityResult(domain, DomainStatus.UNKNOWN, self.name, price_text)


class NameComProvider:
    name = "namecom"

    def __init__(self, *, username: str, token: str, use_sandbox: bool = False, timeout_seconds: float = 15):
        self.username = username
        self.token = token
        self.use_sandbox = use_sandbox
        self.timeout_seconds = timeout_seconds

    async def check(self, domain: str) -> AvailabilityResult:
        auth = base64.b64encode(f"{self.username}:{self.token}".encode("utf-8")).decode("ascii")
        base_url = "https://api.dev.name.com" if self.use_sandbox else "https://api.name.com"
        headers = {
            "Authorization": f"Basic {auth}",
            "Content-Type": "application/json",
        }
        payload = {"domainNames": [domain]}
        async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
            response = await client.post(f"{base_url}/core/v1/domains:checkAvailability", json=payload, headers=headers)
            response.raise_for_status()
            data = response.json()
        results = data.get("results") or []
        if not results:
            return AvailabilityResult(domain, DomainStatus.UNKNOWN, self.name, "Missing results")
        result = results[0]
        purchasable = bool(result.get("purchasable"))
        premium = bool(result.get("premium"))
        price = _coerce_price(result.get("purchasePrice"))
        renewal_price = _coerce_price(result.get("renewalPrice"))
        detail = str(result.get("reason") or "")
        if purchasable:
            return AvailabilityResult(
                domain,
                DomainStatus.PREMIUM if premium else DomainStatus.AVAILABLE,
                self.name,
                detail=detail,
                price=price,
                currency="USD" if price is not None or renewal_price is not None else None,
            )
        return AvailabilityResult(domain, DomainStatus.TAKEN, self.name, detail or "Not purchasable")


class SpaceshipProvider:
    name = "spaceship"

    def __init__(self, *, api_key: str, api_secret: str, timeout_seconds: float = 15):
        self.api_key = api_key
        self.api_secret = api_secret
        self.timeout_seconds = timeout_seconds

    async def check(self, domain: str) -> AvailabilityResult:
        headers = {"X-API-Key": self.api_key, "X-API-Secret": self.api_secret}
        async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
            response = await client.get(f"https://spaceship.dev/api/v1/domains/{domain}/available", headers=headers)
            response.raise_for_status()
            data = response.json()
        result = _extract_spaceship_result(data)
        state = str(result.get("result") or result.get("status") or "").lower()
        pricing = result.get("premiumPricing") or result.get("pricing") or []
        register_pricing = next(
            (item for item in pricing if str(item.get("operation", "")).lower() == "register"),
            pricing[0] if pricing else None,
        )
        price = _coerce_price(register_pricing.get("price")) if isinstance(register_pricing, dict) else None
        currency = register_pricing.get("currency") if isinstance(register_pricing, dict) else None
        if state in {"available", "purchasable"}:
            return AvailabilityResult(
                domain,
                DomainStatus.PREMIUM if price is not None and pricing else DomainStatus.AVAILABLE,
                self.name,
                price=price,
                currency=currency,
            )
        if state in {"registered", "taken", "unavailable"}:
            return AvailabilityResult(domain, DomainStatus.TAKEN, self.name)
        return AvailabilityResult(domain, DomainStatus.UNKNOWN, self.name, state or "Unknown Spaceship response")


class RapidApiProvider:
    name = "rapidapi"

    def __init__(self, *, api_key: str, host: str, url: str, domain_param: str = "domain", timeout_seconds: float = 15):
        self.api_key = api_key
        self.host = host
        self.url = url
        self.domain_param = domain_param
        self.timeout_seconds = timeout_seconds

    async def check(self, domain: str) -> AvailabilityResult:
        headers = {"x-rapidapi-key": self.api_key, "x-rapidapi-host": self.host}
        async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
            response = await client.get(self.url, params={self.domain_param: domain}, headers=headers)
            response.raise_for_status()
            data = response.json()
        state = _parse_common_availability(data)
        return AvailabilityResult(domain, state, self.name)


def build_provider_list(settings: dict, *, timeout_seconds: float = 15, include_fallbacks: bool = True) -> list[AvailabilityProvider]:
    domain_settings = settings.get("domain_providers", {})
    providers: list[AvailabilityProvider] = []

    namecheap = domain_settings.get("namecheap", {})
    if all(namecheap.get(key) for key in ("api_user", "api_key", "username", "client_ip")):
        providers.append(NamecheapProvider(**namecheap, timeout_seconds=timeout_seconds))

    whoisxml = domain_settings.get("whoisxml", {})
    whoisxml_key = whoisxml.get("api_key") or os.getenv("WHOISXML_API_KEY")
    if whoisxml_key:
        providers.append(WhoisXmlProvider(whoisxml_key, timeout_seconds=timeout_seconds))

    godaddy = domain_settings.get("godaddy", {})
    if godaddy.get("api_key") and godaddy.get("api_secret"):
        providers.append(GoDaddyProvider(**godaddy, timeout_seconds=timeout_seconds))

    dynadot = domain_settings.get("dynadot", {})
    if dynadot.get("api_key"):
        providers.append(
            DynadotProvider(
                api_key=dynadot["api_key"],
                currency=dynadot.get("currency", "USD"),
                timeout_seconds=timeout_seconds,
            )
        )

    namecom = domain_settings.get("namecom", {})
    if namecom.get("username") and namecom.get("token"):
        providers.append(
            NameComProvider(
                username=namecom["username"],
                token=namecom["token"],
                use_sandbox=str(namecom.get("use_sandbox", "false")).lower() == "true",
                timeout_seconds=timeout_seconds,
            )
        )

    spaceship = domain_settings.get("spaceship", {})
    if spaceship.get("api_key") and spaceship.get("api_secret"):
        providers.append(
            SpaceshipProvider(
                api_key=spaceship["api_key"],
                api_secret=spaceship["api_secret"],
                timeout_seconds=timeout_seconds,
            )
        )

    rapidapi = domain_settings.get("rapidapi", {})
    if rapidapi.get("api_key") and rapidapi.get("host") and rapidapi.get("url"):
        providers.append(
            RapidApiProvider(
                api_key=rapidapi["api_key"],
                host=rapidapi["host"],
                url=rapidapi["url"],
                domain_param=rapidapi.get("domain_param", "domain"),
                timeout_seconds=timeout_seconds,
            )
        )

    if include_fallbacks:
        providers.extend([RdapProvider(timeout_seconds=timeout_seconds), WhoisProvider()])
    return providers


def build_checker(settings: dict, *, timeout_seconds: float = 15, include_fallbacks: bool = True) -> DomainChecker:
    providers = build_provider_list(
        settings,
        timeout_seconds=timeout_seconds,
        include_fallbacks=include_fallbacks,
    )
    return DomainChecker(
        providers,
        delay_seconds=float(settings.get("delay_between_checks", 0.25)),
    )


def _parse_common_availability(data: dict) -> DomainStatus:
    lowered = {str(key).lower(): value for key, value in data.items()}
    for key in ("available", "isavailable", "free"):
        if key in lowered:
            return DomainStatus.AVAILABLE if bool(lowered[key]) else DomainStatus.TAKEN
    status = str(lowered.get("status", lowered.get("availability", ""))).lower()
    if status in {"available", "free", "yes", "true"}:
        return DomainStatus.AVAILABLE
    if status in {"taken", "registered", "unavailable", "no", "false"}:
        return DomainStatus.TAKEN
    if status == "premium":
        return DomainStatus.PREMIUM
    return DomainStatus.UNKNOWN


def _coerce_price(value) -> float | None:
    if value in (None, ""):
        return None
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    if number > 100000:
        number = number / 1_000_000
    return round(number, 2)


def _parse_embedded_price(value: str) -> tuple[float | None, str | None]:
    match = re.search(r"([0-9]+(?:\.[0-9]+)?)\s+in\s+([A-Z]{3})", value)
    if not match:
        return None, None
    return round(float(match.group(1)), 2), match.group(2)


def _extract_spaceship_result(data: dict) -> dict:
    if isinstance(data.get("domain"), dict):
        return data["domain"]
    domains = data.get("domains")
    if isinstance(domains, list) and domains:
        first = domains[0]
        if isinstance(first, dict):
            return first
    return data
