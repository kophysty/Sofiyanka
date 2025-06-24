import { MigrationUtils } from '../migration';

describe('MigrationUtils', () => {
  it('should migrate from old format', () => {
    const oldParams = { occupancyRate: 60, adr: 10000, opexPercent: 40 };
    const scenario = MigrationUtils.migrateFromOldFormat(oldParams);
    expect(scenario).toBeDefined();
    expect(scenario.params.occupancy).toBe(60);
    expect(scenario.params.adr).toBe(10000);
    expect(scenario.params.opexRate).toBe(40);
    expect(scenario.houses.length).toBeGreaterThan(0);
    expect(scenario.phases.length).toBeGreaterThan(0);
  });

  it('should create houses from old capex', () => {
    const houses = MigrationUtils.createHousesFromOldCapex({});
    expect(Array.isArray(houses)).toBe(true);
    expect(houses.length).toBe(3);
  });

  it('should create phases from old phasing', () => {
    const phases = MigrationUtils.createPhasesFromOldPhasing();
    expect(Array.isArray(phases)).toBe(true);
    expect(phases.length).toBe(4);
  });

  it('should validate correct scenario data', () => {
    const scenarioData = {
      id: 's1',
      name: 'Test',
      params: {
        occupancy: 55,
        adr: 9400,
        adrCAGR: 3.0,
        opexRate: 50,
        opexCAGR: 6.0,
        taxRegime: 'USN6'
      }
    };
    expect(MigrationUtils.validateScenarioData(scenarioData)).toBe(true);
  });

  it('should invalidate incorrect scenario data', () => {
    const scenarioData = { id: 's1', name: 'Test', params: { occupancy: 55 } };
    expect(MigrationUtils.validateScenarioData(scenarioData)).toBe(false);
  });
}); 