import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from fastapi.testclient import TestClient


class BackendApiTests(unittest.TestCase):
    def make_client(self):
        tmp = tempfile.TemporaryDirectory()

        from backend.main import create_app

        app = create_app(data_dir=Path(tmp.name))
        self.addCleanup(tmp.cleanup)
        return TestClient(app)

    def test_health_and_settings_endpoints(self):
        client = self.make_client()

        self.assertEqual(client.get("/health").json()["status"], "ok")
        response = client.get("/settings")

        self.assertEqual(response.status_code, 200)
        self.assertIn("default_tlds", response.json())

    def test_settings_post_masks_keys_in_response(self):
        client = self.make_client()

        response = client.post(
            "/settings",
            json={
                "ai": {
                    "provider": "openrouter",
                    "model": "openrouter/free",
                    "api_keys": {"openrouter": "sk-test-value"},
                },
                "domain_providers": {},
                "default_tlds": [".com"],
                "max_checks_per_run": 20,
                "delay_between_checks": 0.1,
                "registrar_base_url": "https://registrar.example/search?domain=",
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["ai"]["api_keys"]["openrouter"], "sk-t...alue")

    def test_cities_endpoint_returns_country_cities(self):
        client = self.make_client()

        response = client.get("/cities", params={"country": "United States"})

        self.assertEqual(response.status_code, 200)
        self.assertIn("Dallas", response.json()["cities"])

    def test_generate_endpoint_returns_candidates(self):
        client = self.make_client()

        response = client.post(
            "/generate",
            json={
                "country": "United States",
                "cities": ["Dallas"],
                "niche": "Industrial Cleaning",
                "tlds": [".com"],
                "count": 5,
                "style": "Premium Geo",
            },
        )

        self.assertEqual(response.status_code, 200)
        domains = [item["domain"] for item in response.json()["domains"]]
        self.assertIn("dallasindustrialcleaning.com", domains)

    def test_generate_and_check_returns_available_only_and_persists_results(self):
        client = self.make_client()

        async def fake_check_candidates(self, candidates, available_only=False):
            from backend.models import DomainResult, DomainStatus

            return [
                DomainResult(
                    domain=candidates[0].domain,
                    city=candidates[0].city,
                    niche=candidates[0].niche,
                    tld=candidates[0].tld,
                    status=DomainStatus.AVAILABLE,
                    score=88,
                    source="fake",
                    checked_at="2026-04-28T12:00:00Z",
                )
            ]

        with patch("backend.services.domain_checker.DomainChecker.check_candidates", fake_check_candidates):
            response = client.post(
                "/generate-and-check",
                json={
                    "country": "United States",
                    "cities": ["Dallas"],
                    "niche": "Industrial Cleaning",
                    "tlds": [".com"],
                    "count": 3,
                    "style": "Premium Geo",
                },
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()["domains"]), 1)
        self.assertEqual(response.json()["domains"][0]["status"], "AVAILABLE")
        self.assertIn("dallasindustrialcleaning.com", client.get("/export?format=txt").text)

