/**
 * Scenario model - single source of truth for all parameters
 */
import { House, HouseType, HouseTier } from './House';
import { Phase } from './Phase';
import { MonthlyFactor } from '../constants/seasonality';

export type TaxRegime = 'USN6' | 'USN15' | 'OSN' | 'NONE';

export interface OpexStructure {
  payroll: number;
  marketing: number;
  booking: number;
  consumables: number;
  utilities: number;
}

export interface ScenarioParams {
  occupancy: number;
  adr: number;
  adrCAGR: number;
  opexStructure: OpexStructure;
  opexCAGR: number;
  taxRegime: TaxRegime;
  extraRevenueServices: string[]; // IDs of enabled extra revenue streams
  seasonality: Record<string, MonthlyFactor>;
  [key: string]: any;
}

export class Scenario {
  id: string;
  name: string;
  houses: House[];
  phases: Phase[];
  extras: any[];
  financing: any;
  params: ScenarioParams;
  createdAt: Date;
  updatedAt: Date;
  opexCAGR: number;
  taxRegime: TaxRegime;
  extraRevenueServices: string[];
  seasonality: Record<string, MonthlyFactor>;

  constructor(id: string, name: string, params: Partial<ScenarioParams> = {}) {
    this.id = id;
    this.name = name;
    this.houses = [];
    this.phases = [];
    this.extras = [];
    this.financing = null;
    this.params = {
      occupancy: 55,
      adr: 9400,
      adrCAGR: 3.0,
      opexStructure: {
        payroll: 3500000,
        marketing: 1200000,
        booking: 0.05, // 5% of revenue
        consumables: 500, // per occupied room-night
        utilities: 250000,
      },
      opexCAGR: 6.0,
      taxRegime: 'USN6',
      extraRevenueServices: [], // Default to no extra services
      seasonality: {},
      ...params
    };
    this.opexCAGR = this.params.opexCAGR;
    this.taxRegime = this.params.taxRegime;
    this.extraRevenueServices = this.params.extraRevenueServices || [];
    this.seasonality = this.params.seasonality || {};
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Add a house to the scenario
   */
  addHouse(house: House) {
    this.houses.push(house);
    this.updatedAt = new Date();
  }

  /**
   * Add a phase to the scenario
   */
  addPhase(phase: Phase) {
    this.phases.push(phase);
    this.updatedAt = new Date();
  }

  /**
   * Update scenario parameters
   */
  updateParams(newParams: Partial<ScenarioParams>) {
    if (newParams.opexStructure) {
        newParams.opexStructure = { ...this.params.opexStructure, ...newParams.opexStructure };
    }
    this.params = { ...this.params, ...newParams };
    this.opexCAGR = newParams.opexCAGR || this.opexCAGR;
    this.taxRegime = newParams.taxRegime || this.taxRegime;
    this.extraRevenueServices = newParams.extraRevenueServices || this.extraRevenueServices;
    this.seasonality = newParams.seasonality || this.seasonality;
    this.updatedAt = new Date();
  }

  /**
   * Calculate total CAPEX
   * @param houseTypesLookup — lookup table for house types and tiers
   * @returns Total CAPEX in millions RUB
   */
  getTotalCapex(houseTypesLookup: Record<string, any>): number {
    return this.phases.reduce((total, phase) => total + phase.getTotalCapex(houseTypesLookup), 0);
  }

  /**
   * Get total units across all phases
   * @returns Total units
   */
  getTotalUnits(): number {
    return this.houses.reduce((total, house) => total + house.qty, 0);
  }

  /**
   * Create a copy of this scenario
   */
  clone(newId: string, newName: string): Scenario {
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