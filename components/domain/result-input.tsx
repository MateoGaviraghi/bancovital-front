'use client';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/cn';
import {
  type RangeRule,
  type ResultFlag,
  classifyResult,
  formatRangeHint,
} from '@/lib/reference-range';
import { useEffect, useState } from 'react';

type Props = {
  defaultValue?: string;
  unit?: string | null;
  rule: RangeRule | null;
  name: string;
};

const FLAG_STYLE: Record<ResultFlag, string> = {
  normal: 'text-[var(--color-success)]',
  low: 'text-[var(--color-warning)]',
  high: 'text-[var(--color-warning)]',
  critical_low: 'font-semibold text-[var(--color-danger)]',
  critical_high: 'font-semibold text-[var(--color-danger)]',
};

const FLAG_LABEL: Record<ResultFlag, string> = {
  normal: 'Normal',
  low: '↓ Bajo',
  high: '↑ Alto',
  critical_low: '‼ Crítico bajo',
  critical_high: '‼ Crítico alto',
};

export function ResultInput({ defaultValue = '', unit, rule, name }: Props) {
  const [value, setValue] = useState(defaultValue);
  const [flag, setFlag] = useState<ResultFlag | null>(null);

  useEffect(() => {
    if (!value.trim() || !rule) {
      setFlag(null);
      return;
    }
    setFlag(classifyResult(value.replace(',', '.'), rule));
  }, [value, rule]);

  const range = formatRangeHint(rule, unit ?? null);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Input
        name={name}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        inputMode="decimal"
        placeholder="—"
        className="max-w-[140px] text-right font-mono"
      />
      {unit && <span className="text-xs text-[var(--color-fg-muted)]">{unit}</span>}
      {range && (
        <span className="font-mono text-xs text-[var(--color-fg-muted)]">ref. {range}</span>
      )}
      {flag && <span className={cn('ml-auto text-xs', FLAG_STYLE[flag])}>{FLAG_LABEL[flag]}</span>}
    </div>
  );
}
