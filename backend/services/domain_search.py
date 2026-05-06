from __future__ import annotations

import asyncio
from urllib.parse import urlparse

from backend.models import (
    BulkDomainSearchResponse,
    DomainSearchResult,
    DomainStatus,
    RegistrarOffer,
)
from backend.services.domain_checker import AvailabilityResult, build_provider_list


def normalize_domain_input(value: str) -> str:
    cleaned = value.strip().lower()
    if not cleaned:
        raise ValueError("Domain is required.")
    if "://" not in cleaned:
        cleaned = f"https://{cleaned}"
    parsed = urlparse(cleaned)
    host = (parsed.netloc or parsed.path).strip().lower()
    if host.startswith("www."):
        host = host[4:]
    host = host.split("/")[0].split("?")[0].split("#")[0]
    return host


def normalize_bulk_domain_inputs(domains: list[str]) -> list[str]:
    normalized: list[str] = []
    seen: set[str] = set()
    for domain in domains:
        cleaned = normalize_domain_input(domain)
        if cleaned in seen:
            continue
        seen.add(cleaned)
        normalized.append(cleaned)
    return normalized


def pick_best_offer(offers: list[RegistrarOffer]) -> RegistrarOffer | None:
    priced_available = sorted(
        [offer for offer in offers if offer.status == DomainStatus.AVAILABLE and offer.price is not None],
        key=lambda offer: (offer.price or float("inf"), offer.provider),
    )
    if priced_available:
        return priced_available[0]

    available = [offer for offer in offers if offer.status == DomainStatus.AVAILABLE]
    if available:
        return available[0]

    priced_premium = sorted(
        [offer for offer in offers if offer.status == DomainStatus.PREMIUM and offer.price is not None],
        key=lambda offer: (offer.price or float("inf"), offer.provider),
    )
    if priced_premium:
        return priced_premium[0]

    return None


async def search_domain(domain: str, settings: dict) -> DomainSearchResult:
    normalized_domain = normalize_domain_input(domain)
    providers = build_provider_list(settings, include_fallbacks=False)
    if not providers:
        providers = build_provider_list(settings, include_fallbacks=True)
    offers = await asyncio.gather(
        *[_search_provider(provider, normalized_domain, settings) for provider in providers]
    )
    best = pick_best_offer(offers)
    if best:
        offers = [
            offer.model_copy(update={"is_best": _offers_match(offer, best)})
            for offer in offers
        ]
        best = next((offer for offer in offers if offer.is_best), best)
    return DomainSearchResult(
        domain=normalized_domain,
        available=any(offer.status == DomainStatus.AVAILABLE for offer in offers),
        best_offer=best,
        offers=offers,
    )


async def search_domains(domains: list[str], settings: dict) -> BulkDomainSearchResponse:
    normalized = normalize_bulk_domain_inputs(domains)
    results = await asyncio.gather(*[search_domain(domain, settings) for domain in normalized])
    return BulkDomainSearchResponse(results=results)


async def _search_provider(provider, domain: str, settings: dict) -> RegistrarOffer:
    try:
        availability: AvailabilityResult = await provider.check(domain)
    except Exception as exc:
        return RegistrarOffer(
            provider=getattr(provider, "name", "unknown"),
            status=DomainStatus.ERROR,
            price=None,
            currency=None,
            purchase_url=None,
            detail=str(exc),
        )

    return RegistrarOffer(
        provider=availability.source,
        status=availability.status,
        price=availability.price,
        currency=availability.currency,
        purchase_url=availability.purchase_url or _build_purchase_url(availability.source, settings, domain),
        detail=availability.detail,
    )


def _build_purchase_url(provider: str, settings: dict, domain: str) -> str | None:
    default_url = settings.get("registrar_base_url", "").strip()
    provider_defaults = {
        "namecheap": default_url or "https://www.namecheap.com/domains/registration/results/?domain=",
        "godaddy": "https://www.godaddy.com/domainsearch/find?checkAvail=1&domainToCheck=",
        "whoisxml": default_url or "https://www.namecheap.com/domains/registration/results/?domain=",
        "rdap": f"https://rdap.org/domain/{domain}",
        "whois": default_url or "https://www.namecheap.com/domains/registration/results/?domain=",
        "rapidapi": default_url or "https://www.namecheap.com/domains/registration/results/?domain=",
    }
    base = provider_defaults.get(provider)
    if not base:
        return None
    return base if base.endswith(domain) else f"{base}{domain}"


def _offers_match(left: RegistrarOffer, right: RegistrarOffer) -> bool:
    return (
        left.provider == right.provider
        and left.status == right.status
        and left.price == right.price
        and left.purchase_url == right.purchase_url
    )
