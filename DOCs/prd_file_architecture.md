# PRD: Sofyinka Financial Model — Project File Architecture

## 1. Purpose

This Product Requirements Document (PRD) formalises the *file‑level architecture* for the Sofyinka glamping financial‑model web app. Its goal is to keep code modular, enable scenario versioning, and smooth future expansion (e.g. REST API, React/Vue port).

## 2. Guiding Principles

1. **Separation of concerns** — pure calculations never mingle with DOM logic.
2. **Flat public bundle** — only production‑ready assets are shipped to `/public`.
3. **Configuration over code** — price lists & presets live as JSON in `/data`.
4. **Scenario as data** — each user scenario is a self‑contained JSON under `/scenarios`.
5. **Documentation lives next to code but outside the bundle** (`/docs`).

## 3. High‑Level Directory Tree

```text
sofyinka/
├─ public/                  # Static assets served by the host
│  ├─ index.html            # Single entry HTML
│  ├─ imgs/                 # Logos, screenshots
│  └─ libs/                 # CDN fallbacks (Chart.js, plugins)
├─ src/                     # Source code (ES‑modules)
│  ├─ main.js               # App bootstrap
│  ├─ constants/            # Immutable lookup tables
│  │   ├─ houseTypes.js     # Cost per tier & type
│  │   └─ infraItems.js     # Default infra catalogue
│  ├─ models/               # Domain models (plain functions / classes)
│  │   ├─ House.js
│  │   ├─ Phase.js
│  │   └─ Scenario.js
│  ├─ services/             # Business logic & side‑effects
│  │   ├─ calcService.js    # Cash‑flow, NPV, IRR
│  │   ├─ chartService.js   # Chart.js builders
│  │   └─ storageService.js # LocalStorage / API persistence
│  ├─ components/           # UI widgets (templated HTML + events)
│  │   ├─ Sidebar.js
│  │   ├─ KpiCards.js
│  │   ├─ Table.js
│  │   └─ CashFlowChart.js
│  ├─ store/                # Tiny reactive global state bus
│  │   └─ index.js
│  └─ utils/                # Pure helpers (currency, dates, uuid)
├─ data/                    # Changeable data with the app closed
│  ├─ defaultScenario.json
│  └─ extras.json           # Extra‑income presets
├─ scenarios/               # User‑saved what‑if runs
│  └─ 2025-base-55-9400.json
├─ styles/                  # SCSS (compiled → public/css)
│  ├─ main.scss
│  └─ _variables.scss
├─ docs/                    # Markdown specs & financial docs
│  ├─ sofyinka_summary_prd.md
│  ├─ capex_breakdown.md
│  └─ extra_revenue.md
└─ README.md
```

## 4. Directory Responsibilities

| Folder              | Responsibility                                                                   |
| ------------------- | -------------------------------------------------------------------------------- |
| **public/**         | Zero‑logic assets that browsers fetch. 100 % deployable.                         |
| **src/main.js**     | Entry point: mounts components, subscribes to store, kicks initial render.       |
| **src/constants/**  | Hard‑coded lookup tables shared by calc & UI.                                    |
| **src/models/**     | Pure domain abstractions (`Scenario`, `House` …). No DOM, no fetch.              |
| **src/services/**   | Side‑effect layer: calculations, LocalStorage, Chart.js config etc.              |
| **src/components/** | Rendering logic; each exports `render(target, props)` & internal event bindings. |
| **src/store/**      | Singleton event bus (`subscribe`, `dispatch`). Keeps current scenario in memory. |
| **data/**           | Non‑code presets editable by PM without touching JS.                             |
| **scenarios/**      | Persisted user files. Naming rule: `YYYY‑tag‑… .json`.                           |
| **styles/**         | SCSS sources; compiled by Vite to `/public/css`.                                 |
| **docs/**           | Project docs; never imported by JS bundle.                                       |

## 5. Build & Tooling

- **Bundler**: Vite (fast HMR, ESM native).
- **Lint/Format**: ESLint + Prettier + Husky pre‑commit.
- **Type‑checking**: `// @ts-check` with VSCode or migrate to TypeScript when backlog permits.
- **Tests**: Jest for `services/`, minimal snapshot tests for `components/`.

## 6. Extension Points

| Use‑Case             | Where to touch                                                                                 |
| -------------------- | ---------------------------------------------------------------------------------------------- |
| New house type       | `data/houseTypes.json` + optional image in `/public/imgs`.                                     |
| Add Financing module | `models/Loan.js`, `services/finService.js`, UI component `FinancingPanel.js`.                  |
| REST backend         | Replace LocalStorage calls inside `storageService.js` with `fetch` while preserving interface. |

## 7. Risks & Mitigations

- **Single‑page bottleneck** → keep heavy math in Web Worker if payload ≥ 10k rows.
- **Unbounded scenarios folder** → implement soft limit (e.g. warn after 50 files).

## 8. Acceptance Criteria

1. Repository passes `npm run lint && npm run test`.
2. App builds via `npm run build`, producing `/dist` that mirrors `/public` layout.
3. Any developer can trace a KPI value to one pure function in `calcService.js`.
4. Scenario JSON copied into `/scenarios` auto‑appears in UI list on reload.

---

**Status**: Draft v1.0 (24 Jun 2025)

