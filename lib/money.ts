import Decimal from 'decimal.js';

Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

export const Money = {
  zero: '0.00',

  of(value: string | number | null | undefined): Decimal | null {
    if (value == null || value === '') return null;
    return new Decimal(value);
  },

  toWire(d: Decimal): string {
    return d.toFixed(2);
  },

  /** Display in Argentine currency format: "$ 12.450,00". */
  toDisplay(value: string | number | null | undefined): string {
    if (value == null || value === '') return '—';
    const d = new Decimal(value);
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(d.toNumber());
  },

  add(...values: (string | Decimal)[]): string {
    return values.reduce<Decimal>((acc, v) => acc.add(new Decimal(v)), new Decimal(0)).toFixed(2);
  },
};
