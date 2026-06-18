import { cn } from '@/lib/cn';
import { type VariantProps, cva } from 'class-variance-authority';
import type * as React from 'react';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-medium text-xs [&_svg]:size-3',
  {
    variants: {
      variant: {
        default:
          'border-[var(--color-primary)]/15 bg-[var(--color-primary-soft)] text-[var(--color-primary)]',
        secondary:
          'border-[var(--color-border)] bg-[var(--color-bg-subtle)] text-[var(--color-fg-muted)]',
        outline: 'border-[var(--color-border-strong)] text-[var(--color-fg)]',
        // Acento de marca Banco Vital — usar con moderación (destacados, no estados).
        accent:
          'border-[var(--color-accent)]/15 bg-[var(--color-accent-soft)] text-[var(--color-accent)]',
        success:
          'border-[var(--color-success)]/15 bg-[var(--color-success-soft)] text-[var(--color-success)]',
        warning:
          'border-[var(--color-warning)]/15 bg-[var(--color-warning-soft)] text-[var(--color-warning)]',
        danger:
          'border-[var(--color-danger)]/15 bg-[var(--color-danger-soft)] text-[var(--color-danger)]',
        info: 'border-[var(--color-info)]/15 bg-[var(--color-info-soft)] text-[var(--color-info)]',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />;
}

export { badgeVariants };
