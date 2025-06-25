/**
 * Calculation service for financial projections
 */
import { Scenario } from '../models/Scenario';
import { HOUSE_TYPES } from '../constants/houseTypes';
import { EXTRA_REVENUES } from '../constants/extraRevenues';
import { SEASONALITY_FACTORS, MONTH_KEYS } from '../constants/seasonality';
import { TaxService } from './taxService';

export interface CashFlowPeriod {
  period: string;
  revenue: number;
  opex: number;
  capex: number;
  tax: number;
  netCf: number;
  cumulativeCf: number;
  year: number;
  isH2: boolean;
}

export interface KPIResult {
  paybackPeriod: number | null;
  irr: number;
  npv: number;
  totalInvestment: number;
  finalCumulativeCf: number;
}

export class CalculationService {
  /**
   * Build timeline with phase information
   */
  static buildPhaseTimeline(scenario: Scenario, totalCapex: number) {
    const totalUnits = scenario.getTotalUnits();
    // Phasing percentages from the original validated model
    const capexDistribution = [0.096, 0.385, 0.365, 0.154];
    
    return [
        { year: 2025, capex: totalCapex * capexDistribution[0], units: 0, name: 'Фаза I. Старт' },
        { year: 2026, capex: totalCapex * capexDistribution[1], units: Math.floor(totalUnits * 0.4), name: 'Фаза I. Старт' },
        { year: 2027, capex: totalCapex * capexDistribution[2], units: Math.floor(totalUnits * 0.9), name: 'Фаза II. Разгон' },
        { year: 2028, capex: totalCapex * capexDistribution[3], units: totalUnits, name: 'Фаза II. Разгон' },
        { year: 2029, capex: 0, units: totalUnits, name: 'Фаза III. Флагман' },
        { year: 2030, capex: 0, units: totalUnits, name: 'Фаза III. Флагман' },
        { year: 2031, capex: 0, units: totalUnits, name: 'Фаза III. Флагман' },
        { year: 2032, capex: 0, units: totalUnits, name: 'Фаза III. Флагман' },
        { year: 2033, capex: 0, units: totalUnits, name: 'Фаза III. Флагман' }
    ];
  }

  /**
   * Calculate cash flow projections
   */
  static calculateCashFlow(scenario: Scenario, timeline: any[]): CashFlowPeriod[] {
    const cashFlow: CashFlowPeriod[] = [];
    let cumulativeCf = 0;
    
    for (let year = 2025; year <= 2033; year++) {
      const phase = timeline[year - 2025] || { capex: 0, units: scenario.getTotalUnits() };
      
      const calcData = {
        units: phase.units,
        capex: phase.capex,
      };

      if (year >= 2026) {
        // H1 and H2
        const h1 = this.calculatePeriod(scenario, calcData, year, false, cumulativeCf);
        cashFlow.push(h1);
        cumulativeCf = h1.cumulativeCf;
        
        const h2 = this.calculatePeriod(scenario, calcData, year, true, cumulativeCf);
        cashFlow.push(h2);
        cumulativeCf = h2.cumulativeCf;
      } else {
        // Full year for 2025 (pre-operational)
        const fullYear = this.calculatePeriod(scenario, calcData, year, false, cumulativeCf, true);
        cashFlow.push(fullYear);
        cumulativeCf = fullYear.cumulativeCf;
      }
    }
    return cashFlow;
  }

  /**
   * Calculate cash flow for a specific period (H1/H2 or full year)
   */
  static calculatePeriod(
    scenario: Scenario,
    phaseData: any,
    year: number,
    isH2: boolean,
    cumulativeCf: number,
    isFirstYear: boolean = false
  ): CashFlowPeriod {
    if (isFirstYear) {
      const netCf = -phaseData.capex;
      const newCumulativeCf = cumulativeCf + netCf;
      return {
        period: `${year}`,
        revenue: 0, opex: 0, tax: 0,
        capex: phaseData.capex,
        netCf,
        cumulativeCf: newCumulativeCf,
        year, isH2: false
      };
    }
    
    const period = isH2 ? `${year} H2` : `${year} H1`;
    const units = phaseData?.units || 0;
    
    // Monthly calculation for seasonality
    const months = isH2 ? MONTH_KEYS.slice(6) : MONTH_KEYS.slice(0, 6);
    const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();

    let totalRevenue = 0;
    let totalRoomNights = 0;
    months.forEach((monthKey, index) => {
        const monthIndex = isH2 ? index + 6 : index;
        const monthDays = daysInMonth(year, monthIndex);
        const factor = scenario.seasonality[monthKey] || { occupancy: 1, adr: 1 };

        const adjustedOccupancy = (scenario.params.occupancy / 100) * factor.occupancy;
        let adjustedAdr = scenario.params.adr * factor.adr;

        // Apply ADR escalation directly to the monthly ADR
        if (year > 2028) {
          adjustedAdr *= Math.pow(1 + scenario.params.adrCAGR / 100, year - 2028);
        }
        
        const monthlyRoomNights = units * monthDays * adjustedOccupancy;
        totalRoomNights += monthlyRoomNights;
        const monthlyRevenue = monthlyRoomNights * adjustedAdr / 1_000_000;
        totalRevenue += monthlyRevenue;
    });

    let opex = this.calculateOpex(totalRevenue, units, totalRoomNights, year, scenario);
    
    // Apply extra revenues
    const extra = this.applyExtras(totalRevenue, opex, units, scenario);
    let revenue = extra.revenue;
    opex = extra.opex;
    
    const capex = phaseData && year <= 2028 ? phaseData.capex * 0.5 : 0;
    
    const periodForTax = { revenue, opex, capex, netCf: 0, cumulativeCf: 0, period: '', year, isH2, tax: 0 };
    const tax = TaxService.calculateTax(periodForTax, scenario.params.taxRegime);

    const netCf = revenue - opex - capex - tax;
    const newCumulativeCf = cumulativeCf + netCf;
    return {
      period,
      revenue,
      opex,
      capex,
      tax,
      netCf,
      cumulativeCf: newCumulativeCf,
      year,
      isH2
    };
  }

  static calculateOpex(baseRevenue: number, units: number, totalRoomNights: number, year: number, scenario: Scenario): number {
    const { opexStructure, opexCAGR } = scenario.params;
    const scalingFactor = units > 0 ? units / 10 : 0; // Base opex is for 10 units

    // 1. Fixed costs (annual) are scaled by the number of units and halved for the period
    const fixedCosts = (opexStructure.payroll + opexStructure.marketing + opexStructure.utilities) * scalingFactor / 2;

    // 2. Variable costs are calculated for the period
    const bookingCommission = (baseRevenue * 1_000_000) * opexStructure.booking;
    const consumablesCost = totalRoomNights * opexStructure.consumables;

    let totalOpexInRub = fixedCosts + bookingCommission + consumablesCost;
    
    // Apply general OPEX escalation
    if (year > 2025) {
        totalOpexInRub *= Math.pow(1 + opexCAGR / 100, year - 2025);
    }
    
    return totalOpexInRub / 1_000_000; // Convert final amount to millions
  }

  /**
   * Add extra revenue streams to a period's cash flow
   */
  static applyExtras(revenue: number, opex: number, units: number, scenario: Scenario): { revenue: number, opex: number } {
    if (units === 0) {
      return { revenue, opex };
    }

    const enabledServices = scenario.params.extraRevenueServices || [];
    const scalingFactor = units / 10; // All revenue data is based on a 10-unit setup
    
    enabledServices.forEach(serviceId => {
      const config = EXTRA_REVENUES[serviceId];
      if (config) {
        // Scale revenue based on the number of units, divide by 2 for half-year period
        // NOTE: This is a simplification. A more complex model would apply seasonality to extras too.
        const extraRevenue = (config.annualRevenue * scalingFactor * 0.5) / 1_000_000; // In millions
        const extraOpex = extraRevenue * (1 - config.margin);
        revenue += extraRevenue;
        opex += extraOpex;
      }
    });

    return { revenue, opex };
  }

  /**
   * Derive KPIs from cash flow data
   */
  static deriveKPIs(cashFlow: CashFlowPeriod[], totalInvestment: number): KPIResult {
    const paybackIndex = cashFlow.findIndex(period => period.cumulativeCf >= 0);
    
    let paybackPeriod: number | null = null;
    if (paybackIndex !== -1) {
      if (paybackIndex === 0) {
        const firstPeriod = cashFlow[0];
        const investmentInPeriod = firstPeriod.capex;
        paybackPeriod = (investmentInPeriod / firstPeriod.netCf) * 1.0; // Duration is 1 year
      } else {
        const lastNegativePeriod = cashFlow[paybackIndex - 1];
        const paybackPeriodData = cashFlow[paybackIndex];
        const cfToCover = Math.abs(lastNegativePeriod.cumulativeCf);
        const netCfInPaybackPeriod = paybackPeriodData.netCf;
        
        const yearsBefore = 1 + (paybackIndex - 1) * 0.5; // 1 year for 2025, plus 0.5 for each subsequent period
        const fractionOfPeriod = netCfInPaybackPeriod > 0 ? cfToCover / netCfInPaybackPeriod : 0;
        const periodDuration = 0.5; // All periods after the first are 0.5 years

        paybackPeriod = yearsBefore + (fractionOfPeriod * periodDuration);
      }
    }

    const finalCf = cashFlow[cashFlow.length - 1]?.cumulativeCf || 0;
    const irr = this.calculateIRR(totalInvestment, finalCf, cashFlow.length * 0.5);
    const npv = this.calculateNPV(cashFlow, 0.15);
    return {
      paybackPeriod,
      irr,
      npv,
      totalInvestment,
      finalCumulativeCf: finalCf
    };
  }

  /**
   * Calculate IRR (simplified)
   */
  static calculateIRR(investment: number, finalValue: number, years: number): number {
    if (investment <= 0 || years <= 0) return 0;
    return Math.pow(finalValue / investment, 1 / years) - 1;
  }

  /**
   * Calculate NPV
   */
  static calculateNPV(cashFlow: CashFlowPeriod[], discountRate: number): number {
    return cashFlow.reduce((npv, period, index) => {
      const discountFactor = Math.pow(1 + discountRate, index * 0.5);
      return npv + period.netCf / discountFactor;
    }, 0);
  }
} 