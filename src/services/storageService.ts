/**
 * Service for persisting and retrieving scenario data from localStorage.
 */
import { ScenarioParams } from '../models/Scenario';

const SCENARIO_LIST_KEY = 'sofyinka_scenario_list';
const SCENARIO_PREFIX = 'sofyinka_scenario_';

export class StorageService {
    /**
     * Get the list of all saved scenario names.
     */
    static listScenarios(): string[] {
        const listJson = localStorage.getItem(SCENARIO_LIST_KEY);
        return listJson ? JSON.parse(listJson) : [];
    }

    /**
     * Save a scenario to localStorage.
     * @param name - The name of the scenario to save.
     * @param data - The scenario data object.
     */
    static saveScenario(name: string, data: ScenarioParams): void {
        if (!name) {
            throw new Error('Scenario name cannot be empty.');
        }
        localStorage.setItem(`${SCENARIO_PREFIX}${name}`, JSON.stringify(data));
        
        const scenarios = this.listScenarios();
        if (!scenarios.includes(name)) {
            scenarios.push(name);
            localStorage.setItem(SCENARIO_LIST_KEY, JSON.stringify(scenarios));
        }
    }

    /**
     * Load a scenario from localStorage.
     * @param name - The name of the scenario to load.
     * @returns The scenario data object, or null if not found.
     */
    static loadScenario(name: string): ScenarioParams | null {
        const dataJson = localStorage.getItem(`${SCENARIO_PREFIX}${name}`);
        return dataJson ? JSON.parse(dataJson) : null;
    }

    /**
     * Delete a scenario from localStorage.
     * @param name - The name of the scenario to delete.
     */
    static deleteScenario(name: string): void {
        localStorage.removeItem(`${SCENARIO_PREFIX}${name}`);
        
        let scenarios = this.listScenarios();
        scenarios = scenarios.filter(s => s !== name);
        localStorage.setItem(SCENARIO_LIST_KEY, JSON.stringify(scenarios));
    }

    /**
     * Triggers the download of a scenario as a JSON file.
     * @param name The name for the file (and the scenario).
     * @param data The scenario data.
     */
    static exportScenarioToFile(name: string, data: ScenarioParams): void {
        const dataStr = JSON.stringify({ name, ...data }, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${name}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    /**
     * Reads a file from an input element and returns scenario data.
     * @param file The file to import.
     * @returns A promise that resolves with the scenario name and parameters.
     */
    static async importScenarioFromFile(file: File): Promise<{ name: string; params: ScenarioParams }> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const text = event.target?.result;
                    if (typeof text !== 'string') {
                        throw new Error('File content is not a string.');
                    }
                    const data = JSON.parse(text);
                    const { name, ...params } = data;

                    // Basic validation
                    if (!name || typeof name !== 'string' || !params.houses) {
                        throw new Error('Invalid or corrupted scenario file.');
                    }
                    
                    resolve({ name, params });
                } catch (e) {
                    reject(e);
                }
            };
            reader.onerror = (error) => reject(error);
            reader.readAsText(file);
        });
    }
}
