import { StorageService } from '../storageService';
import { Scenario } from '../../models/Scenario';

global.localStorage = {
  store: {} as Record<string, string>,
  getItem(key: string) { return this.store[key] || null; },
  setItem(key: string, value: string) { this.store[key] = value; },
  removeItem(key: string) { delete this.store[key]; },
  clear() { this.store = {}; }
} as any;

describe('StorageService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should save and load a scenario', () => {
    const scenario = new Scenario('s1', 'Test Scenario');
    StorageService.saveScenario(scenario);
    const loaded = StorageService.loadScenario('s1');
    expect(loaded).not.toBeNull();
    expect(loaded?.id).toBe('s1');
  });

  it('should list all scenarios', () => {
    const scenario = new Scenario('s1', 'Test Scenario');
    StorageService.saveScenario(scenario);
    const all = StorageService.getAllScenarios();
    expect(Array.isArray(all)).toBe(true);
    expect(all.length).toBe(1);
  });

  it('should delete a scenario', () => {
    const scenario = new Scenario('s1', 'Test Scenario');
    StorageService.saveScenario(scenario);
    StorageService.deleteScenario('s1');
    const loaded = StorageService.loadScenario('s1');
    expect(loaded).toBeNull();
  });
}); 