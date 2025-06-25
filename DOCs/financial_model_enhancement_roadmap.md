# Financial Model Enhancement Roadmap
## Sofyinka Glamping Project

> **Project Timeline Note:** For the purpose of this model and its development log, the "present day" is considered to be **mid-2025**. All projections start from this year, and all changelog entries should reflect this timeline.

### Executive Summary

This document outlines the systematic enhancement of the Sofyinka financial model web application, transforming it from the current basic implementation into a sophisticated, modular system that mirrors real-world investment decision-making processes.

### Current State Analysis

**Initial State (Pre-Enhancement):**
- Monolithic `app.js` structure.
- Basic, static calculations.

**Current State (v1.2):**
- **Migration Complete:** The project has been successfully migrated to a modular TypeScript architecture.
- **Enhanced Core Logic:** Implemented flexible house configuration, granular OPEX, multiple tax regimes, and seasonality factors.
- **UI Improvements:** The interface is now tab-based, with interactive controls for seasonality and housing mix.
- **Dynamic Calculations:** The model instantly recalculates on parameter changes.

### Enhancement Features Matrix

| ID | Feature | Priority | Status | Notes |
|----|---------|----------|--------|-------|
| L-1 | House Tier Pricing | High | **Done** | Implemented via `houseTypes.ts` and UI configuration. |
| L-2 | Granular Infrastructure | High | **Not Started** | CAPEX for infrastructure is still a single input field. |
| L-3 | Dynamic Phase Management | High | **Next Up** | Currently static. A detailed plan is formulated below. |
| L-4 | Extra Revenue Streams | Medium | **Done** | Implemented with UI toggles and scaling. |
| L-5 | Financing Layer | High | **Not Started** | No loan or investment schedule modeling yet. |
| L-6 | Seasonality Matrix | Medium | **Done** | Seasonality factors for both Occupancy and ADR are now managed in the UI. |
| L-7 | Cost Escalation & Inflation | Medium | **Done** | ADR and OPEX CAGR are implemented. |
| L-8 | Tax Regimes | Medium | **Done** | Implemented via `taxService.ts` and a UI dropdown. |
| L-9 | Payroll Breakdown | Low | **Partially Done** | Payroll is a separate input, but not broken down further. |
| L-10| Scenario Compare | Medium | **Done** | Requires state management and persistence layer. |
| L-11| Gantt of Build Works | Low | **Not Started** | A visual-only feature for post-MVP. |

### Phase 1: Core Architecture Migration (Weeks 1-2) - COMPLETED

#### 1.1 Project Structure Setup
- [x] Create modular directory structure
- [x] Set up build system (Vite)
- [x] Configure linting and formatting
- [x] Establish TypeScript foundation

#### 1.2 Data Model Migration
- [x] Create `src/models/` directory
- [x] Implement `House.ts` model with tier support
- [x] Implement `Phase.ts` model with flexible timing
- [x] Implement `Scenario.js` as single source of truth
- [x] Create `src/constants/` for lookup tables

#### 1.3 Service Layer Foundation
- [x] Create `src/services/calcService.js`
- [x] Migrate calculation logic from `app.js`
- [x] Implement immutable calculation pipeline
- [x] Create `src/services/storageService.js`

---

### Future Work & Detailed Plans

### L-3: Dynamic and Manageable Project Phases

This is the next major planned feature.

#### Current Problem
The current implementation uses a hard-coded timeline for CAPEX distribution and unit rollout, which does not allow for flexible scenario modeling.

#### Proposed Solution
1.  **New "Phases" UI Tab:** Create a dedicated tab in the interface to manage project phases.
2.  **Manageable Phase Parameters:** Allow the user to dynamically add, remove, and define each phase with the following parameters:
    *   **Phase Name:** e.g., "Construction," "Launch," "Expansion."
    *   **Start Year.**
    *   **Duration (in years).**
    *   **CAPEX Amount:** The capital expenditure for that specific phase.
    *   **Units by Phase End:** The total number of units that should be operational by the end of the phase.
3.  **Dynamic Timeline Generation:** Rework the `buildPhaseTimeline` function in `calcService.ts` to build the investment and unit rollout schedule based on the user-defined phases from the new UI.
4.  **Dynamic Table Labels:** The phase separators in the main financial table will dynamically use the names and dates from the user's configuration.

---

### L-2, L-5, L-10: Other Key Future Enhancements

- **Granular Infrastructure (L-2):** Break down infrastructure costs (e.g., well, electricity, sewage) into individual, toggleable items.
- **Financing Layer (L-5):** Introduce loan modeling, including parameters like interest rate, term, grace period, and calculate debt service coverage ratio (DSCR).
- **Scenario Management (L-10):** Implement functionality to save, load, and compare different scenarios. This will be the final step to make the tool a complete decision-making platform.

### Target Architecture Overview

Based on the PRD File Architecture and Logic Enhancement Spec, the target system will feature:

```
sofyinka/
├─ public/                  # Static assets
├─ src/                     # Source code (ES-modules)
│  ├─ main.js              # App bootstrap
│  ├─ constants/           # Immutable lookup tables
│  ├─ models/              # Domain models
│  ├─ services/            # Business logic
│  ├─ components/          # UI widgets
│  ├─ store/               # Reactive state
│  └─ utils/               # Pure helpers
├─ data/                   # Configuration
├─ scenarios/              # User scenarios
├─ styles/                 # SCSS sources
└─ docs/                   # Documentation
```

### Phase 2: Enhanced Calculation Engine (Weeks 3-4)

#### 2.1 House Tier Pricing (L-1)
```javascript
// src/constants/houseTypes.js
export const HOUSE_TYPES = {
  'Comfort': {
    economy: { cost: 2.1, features: ['basic'] },
    base: { cost: 2.8, features: ['basic', 'premium'] },
    premium: { cost: 3.5, features: ['basic', 'premium', 'luxury'] }
  },
  // ... other types
};
```

#### 2.2 Granular Infrastructure (L-2)
```javascript
// src/constants/infraItems.js
export const INFRA_ITEMS = {
  well: { cost: 1.2, optional: true },
  ktp: { cost: 0.8, optional: true },
  los: { cost: 0.6, optional: true },
  // ... other items
};
```

#### 2.3 Phase Start Picker (L-3)
- [ ] Implement flexible phase timing
- [ ] Add cash cushion optimization
- [ ] Create phase dependency logic

### Phase 3: Revenue & Cost Enhancements (Weeks 5-6)

#### 3.1 Extra Revenue Streams (L-4)
```javascript
// data/extras.json
{
  "bath": { revenue: 500, margin: 0.7, seasonality: 0.8 },
  "excursions": { revenue: 1200, margin: 0.6, seasonality: 0.9 },
  "f&b": { revenue: 800, margin: 0.4, seasonality: 0.7 }
}
```

#### 3.2 Seasonality Matrix (L-6)
```javascript
// data/seasonality.json
{
  "jan": { adr: 0.7, occupancy: 0.6 },
  "feb": { adr: 0.75, occupancy: 0.65 },
  // ... monthly factors
}
```

#### 3.3 Cost Escalation & Inflation (L-7)
- [ ] Implement ADR growth (3% CAGR)
- [ ] Implement OPEX escalation (6% CAGR)
- [ ] Add inflation parameters to UI

### Phase 4: Financing & Tax Layer (Weeks 7-8)

#### 4.1 Financing Layer (L-5)
```javascript
// src/models/Loan.js
export class Loan {
  constructor(amount, rate, term, gracePeriod) {
    this.amount = amount;
    this.rate = rate;
    this.term = term;
    this.gracePeriod = gracePeriod;
  }
  
  calculateSchedule() {
    // Debt service calculation
  }
}
```

#### 4.2 Tax Regimes (L-8)
```javascript
// src/services/taxService.js
export const TAX_REGIMES = {
  USN6: { rate: 0.06, type: 'revenue' },
  OSN: { rate: 0.20, type: 'profit' },
  NONE: { rate: 0, type: 'none' }
};
```

### Phase 5: Advanced Features (Weeks 9-10)

#### 5.1 Payroll Breakdown (L-9)
- [ ] Separate FOT, utilities, purchases
- [ ] Add detailed OPEX categorization
- [ ] Implement granular cost tracking

#### 5.2 Scenario Compare (L-10)
- [ ] Create A/B comparison interface
- [ ] Implement KPI side-by-side view
- [ ] Add scenario diff highlighting

#### 5.3 Gantt of Build Works (L-11)
- [ ] Integrate Frappe Gantt library
- [ ] Create visual timeline component
- [ ] Link to phase timing logic

### Implementation Guidelines

#### Code Quality Standards
- **Type Safety**: Use TypeScript with strict mode
- **Testing**: Unit tests for all calculation functions
- **Documentation**: JSDoc for all public APIs
- **Performance**: Immutable data structures, memoization

#### Data Flow Architecture
```
User Input → Scenario Model → Calculation Pipeline → Results
     ↓              ↓              ↓              ↓
  Validation → Persistence → KPI Derivation → UI Update
```

#### Calculation Pipeline
1. **expandHouses()** → per-unit CAPEX rows
2. **buildPhaseTimeline()** → CAPEX & go-live alignment
3. **calcRevenue()** → nightly rate × occupancy × units
4. **applyExtras()** → margin-weighted extra income
5. **calcOpex()** → payroll, utilities, purchases
6. **taxService.apply()** → regime-specific taxation
7. **finService.apply()** → debt schedule, DSCR
8. **deriveKPIs()** → Payback, IRR, NPV

### Migration Strategy

#### Step 1: Parallel Development
- Keep existing `app.js` functional
- Develop new modules alongside
- Implement feature flags for gradual rollout

#### Step 2: Data Migration
- Create migration scripts for existing scenarios
- Implement schema versioning in storage service
- Add backward compatibility layer

#### Step 3: UI Migration
- Migrate components one by one
- Maintain consistent user experience
- Add progressive enhancement features

### Success Metrics

#### Technical Metrics
- [ ] 100% test coverage for calculation functions
- [ ] <200ms calculation time for complex scenarios
- [ ] Zero breaking changes during migration
- [ ] 100% backward compatibility

#### Business Metrics
- [ ] Support for all 11 enhancement features
- [ ] Scenario save/load functionality
- [ ] Real-time "what-if" analysis
- [ ] Professional-grade financial modeling

### Risk Mitigation

#### Technical Risks
- **Performance**: Implement Web Workers for heavy calculations
- **Data Loss**: Robust backup and migration strategies
- **Browser Compatibility**: Progressive enhancement approach

#### Business Risks
- **User Adoption**: Gradual feature rollout with training
- **Data Accuracy**: Extensive validation and testing
- **Timeline**: Agile development with regular milestones

### Next Steps

1. **Immediate Actions** (Week 1):
   - Set up development environment
   - Create project structure
   - Begin Phase 1 implementation

2. **Weekly Reviews**:
   - Progress tracking against milestones
   - Code quality assessments
   - User feedback integration

3. **Monthly Deliverables**:
   - Working prototype with new features
   - Performance benchmarks
   - User acceptance testing

---

**Document Version**: 1.0  
**Last Updated**: December 2024  
**Next Review**: Weekly during implementation 