/**
 * Phase model representing a construction/development phase
 */
import { House } from './House';

export class Phase {
  id: string;
  name: string;
  startDate: Date;
  houses: House[];
  capex: number;

  constructor(id: string, name: string, startDate: Date, houses: House[] = [], capex: number = 0) {
    this.id = id;
    this.name = name;
    this.startDate = new Date(startDate);
    this.houses = houses;
    this.capex = capex;
  }

  /**
   * Calculate total units in this phase
   * @returns Total number of units
   */
  getTotalUnits(): number {
    return this.houses.reduce((total, house) => total + house.qty, 0);
  }

  /**
   * Calculate total CAPEX for this phase
   * @param houseTypesLookup — lookup table for house types and tiers
   * @returns Total CAPEX in millions RUB
   */
  getTotalCapex(houseTypesLookup: Record<string, any>): number {
    const houseCapex = this.houses.reduce((total, house) => total + house.cost(houseTypesLookup), 0);
    return houseCapex + this.capex;
  }

  /**
   * Get phase duration in months
   * @returns Duration in months
   */
  getDuration(): number {
    // Default 6 months per phase
    return 6;
  }

  /**
   * Get phase end date
   * @returns Phase end date
   */
  getEndDate(): Date {
    const endDate = new Date(this.startDate);
    endDate.setMonth(endDate.getMonth() + this.getDuration());
    return endDate;
  }
} 