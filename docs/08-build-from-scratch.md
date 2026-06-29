# 08. Build TripMate from Scratch

This chapter recreates the project in dependency order. Complete each checkpoint before moving on; debugging one layer at a time is faster than assembling the whole stack and guessing where it broke.

## 0. Prerequisites

Install:

- Git;
- Python 3.11 or newer;
- Node.js for JavaScript syntax checking;
- Docker Desktop if using PostgreSQL/containers;
- a modern Chromium, Firefox, or Edge browser.

Verify:

```bash
git --version
python --version
node --version
docker --version
docker compose version
```

The static app needs only Python's local server. Docker and a Groq account are optional.

## 1. Create the repository skeleton

```bash
mkdir tripmate-ai
cd tripmate-ai
git init
mkdir src public tests tools backend
mkdir backend/app backend/tests
```

Create this structure:

```text
tripmate-ai/
|-- index.html
|-- app.js
|-- sw.js
|-- src/styles.css
|-- public/manifest.webmanifest
|-- backend/app/
|-- backend/tests/
|-- tests/
|-- tools/
|-- docker-compose.yml
|-- render.yaml
`-- README.md
```

Checkpoint: `git status --short` should show only the files you intentionally created.

## 2. Build the HTML shell

In `index.html`:

1. use the HTML5 doctype and `lang="en"`;
2. add UTF-8 and viewport metadata;
3. add theme color and product description;
4. link favicon, manifest, and stylesheet with relative paths;
5. add `<div id="app"></div>`;
6. load local icons and `app.js` at the end of body.

Use relative paths beginning with `./` so the project works beneath a Pages subpath.

Checkpoint:

```bash
python -m http.server 8080
```

Open `http://localhost:8080` and confirm the page loads with no 404 requests.

## 3. Establish visual tokens and layout

In `src/styles.css`, define reusable tokens for:

- background, surface, text, muted text, border, and accent colors;
- font stack;
- compact radii and shadows;
- sidebar width, topbar height, and content max width;
- focus states and motion timing.

Build the layout from large regions:

1. top bar;
2. trip sidebar;
3. hero and trip stats;
4. tabs;
5. main content grid;
6. fixed chat launcher;
7. mobile bottom navigation.

Add responsive rules after the desktop structure is stable. Test narrow screens for overflow after every dense component.

Checkpoint: temporary static markup should remain readable at 390px and 1280px.

## 4. Add local destination data

In `app.js`, create a private scope and define:

- `STORAGE_KEY`;
- icon helper;
- `escapeHtml`;
- currency formatter;
- destination profiles;
- a generic fallback profile.

Keep content structured. Activity tuples in this project are compact, but named objects are more maintainable in a larger system.

Checkpoint:

```bash
node --check app.js
```

## 5. Implement the local planner

Add pure or mostly pure functions:

1. `profileFor(destination)` chooses known or fallback content.
2. `dayCount(start, end)` computes and clamps duration.
3. `makeTrip(request)` builds the complete presentation model.

Define invariants before UI work:

- each trip has a stable id;
- every day has a date and at least two activities;
- pace controls density;
- budget percentages total 100%;
- unknown destinations still produce useful generic content;
- generated text is treated as data.

Checkpoint: call `makeTrip` from the browser console and inspect the object.

## 6. Add application state and persistence

Create a default demo trip. Read the saved collection inside `try/catch`, then initialize active trip and navigation state.

Implement:

- `trip()` selector;
- `save()` serialization;
- state transitions for trip, view, day, drawers, and styles.

Checkpoint:

1. save a trip;
2. reload the browser;
3. verify it remains;
4. manually corrupt the localStorage value;
5. reload and verify the app falls back instead of crashing.

## 7. Render the product views

Build small render functions before the full shell:

- tabs;
- itinerary timeline;
- budget view;
- map view;
- planner modal;
- chat panel.

Then compose them in `render()`. Escape every free-form value before placing it in an HTML template.

Checkpoint: switch every view and day with no console errors.

## 8. Implement interactions

Expose a narrow action object for UI events:

- selection and navigation;
- modal/chat open and close;
- interest toggles;
- trip creation;
- bookmarks and activity changes;
- checklist changes;
- export and share;
- toast feedback;
- chat submission.

After a persistent mutation, call `save()`. After visible state changes, rerender or update the bounded DOM region.

Checkpoint: complete the core workflow create -> modify -> reload -> export.

## 9. Add PWA metadata

Create `public/manifest.webmanifest` with:

- long and short names;
- description;
- `start_url` and `scope` set relative to the manifest;
- standalone display;
- background and theme colors;
- local icon metadata.

Link it from `index.html`.

Checkpoint: browser developer tools should parse the manifest without errors.

## 10. Implement the service worker

Create a versioned cache name. Derive the base path from registration scope and list every required shell asset.

Implement handlers:

1. install -> precache shell;
2. activate -> remove old versions;
3. fetch -> network first, cache success, cached fallback.

Register after page load only for HTTP/HTTPS.

Checkpoint:

1. load online;
2. wait for service-worker activation;
3. enable offline mode in developer tools;
4. reload;
5. confirm app shell and saved trips remain available.

## 11. Add zero-dependency release tests

Create a `unittest` suite that verifies:

- entry-point assets exist;
- manifest JSON and scope are valid;
- critical action names remain present;
- obvious credential patterns are absent.

Run:

```bash
python -m unittest discover -s tests -v
node --check app.js
```

Checkpoint: intentionally break one path and confirm a test fails before restoring it.

## 12. Create the backend environment

Add `backend/requirements.txt`:

```text
fastapi>=0.115,<1
uvicorn[standard]>=0.34,<1
langgraph>=1.2,<2
langchain-groq>=1.1,<2
sqlalchemy>=2.0,<3
psycopg[binary]>=3.2,<4
pydantic>=2.10,<3
```

Add development requirements for HTTP test client and pytest. Create a virtual environment and install dependencies.

```bash
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt -r backend/requirements-dev.txt
```

Checkpoint: `python -c "import fastapi, langgraph, sqlalchemy"` succeeds.

## 13. Define API schemas first

In `backend/app/schemas.py`:

1. define the exact planner input contract;
2. use numeric bounds and string length bounds;
3. model pace as a literal set;
4. add cross-field date validation;
5. define planner and saved-trip outputs.

Schema-first development prevents routes, graph nodes, and tests from inventing incompatible shapes.

Checkpoint: create valid and invalid `TripRequest` instances in a Python shell.

## 14. Build the LangGraph workflow

In `backend/app/planner.py`:

1. define `PlannerState`;
2. create trace helper;
3. implement deterministic fallback research;
4. add the optional Groq call with timeout and strict parsing;
5. implement route, budget, and safety nodes;
6. add nodes and edges;
7. compile once at module import;
8. map final state to `TripPlan`.

Start without Groq. Verify the fallback graph first, then add the optional provider path.

Checkpoint:

```python
from backend.app.schemas import TripRequest
from backend.app.planner import plan_trip
```

Invoke with a valid request and inspect `mode` and `agent_trace`.

## 15. Build the database layer

In `backend/app/database.py`:

1. read `DATABASE_URL` with SQLite default;
2. normalize hosted PostgreSQL schemes;
3. create engine with connection pre-ping;
4. define declarative base and trip model;
5. initialize tables;
6. wrap sessions in commit/rollback/close lifecycle.

Checkpoint: run initialization and inspect the local SQLite file or PostgreSQL table.

## 16. Build the FastAPI routes

In `backend/app/main.py`:

1. initialize schema in lifespan;
2. configure CORS from environment;
3. expose health and generation routes;
4. expose create/list/get/delete persistence routes;
5. set response models and status codes;
6. return explicit 404 errors.

Run:

```bash
uvicorn backend.app.main:app --reload --port 8000
```

Checkpoint: use `/docs` to generate a fallback plan and complete CRUD operations.

## 17. Add backend tests

Write a deterministic test with no model key. Exercise the application through HTTP rather than calling route functions directly.

Test at least:

- health mode;
- plan generation;
- day count;
- budget allocation;
- invalid dates;
- CRUD success and not-found behavior.

Checkpoint:

```powershell
Push-Location backend
..\.venv\Scripts\python.exe -m pytest tests -q
Pop-Location
```

## 18. Containerize the API

Create a Dockerfile that installs requirements before copying frequently changing source. This preserves dependency-layer caching.

Create Compose services for PostgreSQL and API. Add database health checks and make API startup depend on healthy PostgreSQL.

Checkpoint:

```bash
docker compose up --build
curl http://localhost:8000/health
```

## 19. Create the Pages workflow

Add `.github/workflows/deploy.yml`:

1. trigger on `main` and manual dispatch;
2. use minimum Pages permissions;
3. check out source;
4. validate JavaScript and tests;
5. stage only public runtime files;
6. upload the Pages artifact;
7. deploy it.

Checkpoint: inspect the artifact contents before enabling deployment. The backend and `.env` must not appear.

## 20. Describe managed backend deployment

Add a Render Blueprint containing the Docker web service and PostgreSQL database. Mark model key as an unsynchronized secret. Configure the exact frontend origin for CORS.

Checkpoint: deploy without a model key first. Verify health and fallback generation, then configure the key and test model mode.

## 21. Connect browser and API safely

Do this only after both halves work independently:

1. introduce one API client adapter;
2. map camelCase browser fields to snake_case API fields;
3. map API plan to the browser view model;
4. add timeout and cancellation;
5. fall back to local generation on recoverable errors;
6. show execution mode;
7. persist to server only after generation succeeds;
8. retain local save for offline-first behavior.

Checkpoint: test server success, server fallback, total server outage, slow request, malformed response, and offline creation.

## 22. Final quality gate

```bash
node --check app.js
python -m unittest discover -s tests -v
cd backend
../.venv/Scripts/python.exe -m pytest tests -q
cd ..
git diff --check
```

Then run browser smoke, responsive visual checks, offline reload, API docs checks, and a live deployment test.

## 23. Common build mistakes

- Using root-relative asset paths on a Pages project site.
- Putting a model key in browser JavaScript.
- Testing only the Groq path and leaving no deterministic fallback.
- Returning model prose when the UI expects structured data.
- Forgetting to validate end date against start date.
- Starting API before PostgreSQL is ready.
- Treating CORS as user authorization.
- Caching private API responses in a general service worker.
- Deploying the entire repository as the Pages artifact.
- Claiming map optimization when only an embed is present.
