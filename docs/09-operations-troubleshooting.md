# 09. Operations and Troubleshooting

## 1. Troubleshooting method

Debug from the smallest failing boundary outward:

1. reproduce the exact symptom;
2. identify static client, service worker, HTTP API, graph, model, or database;
3. inspect the closest log or browser panel;
4. test the dependency directly;
5. change one variable;
6. rerun the smallest relevant test;
7. run the broader regression suite after the fix.

Do not start by adding retries everywhere. Retries can hide deterministic defects and multiply load.

## 2. Baseline diagnostics

From the repository root:

```powershell
git status --short
node --check app.js
python -m unittest discover -s tests -v
Push-Location backend
..\.venv\Scripts\python.exe -m pytest tests -q
Pop-Location
```

For containers:

```powershell
docker compose ps
docker compose logs --tail 100 api
docker compose logs --tail 100 postgres
```

For the browser, inspect:

- Console;
- Network requests and status codes;
- Application > Manifest;
- Application > Service Workers;
- Application > Storage and Cache Storage;
- localStorage key `tripmate-ai-static-v1`.

## 3. Static site does not load

### Symptoms

- blank page;
- `TripMate is not defined`;
- CSS missing;
- icon placeholders remain;
- 404 requests for assets.

### Checks

1. Run `node --check app.js`.
2. Confirm `index.html` loads `lucide.min.js` before `app.js`.
3. Confirm relative paths and exact filename casing.
4. Use an HTTP server instead of opening a directory path incorrectly.
5. Disable or unregister an old service worker while diagnosing stale code.
6. Check whether an extension or content policy blocked local script execution.

### Recovery

Fix the first console error, reload with cache disabled, and rerun static tests. Browser errors often cascade from one early syntax or asset failure.

## 4. GitHub Pages shows 404 assets

### Likely cause

Root-relative URLs such as `/app.js` point to the account root rather than the repository subpath.

### Checks

- HTML links should be `./app.js`, `./src/styles.css`, and similar.
- manifest `start_url` and `scope` should resolve to the project root.
- service-worker asset paths should derive from registration scope.
- the Pages artifact should preserve `src/` and `public/` directories.

### Recovery

Correct paths, bump the service-worker cache version if necessary, push, wait for the Pages deployment, then unregister the old worker or hard-refresh.

## 5. Old UI remains after deployment

### Cause

A service worker or browser HTTP cache still serves an older shell.

### Checks

1. Compare the live response and repository commit.
2. Inspect active and waiting service-worker versions.
3. Inspect cache names.
4. Confirm the new deployment completed rather than only the source push.

### Recovery

- bump `CACHE` in `sw.js` when shell assets change materially;
- reload once after the new worker activates;
- during diagnosis, unregister worker and clear site data;
- design an update notification for production users.

## 6. Trip disappears after reload

### Checks

- confirm localStorage is enabled;
- inspect the storage key and JSON syntax;
- check browser private mode or storage-clearing policy;
- verify mutation actions call `save()`;
- confirm generated data contains no circular references.

### Recovery

Restore valid JSON or let the app fall back to the demo. For production, version persisted schemas and migrate rather than silently discarding incompatible data.

## 7. Trip form does nothing

### Checks

1. Browser console for errors.
2. Required fields and native form validation.
3. Confirm `onsubmit="TripMate.submitTrip(event)"` resolves.
4. Confirm the loading overlay is not permanently covering the UI.
5. Check dates and numeric fields passed to `makeTrip`.

The static form currently relies partly on browser constraints. Add explicit reversed-date and finite-number validation if extending it.

## 8. Offline mode fails

### Checks

- app was loaded successfully online at least once;
- page uses HTTP/HTTPS, not `file://`;
- service-worker registration scope covers requested files;
- all `CORE` assets return 200 during install;
- no missing image causes `cache.addAll` to reject;
- active worker controls the page;
- test after reloading once under worker control.

### Recovery

Fix missing paths, change cache version, reload online until the worker activates, then repeat the offline test.

## 9. API will not start

### Symptoms

- import error;
- Uvicorn cannot find app;
- database driver error;
- port already in use.

### Checks

```powershell
python --version
pip show fastapi langgraph sqlalchemy psycopg
python -c "from backend.app.main import app; print(app.title)"
Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue
```

Run Uvicorn from the repository root with:

```powershell
uvicorn backend.app.main:app --reload --port 8000
```

Inside the backend Docker image, the module path is `app.main:app` because `/app/app` is copied into the container.

## 10. API returns 422

This usually means request validation worked as designed. Read the `detail` array for field location, error type, and message.

Frequent causes:

- camelCase browser fields instead of snake_case API fields;
- dates not in `YYYY-MM-DD` format;
- end date before start date;
- trip longer than fourteen days;
- invalid pace;
- currency not three characters;
- budget is zero or negative;
- too many interests or overlong notes.

Fix the client adapter or request, not the server validator.

## 11. Planner always reports fallback

### Checks

1. `/health` reports fallback when `GROQ_API_KEY` is absent from the process.
2. Environment variables must be set before process startup.
3. In Docker Compose, ensure `backend/.env` exists and is read.
4. Check the trace: `Groq fallback: TimeoutError` differs from no-key fallback.
5. Verify configured model is available to the account.
6. Check provider authentication, quota, and network access.

### Safe diagnostic

Confirm only whether the variable exists and its length; never print the key itself.

### Recovery

Correct the environment or provider issue and restart the API. Fallback mode is expected behavior during outages, not a corrupt state.

## 12. Groq request times out

### Checks

- DNS and outbound HTTPS from the runtime;
- provider status and rate limits;
- `GROQ_TIMEOUT_SECONDS` value;
- model name;
- whether a corporate proxy or firewall blocks the endpoint;
- provider latency independent of LangGraph.

### Response strategy

Keep fallback enabled. For production, record a categorized metric, enforce a total request deadline, and use a small retry budget only for transient failures.

## 13. Groq responds but planner falls back

Likely cause: the response was not a valid JSON list.

### Checks

- trace exception class;
- mocked reproduction with captured shape, excluding sensitive content;
- code-fence stripping;
- whether content is a list rather than an object;
- output size and item types.

### Recovery

Prefer provider-supported structured output or JSON schema. Add output length limits and one bounded repair attempt. Never pass malformed prose downstream as trusted structure.

## 14. PostgreSQL connection fails

### Checks

```powershell
docker compose ps postgres
docker compose logs --tail 100 postgres
docker compose exec postgres pg_isready -U tripmate
```

Verify:

- `DATABASE_URL` hostname is `postgres` inside Compose, not `localhost`;
- credentials match Compose configuration;
- scheme is normalized to Psycopg 3;
- database health check passes;
- local port conflicts are not relevant unless PostgreSQL is explicitly published;
- managed database permits the service network.

## 15. SQLite thread or lock problems

The engine sets `check_same_thread=False`, but SQLite still has limited concurrent-write behavior.

For a local demo:

- keep transactions short;
- avoid multiple writer processes;
- close sessions reliably;
- remove stale test databases only when data is disposable.

Move to PostgreSQL for concurrent production writes.

## 16. Saved trip returns 404

Checks:

- exact id, including case;
- whether the save transaction committed;
- whether API points at the expected database;
- whether a container was recreated without its intended volume;
- whether delete was called;
- whether environment switched between SQLite and PostgreSQL.

Add request ids and structured persistence logs before diagnosing distributed production incidents.

## 17. Docker API starts before database

The Compose file uses `depends_on` with `condition: service_healthy`. If startup still fails:

- confirm Docker Compose supports this condition;
- inspect PostgreSQL health status;
- verify `backend/.env` database hostname;
- remember platform deployments may not honor Compose semantics.

Application-level connection retry can complement orchestration health checks, but it must remain bounded.

## 18. GitHub Actions fails

### JavaScript step

Run `node --check app.js` locally and fix the first syntax error.

### unittest step

Run the exact discovery command. Common causes are moved files, invalid manifest JSON, or changed expected workflow names.

### staging step

Confirm every `cp` source exists and image glob matches files.

### upload/deploy step

Confirm Pages is configured for GitHub Actions and workflow permissions include Pages and id-token writes.

### Concurrency cancellation

A cancelled older run may be normal when a newer push supersedes it.

## 19. Render health check fails

Checks:

- container build log;
- Uvicorn bind address is `0.0.0.0`;
- service listens on expected port;
- `/health` starts without requiring Groq;
- database URL is injected;
- database initialization can connect;
- model key is not mistakenly required for startup.

Keep health checks inexpensive. Do not perform a live model request on every platform probe.

## 20. Incident priorities

| Severity | Example | First action |
| --- | --- | --- |
| SEV-1 | secret exposed or destructive data issue | revoke/contain, stop affected path, preserve evidence |
| SEV-2 | public app unavailable or API broadly failing | rollback or activate fallback, communicate status |
| SEV-3 | model mode degraded but fallback works | monitor, diagnose provider, avoid risky emergency change |
| SEV-4 | cosmetic or isolated workflow defect | capture reproduction and schedule normal fix |

After an incident, write a blameless review with timeline, impact, root causes, detection gaps, and owned follow-up actions.

## 21. Backup and recovery plan

The current local demonstration has no automated backup. A real deployment should define:

- managed PostgreSQL backup frequency;
- retention and encryption;
- restore testing schedule;
- recovery point objective;
- recovery time objective;
- ownership of restore approval;
- handling of JSON payload schema versions after restore.

A backup is not trusted until a restore has been tested.
