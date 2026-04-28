from __future__ import annotations

import asyncio
import os
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
        if check.attrib.get("IsPremiumName", "").lower() == "true":
            return AvailabilityResult(domain, DomainStatus.PREMIUM, self.name)
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
        return AvailabilityResult(
            domain,
            DomainStatus.AVAILABLE if data["available"] else DomainStatus.TAKEN,
            self.name,
        )


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


def build_checker(settings: dict, *, timeout_seconds: float = 15) -> DomainChecker:
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

    providers.extend([RdapProvider(timeout_seconds=timeout_seconds), WhoisProvider()])
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

