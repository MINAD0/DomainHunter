# DomainHunter

DomainHunter is a local-first Docker web app for generating, checking, saving, and exporting available GeoDomains for resale research.

Example target:

```txt
City: Dallas
Niche: Industrial Cleaning
TLD: .com
Result: dallasindustrialcleaning.com
```

The app has no login, no database, and no hosted service requirement. It runs on your machine with a Next.js dashboard, a FastAPI backend, provider-based domain availability checks, and local JSON/CSV/TXT storage.

## What It Does

- Generates GeoDomain ideas from country, cities, niche, TLDs, count, and style.
- Supports Exact Match, Service Based, Lead Generation, and Premium Geo styles.
- Uses AI ideas when configured, with deterministic local fallbacks when keys are missing.
- Checks availability through Namecheap, WhoisXML, optional GoDaddy/RapidAPI, RDAP, and WHOIS fallback.
- Shows available domains only in the main generator results workflow.
- Scores domains from 0 to 100 using TLD, city placement, service clarity, length, commercial intent, and readability.
- Saves domains with notes and exports CSV/TXT.
- Stores settings, results, saved domains, and logs in local files.

## Screens

- Dashboard: totals, available count, last scan, top saved domains.
- Geo Generator: country/city selector, niche, TLDs, count, style, generate-and-check action.
- Results: available-domain table with copy, save, export, and registrar actions.
- Saved Domains: local saved list, notes, remove, export.
- Settings: AI provider config, availability-provider keys, defaults, limits, registrar URL.
- Logs: local run history.

## Tech Stack

- Frontend: Next.js, React, Tailwind CSS, lucide-react.
- Backend: FastAPI, Pydantic, httpx, python-whois.
- AI providers: OpenAI, Gemini, Claude, OpenRouter, custom endpoint.
- Domain providers: Namecheap, WhoisXML, RDAP, WHOIS fallback, optional GoDaddy/RapidAPI.
- Storage: local JSON, CSV, and text files.
- Runtime: Docker Compose.

## Run With Docker

Prerequisites:

- Docker Desktop or Docker Engine with Compose.

```bash
cp .env.example .env
docker compose up --build
```

Open:

- Frontend: http://localhost:3000
- Backend health: http://localhost:8000/health

Backend data is stored in the `domain_hunter_data` Docker volume at `/app/backend/data`.

## Configure API Keys

You can add keys in the Settings page after the app starts. You can also seed optional values in `.env`.

Supported AI settings:

- OpenRouter API key and model.
- OpenAI API key and model.
- Gemini API key and model.
- Claude API key and model.
- Custom endpoint and optional bearer key.

Supported domain-check settings:

- Namecheap API user, key, username, and client IP.
- WhoisXML API key.
- GoDaddy API key and secret.
- RapidAPI key, host, URL, and domain parameter.

If provider keys are missing, DomainHunter still attempts RDAP and WHOIS fallback checks.

## Local Development

Backend:

```bash
python -m pip install -r backend/requirements.txt
uvicorn backend.main:app --reload --port 8000
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Development URLs:

- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- OpenAPI docs: http://localhost:8000/docs

## API Endpoints

- `GET /health`
- `GET /dashboard`
- `GET /settings`
- `POST /settings`
- `GET /countries`
- `GET /cities?country=United States`
- `POST /generate`
- `POST /check`
- `POST /generate-and-check`
- `GET /results`
- `GET /saved`
- `POST /saved`
- `DELETE /saved/{domain}`
- `GET /export?format=csv|txt`
- `GET /logs`

## Tests

Backend and preserved legacy CLI tests:

```bash
python -m unittest discover -s tests -v
```

Frontend:

```bash
cd frontend
npm test
npm run build
```

## Local Data Files

The backend writes these files under `backend/data` during local development, or inside the Docker volume in Compose:

- `settings.json`
- `saved_domains.json`
- `available_results.csv`
- `logs.txt`

Do not commit real API keys. The included defaults are blank and safe to publish.

## Project Structure

```txt
backend/
  main.py
  services/
  data/
  Dockerfile
frontend/
  app/
  components/
  lib/
  Dockerfile
docker-compose.yml
.env.example
```

The original CLI prototype remains in `domain_hunter.py` with its tests preserved.

## Notes

- V1 is intentionally local-first: no auth, no marketplace, no payments, no database, no scraping, and no email automation.
- Domain availability APIs can rate-limit or return uncertain results. Treat `UNKNOWN`/fallback behavior as research assistance, not registrar-grade final proof.
