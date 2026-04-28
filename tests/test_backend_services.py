import asyncio
import json
import tempfile
import unittest
from pathlib import Path


class BackendServiceTests(unittest.TestCase):
    def test_settings_storage_masks_secret_values(self):
        from backend.services.storage import Storage

        with tempfile.TemporaryDirectory() as tmp:
            storage = Storage(Path(tmp))
            settings = storage.save_settings(
                {
                    "ai": {
                        "provider": "openrouter",
                        "model": "openrouter/free",
                        "api_keys": {
                            "openrouter": "sk-openrouter-secret",
                            "openai": "",
                        },
                    },
                    "domain_providers": {
                        "whoisxml": {"api_key": "whois-secret"},
                    },
                    "default_tlds": [".com", ".net"],
                    "max_checks_per_run": 25,
                    "delay_between_checks": 0.5,
                    "registrar_base_url": "https://registrar.example/search?domain=",
                }
            )

            self.assertEqual(settings["ai"]["api_keys"]["openrouter"], "sk-openrouter-secret")
            masked = storage.mask_settings(settings)

            self.assertEqual(masked["ai"]["api_keys"]["openrouter"], "sk-o...cret")
            self.assertEqual(masked["domain_providers"]["whoisxml"]["api_key"], "whoi...cret")
            self.assertEqual(storage.load_settings()["default_tlds"], [".com", ".net"])

    def test_settings_storage_preserves_existing_secret_when_masked_value_is_saved(self):
        from backend.services.storage import Storage

        with tempfile.TemporaryDirectory() as tmp:
            storage = Storage(Path(tmp))
            storage.save_settings(
                {
                    "ai": {
                        "api_keys": {
                            "openrouter": "sk-openrouter-secret",
                        }
                    }
                }
            )

            masked = storage.mask_settings()
            masked["max_checks_per_run"] = 99
            storage.save_settings(masked)

            settings = storage.load_settings()
            self.assertEqual(settings["ai"]["api_keys"]["openrouter"], "sk-openrouter-secret")
            self.assertEqual(settings["max_checks_per_run"], 99)

    def test_city_catalog_returns_bundled_country_cities(self):
        from backend.services.storage import load_city_catalog

        catalog = load_city_catalog()

        self.assertIn("United States", catalog.countries())
        self.assertIn("Dallas", catalog.cities_for("United States"))
        self.assertEqual(catalog.cities_for("Missing"), [])

    def test_geo_generator_produces_clean_style_variants(self):
        from backend.models import GeoStyle
        from backend.services.domain_generator import generate_geo_domains

        domains = generate_geo_domains(
            country="United States",
            cities=["Dallas"],
            niche="Industrial Cleaning",
            tlds=[".com"],
            count=12,
            style=GeoStyle.PREMIUM_GEO,
            ai_ideas=["Dallas-123", "amazon dallas cleaning", "Dallas Warehouse Cleaning"],
        )

        names = [item.domain for item in domains]
        self.assertIn("dallasindustrialcleaning.com", names)
        self.assertIn("industrialcleaningdallas.com", names)
        self.assertIn("dallaswarehousecleaning.com", names)
        self.assertNotIn("dallas-123.com", names)
        self.assertFalse(any("amazon" in name for name in names))
        self.assertEqual(len(names), len(set(names)))

    def test_domain_scoring_matches_geo_priority(self):
        from backend.services.domain_scoring import score_domain

        city_first = score_domain(
            domain="dallasindustrialcleaning.com",
            city="Dallas",
            niche="Industrial Cleaning",
        )
        city_last = score_domain(
            domain="industrialcleaningdallas.com",
            city="Dallas",
            niche="Industrial Cleaning",
        )

        self.assertEqual(city_first, 88)
        self.assertEqual(city_last, 76)

    def test_storage_saves_removes_and_exports_domains(self):
        from backend.models import DomainResult, DomainStatus, SavedDomainRequest
        from backend.services.storage import Storage

        with tempfile.TemporaryDirectory() as tmp:
            storage = Storage(Path(tmp))
            result = DomainResult(
                domain="dallascleaning.com",
                city="Dallas",
                niche="Cleaning",
                tld=".com",
                status=DomainStatus.AVAILABLE,
                score=91,
                source="test",
                checked_at="2026-04-28T12:00:00Z",
            )

            storage.append_results([result])
            saved = storage.save_domain(SavedDomainRequest(**result.model_dump(), note="Call buyer"))

            self.assertEqual(saved.note, "Call buyer")
            self.assertIn("dallascleaning.com", storage.export_results("txt"))
            self.assertIn("domain,city,niche,tld,status,score,source,checked_at", storage.export_results("csv"))

            storage.remove_saved_domain("dallascleaning.com")
            self.assertEqual(storage.load_saved_domains(), [])

    def test_checker_falls_back_and_returns_available_only(self):
        from backend.models import CheckRequest, DomainCandidate, DomainStatus
        from backend.services.domain_checker import AvailabilityResult, DomainChecker

        class UnknownProvider:
            name = "unknown"

            async def check(self, domain):
                return AvailabilityResult(domain=domain, status=DomainStatus.UNKNOWN, source=self.name)

        class AvailableProvider:
            name = "available"

            async def check(self, domain):
                return AvailabilityResult(domain=domain, status=DomainStatus.AVAILABLE, source=self.name)

        checker = DomainChecker([UnknownProvider(), AvailableProvider()], delay_seconds=0)
        candidates = [
            DomainCandidate(domain="dallascleaning.com", city="Dallas", niche="Cleaning", tld=".com")
        ]

        results = asyncio.run(checker.check_candidates(candidates, available_only=True))

        self.assertEqual(len(results), 1)
        self.assertEqual(results[0].status, DomainStatus.AVAILABLE)
        self.assertEqual(results[0].source, "available")
