# Financial Model Enhancement Roadmap
## Sofyinka Glamping Project

### Executive Summary

This document outlines the systematic enhancement of the Sofyinka financial model web application, transforming it from the current basic implementation into a sophisticated, modular system that mirrors real-world investment decision-making processes.

### Current State Analysis

**Existing Implementation:**
- Single `app.js` file (693 lines) with monolithic structure
- Basic CAPEX/OPEX calculations
- Simple cash flow projections (2025-2033)
- Basic KPI calculations (Payback, IRR)
- Static phasing model

**Limitations:**
- No modular architecture
- Limited scenario management
- No financing layer
- No seasonality modeling
- No tax regime flexibility
- No extra revenue streams
- No infrastructure granularity

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

### Enhancement Features Matrix

| ID | Feature | Priority | Business Value | Implementation Complexity |
|----|---------|----------|----------------|---------------------------|
| L-1 | House Tier Pricing | High | CAPEX accuracy | Medium |
| L-2 | Granular Infrastructure | High | Investment flexibility | Medium |
| L-3 | Phase Start Picker | High | Cash flow optimization | High |
| L-4 | Extra Revenue Streams | Medium | Revenue diversification | Medium |
| L-5 | Financing Layer | High | Real-world modeling | High |
| L-6 | Seasonality Matrix | Medium | Cash gap analysis | Medium |
| L-7 | Cost Escalation & Inflation | Medium | Long-term accuracy | Low |
| L-8 | Tax Regimes | Medium | Regulatory compliance | Low |
| L-9 | Payroll Breakdown | Low | Operational detail | Low |
| L-10 | Scenario Compare | Medium | Decision support | Medium |
| L-11 | Gantt of Build Works | Low | Visual planning | High |

### Phase 1: Core Architecture Migration (Weeks 1-2)

#### 1.1 Project Structure Setup
- [ ] Create modular directory structure
- [ ] Set up build system (Vite)
- [ ] Configure linting and formatting
- [ ] Establish TypeScript foundation

#### 1.2 Data Model Migration
- [ ] Create `src/models/` directory
- [ ] Implement `House.js` model with tier support
- [ ] Implement `Phase.js` model with flexible timing
- [ ] Implement `Scenario.js` as single source of truth
- [ ] Create `src/constants/` for lookup tables

#### 1.3 Service Layer Foundation
- [ ] Create `src/services/calcService.js`
- [ ] Migrate calculation logic from `app.js`
- [ ] Implement immutable calculation pipeline
- [ ] Create `src/services/storageService.js`

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