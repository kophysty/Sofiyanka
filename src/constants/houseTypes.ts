/**
 * House types and their tier-based pricing
 * Based on the CAPEX breakdown from the project documentation
 */
import { HouseType, HouseTier } from '../models/House';

export interface HouseTypeConfig {
  cost: number;
  features: string[];
}

export interface HouseTierConfig {
  comfort: HouseTypeConfig;
  premium_base: HouseTypeConfig;
}

export const HOUSE_TYPES: Record<HouseType, HouseTierConfig> = {
  'Модульный EasyFab (27 м²)': {
    comfort: {
      cost: 2.3,
      features: ['basic_furniture', 'heating', 'electricity', 'premium_finishing']
    },
    premium_base: {
      cost: 2.8,
      features: ['basic_furniture', 'heating', 'electricity', 'premium_finishing', 'luxury_amenities']
    }
  },
  'A-Frame (39 м²)': {
    comfort: {
      cost: 3.0,
      features: ['basic_furniture', 'heating', 'electricity', 'unique_design', 'premium_finishing']
    },
    premium_base: {
      cost: 3.5,
      features: ['basic_furniture', 'heating', 'electricity', 'unique_design', 'premium_finishing', 'luxury_amenities']
    }
  },
  'Family-suite (44 м²)': {
    comfort: {
      cost: 3.5,
      features: ['basic_furniture', 'heating', 'electricity', 'family_size', 'premium_finishing']
    },
    premium_base: {
      cost: 4.0,
      features: ['basic_furniture', 'heating', 'electricity', 'family_size', 'premium_finishing', 'luxury_amenities']
    }
  }
};

/**
 * Get available house types
 * @returns Array of house type names
 */
export function getHouseTypes(): HouseType[] {
  return Object.keys(HOUSE_TYPES) as HouseType[];
}

/**
 * Get available tiers for a house type
 * @param houseType — House type
 * @returns Array of tier names
 */
export function getTiersForType(houseType: HouseType): HouseTier[] {
  return Object.keys(HOUSE_TYPES[houseType] || {}) as HouseTier[];
}

/**
 * Get cost for a specific house type and tier
 * @param houseType — House type
 * @param tier — Tier level
 * @returns Cost in millions RUB
 */
export function getHouseCost(houseType: HouseType, tier: HouseTier): number {
  return HOUSE_TYPES[houseType]?.[tier]?.cost || 0;
}

/**
 * Get features for a specific house type and tier
 * @param houseType — House type
 * @param tier — Tier level
 * @returns Array of feature names
 */
export function getHouseFeatures(houseType: HouseType, tier: HouseTier): string[] {
  return HOUSE_TYPES[houseType]?.[tier]?.features || [];
} 