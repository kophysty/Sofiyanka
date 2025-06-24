import { Scenario } from '../Scenario';
import { House } from '../House';
import { Phase } from '../Phase';

const mockHouseTypes = {
  'Модульный EasyFab (27 м²)': {
    comfort: { cost: 2.3, features: [] }
  },
  'A-Frame (39 м²)': {
    comfort: { cost: 3.0, features: [] }
  }
};

describe('Scenario model', () => {
  it('should create a scenario with default params', () => {
    const scenario = new Scenario('s1', 'Test Scenario');
    expect(scenario.id).toBe('s1');
    expect(scenario.name).toBe('Test Scenario');
    expect(scenario.params.occupancy).toBe(55);
  });

  it('should add a house', () => {
    const scenario = new Scenario('s1', 'Test Scenario');
    const house = new House('h1', 'Модульный EasyFab (27 м²)', 'comfort', 2);
    scenario.addHouse(house);
    expect(scenario.houses.length).toBe(1);
  });

  it('should add a phase', () => {
    const scenario = new Scenario('s1', 'Test Scenario');
    const phase = new Phase('p1', 'Phase I', new Date('2025-01-01'));
    scenario.addPhase(phase);
    expect(scenario.phases.length).toBe(1);
  });

  it('should update params', () => {
    const scenario = new Scenario('s1', 'Test Scenario');
    scenario.updateParams({ occupancy: 70 });
    expect(scenario.params.occupancy).toBe(70);
  });

  it('should calculate total capex', () => {
    const scenario = new Scenario('s1', 'Test Scenario');
    const phase = new Phase('p1', 'Phase I', new Date('2025-01-01'), [new House('h1', 'Модульный EasyFab (27 м²)', 'comfort', 2)], 5);
    scenario.addPhase(phase);
    expect(scenario.getTotalCapex(mockHouseTypes)).toBe(2 * 2.3 + 5);
  });

  it('should calculate total units', () => {
    const scenario = new Scenario('s1', 'Test Scenario');
    scenario.addHouse(new House('h1', 'Модульный EasyFab (27 м²)', 'comfort', 2));
    scenario.addHouse(new House('h2', 'A-Frame (39 м²)', 'comfort', 3));
    expect(scenario.getTotalUnits()).toBe(5);
  });

  it('should clone scenario', () => {
    const scenario = new Scenario('s1', 'Test Scenario');
    scenario.addHouse(new House('h1', 'Модульный EasyFab (27 м²)', 'comfort', 2));
    const clone = scenario.clone('s2', 'Clone');
    expect(clone.id).toBe('s2');
    expect(clone.name).toBe('Clone');
    expect(clone.houses.length).toBe(1);
  });
}); 