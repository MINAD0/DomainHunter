from __future__ import annotations

from enum import Enum
from typing import Any

from pydantic import BaseModel, Field, field_validator


class GeoStyle(str, Enum):
    EXACT_MATCH = "Exact Match"
    SERVICE_BASED = "Service Based"
    LEAD_GENERATION = "Lead Generation"
    PREMIUM_GEO = "Premium Geo"


class DomainStatus(str, Enum):
    AVAILABLE = "AVAILABLE"
    TAKEN = "TAKEN"
    PREMIUM = "PREMIUM"
    UNKNOWN = "UNKNOWN"
    ERROR = "ERROR"


class DomainCandidate(BaseModel):
    domain: str
    city: str
    niche: str
    tld: str


class DomainResult(DomainCandidate):
    status: DomainStatus
    score: int = Field(ge=0, le=100)
    source: str
    checked_at: str


class SavedDomainRequest(DomainResult):
    note: str = ""


class SavedDomain(SavedDomainRequest):
    saved_at: str


class GenerateAndCheckRequest(BaseModel):
    country: str
    cities: list[str]
    niche: str
    tlds: list[str]
    count: int = Field(default=50, ge=1, le=500)
    style: GeoStyle = GeoStyle.EXACT_MATCH

    @field_validator("country", "niche")
    @classmethod
    def require_text(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Value is required.")
        return cleaned

    @field_validator("cities")
    @classmethod
    def require_cities(cls, value: list[str]) -> list[str]:
        cities = [item.strip() for item in value if item.strip()]
        if not cities:
            raise ValueError("At least one city is required.")
        return cities

    @field_validator("tlds")
    @classmethod
    def normalize_tlds(cls, value: list[str]) -> list[str]:
        tlds: list[str] = []
        for item in value:
            cleaned = item.strip().lower()
            if not cleaned:
                continue
            if not cleaned.startswith("."):
                cleaned = f".{cleaned}"
            tlds.append(cleaned)
        if not tlds:
            raise ValueError("At least one TLD is required.")
        return list(dict.fromkeys(tlds))


class CheckRequest(BaseModel):
    domains: list[DomainCandidate]
    available_only: bool = False


class GenerateResponse(BaseModel):
    domains: list[DomainCandidate]


class ResultsResponse(BaseModel):
    domains: list[DomainResult]


class DashboardStats(BaseModel):
    total_domains_generated: int
    available_domains_found: int
    last_scan: str | None
    top_saved_domains: list[SavedDomain]


class Settings(BaseModel):
    ai: dict[str, Any] = Field(default_factory=dict)
    domain_providers: dict[str, Any] = Field(default_factory=dict)
    default_tlds: list[str] = Field(default_factory=lambda: [".com"])
    max_checks_per_run: int = Field(default=50, ge=1, le=1000)
    delay_between_checks: float = Field(default=0.25, ge=0, le=10)
    registrar_base_url: str = "https://www.namecheap.com/domains/registration/results/?domain="

