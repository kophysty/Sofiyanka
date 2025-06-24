/**
 * Migration utilities for converting old app.js data to new Scenario format
 */
import { Scenario, ScenarioParams } from '../models/Scenario';
import { House, HouseType, HouseTier } from '../models/House';
import { Phase } from '../models/Phase';

export class MigrationUtils {
  /**
   * Convert old app.js parameters to new Scenario format
   */
  static migrateFromOldFormat(oldParams: any): Scenario {
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
   */
  static createHousesFromOldCapex(oldParams: any): House[] {
    const houses: House[] = [];
    // Estimate house types based on residential fund
    const totalUnits = 10; // From original spec
    const comfortUnits = Math.floor(totalUnits * 0.5); // 50% Comfort
    const aFrameUnits = Math.floor(totalUnits * 0.3);  // 30% A-Frame
    const familyUnits = totalUnits - comfortUnits - aFrameUnits;  // 20% Family
    if (comfortUnits > 0) {
      houses.push(new House('comfort-1', 'Модульный EasyFab (27 м²)', 'comfort', comfortUnits));
    }
    if (aFrameUnits > 0) {
      houses.push(new House('aframe-1', 'A-Frame (39 м²)', 'comfort', aFrameUnits));
    }
    if (familyUnits > 0) {
      houses.push(new House('family-1', 'Family-suite (44 м²)', 'comfort', familyUnits));
    }
    return houses;
  }

  /**
   * Create phases from old phasing structure
   */
  static createPhasesFromOldPhasing(): Phase[] {
    return [
      new Phase('phase-1', 'Phase I', new Date(2025, 0, 1), [], 5.0),
      new Phase('phase-2', 'Phase II', new Date(2026, 0, 1), [], 20.0),
      new Phase('phase-3', 'Phase III', new Date(2027, 0, 1), [], 19.0),
      new Phase('phase-4', 'Phase IV', new Date(2028, 0, 1), [], 8.0)
    ];
  }

  /**
   * Validate scenario data structure
   */
  static validateScenarioData(scenarioData: any): boolean {
    const requiredFields = ['id', 'name', 'params'];
    const requiredParams = ['occupancy', 'adr', 'adrCAGR', 'opexRate', 'opexCAGR', 'taxRegime'];
    for (const field of requiredFields) {
      if (!scenarioData[field]) {
        console.error(`Missing required field: ${field}`);
        return false;
      }
    }
    for (const param of requiredParams) {
      if (typeof scenarioData.params[param] === 'undefined') {
        console.error(`Missing required parameter: ${param}`);
        return false;
      }
    }
    return true;
  }
} 