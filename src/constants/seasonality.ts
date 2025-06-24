/**
 * Seasonality adjustment factors for revenue calculation.
 * These factors adjust the base occupancy and ADR for each month.
 */
export interface MonthlyFactor {
  occupancy: number; // Multiplier for base occupancy rate
  adr: number;       // Multiplier for base ADR
}

export const SEASONALITY_FACTORS: Record<string, MonthlyFactor> = {
  jan: { occupancy: 0.7, adr: 1.2 },   // New Year holidays
  feb: { occupancy: 0.75, adr: 1.1 },  // Public holidays
  mar: { occupancy: 0.8, adr: 1.0 },
  apr: { occupancy: 0.9, adr: 1.0 },
  may: { occupancy: 1.1, adr: 1.2 },   // May holidays
  jun: { occupancy: 1.2, adr: 1.3 },   // Summer season start
  jul: { occupancy: 1.4, adr: 1.4 },   // Peak summer
  aug: { occupancy: 1.3, adr: 1.4 },   // Peak summer
  sep: { occupancy: 1.1, adr: 1.1 },   // Velvet season
  oct: { occupancy: 0.9, adr: 0.9 },
  nov: { occupancy: 0.7, adr: 0.8 },   // Low season
  dec: { occupancy: 1.0, adr: 1.15 }  // Pre-New Year
};

export const MONTH_KEYS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']; 