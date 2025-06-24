import { CalculationService } from '../calcService';
import { Scenario } from '../../models/Scenario';
import { Phase } from '../../models/Phase';
import { House } from '../../models/House';

const mockHouseTypes = {
  'Family-suite (44 м²)': {
    premium_base: { cost: 4.0, features: [] }
  }
};

describe('CalculationService', () => {
  const scenario = new Scenario('s1', 'Test Scenario');
  const phase = new Phase('p1', 'Phase I', new Date('2025-01-01'), [new House('h1', 'Family-suite (44 м²)', 'premium_base', 2)], 5);
  scenario.addPhase(phase);

  it('should build phase timeline', () => {
    const timeline = CalculationService.buildPhaseTimeline(scenario);
    expect(timeline.length).toBe(1);
    expect(timeline[0].phaseId).toBe('p1');
  });

  it('should calculate cash flow', () => {
    const timeline = CalculationService.buildPhaseTimeline(scenario);
    const cashFlow = CalculationService.calculateCashFlow(scenario, timeline);
    expect(Array.isArray(cashFlow)).toBe(true);
    expect(cashFlow.length).toBeGreaterThan(0);
    expect(typeof cashFlow[0].revenue).toBe('number');
  });

  it('should derive KPIs', () => {
    const timeline = CalculationService.buildPhaseTimeline(scenario);
    const cashFlow = CalculationService.calculateCashFlow(scenario, timeline);
    const kpis = CalculationService.deriveKPIs(cashFlow, scenario.getTotalCapex(mockHouseTypes));
    expect(kpis).toHaveProperty('paybackPeriod');
    expect(kpis).toHaveProperty('irr');
    expect(kpis).toHaveProperty('npv');
    expect(kpis).toHaveProperty('totalInvestment');
    expect(kpis).toHaveProperty('finalCumulativeCf');
  });
}); 