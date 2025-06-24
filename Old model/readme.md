# Sofyinka – Financial‑Model Web App

> **Purpose** – interactive tool to size CAPEX/OPEX, play out investment phases, and benchmark KPIs (Payback, IRR, DSCR) for the Sofyinka premium glamping project.

---

## 1 | Key Folders

| Path           | What lives here                                                                                                 |
| -------------- | --------------------------------------------------------------------------------------------------------------- |
| **/public**    | Static bundle served to the browser (HTML, compiled JS/CSS, images, vendor libs).                               |
| **/src**       | Source code (ES‑modules). Split by responsibility → constants / models / services / components / store / utils. |
| **/data**      | Price lists & presets editable without code (JSON).                                                             |
| **/scenarios** | User‑saved what‑if runs (one *Scenario JSON* each).                                                             |
| **/styles**    | SCSS sources; Vite compiles to `/public/css`.                                                                   |
| **/docs**      | Markdown documentation (PRDs, specs, smeta).                                                                    |
| **README.md**  | 👉 *this file* – high‑level map & developer quick‑start.                                                        |

Full tree (abridged):

```text
sofyinka/
├─ public/
│  ├─ index.html             # entry point
│  ├─ libs/                  # Chart.js, plugins fallback
│  └─ imgs/
├─ src/
│  ├─ main.js                # bootstrap
│  ├─ constants/
│  │   ├─ houseTypes.js
│  │   └─ infraItems.js
│  ├─ models/                # House, Phase, Scenario, Loan…
│  ├─ services/              # calcService, storageService, chartService…
│  ├─ components/            # Sidebar, KpiCards, CashFlowChart…
│  ├─ store/                 # reactive global state
│  └─ utils/                 # helpers (currency, dates)
├─ data/
│  ├─ defaultScenario.json
│  └─ extras.json
├─ scenarios/
│  └─ 2025‑base‑55‑9400.json
├─ styles/
│  └─ main.scss
├─ docs/
│  ├─ prd_file_architecture.md
│  ├─ logic_enhancement_spec.md
│  └─ sofyinka_summary_prd.md
└─ README.md
```

---

## 2 | Quick Start

```bash
# 1. Install deps
$ pnpm i          # or npm / yarn

# 2. Dev server w/ HMR
$ pnpm dev        # -> http://localhost:5173

# 3. Lint & test
$ pnpm lint
$ pnpm test

# 4. Production build → /dist (mirrors /public)
$ pnpm build
```

> **Prerequisites** – Node 18+, pnpm 8 (or npm >=9). Chrome/Edge ≥ 115 for ES‑modules.

### Saving Scenarios

- Click **💾 Save as…** → pick a name → file appears in `/scenarios`.
- List auto‑loads on startup; last opened scenario restored from `localStorage`.

---

## 3 | Core Concepts

| Concept                | File / Module                          | Notes                                                                      |
| ---------------------- | -------------------------------------- | -------------------------------------------------------------------------- |
| **Scenario**           | `src/models/Scenario.js`               | Single source‑of‑truth for parameters, houses, phases, extras, financing.  |
| **Calculation Engine** | `src/services/calcService.js`          | Pure functions → returns immutable cash‑flow arrays used by table & chart. |
| **Persistence Layer**  | `src/services/storageService.js`       | `save/load/list` for LocalStorage ✅; API stub ready for backend switch.    |
| **KPI Derivation**     | `deriveKPIs()` inside `calcService.js` | Payback, NPV, IRR, DSCR – all computed per scenario instance.              |

For deeper architecture rationale see ``.

---

## 4 | Contribution Guide

1. **Fork & branch** – `feat/…`, `fix/…`.
2. Write/adjust unit tests in `__tests__/` when touching `services/`.
3. Run `pnpm lint --fix` before push (auto via Husky pre‑commit hook).
4. Open a PR, fill the template (description, related issue, screenshots).

Coding style follows **Airbnb JS** + Prettier; Type safety via `// @ts‑check` with JSDoc.

---

## 5 | Roadmap Snippets (next Q)

- 🏗 **Financing Layer** – debt schedule, equity IRR card.
- 📉 **Seasonality Heat‑map** – monthly cash‑gap insight.
- 🔄 **Scenario Compare** – A/B toggle & diff table.

See `` for full backlog & acceptance tests.

---

## 6 | License

MIT (to be confirmed).

