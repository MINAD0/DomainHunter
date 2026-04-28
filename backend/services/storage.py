from __future__ import annotations

import csv
import json
from dataclasses import dataclass
from datetime import UTC, datetime
from io import StringIO
from pathlib import Path
from typing import Any

from backend.models import DomainResult, SavedDomain, SavedDomainRequest


DEFAULT_SETTINGS: dict[str, Any] = {
    "ai": {
        "provider": "openrouter",
        "model": "openrouter/free",
        "api_keys": {
            "openai": "",
            "gemini": "",
            "claude": "",
            "openrouter": "",
            "custom": "",
        },
        "custom_endpoint": "",
    },
    "domain_providers": {
        "namecheap": {
            "api_user": "",
            "api_key": "",
            "username": "",
            "client_ip": "",
        },
        "whoisxml": {"api_key": ""},
        "godaddy": {"api_key": "", "api_secret": ""},
        "rapidapi": {
            "api_key": "",
            "host": "",
            "url": "",
            "domain_param": "domain",
        },
    },
    "default_tlds": [".com"],
    "max_checks_per_run": 50,
    "delay_between_checks": 0.25,
    "registrar_base_url": "https://www.namecheap.com/domains/registration/results/?domain=",
}


CITY_DATA: dict[str, list[str]] = {
    "United States": [
        "New York",
        "Los Angeles",
        "Chicago",
        "Houston",
        "Phoenix",
        "Philadelphia",
        "San Antonio",
        "San Diego",
        "Dallas",
        "San Jose",
        "Austin",
        "Jacksonville",
        "Fort Worth",
        "Columbus",
        "Charlotte",
        "Indianapolis",
        "San Francisco",
        "Seattle",
        "Denver",
        "Washington",
        "Boston",
        "El Paso",
        "Nashville",
        "Detroit",
        "Portland",
        "Memphis",
        "Oklahoma City",
        "Las Vegas",
        "Louisville",
        "Baltimore",
        "Milwaukee",
        "Albuquerque",
        "Tucson",
        "Fresno",
        "Sacramento",
        "Mesa",
        "Atlanta",
        "Kansas City",
        "Colorado Springs",
        "Miami",
    ],
    "Canada": [
        "Toronto",
        "Montreal",
        "Vancouver",
        "Calgary",
        "Edmonton",
        "Ottawa",
        "Winnipeg",
        "Quebec City",
        "Hamilton",
        "Kitchener",
    ],
    "United Kingdom": [
        "London",
        "Birmingham",
        "Manchester",
        "Leeds",
        "Glasgow",
        "Liverpool",
        "Bristol",
        "Sheffield",
        "Edinburgh",
        "Cardiff",
    ],
    "Australia": [
        "Sydney",
        "Melbourne",
        "Brisbane",
        "Perth",
        "Adelaide",
        "Gold Coast",
        "Canberra",
        "Newcastle",
        "Wollongong",
        "Hobart",
    ],
    "Germany": [
        "Berlin",
        "Hamburg",
        "Munich",
        "Cologne",
        "Frankfurt",
        "Stuttgart",
        "Dusseldorf",
        "Leipzig",
        "Dortmund",
        "Essen",
    ],
    "France": [
        "Paris",
        "Marseille",
        "Lyon",
        "Toulouse",
        "Nice",
        "Nantes",
        "Montpellier",
        "Strasbourg",
        "Bordeaux",
        "Lille",
    ],
    "Spain": [
        "Madrid",
        "Barcelona",
        "Valencia",
        "Seville",
        "Zaragoza",
        "Malaga",
        "Murcia",
        "Palma",
        "Bilbao",
        "Alicante",
    ],
    "Italy": [
        "Rome",
        "Milan",
        "Naples",
        "Turin",
        "Palermo",
        "Genoa",
        "Bologna",
        "Florence",
        "Bari",
        "Catania",
    ],
    "Mexico": [
        "Mexico City",
        "Guadalajara",
        "Monterrey",
        "Puebla",
        "Tijuana",
        "Leon",
        "Juarez",
        "Zapopan",
        "Merida",
        "Cancun",
    ],
    "Brazil": [
        "Sao Paulo",
        "Rio de Janeiro",
        "Brasilia",
        "Salvador",
        "Fortaleza",
        "Belo Horizonte",
        "Manaus",
        "Curitiba",
        "Recife",
        "Porto Alegre",
    ],
}


@dataclass(frozen=True)
class CityCatalog:
    data: dict[str, list[str]]

    def countries(self) -> list[str]:
        return sorted(self.data)

    def cities_for(self, country: str) -> list[str]:
        return list(self.data.get(country, []))


def load_city_catalog() -> CityCatalog:
    return CityCatalog(CITY_DATA)


class Storage:
    def __init__(self, data_dir: Path):
        self.data_dir = data_dir
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.settings_path = self.data_dir / "settings.json"
        self.saved_path = self.data_dir / "saved_domains.json"
        self.results_path = self.data_dir / "available_results.csv"
        self.logs_path = self.data_dir / "logs.txt"
        self._ensure_files()

    def _ensure_files(self) -> None:
        if not self.settings_path.exists():
            self.settings_path.write_text(
                json.dumps(DEFAULT_SETTINGS, indent=2),
                encoding="utf-8",
            )
        if not self.saved_path.exists():
            self.saved_path.write_text("[]", encoding="utf-8")
        if not self.results_path.exists():
            self.results_path.write_text(self._csv_header(), encoding="utf-8")
        if not self.logs_path.exists():
            self.logs_path.write_text("", encoding="utf-8")

    def load_settings(self) -> dict[str, Any]:
        try:
            loaded = json.loads(self.settings_path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            loaded = {}
        return _deep_merge(DEFAULT_SETTINGS, loaded)

    def save_settings(self, settings: dict[str, Any]) -> dict[str, Any]:
        current = self.load_settings()
        cleaned_settings = _preserve_masked_secrets(settings, current)
        merged = _deep_merge(DEFAULT_SETTINGS, cleaned_settings)
        merged["default_tlds"] = _normalize_tlds(merged.get("default_tlds", [".com"]))
        self.settings_path.write_text(json.dumps(merged, indent=2), encoding="utf-8")
        return merged

    def mask_settings(self, settings: dict[str, Any] | None = None) -> dict[str, Any]:
        return _mask_nested(settings or self.load_settings())

    def append_results(self, results: list[DomainResult]) -> None:
        if not results:
            return
        exists = self.results_path.exists()
        with self.results_path.open("a", encoding="utf-8", newline="") as handle:
            writer = csv.DictWriter(handle, fieldnames=_result_fields())
            if not exists or self.results_path.stat().st_size == 0:
                writer.writeheader()
            for result in results:
                writer.writerow(result.model_dump())

    def load_results(self) -> list[DomainResult]:
        if not self.results_path.exists():
            return []
        with self.results_path.open("r", encoding="utf-8", newline="") as handle:
            rows = list(csv.DictReader(handle))
        results: list[DomainResult] = []
        for row in rows:
            if not row.get("domain"):
                continue
            row["score"] = int(row.get("score") or 0)
            results.append(DomainResult(**row))
        return results

    def export_results(self, format: str) -> str:
        results = self.load_results()
        if format.lower() == "txt":
            return "\n".join(result.domain for result in results) + ("\n" if results else "")
        output = StringIO()
        writer = csv.DictWriter(output, fieldnames=_result_fields())
        writer.writeheader()
        for result in results:
            writer.writerow(result.model_dump())
        return output.getvalue()

    def load_saved_domains(self) -> list[SavedDomain]:
        try:
            raw = json.loads(self.saved_path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            raw = []
        return [SavedDomain(**item) for item in raw if item.get("domain")]

    def save_domain(self, request: SavedDomainRequest) -> SavedDomain:
        domains = [item for item in self.load_saved_domains() if item.domain != request.domain]
        saved = SavedDomain(
            **request.model_dump(),
            saved_at=datetime.now(UTC).isoformat().replace("+00:00", "Z"),
        )
        domains.insert(0, saved)
        self.saved_path.write_text(
            json.dumps([item.model_dump() for item in domains], indent=2),
            encoding="utf-8",
        )
        return saved

    def remove_saved_domain(self, domain: str) -> None:
        domains = [item for item in self.load_saved_domains() if item.domain != domain]
        self.saved_path.write_text(
            json.dumps([item.model_dump() for item in domains], indent=2),
            encoding="utf-8",
        )

    def append_log(self, message: str) -> None:
        timestamp = datetime.now(UTC).isoformat().replace("+00:00", "Z")
        with self.logs_path.open("a", encoding="utf-8") as handle:
            handle.write(f"[{timestamp}] {message}\n")

    def read_logs(self) -> str:
        return self.logs_path.read_text(encoding="utf-8")

    @staticmethod
    def _csv_header() -> str:
        return ",".join(_result_fields()) + "\n"


def _result_fields() -> list[str]:
    return ["domain", "city", "niche", "tld", "status", "score", "source", "checked_at"]


def _normalize_tlds(values: list[str]) -> list[str]:
    normalized: list[str] = []
    for value in values:
        cleaned = str(value).strip().lower()
        if not cleaned:
            continue
        if not cleaned.startswith("."):
            cleaned = f".{cleaned}"
        normalized.append(cleaned)
    return list(dict.fromkeys(normalized)) or [".com"]


def _deep_merge(defaults: dict[str, Any], updates: dict[str, Any]) -> dict[str, Any]:
    merged = json.loads(json.dumps(defaults))
    for key, value in updates.items():
        if isinstance(value, dict) and isinstance(merged.get(key), dict):
            merged[key] = _deep_merge(merged[key], value)
        else:
            merged[key] = value
    return merged


def _mask_nested(value: Any, *, secret_context: bool = False) -> Any:
    if isinstance(value, dict):
        masked: dict[str, Any] = {}
        for key, item in value.items():
            child_secret_context = secret_context or _is_secret_key(key)
            if child_secret_context and isinstance(item, str):
                masked[key] = _mask_secret(item)
            else:
                masked[key] = _mask_nested(item, secret_context=child_secret_context)
        return masked
    if isinstance(value, list):
        return [_mask_nested(item, secret_context=secret_context) for item in value]
    return value


def _is_secret_key(key: str) -> bool:
    lowered = key.lower()
    return "key" in lowered or "secret" in lowered or "token" in lowered


def _mask_secret(value: str) -> str:
    if not value:
        return ""
    if len(value) <= 8:
        return "*" * len(value)
    return f"{value[:4]}...{value[-4:]}"


def _preserve_masked_secrets(value: Any, current: Any, *, secret_context: bool = False) -> Any:
    if isinstance(value, dict):
        preserved: dict[str, Any] = {}
        current_dict = current if isinstance(current, dict) else {}
        for key, item in value.items():
            child_secret_context = secret_context or _is_secret_key(key)
            preserved[key] = _preserve_masked_secrets(
                item,
                current_dict.get(key),
                secret_context=child_secret_context,
            )
        return preserved
    if secret_context and isinstance(value, str) and _looks_masked(value):
        return current if isinstance(current, str) else value
    return value


def _looks_masked(value: str) -> bool:
    return "..." in value or (bool(value) and set(value) == {"*"})
