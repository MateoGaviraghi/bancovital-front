import { cn } from '@/lib/cn';
import { Money } from '@/lib/money';

type Props = {
  value: string | number | null | undefined;
  emphasis?: boolean;
  className?: string;
};

export function MoneyDisplay({ value, emphasis = false, className }: Props) {
  if (value == null || value === '') {
    return <span className={cn('text-[var(--color-fg-subtle)]', className)}>—</span>;
  }
  return (
    <span className={cn('tabular font-mono', emphasis && 'font-semibold', className)}>
      {Money.toDisplay(value)}
    </span>
  );
}
