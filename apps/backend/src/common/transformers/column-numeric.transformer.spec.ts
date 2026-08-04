import { ColumnNumericTransformer, columnNumericTransformer } from './column-numeric.transformer';

describe('ColumnNumericTransformer', () => {
  const transformer = new ColumnNumericTransformer();

  describe('to (entity -> database)', () => {
    it('passes numbers through untouched', () => {
      expect(transformer.to(21)).toBe(21);
      expect(transformer.to(33.5)).toBe(33.5);
      expect(transformer.to(0)).toBe(0);
    });

    it('passes null through', () => {
      expect(transformer.to(null)).toBeNull();
    });
  });

  describe('from (database -> entity)', () => {
    it('parses the string the driver returns into a number', () => {
      expect(transformer.from('21.00')).toBe(21);
      expect(transformer.from('33.50')).toBe(33.5);
      expect(transformer.from('0.01')).toBe(0.01);
    });

    it('round-trips the widest decimal(10,2) value', () => {
      expect(transformer.from('99999999.99')).toBe(99999999.99);
    });

    it('returns null for null and undefined', () => {
      expect(transformer.from(null)).toBeNull();
      expect(transformer.from(undefined as unknown as string)).toBeNull();
    });
  });

  it('exposes a shared instance', () => {
    expect(columnNumericTransformer).toBeInstanceOf(ColumnNumericTransformer);
  });
});
