/**
 * HouseType — тип дома
 * HouseTier — категория (эконом, базовая, премиум)
 */
export type HouseType = 'Модульный EasyFab (27 м²)' | 'A-Frame (39 м²)' | 'Family-suite (44 м²)';
export type HouseTier = 'comfort' | 'premium_base';

/**
 * House model representing a single accommodation unit
 */
export class House {
  id: string;
  type: HouseType;
  tier: HouseTier;
  qty: number;

  constructor(id: string, type: HouseType, tier: HouseTier, qty: number = 1) {
    this.id = id;
    this.type = type;
    this.tier = tier;
    this.qty = qty;
  }

  /**
   * Calculate total cost for this house configuration
   * @param houseTypesLookup — lookup table for house types and tiers
   * @returns Total cost in millions RUB
   */
  cost(houseTypesLookup: Record<string, any>): number {
    const baseCost = houseTypesLookup?.[this.type]?.[this.tier]?.cost || 0;
    return baseCost * this.qty;
  }

  /**
   * Get features available for this house configuration
   * @param houseTypesLookup — lookup table for house types and tiers
   * @returns Array of feature names
   */
  getFeatures(houseTypesLookup: Record<string, any>): string[] {
    return houseTypesLookup?.[this.type]?.[this.tier]?.features || [];
  }

  /**
   * Create a copy of this house with modified properties
   * @param changes — Properties to change
   * @returns New house instance
   */
  clone(changes: Partial<House> = {}): House {
    return new House(
      changes.id ?? this.id,
      changes.type ?? this.type,
      changes.tier ?? this.tier,
      changes.qty ?? this.qty
    );
  }
} 