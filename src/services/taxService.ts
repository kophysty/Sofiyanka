/**
 * Service for calculating tax liabilities based on different tax regimes.
 */
import { CashFlowPeriod } from './calcService';
import { TaxRegime } from '../models/Scenario';

export interface TaxCalculationResult {
  taxAmount: number;
}

export const TAX_REGIMES = {
  USN6: { rate: 0.06, base: 'revenue', name: 'УСН (доходы)' },
  USN15: { rate: 0.15, base: 'profit', name: 'УСН (доходы минус расходы)' },
  OSN: { rate: 0.20, base: 'profit', name: 'ОСН' },
  NONE: { rate: 0, base: 'none', name: 'Нет (самозанятый)' },
};

export class TaxService {
  /**
   * Calculate tax for a given period based on the selected regime.
   * @param periodData - The cash flow data for the period.
   * @param taxRegime - The selected tax regime.
   * @returns The calculated tax amount.
   */
  static calculateTax(periodData: CashFlowPeriod, taxRegime: TaxRegime): number {
    const regime = TAX_REGIMES[taxRegime];
    if (!regime || regime.rate === 0) {
      return 0;
    }

    let taxBase = 0;
    if (regime.base === 'revenue') {
      taxBase = periodData.revenue;
    } else if (regime.base === 'profit') {
      taxBase = periodData.revenue - periodData.opex;
    }

    // Ensure tax base is not negative for profit-based taxes
    if (taxBase < 0) {
      taxBase = 0;
    }
    
    return taxBase * regime.rate;
  }
} 