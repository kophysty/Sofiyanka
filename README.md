# Sofyinka – Financial‑Model Web App

> **Purpose** – an interactive tool to size CAPEX/OPEX, play out investment phases, and benchmark KPIs (Payback, IRR) for the Sofyinka premium glamping project.

---

## 1 | Project Structure

| Path | Description |
|---|---|
| **/src** | Source code (TypeScript), split by responsibility: `constants`, `models`, `services`. |
| **/DOCs** | Markdown documentation (roadmaps, specs, etc.). |
| **index.html** | The main HTML entry point for the application. |
| **vite.config.js** | Configuration for the Vite build tool. |
| **tsconfig.json** | TypeScript compiler configuration. |
| **package.json** | Project dependencies and scripts. |
| **CHANGELOG.md** | A log of all key enhancements and fixes. |
| **README.md** | 👉 *This file* – a high-level map and developer quick-start. |

### Key Files & Directories

```text
sofyinka/
├─ src/
│  ├─ main.ts                # Application bootstrap and UI event handling
│  ├─ constants/             # Immutable data (house types, seasonality)
│  │   ├─ houseTypes.ts
│  │   ├─ seasonality.ts
│  │   └─ ...
│  ├─ models/                # Core data structures (Scenario, House, Phase)
│  │   ├─ Scenario.ts
│  │   ├─ House.ts
│  │   └─ ...
│  └─ services/              # Business logic modules
│      ├─ calcService.ts     # The main calculation engine
│      ├─ taxService.ts      # Tax calculation logic
│      └─ ...
├─ DOCs/
│  └─ financial_model_enhancement_roadmap.md
├─ index.html
├─ package.json
└─ README.md
```

---

## 2 | Quick Start

```bash
# 1. Install dependencies
$ npm install

# 2. Run the development server with Hot Module Replacement (HMR)
$ npm run dev

# 3. Run unit tests
$ npm run test

# 4. Build for production
$ npm run build
```

> **Prerequisites** – Node.js 18+, npm 9+.

---

## 3 | Core Concepts

| Concept | File / Module | Notes |
|---|---|---|
| **Scenario** | `src/models/Scenario.ts` | A single source-of-truth object holding all input parameters for a calculation. |
| **Calculation Engine** | `src/services/calcService.ts` | A collection of pure functions that take a `Scenario` and produce an immutable cash-flow array. |
| **UI Interaction** | `src/main.ts` | Handles user input, orchestrates calculations, and updates the DOM and charts. |
| **KPI Derivation** | `deriveKPIs()` in `calcService.ts` | Payback Period, NPV, IRR – all computed from the cash flow results. |

See `DOCs/financial_model_enhancement_roadmap.md` for a detailed look at the project's architecture and future plans.

---

## 4 | Key Features (Current)

- **Modular Architecture:** Fully migrated to TypeScript with a clean, service-oriented architecture.
- **Flexible CAPEX:** Configure the housing mix with different types and tiers.
- **Granular OPEX:** Detailed breakdown of operational costs.
- **Dynamic Seasonality:** Adjust monthly coefficients for both occupancy and ADR.
- **Tax Regimes:** Model different tax scenarios (УСН 6%, УСН 15%, ОСН).
- **Extra Revenues:** Toggle various extra revenue streams on or off.

---

## 5 | Next Steps

The next major planned enhancement is the implementation of **Dynamic and Manageable Project Phases**.

See `DOCs/financial_model_enhancement_roadmap.md` for the full backlog.

---

## 6 | License

MIT (to be confirmed).

---

## 7 | Change Log

Вся история изменений и доработок фиксируется в файле `CHANGELOG.md` в корне проекта. При каждом значимом изменении:
- Кратко описывайте дату, суть и область изменений
- Следуйте формату:
  - `## YYYY-MM-DD`
  - Список изменений

