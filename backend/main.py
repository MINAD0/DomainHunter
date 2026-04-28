from __future__ import annotations

import asyncio
import os
from pathlib import Path

from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware

from backend.models import (
    CheckRequest,
    DashboardStats,
    GenerateAndCheckRequest,
    GenerateResponse,
    ResultsResponse,
    SavedDomain,
    SavedDomainRequest,
    Settings,
)
from backend.services.ai_generator import generate_ai_domain_ideas
from backend.services.domain_checker import build_checker
from backend.services.domain_generator import generate_geo_domains
from backend.services.storage import Storage, load_city_catalog


def create_app(data_dir: Path | None = None) -> FastAPI:
    storage = Storage(data_dir or Path(os.getenv("DOMAIN_HUNTER_DATA_DIR", "backend/data")))
    app = FastAPI(title="Domain Hunter API", version="1.0.0")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.state.storage = storage

    @app.get("/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    @app.get("/dashboard", response_model=DashboardStats)
    def dashboard() -> DashboardStats:
        results = storage.load_results()
        saved = storage.load_saved_domains()
        return DashboardStats(
            total_domains_generated=len(results),
            available_domains_found=len(results),
            last_scan=results[0].checked_at if results else None,
            top_saved_domains=saved[:5],
        )

    @app.get("/settings")
    def get_settings() -> dict:
        return storage.mask_settings()

    @app.post("/settings")
    def post_settings(settings: Settings) -> dict:
        saved = storage.save_settings(settings.model_dump())
        storage.append_log("Settings updated.")
        return storage.mask_settings(saved)

    @app.get("/countries")
    def countries() -> dict[str, list[str]]:
        return {"countries": load_city_catalog().countries()}

    @app.get("/cities")
    def cities(country: str) -> dict[str, list[str]]:
        return {"cities": load_city_catalog().cities_for(country)}

    @app.post("/generate", response_model=GenerateResponse)
    async def generate(request: GenerateAndCheckRequest) -> GenerateResponse:
        settings = storage.load_settings()
        ai_ideas = await _generate_ideas_for_request(settings, request)
        domains = generate_geo_domains(
            country=request.country,
            cities=request.cities,
            niche=request.niche,
            tlds=request.tlds,
            count=request.count,
            style=request.style,
            ai_ideas=ai_ideas,
        )
        storage.append_log(f"Generated {len(domains)} candidates for {request.niche}.")
        return GenerateResponse(domains=domains)

    @app.post("/check", response_model=ResultsResponse)
    async def check(request: CheckRequest) -> ResultsResponse:
        settings = storage.load_settings()
        checker = build_checker(settings)
        results = await checker.check_candidates(
            request.domains[: int(settings.get("max_checks_per_run", 50))],
            available_only=request.available_only,
        )
        available = [result for result in results if result.status.value == "AVAILABLE"]
        storage.append_results(available)
        storage.append_log(f"Checked {len(request.domains)} domains; {len(available)} available.")
        return ResultsResponse(domains=results)

    @app.post("/generate-and-check", response_model=ResultsResponse)
    async def generate_and_check(request: GenerateAndCheckRequest) -> ResultsResponse:
        settings = storage.load_settings()
        ai_ideas = await _generate_ideas_for_request(settings, request)
        max_checks = min(request.count, int(settings.get("max_checks_per_run", request.count)))
        candidates = generate_geo_domains(
            country=request.country,
            cities=request.cities,
            niche=request.niche,
            tlds=request.tlds,
            count=max_checks,
            style=request.style,
            ai_ideas=ai_ideas,
        )
        checker = build_checker(settings)
        results = await checker.check_candidates(candidates, available_only=True)
        storage.append_results(results)
        storage.append_log(f"Generate-and-check found {len(results)} available domains.")
        return ResultsResponse(domains=results)

    @app.get("/results", response_model=ResultsResponse)
    def results() -> ResultsResponse:
        return ResultsResponse(domains=storage.load_results())

    @app.get("/saved", response_model=list[SavedDomain])
    def saved() -> list[SavedDomain]:
        return storage.load_saved_domains()

    @app.post("/saved", response_model=SavedDomain)
    def save_domain(request: SavedDomainRequest) -> SavedDomain:
        saved_domain = storage.save_domain(request)
        storage.append_log(f"Saved {request.domain}.")
        return saved_domain

    @app.delete("/saved/{domain}")
    def delete_saved(domain: str) -> dict[str, str]:
        storage.remove_saved_domain(domain)
        storage.append_log(f"Removed saved domain {domain}.")
        return {"status": "removed"}

    @app.get("/export")
    def export(format: str = "csv") -> Response:
        selected = format.lower()
        if selected not in {"csv", "txt"}:
            raise HTTPException(status_code=400, detail="format must be csv or txt")
        media_type = "text/csv" if selected == "csv" else "text/plain"
        filename = f"domain-hunter-results.{selected}"
        return Response(
            storage.export_results(selected),
            media_type=media_type,
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )

    @app.get("/logs")
    def logs() -> Response:
        return Response(storage.read_logs(), media_type="text/plain")

    return app


async def _generate_ideas_for_request(settings: dict, request: GenerateAndCheckRequest) -> list[str]:
    tasks = [
        generate_ai_domain_ideas(
            settings=settings,
            city=city,
            niche=request.niche,
            tlds=request.tlds,
            count=max(4, request.count // max(1, len(request.cities))),
            style=request.style.value,
        )
        for city in request.cities
    ]
    ideas_by_city = await asyncio.gather(*tasks)
    return [idea for ideas in ideas_by_city for idea in ideas]


app = create_app()

