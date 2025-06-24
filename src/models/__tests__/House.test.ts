import { House, HouseType, HouseTier } from '../House';

const mockHouseTypes = {
  'Модульный EasyFab (27 м²)': {
    comfort: { cost: 2.3, features: ['basic'] },
    premium_base: { cost: 2.8, features: ['basic', 'premium'] }
  }
};

describe('House model', () => {
  it('should create a house with correct properties', () => {
    const house = new House('h1', 'Модульный EasyFab (27 м²)', 'comfort', 2);
    expect(house.id).toBe('h1');
    expect(house.type).toBe('Модульный EasyFab (27 м²)');
    expect(house.tier).toBe('comfort');
    expect(house.qty).toBe(2);
  });

  it('should calculate cost correctly', () => {
    const house = new House('h1', 'Модульный EasyFab (27 м²)', 'comfort', 2);
    expect(house.cost(mockHouseTypes)).toBe(4.6);
  });

  it('should return correct features', () => {
    const house = new House('h1', 'Модульный EasyFab (27 м²)', 'premium_base', 1);
    expect(house.getFeatures(mockHouseTypes)).toEqual(['basic', 'premium']);
  });

  it('should clone with changes', () => {
    const house = new House('h1', 'Модульный EasyFab (27 м²)', 'comfort', 2);
    const clone = house.clone({ tier: 'premium_base', qty: 1 });
    expect(clone.id).toBe('h1');
    expect(clone.type).toBe('Модульный EasyFab (27 м²)');
    expect(clone.tier).toBe('premium_base');
    expect(clone.qty).toBe(1);
  });
}); 