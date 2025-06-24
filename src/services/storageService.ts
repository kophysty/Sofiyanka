/**
 * Storage service for scenario persistence
 */
import { Scenario, ScenarioParams } from '../models/Scenario';
import { House } from '../models/House';
import { Phase } from '../models/Phase';

export class StorageService {
  static STORAGE_KEY = 'sofyinka_scenarios';
  static CURRENT_SCENARIO_KEY = 'sofyinka_current_scenario';
  static SCHEMA_VERSION = '1.0';

  /**
   * Save a scenario to storage
   */
  static saveScenario(scenario: Scenario): boolean {
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
   */
  static loadScenario(scenarioId: string): Scenario | null {
    try {
      const scenarios = this.getAllScenarios();
      const scenarioData = scenarios.find(s => s.id === scenarioId);
      if (!scenarioData) return null;
      const migratedData = this.migrateScenario(scenarioData);
      const scenario = new Scenario(migratedData.id, migratedData.name, migratedData.params);
      scenario.houses = (migratedData.houses || []).map((h: any) => new House(h.id, h.type, h.tier, h.qty));
      scenario.phases = (migratedData.phases || []).map((p: any) => new Phase(p.id, p.name, p.startDate, (p.houses || []).map((h: any) => new House(h.id, h.type, h.tier, h.qty)), p.capex));
      scenario.extras = migratedData.extras || [];
      scenario.financing = migratedData.financing || null;
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
   */
  static getAllScenarios(): any[] {
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
   */
  static getCurrentScenarioId(): string | null {
    return localStorage.getItem(this.CURRENT_SCENARIO_KEY);
  }

  /**
   * Delete a scenario
   */
  static deleteScenario(scenarioId: string): boolean {
    try {
      const scenarios = this.getAllScenarios();
      const filteredScenarios = scenarios.filter(s => s.id !== scenarioId);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredScenarios));
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
   */
  static migrateScenario(scenarioData: any): any {
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
   */
  static exportScenario(scenario: Scenario, filename?: string) {
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
   */
  static async importScenario(file: File): Promise<Scenario> {
    try {
      const text = await file.text();
      const scenarioData = JSON.parse(text);
      const migratedData = this.migrateScenario(scenarioData);
      const scenario = new Scenario(migratedData.id, migratedData.name, migratedData.params);
      scenario.houses = (migratedData.houses || []).map((h: any) => new House(h.id, h.type, h.tier, h.qty));
      scenario.phases = (migratedData.phases || []).map((p: any) => new Phase(p.id, p.name, p.startDate, (p.houses || []).map((h: any) => new House(h.id, h.type, h.tier, h.qty)), p.capex));
      scenario.extras = migratedData.extras || [];
      scenario.financing = migratedData.financing || null;
      return scenario;
    } catch (error) {
      console.error('Error importing scenario:', error);
      throw new Error('Invalid scenario file');
    }
  }
} 