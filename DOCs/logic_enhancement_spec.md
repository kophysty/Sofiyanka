# Specification: Logic Enhancements for Sofyinka Financial Model

## 1. Objective

Upgrade the core calculation engine so that the web app mirrors real‑world investment decision‑making and remains interactive for "what‑if" analysis.

## 2. Feature Matrix

| ID  | Feature | Business Need | Primary Modules |
| --- | ------- | ------------- | --------------- |
| L‑1 |         |               |                 |

| **House Tier Pricing** | Choose economy / base / premium per unit, reflect in CAPEX | `constants/houseTypes.js`, `models/House.js`, `services/calcService.js` |                                                                   |
| ---------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------- |
| L‑2                    | **Granular Infrastructure**                                | Include/exclude well, KTP, LOS, etc.                                    | `constants/infraItems.js`, `models/Scenario.js`, `calcService.js` |
| L‑3                    | **Phase Start Picker**                                     | Slide Phases II & III to maximise cash cushion                          | `models/Phase.js`, UI `PhasePanel.js`, `calcService.js`           |
| L‑4                    | **Extra Revenue Streams**                                  | Bath, excursions, F&B — add non‑room profit                             | `data/extras.json`, UI `ExtraIncomeTable.js`, `calcService.js`    |
| L‑5                    | **Financing Layer**                                        | Compute cash‑flow to Equity: NPV, IRR, DSCR                             | `models/Loan.js`, `services/finService.js`, KPI cards             |
| L‑6                    | **Seasonality Matrix**                                     | Monthly ADR & occupancy for cash‑gap analysis                           | `data/seasonality.json`, heat‑map component                       |
| L‑7                    | **Cost Escalation & Inflation**                            | 3 % ADR growth, 6 % OPEX CAGR                                           | Parameters in Sidebar → `calcService.js`                          |
| L‑8                    | **Tax Regimes**                                            | USN 6 %, OSN, No‑tax toggle                                             | `services/taxService.js`, `models/Scenario.js`                    |
| L‑9                    | **Payroll Breakdown**                                      | Separate FOT, utilities, purchases                                      | UI group in OPEX panel, `calcService.js`                          |
| L‑10                   | **Scenario Compare**                                       | A/B KPIs side‑by‑side                                                   | `components/ScenarioCompare.js`                                   |
| L‑11                   | **Gantt of Build Works**                                   | Visual timeline for CAPEX execution                                     | `components/BuildGantt.js` (Frappe Gantt)                         |

## 3. Data Structures

```ts
// Example — House
export interface House {
  id: string;
  type: 'Comfort' | 'A‑Frame' | 'Family' | 'One‑House';
  tier: 'economy' | 'base' | 'premium';
  qty: number;
  cost(): number; // derived via constants
}

// Scenario skeleton
export interface Scenario {
  id: string;
  name: string;
  houses: House[];
  phases: Phase[];
  extras: ExtraIncome[];
  financing?: Loan;          // optional
  params: {
    occupancy: number;       // %
    adr: number;             // ₽
    adrCAGR: number;         // % p.a.
    opexRate: number;        // % of revenue (fallback)
    opexCAGR: number;        // % p.a.
    taxRegime: 'USN6' | 'OSN' | 'NONE';
  };
}
```

## 4. Calculation Pipeline

1. **expandHouses()** → produce per‑unit CAPEX rows.
2. **buildPhaseTimeline()** → align CAPEX & unit go‑live dates.
3. **calcRevenue()** → nightly rate × occupancy × units (+ seasonality).
4. **applyExtras()** → add margin‑weighted extra income.
5. **calcOpex()** → split into payroll, utilities, purchases, indexed by OPEX CAGR.
6. **taxService.apply()** → deduct 6 % or full profit tax, depending on regime.
7. **finService.apply()** → debt schedule, interest, principal, DSCR.
8. **deriveKPIs()** → Payback, IRR, NPV (equity & project), Cum CF.

Each step returns an immutable object so intermediate tables can feed charts.

## 5. Formulae Fixes & Additions

- **Payback‑period**
  ```js
  const payback = (cum) => cum.findIndex(v => v >= 0) * periodLen;
  ```
  where `periodLen` derives from date diff (H1 → 0.5 years).
- **NPV / IRR** — use standard finance formulas with discount rate default = 15 %.
- **DSCR** = EBITDA / Debt Service; flag red if < 1.2.

## 6. Persistence & Versioning

- All new parameters serialise naturally inside Scenario JSON.
- `storageService.save()` gets a *schemaVersion* key — bump when breaking changes occur; loader migrates old files.

## 7. UI Implications

| Screen Area   | Change                                                                                         |
| ------------- | ---------------------------------------------------------------------------------------------- |
| **Sidebar**   | Tabs accordion: *CAPEX • OPEX • Phasing • Financing • Extras • Global*                         |
| **KPI Block** | Add "Equity IRR", "NPV\@15 %", "DSCR min"                                                      |
| **Chart**     | New series: Extra Profit (green), Debt Service (line). Vertical dashed lines for phase starts. |

## 8. Acceptance Tests

1. **Scenario‑Save → Reload** retains new fields.
2. Sliding Phase II start from 2027‑Q3 to 2028‑Q2 updates payback & IRR in <200 ms.
3. Toggling well & KTP reduces CAPEX by ≥ 4.0 M ₽.
4. Switching tax regime to USN increases Cum CF 2033‑H2 by 15 ± 1 % vs OSN.
5. Equity IRR ≥ Project IRR when Debt% > 0.

---

**Status**: Draft v1.0 (24 Jun 2025)

