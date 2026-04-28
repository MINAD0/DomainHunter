import asyncio
import io
import random
import subprocess
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

from domain_hunter import (
    TOOL_NAME,
    VERSION,
    AiTermSuggestion,
    AvailabilityChecker,
    AvailabilityResult,
    AvailabilityState,
    ProviderError,
    _decode_json_response,
    emit_available_result,
    format_banner,
    format_settings,
    generate_domains,
    interactive_menu,
    normalize_openrouter_model_id,
    parse_ai_terms_response,
    parse_args,
)


class DomainGenerationTests(unittest.TestCase):
    def test_generate_domains_combines_expected_patterns_and_deduplicates(self):
        domains = generate_domains(
            niches=["ai", "cloud", "ai"],
            keywords=["agent", "hub"],
            tlds=["com", "ai"],
            count=1000,
            rng=random.Random(7),
        )

        self.assertEqual(len(domains), len(set(domains)))
        self.assertIn("agentai.com", domains)
        self.assertIn("aiagent.ai", domains)
        self.assertIn("agenthub.com", domains)
        self.assertIn("aicloud.com", domains)

    def test_generate_domains_sanitizes_terms_and_limits_count(self):
        domains = generate_domains(
            niches=[" AI! ", "ro-bot"],
            keywords=["Agent", "store"],
            tlds=["COM"],
            count=3,
            rng=random.Random(3),
        )

        self.assertEqual(len(domains), 3)
        for domain in domains:
            self.assertRegex(domain, r"^[a-z0-9]+\.[a-z0-9]+$")


class AvailabilityOutputTests(unittest.TestCase):
    def test_emit_available_result_prints_and_saves_only_available_domains(self):
        output_path = Path.cwd() / "tests" / ".available-test.txt"
        try:
            output_path.unlink(missing_ok=True)
            stream = io.StringIO()

            available = AvailabilityResult(
                domain="agentcloud.ai",
                state=AvailabilityState.AVAILABLE,
                source="test",
            )
            taken = AvailabilityResult(
                domain="aistore.com",
                state=AvailabilityState.TAKEN,
                source="test",
            )

            self.assertTrue(
                emit_available_result(
                    available,
                    output_path=output_path,
                    stream=stream,
                    use_color=False,
                )
            )
            self.assertFalse(
                emit_available_result(
                    taken,
                    output_path=output_path,
                    stream=stream,
                    use_color=False,
                )
            )

            self.assertEqual(stream.getvalue(), "✔ agentcloud.ai\n")
            self.assertEqual(output_path.read_text(encoding="utf-8"), "agentcloud.ai\n")
        finally:
            output_path.unlink(missing_ok=True)


class FakeProvider:
    name = "fake"

    def __init__(self, result=None, error=None):
        self.result = result
        self.error = error
        self.calls = []

    async def check(self, domain):
        self.calls.append(domain)
        if self.error:
            raise self.error
        return self.result


class AvailabilityCheckerTests(unittest.TestCase):
    def test_checker_falls_back_when_primary_provider_errors(self):
        primary = FakeProvider(error=ProviderError("rate limited", retryable=True))
        fallback_result = AvailabilityResult(
            domain="agenthub.io",
            state=AvailabilityState.AVAILABLE,
            source="fallback",
        )
        fallback = FakeProvider(result=fallback_result)
        checker = AvailabilityChecker(
            [primary, fallback],
            delay_seconds=0,
            max_retries=0,
        )

        result = asyncio.run(checker.check_domain("agenthub.io"))

        self.assertEqual(result.state, AvailabilityState.AVAILABLE)
        self.assertEqual(result.source, "fallback")
        self.assertEqual(primary.calls, ["agenthub.io"])
        self.assertEqual(fallback.calls, ["agenthub.io"])


class CliDisplayTests(unittest.TestCase):
    def test_banner_includes_tool_name_and_version(self):
        banner = format_banner()

        self.assertIn(TOOL_NAME, banner)
        self.assertIn(VERSION, banner)

    def test_parse_args_accepts_menu_flag(self):
        args = parse_args(["--menu"])

        self.assertTrue(args.menu)

    def test_interactive_menu_can_exit_without_running(self):
        args = parse_args(["--count", "5"])
        stream = io.StringIO()

        result = interactive_menu(args, input_func=lambda _prompt: "8", stream=stream)

        self.assertIsNone(result)
        self.assertIn("Main Menu", stream.getvalue())
        self.assertIn(TOOL_NAME, stream.getvalue())

    def test_interactive_menu_updates_domain_seed_config(self):
        args = parse_args([])
        answers = iter(
            [
                "2",
                "security, ai",
                "agent, scanner",
                "com, ai",
                "get",
                "lab",
                "25",
                "8",
            ]
        )

        result = interactive_menu(
            args,
            input_func=lambda _prompt: next(answers),
            stream=io.StringIO(),
        )

        self.assertIsNone(result)
        self.assertEqual(args.niches, ["security", "ai"])
        self.assertEqual(args.keywords, ["agent", "scanner"])
        self.assertEqual(args.tlds, ["com", "ai"])
        self.assertEqual(args.prefixes, ["get"])
        self.assertEqual(args.suffixes, ["lab"])
        self.assertEqual(args.count, 25)

    def test_interactive_menu_updates_ai_config(self):
        args = parse_args([])
        answers = iter(
            [
                "3",
                "yes",
                "agentic devtools",
                "inclusionAI: Ling-2.6-1T (free)",
                "12",
                "20",
                "0.7",
                "yes",
                "sk-test",
                "8",
            ]
        )

        interactive_menu(
            args,
            input_func=lambda _prompt: next(answers),
            stream=io.StringIO(),
        )

        self.assertTrue(args.ai_generate)
        self.assertEqual(args.ai_topic, "agentic devtools")
        self.assertEqual(args.openrouter_model, "inclusionai/ling-2.6-1t:free")
        self.assertEqual(args.ai_niche_count, 12)
        self.assertEqual(args.ai_keyword_count, 20)
        self.assertEqual(args.ai_temperature, 0.7)
        self.assertTrue(args.ai_replace)
        self.assertEqual(args.openrouter_api_key, "sk-test")

    def test_format_settings_masks_api_keys(self):
        args = parse_args(["--openrouter-api-key", "sk-secret-value"])

        settings = format_settings(args)

        self.assertIn("sk-s...alue", settings)
        self.assertNotIn("sk-secret-value", settings)

    def test_version_flag_prints_tool_name_and_version(self):
        completed = subprocess.run(
            [sys.executable, "domain_hunter.py", "--version"],
            cwd=Path.cwd(),
            capture_output=True,
            text=True,
            check=True,
        )

        self.assertEqual(completed.stdout.strip(), f"{TOOL_NAME} {VERSION}")


class AiTermGenerationTests(unittest.TestCase):
    def test_parse_ai_terms_response_accepts_json_and_sanitizes_terms(self):
        suggestion = parse_ai_terms_response(
            """
            {
              "niches": ["AI Agents", "cloud-native", "robotics"],
              "keywords": ["agent", "hub!", "Infra Stack"]
            }
            """
        )

        self.assertEqual(
            suggestion,
            AiTermSuggestion(
                niches=["aiagents", "cloudnative", "robotics"],
                keywords=["agent", "hub", "infrastack"],
            ),
        )

    def test_parse_ai_terms_response_accepts_markdown_code_fence(self):
        suggestion = parse_ai_terms_response(
            """```json
            {"niches": ["automation"], "keywords": ["agent"]}
            ```"""
        )

        self.assertEqual(suggestion.niches, ["automation"])
        self.assertEqual(suggestion.keywords, ["agent"])

    def test_parse_args_accepts_ai_generation_flags(self):
        args = parse_args(
            [
                "--ai-generate",
                "--ai-topic",
                "agentic developer tools",
                "--openrouter-model",
                "openrouter/auto",
            ]
        )

        self.assertTrue(args.ai_generate)
        self.assertEqual(args.ai_topic, "agentic developer tools")
        self.assertEqual(args.openrouter_model, "openrouter/auto")

    def test_parse_args_defaults_to_openrouter_free_for_ai_generation(self):
        args = parse_args(["--ai-generate"])

        self.assertEqual(args.openrouter_model, "openrouter/free")

    def test_normalize_openrouter_model_id_keeps_api_ids(self):
        self.assertEqual(
            normalize_openrouter_model_id("inclusionai/ling-2.6-1t:free"),
            "inclusionai/ling-2.6-1t:free",
        )

    def test_normalize_openrouter_model_id_converts_ui_display_name(self):
        self.assertEqual(
            normalize_openrouter_model_id("inclusionAI: Ling-2.6-1T (free)"),
            "inclusionai/ling-2.6-1t:free",
        )


class ProviderErrorHandlingTests(unittest.TestCase):
    def test_decode_json_response_includes_openrouter_error_message(self):
        class Response:
            status_code = 402

            @staticmethod
            def json():
                return {
                    "error": {
                        "code": 402,
                        "message": "Insufficient credits",
                    }
                }

        with self.assertRaisesRegex(
            ProviderError,
            "HTTP 402 from openrouter: Insufficient credits",
        ):
            _decode_json_response(Response(), "openrouter")

    def test_main_prints_provider_error_without_traceback(self):
        async def failing_run(_args):
            raise ProviderError("HTTP 402 from openrouter: Insufficient credits")

        stream = io.StringIO()
        with patch("domain_hunter.run", failing_run), patch("sys.stderr", stream):
            import domain_hunter

            exit_code = domain_hunter.main(["--ai-generate"])

        self.assertEqual(exit_code, 1)
        self.assertIn("Error: HTTP 402 from openrouter", stream.getvalue())
        self.assertNotIn("Traceback", stream.getvalue())

    def test_main_prints_invalid_model_hint(self):
        async def failing_run(_args):
            raise ProviderError(
                "HTTP 400 from openrouter: MODEL_ID_HERE is not a valid model ID."
            )

        stream = io.StringIO()
        with patch("domain_hunter.run", failing_run), patch("sys.stderr", stream):
            import domain_hunter

            exit_code = domain_hunter.main(["--ai-generate"])

        self.assertEqual(exit_code, 1)
        self.assertIn("Use a real OpenRouter model ID", stream.getvalue())


if __name__ == "__main__":
    unittest.main()
