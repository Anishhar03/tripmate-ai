# TripMate AI Engineering Handbook

This handbook explains how TripMate AI was designed, implemented, tested, and deployed. It starts with the product problem, follows a trip through every runtime layer, and ends with a from-scratch build plan and interview questions.

The repository intentionally supports two operating modes:

1. **Static PWA mode** is the deployed GitHub Pages application. It has no build step, needs no API key, stores trips in the browser, and keeps working offline after the first successful load.
2. **Connected mode** adds the optional FastAPI service, LangGraph workflow, Groq model, and SQLite or PostgreSQL persistence.

Keeping those modes separate is a deliberate reliability choice. A model outage, missing key, backend cold start, or database failure must not turn the public portfolio into a blank screen.

## Reading order

| Chapter | What it teaches |
| --- | --- |
| [01. Product and requirements](01-product-and-requirements.md) | Problem framing, users, scope, quality attributes, and design decisions |
| [02. System architecture](02-system-architecture.md) | Components, boundaries, runtime flows, failure paths, and deployment topology |
| [03. Frontend implementation](03-frontend-implementation.md) | UI state, rendering, local planner, interactions, responsive behavior, and safety |
| [04. Agentic planner](04-agentic-planner.md) | LangGraph state, nodes, edges, Groq use, deterministic fallback, and evaluation |
| [05. API and data](05-api-and-data.md) | FastAPI lifecycle, contracts, validation, SQLAlchemy, transactions, and persistence |
| [06. PWA, security, and reliability](06-pwa-security-reliability.md) | Service workers, offline caching, secret handling, CORS, threat model, and resilience |
| [07. Testing and delivery](07-testing-ci-cd-deployment.md) | Test pyramid, browser smoke test, Docker, GitHub Actions, Pages, and Render |
| [08. Build from scratch](08-build-from-scratch.md) | A step-by-step path to recreate the project in a clean repository |
| [09. Operations and troubleshooting](09-operations-troubleshooting.md) | Runbooks for local, CI, browser, model, database, and deployment failures |
| [10. Interview and extension guide](10-interview-extension-guide.md) | Project walkthrough, deep questions, trade-offs, and production roadmap |

## Source map

| Area | Main source |
| --- | --- |
| HTML entry point | [`index.html`](../index.html) |
| Browser application and local planner | [`app.js`](../app.js) |
| Responsive visual system | [`src/styles.css`](../src/styles.css) |
| PWA cache runtime | [`sw.js`](../sw.js) |
| Manifest | [`public/manifest.webmanifest`](../public/manifest.webmanifest) |
| HTTP API | [`backend/app/main.py`](../backend/app/main.py) |
| Agent graph | [`backend/app/planner.py`](../backend/app/planner.py) |
| Validation schemas | [`backend/app/schemas.py`](../backend/app/schemas.py) |
| Database layer | [`backend/app/database.py`](../backend/app/database.py) |
| Local containers | [`docker-compose.yml`](../docker-compose.yml) |
| Managed backend blueprint | [`render.yaml`](../render.yaml) |
| Pages delivery pipeline | [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) |

## Quick start

Run only the deployed-style client:

```bash
python -m http.server 8080
```

Then open `http://localhost:8080`.

Run the connected backend without containers:

```bash
python -m venv .venv
# Windows PowerShell
.venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt -r backend/requirements-dev.txt
uvicorn backend.app.main:app --reload --port 8000
```

Run API plus PostgreSQL:

```bash
copy backend/.env.example backend/.env
docker compose up --build
```

Do not place `GROQ_API_KEY` in `app.js`, `index.html`, Git history, screenshots, or documentation. The backend works in fallback mode when the variable is absent.

## Terminology

- **Agent**: one bounded planner function with a clear responsibility. In this project, nodes are named research, route, budget, and safety.
- **Graph state**: the shared typed data passed between LangGraph nodes.
- **Fallback mode**: deterministic planning that does not call a model.
- **PWA shell**: the HTML, JavaScript, CSS, icons, and images cached for offline launch.
- **Connected mode**: browser plus optional API and database, rather than browser-only execution.
- **Live fact**: information such as entry rules, prices, weather, opening hours, and advisories that must be rechecked close to travel.

## Authoritative references

- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview)
- [LangGraph Graph API](https://docs.langchain.com/oss/python/langgraph/graph-api)
- [FastAPI documentation](https://fastapi.tiangolo.com/)
- [Groq API overview](https://console.groq.com/docs/overview)
- [SQLAlchemy documentation](https://docs.sqlalchemy.org/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [GitHub Pages custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [Render FastAPI deployment](https://render.com/docs/deploy-fastapi)

