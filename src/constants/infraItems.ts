/**
 * Infrastructure items and their costs
 * Based on the CAPEX breakdown from the project documentation
 */
export interface InfraItem {
  cost: number;
  optional: boolean;
  description?: string;
}

export const INFRA_ITEMS: Record<string, InfraItem> = {
  well: {
    cost: 0.25,
    optional: true,
    description: 'Скважина 100 м + насосный узел'
  },
  waterTower: {
    cost: 0.62,
    optional: true,
    description: 'Водонапорная башня 10–15 м³'
  },
  los: {
    cost: 0.44,
    optional: true,
    description: 'ЛОС «Биосфера-50» (до 50 чел)'
  },
  ktp: {
    cost: 0.90,
    optional: true,
    description: 'КТП-160 кВА + кабель 0,4 кВ'
  },
  pool: {
    cost: 2.10,
    optional: true,
    description: 'Открытый бетонный бассейн 8 × 4 м'
  },
  spa: {
    cost: 1.50,
    optional: true,
    description: 'Баня/SPA 28 м²'
  },
  reception: {
    cost: 2.60,
    optional: false,
    description: 'Ресепшен + мини-кухня 60 м²'
  },
  serviceBlock: {
    cost: 0.75,
    optional: false,
    description: 'Сервис-блок (прачечная + склад) 30 м²'
  },
  landscaping: {
    cost: 4.00,
    optional: false,
    description: 'Благоустройство территории'
  },
  it: {
    cost: 0.90,
    optional: false,
    description: 'IT & автоматизация'
  }
};

/**
 * Get all infrastructure items
 * @returns Array of infrastructure item names
 */
export function getInfraItems(): string[] {
  return Object.keys(INFRA_ITEMS);
}

/**
 * Get optional infrastructure items only
 * @returns Array of optional infrastructure item names
 */
export function getOptionalInfraItems(): string[] {
  return Object.keys(INFRA_ITEMS).filter(key => INFRA_ITEMS[key].optional);
}

/**
 * Get required infrastructure items only
 * @returns Array of required infrastructure item names
 */
export function getRequiredInfraItems(): string[] {
  return Object.keys(INFRA_ITEMS).filter(key => !INFRA_ITEMS[key].optional);
}

/**
 * Get cost for a specific infrastructure item
 * @param itemName — Infrastructure item name
 * @returns Cost in millions RUB
 */
export function getInfraItemCost(itemName: string): number {
  return INFRA_ITEMS[itemName]?.cost || 0;
}

/**
 * Check if infrastructure item is optional
 * @param itemName — Infrastructure item name
 * @returns True if optional, false if required
 */
export function isInfraItemOptional(itemName: string): boolean {
  return INFRA_ITEMS[itemName]?.optional || false;
}

/**
 * Calculate total cost for selected infrastructure items
 * @param selectedItems — Array of selected infrastructure item names
 * @returns Total cost in millions RUB
 */
export function calculateInfraCost(selectedItems: string[]): number {
  return selectedItems.reduce((total, itemName) => {
    return total + getInfraItemCost(itemName);
  }, 0);
} 