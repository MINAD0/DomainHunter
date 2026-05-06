# DomainHunter

DomainHunter is a local Docker app for finding domain opportunities.

It helps you:
- generate geo-targeted domain ideas
- check availability
- compare registrar search results
- save good domains
- export your research

Everything runs on your machine.  
No login. No database. No hosted account required.

---

## What You Can Do

- Generate domains from:
  - country
  - city
  - niche
  - TLDs
  - style
- Check available domains
- Search a single domain across configured providers
- Run bulk domain search
- Save domains with notes
- Export results as CSV or TXT

---

## Before You Start

You only need:

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) or Docker Engine with Compose

That is enough to run the app.

If you want better results, you should also add API keys later in the **Settings** page for:
- AI providers
- domain-check providers
- registrar pricing/search providers

The app can still run without keys, but some features will fall back to weaker checks.

---

## Quick Start

From the project folder:

```bash
cp .env.example .env
docker compose up --build
```

Then open:

- App: [http://localhost:3000](http://localhost:3000)
- Backend health: [http://localhost:8000/health](http://localhost:8000/health)

---

## First-Time Setup

After the app starts:

1. Open **Settings**
2. Add the provider keys you want to use
3. Save settings
4. Go to **Geo Generator** or **Domain Search**

Recommended order:

1. Add an AI provider key
2. Add at least one domain availability provider
3. Add at least one official registrar search provider

---

## Main Pages

### Dashboard
Quick summary of:
- total domains generated
- available domains found
- last scan
- top saved domains

### Geo Generator
Use this to:
- choose country and cities
- choose a niche
- select TLDs
- generate and check domain ideas

### Domain Search
Use this to:
- search one domain
- search many domains at once
- compare configured providers
- open the best available source

### Results
Use this to:
- review available domains
- copy domains
- save domains
- export data

### Saved Domains
Use this to:
- keep a shortlist
- add notes
- remove saved domains

### Settings
Use this to configure:
- AI providers
- domain check providers
- registrar search providers
- default TLDs
- max checks per run

### Logs
Use this to inspect:
- provider activity
- fallbacks
- local run history

---

## Providers

### AI Providers

Supported:
- OpenRouter
- OpenAI
- Gemini
- Claude
- Custom endpoint

### Domain Availability Providers

Supported:
- Namecheap
- WhoisXML
- GoDaddy
- RapidAPI
- RDAP fallback
- WHOIS fallback

### Official Search / Pricing Providers

Supported in the app:
- GoDaddy
- Namecheap
- Dynadot
- name.com
- Spaceship

If none of these are configured, search still works, but price comparison will be limited.

---

## Local Data

The app stores local data for you automatically.

Files used by the backend:
- `settings.json`
- `saved_domains.json`
- `available_results.csv`
- `logs.txt`

With Docker Compose, this data is stored in the `domain_hunter_data` volume.

---

## Useful Commands

### Start

```bash
docker compose up --build
```

### Start in background

```bash
docker compose up -d --build
```

### Stop

```bash
docker compose down
```

### Rebuild after changes

```bash
docker compose up -d --build
```

---

## Local Development

### Backend

```bash
python -m pip install -r backend/requirements.txt
uvicorn backend.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Development URLs:
- App: [http://localhost:3000](http://localhost:3000)
- API docs: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## API Endpoints

Main endpoints:

- `GET /health`
- `GET /dashboard`
- `GET /settings`
- `POST /settings`
- `GET /countries`
- `GET /cities`
- `GET /niches`
- `POST /generate`
- `POST /check`
- `POST /generate-and-check`
- `POST /search-domain`
- `POST /search-domains`
- `GET /results`
- `GET /saved`
- `POST /saved`
- `DELETE /saved/{domain}`
- `GET /export?format=csv|txt`
- `GET /logs`

---

## Notes

- This is a local-first tool.
- It is built for research and opportunity finding.
- Availability and price checks can vary by provider.
- Fallback results are useful, but official registrar APIs are more reliable.

---

## Project Structure

```txt
backend/
frontend/
tests/
docker-compose.yml
.env.example
README.md
```

The original CLI prototype is still included in `domain_hunter.py`.
