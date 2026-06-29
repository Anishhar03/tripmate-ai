# 01. Product and Requirements

## 1. Problem statement

Travel planning is not just a recommendation problem. A useful plan must satisfy several competing constraints at the same time:

- places should match the traveler's interests;
- activities should be close enough to avoid wasting the day in transit;
- the schedule should fit the requested pace;
- planned spending should remain below the total budget;
- the plan should include recovery time and a contingency reserve;
- volatile facts should be clearly marked for verification;
- the traveler should be able to save, edit, share, and access the plan offline.

A single free-form model response can sound convincing while violating one or more of those constraints. TripMate therefore treats itinerary creation as a small workflow. Research produces context, route planning turns context into days, budget planning checks allocation, and safety planning adds verification gates.

## 2. Target users and jobs

### Primary user

An independent traveler planning a two-to-fourteen-day city or regional trip who wants a practical first draft, not an endless list of attractions.

### Core jobs to be done

1. Enter destination, dates, party size, budget, pace, and interests.
2. Receive a day-by-day itinerary with understandable reasons for each suggestion.
3. Review the cost distribution and protected buffer.
4. Inspect the geographic order of stops.
5. Bookmark, remove, or insert flexible activities.
6. Save multiple trips and reopen them later.
7. export or share a portable summary.
8. Keep critical plan information available when connectivity is poor.

## 3. Functional requirements

| ID | Requirement | Current implementation |
| --- | --- | --- |
| FR-01 | Create a trip from structured inputs | New-trip modal in `app.js` |
| FR-02 | Respect easy, balanced, and packed pacing | Two, three, or four activities per day |
| FR-03 | Produce a dated daily itinerary | Local planner and backend route node |
| FR-04 | Allocate the total budget | Stay 38%, food 23%, local travel 14%, experiences 17%, buffer 8% |
| FR-05 | Explain planning choices | Agent briefing and backend `agent_trace` |
| FR-06 | Save multiple trips | Browser `localStorage`; optional API CRUD |
| FR-07 | Modify activities | Bookmark, remove, and add flexible slot actions |
| FR-08 | Show a route context | Embedded OpenStreetMap per destination profile |
| FR-09 | Export and share | JSON download, Web Share API, clipboard fallback |
| FR-10 | Work without a model key | Deterministic local and backend fallbacks |
| FR-11 | Launch offline after first load | Service worker precache and runtime cache |
| FR-12 | Validate server requests | Pydantic fields and cross-field date validation |

## 4. Non-functional requirements

### Availability

The public experience should render without depending on an API, model provider, package CDN, or database. This is why Lucide is vendored locally and why the planner has local data profiles.

### Performance

- The static client has no bundler or runtime package download.
- Core assets are cacheable by the service worker.
- Images are fixed local assets rather than third-party hotlinks.
- The planner is deterministic and bounded: the browser caps generated trips at seven days, while the API caps requests at fourteen days.

### Security

- Secrets stay in server environment variables.
- Browser-rendered user strings pass through `escapeHtml`.
- API input is length- and range-limited.
- Cross-origin API access is allowlisted.
- Tests scan browser code for common secret prefixes.

### Explainability

The UI presents agent notes and the API returns a step-by-step `agent_trace`. The trace is operational metadata, not hidden chain-of-thought. It records which component ran and a concise outcome.

### Maintainability

The codebase is intentionally small and framework-light for learning. Responsibilities are still separated: HTML entry point, styles, browser behavior, API, graph, schemas, persistence, tests, and deployment configuration.

### Portability

Relative URLs, a manifest scope of `../`, and a service worker that derives its base path allow the app to work at both `/` and a GitHub Pages project path such as `/tripmate-ai/`.

## 5. Scope boundaries

### Included now

- destination-profile and generic fallback planning;
- a bounded four-node LangGraph workflow;
- optional Groq research notes;
- local and server persistence;
- responsive PWA behavior;
- GitHub Pages frontend delivery;
- Docker and Render configuration for the backend.

### Deliberately not claimed

- live booking or payment;
- real-time flight, hotel, weather, visa, or advisory data;
- map routing or travel-time optimization;
- authenticated user accounts;
- synchronized collaboration;
- automatic application of copilot edits;
- guaranteed factual correctness of model-generated notes.

Those exclusions matter. Calling a feature "AI-powered" does not make changing facts reliable. Production integrations would need approved data providers, source timestamps, citations, and clear failure semantics.

## 6. Important product decisions

### Decision: useful before connected

The static PWA is a complete demonstration. Connected mode improves research and persistence, but the UI is not held hostage by infrastructure.

**Trade-off:** the local planner contains curated templates and does not have broad world knowledge.

### Decision: workflow instead of one giant prompt

Each node has one responsibility and produces structured state for the next node.

**Trade-off:** the current graph is sequential and simple. It demonstrates orchestration but does not yet use branches, tools, checkpointers, or human approval interrupts.

### Decision: JSON payload persistence

The database stores a searchable trip identifier and destination plus the complete plan as JSON.

**Trade-off:** this speeds up iteration, but makes analytics and partial updates harder than a normalized schema.

### Decision: no frontend build system

The browser loads plain HTML, CSS, and JavaScript.

**Trade-off:** deployment and learning are simple; module boundaries, type checking, code splitting, and large-team ergonomics are limited.

## 7. Acceptance criteria

A release is acceptable when all of the following are true:

1. `index.html` references files that exist.
2. `node --check app.js` succeeds.
3. dependency-free tests pass.
4. a user can create, select, modify, persist, export, and reopen a trip.
5. mobile and desktop layouts have no horizontal overflow.
6. the backend returns a valid plan with no model key.
7. the health endpoint reports the active planner mode.
8. no known credential prefix appears in browser code.
9. the Pages artifact contains all files listed by the service worker.
10. the live URL responds successfully after deployment.

## 8. Success metrics for a future production version

| Area | Example metric |
| --- | --- |
| Activation | Percentage of visitors who generate a trip |
| Quality | Percentage of generated activities users retain |
| Reliability | Successful plan generations divided by attempts |
| Latency | p50 and p95 generation time by fallback/model mode |
| Cost | Model cost per accepted itinerary |
| Safety | Percentage of plans showing current-source timestamps |
| Retention | Users reopening a saved trip within seven days |
| Offline utility | Successful offline launches after installation |

