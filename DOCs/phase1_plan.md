# Phase 1 Implementation Plan
## Core Architecture Migration

### Overview

Phase 1 focuses on establishing the foundational architecture for the enhanced Sofyinka financial model. This phase will transform the current monolithic `app.js` into a modular, maintainable system while preserving all existing functionality.

### Week 1: Project Structure & Build System

#### Day 1-2: Environment Setup

**Tasks:**
1. **Create modular directory structure**
   ```bash
   mkdir -p src/{constants,models,services,components,store,utils}
   mkdir -p data scenarios styles docs
   ```

2. **Set up build system with Vite**
   ```bash
   npm init -y
   npm install vite @vitejs/plugin-react typescript
   npm install --save-dev eslint prettier husky
   ```

3. **Create `vite.config.js`**
   ```javascript
   import { defineConfig } from 'vite';
   
   export default defineConfig({
     root: '.',
     build: {
       outDir: 'public',
       rollupOptions: {
         input: {
           main: './index.html'
         }
       }
     },
     server: {
       port: 5173,
       open: true
     }
   });
   ```

4. **Configure TypeScript (`tsconfig.json`)**
   ```json
   {
     "compilerOptions": {
       "target": "ES2020",
       "module": "ESNext",
       "moduleResolution": "node",
       "strict": true,
       "esModuleInterop": true,
       "skipLibCheck": true,
       "forceConsistentCasingInFileNames": true,
       "outDir": "./dist",
       "rootDir": "./src"
     },
     "include": ["src/**/*"],
     "exclude": ["node_modules", "dist"]
   }
   ```

#### Day 3-4: Data Model Foundation

**Task 1: Create House Model (`src/models/House.js`)**
```javascript
/**
 * @typedef {'Comfort' | 'A-Frame' | 'Family' | 'One-House'} HouseType
 * @typedef {'economy' | 'base' | 'premium'} HouseTier
 */

/**
 * House model representing a single accommodation unit
 */
export class House {
  /**
   * @param {string} id - Unique identifier
   * @param {HouseType} type - House type
   * @param {HouseTier} tier - Quality tier
   * @param {number} qty - Quantity of units
   */
  constructor(id, type, tier, qty = 1) {
    this.id = id;
    this.type = type;
    this.tier = tier;
    this.qty = qty;
  }

  /**
   * Calculate total cost for this house configuration
   * @returns {number} Total cost in millions RUB
   */
  cost() {
    const baseCost = HOUSE_TYPES[this.type]?.[this.tier]?.cost || 0;
    return baseCost * this.qty;
  }

  /**
   * Get features available for this house configuration
   * @returns {string[]} Array of feature names
   */
  getFeatures() {
    return HOUSE_TYPES[this.type]?.[this.tier]?.features || [];
  }

  /**
   * Create a copy of this house with modified properties
   * @param {Partial<House>} changes - Properties to change
   * @returns {House} New house instance
   */
  clone(changes = {}) {
    return new House(
      changes.id || this.id,
      changes.type || this.type,
      changes.tier || this.tier,
      changes.qty || this.qty
    );
  }
}
```

**Task 2: Create Phase Model (`src/models/Phase.js`)**
```javascript
/**
 * Phase model representing a construction/development phase
 */
export class Phase {
  /**
   * @param {string} id - Unique identifier
   * @param {string} name - Phase name
   * @param {Date} startDate - Phase start date
   * @param {House[]} houses - Houses in this phase
   * @param {number} capex - Capital expenditure in millions RUB
   */
  constructor(id, name, startDate, houses = [], capex = 0) {
    this.id = id;
    this.name = name;
    this.startDate = new Date(startDate);
    this.houses = houses;
    this.capex = capex;
  }

  /**
   * Calculate total units in this phase
   * @returns {number} Total number of units
   */
  getTotalUnits() {
    return this.houses.reduce((total, house) => total + house.qty, 0);
  }

  /**
   * Calculate total CAPEX for this phase
   * @returns {number} Total CAPEX in millions RUB
   */
  getTotalCapex() {
    const houseCapex = this.houses.reduce((total, house) => total + house.cost(), 0);
    return houseCapex + this.capex;
  }

  /**
   * Get phase duration in months
   * @returns {number} Duration in months
   */
  getDuration() {
    // Default 6 months per phase
    return 6;
  }

  /**
   * Get phase end date
   * @returns {Date} Phase end date
   */
  getEndDate() {
    const endDate = new Date(this.startDate);
    endDate.setMonth(endDate.getMonth() + this.getDuration());
    return endDate;
  }
}
```

**Task 3: Create Scenario Model (`src/models/Scenario.js`)**
```javascript
/**
 * Scenario model - single source of truth for all parameters
 */
export class Scenario {
  /**
   * @param {string} id - Unique identifier
   * @param {string} name - Scenario name
   * @param {Object} params - Scenario parameters
   */
  constructor(id, name, params = {}) {
    this.id = id;
    this.name = name;
    this.houses = [];
    this.phases = [];
    this.extras = [];
    this.financing = null;
    
    // Default parameters
    this.params = {
      occupancy: 55,
      adr: 9400,
      adrCAGR: 3.0,
      opexRate: 50,
      opexCAGR: 6.0,
      taxRegime: 'USN6',
      ...params
    };
    
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Add a house to the scenario
   * @param {House} house - House to add
   */
  addHouse(house) {
    this.houses.push(house);
    this.updatedAt = new Date();
  }

  /**
   * Add a phase to the scenario
   * @param {Phase} phase - Phase to add
   */
  addPhase(phase) {
    this.phases.push(phase);
    this.updatedAt = new Date();
  }

  /**
   * Update scenario parameters
   * @param {Object} newParams - New parameters
   */
  updateParams(newParams) {
    this.params = { ...this.params, ...newParams };
    this.updatedAt = new Date();
  }

  /**
   * Calculate total CAPEX
   * @returns {number} Total CAPEX in millions RUB
   */
  getTotalCapex() {
    const phaseCapex = this.phases.reduce((total, phase) => total + phase.getTotalCapex(), 0);
    return phaseCapex;
  }

  /**
   * Get total units across all phases
   * @returns {number} Total units
   */
  getTotalUnits() {
    return this.houses.reduce((total, house) => total + house.qty, 0);
  }

  /**
   * Create a copy of this scenario
   * @param {string} newId - New scenario ID
   * @param {string} newName - New scenario name
   * @returns {Scenario} New scenario instance
   */
  clone(newId, newName) {
    const newScenario = new Scenario(newId, newName, this.params);
    newScenario.houses = this.houses.map(house => house.clone());
    newScenario.phases = this.phases.map(phase => new Phase(
      phase.id,
      phase.name,
      phase.startDate,
      phase.houses.map(house => house.clone()),
      phase.capex
    ));
    newScenario.extras = [...this.extras];
    return newScenario;
  }
}
```

#### Day 5: Constants Setup

**Task: Create House Types Constants (`src/constants/houseTypes.js`)**
```javascript
/**
 * House types and their tier-based pricing
 */
export const HOUSE_TYPES = {
  'Comfort': {
    economy: {
      cost: 2.1,
      features: ['basic_furniture', 'heating', 'electricity']
    },
    base: {
      cost: 2.8,
      features: ['basic_furniture', 'heating', 'electricity', 'premium_finishing']
    },
    premium: {
      cost: 3.5,
      features: ['basic_furniture', 'heating', 'electricity', 'premium_finishing', 'luxury_amenities']
    }
  },
  'A-Frame': {
    economy: {
      cost: 2.8,
      features: ['basic_furniture', 'heating', 'electricity', 'unique_design']
    },
    base: {
      cost: 3.6,
      features: ['basic_furniture', 'heating', 'electricity', 'unique_design', 'premium_finishing']
    },
    premium: {
      cost: 4.4,
      features: ['basic_furniture', 'heating', 'electricity', 'unique_design', 'premium_finishing', 'luxury_amenities']
    }
  },
  'Family': {
    economy: {
      cost: 3.2,
      features: ['basic_furniture', 'heating', 'electricity', 'family_size']
    },
    base: {
      cost: 4.1,
      features: ['basic_furniture', 'heating', 'electricity', 'family_size', 'premium_finishing']
    },
    premium: {
      cost: 5.0,
      features: ['basic_furniture', 'heating', 'electricity', 'family_size', 'premium_finishing', 'luxury_amenities']
    }
  },
  'One-House': {
    economy: {
      cost: 4.5,
      features: ['basic_furniture', 'heating', 'electricity', 'large_size']
    },
    base: {
      cost: 5.8,
      features: ['basic_furniture', 'heating', 'electricity', 'large_size', 'premium_finishing']
    },
    premium: {
      cost: 7.1,
      features: ['basic_furniture', 'heating', 'electricity', 'large_size', 'premium_finishing', 'luxury_amenities']
    }
  }
};

/**
 * Get available house types
 * @returns {string[]} Array of house type names
 */
export function getHouseTypes() {
  return Object.keys(HOUSE_TYPES);
}

/**
 * Get available tiers for a house type
 * @param {string} houseType - House type
 * @returns {string[]} Array of tier names
 */
export function getTiersForType(houseType) {
  return Object.keys(HOUSE_TYPES[houseType] || {});
}

/**
 * Get cost for a specific house type and tier
 * @param {string} houseType - House type
 * @param {string} tier - Tier level
 * @returns {number} Cost in millions RUB
 */
export function getHouseCost(houseType, tier) {
  return HOUSE_TYPES[houseType]?.[tier]?.cost || 0;
}
```

### Week 2: Service Layer & Migration

#### Day 1-2: Calculation Service Foundation

**Task: Create Calculation Service (`src/services/calcService.js`)**
```javascript
import { HOUSE_TYPES } from '../constants/houseTypes.js';

/**
 * Main calculation service for financial projections
 */
export class CalculationService {
  /**
   * Calculate complete financial projections for a scenario
   * @param {Scenario} scenario - Scenario to calculate
   * @returns {Object} Calculation results
   */
  static calculateProjections(scenario) {
    const timeline = this.buildPhaseTimeline(scenario);
    const cashFlow = this.calculateCashFlow(scenario, timeline);
    const kpis = this.deriveKPIs(cashFlow, scenario.getTotalCapex());
    
    return {
      timeline,
      cashFlow,
      kpis,
      scenario: scenario
    };
  }

  /**
   * Build timeline with phase information
   * @param {Scenario} scenario - Scenario to process
   * @returns {Array} Timeline array
   */
  static buildPhaseTimeline(scenario) {
    const timeline = [];
    let currentDate = new Date(2025, 0, 1); // Start from 2025
    
    scenario.phases.forEach((phase, index) => {
      const phaseTimeline = {
        phaseId: phase.id,
        phaseName: phase.name,
        startDate: new Date(phase.startDate),
        endDate: phase.getEndDate(),
        capex: phase.getTotalCapex(),
        units: phase.getTotalUnits(),
        unitsGoLive: phase.getTotalUnits() // Simplified for now
      };
      
      timeline.push(phaseTimeline);
    });
    
    return timeline;
  }

  /**
   * Calculate cash flow projections
   * @param {Scenario} scenario - Scenario to calculate
   * @param {Array} timeline - Phase timeline
   * @returns {Array} Cash flow array
   */
  static calculateCashFlow(scenario, timeline) {
    const cashFlow = [];
    let cumulativeCf = 0;
    
    // Generate projections for 2025-2033
    for (let year = 2025; year <= 2033; year++) {
      const yearData = this.calculateYearCashFlow(scenario, timeline, year, cumulativeCf);
      cashFlow.push(...yearData.periods);
      cumulativeCf = yearData.cumulativeCf;
    }
    
    return cashFlow;
  }

  /**
   * Calculate cash flow for a specific year
   * @param {Scenario} scenario - Scenario to calculate
   * @param {Array} timeline - Phase timeline
   * @param {number} year - Year to calculate
   * @param {number} cumulativeCf - Cumulative cash flow
   * @returns {Object} Year cash flow data
   */
  static calculateYearCashFlow(scenario, timeline, year, cumulativeCf) {
    const periods = [];
    let currentCumulativeCf = cumulativeCf;
    
    // Get phase data for this year
    const phaseData = timeline.find(p => 
      p.startDate.getFullYear() <= year && p.endDate.getFullYear() >= year
    );
    
    if (year >= 2026) {
      // Split into H1 and H2
      const h1Data = this.calculatePeriodCashFlow(scenario, phaseData, year, false, currentCumulativeCf);
      periods.push(h1Data);
      currentCumulativeCf = h1Data.cumulativeCf;
      
      const h2Data = this.calculatePeriodCashFlow(scenario, phaseData, year, true, currentCumulativeCf);
      periods.push(h2Data);
      currentCumulativeCf = h2Data.cumulativeCf;
    } else {
      // Full year for 2025
      const fullYearData = this.calculatePeriodCashFlow(scenario, phaseData, year, false, currentCumulativeCf);
      periods.push(fullYearData);
      currentCumulativeCf = fullYearData.cumulativeCf;
    }
    
    return { periods, cumulativeCf: currentCumulativeCf };
  }

  /**
   * Calculate cash flow for a specific period (H1/H2)
   * @param {Scenario} scenario - Scenario to calculate
   * @param {Object} phaseData - Phase data
   * @param {number} year - Year
   * @param {boolean} isH2 - Whether this is H2
   * @param {number} cumulativeCf - Cumulative cash flow
   * @returns {Object} Period cash flow data
   */
  static calculatePeriodCashFlow(scenario, phaseData, year, isH2, cumulativeCf) {
    const period = isH2 ? `${year} H2` : (year === 2025 ? `${year}` : `${year} H1`);
    
    // Calculate revenue
    const units = phaseData?.units || 0;
    const roomNights = units * 365 * 0.5 * (scenario.params.occupancy / 100);
    let revenue = roomNights * scenario.params.adr / 1000000; // Convert to millions
    
    // Apply growth
    if (year > 2028) {
      revenue *= Math.pow(1 + scenario.params.adrCAGR / 100, year - 2028);
    }
    
    // Calculate OPEX
    const opex = revenue * (scenario.params.opexRate / 100);
    
    // Calculate CAPEX
    const capex = phaseData && year <= 2028 ? phaseData.capex * 0.5 : 0;
    
    // Calculate net cash flow
    const netCf = revenue - opex - capex;
    const newCumulativeCf = cumulativeCf + netCf;
    
    return {
      period,
      revenue,
      opex,
      capex,
      netCf,
      cumulativeCf: newCumulativeCf,
      year,
      isH2
    };
  }

  /**
   * Derive KPIs from cash flow data
   * @param {Array} cashFlow - Cash flow array
   * @param {number} totalInvestment - Total investment amount
   * @returns {Object} KPI calculations
   */
  static deriveKPIs(cashFlow, totalInvestment) {
    // Find payback period
    const paybackIndex = cashFlow.findIndex(period => period.cumulativeCf >= 0);
    const paybackPeriod = paybackIndex >= 0 ? paybackIndex * 0.5 : null; // 0.5 years per period
    
    // Calculate IRR (simplified)
    const finalCf = cashFlow[cashFlow.length - 1]?.cumulativeCf || 0;
    const irr = this.calculateIRR(totalInvestment, finalCf, cashFlow.length * 0.5);
    
    // Calculate NPV
    const npv = this.calculateNPV(cashFlow, 0.15); // 15% discount rate
    
    return {
      paybackPeriod,
      irr,
      npv,
      totalInvestment,
      finalCumulativeCf: finalCf
    };
  }

  /**
   * Calculate IRR (simplified implementation)
   * @param {number} investment - Initial investment
   * @param {number} finalValue - Final value
   * @param {number} years - Number of years
   * @returns {number} IRR percentage
   */
  static calculateIRR(investment, finalValue, years) {
    if (investment <= 0 || years <= 0) return 0;
    return Math.pow(finalValue / investment, 1 / years) - 1;
  }

  /**
   * Calculate NPV
   * @param {Array} cashFlow - Cash flow array
   * @param {number} discountRate - Discount rate
   * @returns {number} NPV value
   */
  static calculateNPV(cashFlow, discountRate) {
    return cashFlow.reduce((npv, period, index) => {
      const discountFactor = Math.pow(1 + discountRate, index * 0.5);
      return npv + period.netCf / discountFactor;
    }, 0);
  }
}
```

#### Day 3-4: Storage Service

**Task: Create Storage Service (`src/services/storageService.js`)**
```javascript
/**
 * Storage service for scenario persistence
 */
export class StorageService {
  static STORAGE_KEY = 'sofyinka_scenarios';
  static CURRENT_SCENARIO_KEY = 'sofyinka_current_scenario';
  static SCHEMA_VERSION = '1.0';

  /**
   * Save a scenario to storage
   * @param {Scenario} scenario - Scenario to save
   */
  static saveScenario(scenario) {
    try {
      const scenarioData = {
        ...scenario,
        schemaVersion: this.SCHEMA_VERSION,
        savedAt: new Date().toISOString()
      };
      
      const scenarios = this.getAllScenarios();
      const existingIndex = scenarios.findIndex(s => s.id === scenario.id);
      
      if (existingIndex >= 0) {
        scenarios[existingIndex] = scenarioData;
      } else {
        scenarios.push(scenarioData);
      }
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(scenarios));
      localStorage.setItem(this.CURRENT_SCENARIO_KEY, scenario.id);
      
      return true;
    } catch (error) {
      console.error('Error saving scenario:', error);
      return false;
    }
  }

  /**
   * Load a scenario from storage
   * @param {string} scenarioId - Scenario ID to load
   * @returns {Scenario|null} Loaded scenario or null
   */
  static loadScenario(scenarioId) {
    try {
      const scenarios = this.getAllScenarios();
      const scenarioData = scenarios.find(s => s.id === scenarioId);
      
      if (!scenarioData) return null;
      
      // Migrate if needed
      const migratedData = this.migrateScenario(scenarioData);
      
      // Reconstruct scenario object
      const scenario = new Scenario(migratedData.id, migratedData.name, migratedData.params);
      scenario.houses = migratedData.houses || [];
      scenario.phases = migratedData.phases || [];
      scenario.extras = migratedData.extras || [];
      scenario.createdAt = new Date(migratedData.createdAt);
      scenario.updatedAt = new Date(migratedData.updatedAt);
      
      return scenario;
    } catch (error) {
      console.error('Error loading scenario:', error);
      return null;
    }
  }

  /**
   * Get all saved scenarios
   * @returns {Array} Array of scenario data
   */
  static getAllScenarios() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading scenarios:', error);
      return [];
    }
  }

  /**
   * Get current scenario ID
   * @returns {string|null} Current scenario ID
   */
  static getCurrentScenarioId() {
    return localStorage.getItem(this.CURRENT_SCENARIO_KEY);
  }

  /**
   * Delete a scenario
   * @param {string} scenarioId - Scenario ID to delete
   */
  static deleteScenario(scenarioId) {
    try {
      const scenarios = this.getAllScenarios();
      const filteredScenarios = scenarios.filter(s => s.id !== scenarioId);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredScenarios));
      
      // Clear current scenario if it was deleted
      if (this.getCurrentScenarioId() === scenarioId) {
        localStorage.removeItem(this.CURRENT_SCENARIO_KEY);
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting scenario:', error);
      return false;
    }
  }

  /**
   * Migrate scenario data if schema version is different
   * @param {Object} scenarioData - Scenario data to migrate
   * @returns {Object} Migrated scenario data
   */
  static migrateScenario(scenarioData) {
    const currentVersion = this.SCHEMA_VERSION;
    const scenarioVersion = scenarioData.schemaVersion || '0.0';
    
    if (scenarioVersion === currentVersion) {
      return scenarioData;
    }
    
    // Add migration logic here as schema evolves
    console.log(`Migrating scenario from ${scenarioVersion} to ${currentVersion}`);
    
    return scenarioData;
  }

  /**
   * Export scenario to JSON file
   * @param {Scenario} scenario - Scenario to export
   * @param {string} filename - Filename for export
   */
  static exportScenario(scenario, filename) {
    try {
      const dataStr = JSON.stringify(scenario, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(dataBlob);
      link.download = filename || `${scenario.name}.json`;
      link.click();
      
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Error exporting scenario:', error);
    }
  }

  /**
   * Import scenario from JSON file
   * @param {File} file - JSON file to import
   * @returns {Promise<Scenario>} Imported scenario
   */
  static async importScenario(file) {
    try {
      const text = await file.text();
      const scenarioData = JSON.parse(text);
      
      // Validate and migrate
      const migratedData = this.migrateScenario(scenarioData);
      
      // Reconstruct scenario
      const scenario = new Scenario(migratedData.id, migratedData.name, migratedData.params);
      scenario.houses = migratedData.houses || [];
      scenario.phases = migratedData.phases || [];
      scenario.extras = migratedData.extras || [];
      
      return scenario;
    } catch (error) {
      console.error('Error importing scenario:', error);
      throw new Error('Invalid scenario file');
    }
  }
}
```

#### Day 5: Migration Script

**Task: Create Migration Script (`src/utils/migration.js`)**
```javascript
import { Scenario } from '../models/Scenario.js';
import { House } from '../models/House.js';
import { Phase } from '../models/Phase.js';

/**
 * Migration utilities for converting old app.js data to new format
 */
export class MigrationUtils {
  /**
   * Convert old app.js parameters to new Scenario format
   * @param {Object} oldParams - Old parameters from app.js
   * @returns {Scenario} New scenario object
   */
  static migrateFromOldFormat(oldParams) {
    const scenario = new Scenario('migrated-scenario', 'Migrated Scenario', {
      occupancy: oldParams.occupancyRate || 55,
      adr: oldParams.adr || 9400,
      adrCAGR: 3.0,
      opexRate: oldParams.opexPercent || 50,
      opexCAGR: 6.0,
      taxRegime: 'USN6'
    });

    // Create houses based on old CAPEX structure
    const houses = this.createHousesFromOldCapex(oldParams);
    houses.forEach(house => scenario.addHouse(house));

    // Create phases based on old phasing
    const phases = this.createPhasesFromOldPhasing();
    phases.forEach(phase => scenario.addPhase(phase));

    return scenario;
  }

  /**
   * Create houses from old CAPEX structure
   * @param {Object} oldParams - Old parameters
   * @returns {House[]} Array of house objects
   */
  static createHousesFromOldCapex(oldParams) {
    const houses = [];
    
    // Estimate house types based on residential fund
    const residentialFund = oldParams.residentialFund || 27.2;
    const totalUnits = 10; // From original spec
    
    // Simple distribution (can be refined)
    const comfortUnits = Math.floor(totalUnits * 0.4); // 40% Comfort
    const aFrameUnits = Math.floor(totalUnits * 0.3);  // 30% A-Frame
    const familyUnits = Math.floor(totalUnits * 0.2);  // 20% Family
    const oneHouseUnits = totalUnits - comfortUnits - aFrameUnits - familyUnits; // 10% One-House
    
    if (comfortUnits > 0) {
      houses.push(new House('comfort-1', 'Comfort', 'base', comfortUnits));
    }
    if (aFrameUnits > 0) {
      houses.push(new House('aframe-1', 'A-Frame', 'base', aFrameUnits));
    }
    if (familyUnits > 0) {
      houses.push(new House('family-1', 'Family', 'base', familyUnits));
    }
    if (oneHouseUnits > 0) {
      houses.push(new House('onehouse-1', 'One-House', 'base', oneHouseUnits));
    }
    
    return houses;
  }

  /**
   * Create phases from old phasing structure
   * @returns {Phase[]} Array of phase objects
   */
  static createPhasesFromOldPhasing() {
    const phases = [
      new Phase('phase-1', 'Phase I', new Date(2025, 0, 1), [], 5.0),
      new Phase('phase-2', 'Phase II', new Date(2026, 0, 1), [], 20.0),
      new Phase('phase-3', 'Phase III', new Date(2027, 0, 1), [], 19.0),
      new Phase('phase-4', 'Phase IV', new Date(2028, 0, 1), [], 8.0)
    ];
    
    return phases;
  }

  /**
   * Validate scenario data structure
   * @param {Object} scenarioData - Scenario data to validate
   * @returns {boolean} Whether data is valid
   */
  static validateScenarioData(scenarioData) {
    const requiredFields = ['id', 'name', 'params'];
    const requiredParams = ['occupancy', 'adr', 'adrCAGR', 'opexRate', 'opexCAGR', 'taxRegime'];
    
    // Check required fields
    for (const field of requiredFields) {
      if (!scenarioData[field]) {
        console.error(`Missing required field: ${field}`);
        return false;
      }
    }
    
    // Check required parameters
    for (const param of requiredParams) {
      if (typeof scenarioData.params[param] === 'undefined') {
        console.error(`Missing required parameter: ${param}`);
        return false;
      }
    }
    
    return true;
  }
}
```

### Deliverables for Phase 1

#### Week 1 Deliverables:
- [x] Modular project structure
- [x] Build system with Vite
- [x] TypeScript configuration
- [x] House, Phase, and Scenario models
- [x] House types constants

#### Week 2 Deliverables:
- [x] Calculation service with core logic
- [x] Storage service for persistence
- [x] Migration utilities
- [x] Basic integration test

#### Success Criteria:
1. **Functionality**: All existing calculations work in new format
2. **Performance**: Calculations complete in <200ms
3. **Data Integrity**: Scenario save/load works correctly
4. **Code Quality**: 100% test coverage for new modules
5. **Backward Compatibility**: Old data can be migrated

### Next Steps After Phase 1

1. **Phase 2 Preparation**: Set up infrastructure for enhanced features
2. **UI Migration**: Begin moving UI components to new architecture
3. **Testing**: Comprehensive test suite for all new modules
4. **Documentation**: Update technical documentation

---

**Phase 1 Status**: Ready for Implementation  
**Estimated Duration**: 2 weeks  
**Dependencies**: None  
**Risks**: Low (parallel development approach) 