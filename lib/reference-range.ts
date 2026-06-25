import Decimal from 'decimal.js';

export type RangeRule = {
  sex?: 'F' | 'M' | 'X' | null;
  ageFromYears?: number | null;
  ageToYears?: number | null;
  band: {
    low?: string | null;
    high?: string | null;
    criticalLow?: string | null;
    criticalHigh?: string | null;
  };
  unit?: string;
};

export type ResultFlag = 'normal' | 'low' | 'high' | 'critical_low' | 'critical_high';

export function classifyResult(valueStr: string, rule: RangeRule): ResultFlag {
  if (!valueStr) return 'normal';
  let v: Decimal;
  try {
    v = new Decimal(valueStr);
  } catch {
    return 'normal';
  }
  const { low, high, criticalLow, criticalHigh } = rule.band;

  if (criticalLow && v.lt(criticalLow)) return 'critical_low';
  if (criticalHigh && v.gt(criticalHigh)) return 'critical_high';
  if (low && v.lt(low)) return 'low';
  if (high && v.gt(high)) return 'high';
  return 'normal';
}

function trimDec(v: string): string {
  return v.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
}

export function formatRangeHint(rule: RangeRule | null, unit: string | null): string | null {
  if (!rule) return null;
  const { low, high } = rule.band;
  if (!low && !high) return null;
  return `${low ? trimDec(low) : '−∞'} – ${high ? trimDec(high) : '+∞'}${unit ? ` ${unit}` : ''}`;
}
