/**
 * Configuration for extra revenue streams
 * All revenue figures are based on a 10-unit glamping setup.
 */
export interface ExtraRevenueConfig {
  name: string;
  annualRevenue: number; // Annual revenue for a 10-unit setup, in RUB
  margin: number;
}

export const EXTRA_REVENUES: Record<string, ExtraRevenueConfig> = {
  'bath_complex': {
    name: 'Приватная русская баня',
    annualRevenue: 4200000,
    margin: 0.70
  },
  'pool': {
    name: 'Тёплый бассейн (day-pass)',
    annualRevenue: 1700000,
    margin: 0.60
  },
  'bbq_kit': {
    name: 'BBQ-kit',
    annualRevenue: 1000000,
    margin: 0.50
  },
  'breakfast': {
    name: 'Завтраки-to-door',
    annualRevenue: 2400000,
    margin: 0.35
  },
  'market': {
    name: 'Мини-маркет / мини-бар',
    annualRevenue: 1300000,
    margin: 0.40
  },
  'rentals': {
    name: 'Велосипеды / SUP / снегоступы',
    annualRevenue: 500000,
    margin: 0.50
  },
  'photoshoot': {
    name: 'Профессиональная фотосессия',
    annualRevenue: 250000,
    margin: 0.80
  },
  'corp_events': {
    name: 'Корпоративы / аренда комплекса',
    annualRevenue: 600000,
    margin: 0.70
  },
  'excursions': {
    name: 'Экскурсионные пакеты',
    annualRevenue: 3000000,
    margin: 0.20
  }
}; 