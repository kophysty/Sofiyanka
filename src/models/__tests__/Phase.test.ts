import { Phase } from '../Phase';
import { House } from '../House';

const mockHouseTypes = {
  'A-Frame (39 м²)': {
    comfort: { cost: 3.0, features: [] }
  }
};

describe('Phase model', () => {
  it('should create a phase with correct properties', () => {
    const phase = new Phase('p1', 'Phase I', new Date('2025-01-01'), [], 5);
    expect(phase.id).toBe('p1');
    expect(phase.name).toBe('Phase I');
    expect(phase.capex).toBe(5);
    expect(phase.houses).toEqual([]);
  });

  it('should calculate total units', () => {
    const houses = [new House('h1', 'A-Frame (39 м²)', 'comfort', 2), new House('h2', 'A-Frame (39 м²)', 'comfort', 3)];
    const phase = new Phase('p1', 'Phase I', new Date('2025-01-01'), houses, 5);
    expect(phase.getTotalUnits()).toBe(5);
  });

  it('should calculate total capex', () => {
    const houses = [new House('h1', 'A-Frame (39 м²)', 'comfort', 2)];
    const phase = new Phase('p1', 'Phase I', new Date('2025-01-01'), houses, 5);
    expect(phase.getTotalCapex(mockHouseTypes)).toBe(2 * 3.0 + 5);
  });

  it('should return default duration', () => {
    const phase = new Phase('p1', 'Phase I', new Date('2025-01-01'));
    expect(phase.getDuration()).toBe(6);
  });

  it('should calculate end date', () => {
    const phase = new Phase('p1', 'Phase I', new Date('2025-01-01'));
    const endDate = phase.getEndDate();
    expect(endDate.getMonth() - phase.startDate.getMonth()).toBe(6);
  });
}); 