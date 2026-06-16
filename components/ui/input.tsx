import { cn } from '@/lib/cn';
import * as React from 'react';

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => (
  <input
    type={type}
    className={cn(
      'flex h-9 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 py-1 text-sm text-[var(--color-fg)] shadow-[var(--shadow-inset)] outline-none transition-[border-color,box-shadow] duration-[var(--duration-fast)] ease-[var(--ease-out-app)] placeholder:text-[var(--color-fg-subtle)] hover:border-[var(--color-border-strong)] focus-visible:border-[var(--color-primary)] focus-visible:shadow-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-soft)] aria-[invalid=true]:border-[var(--color-danger)] aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-[var(--color-danger-soft)] disabled:cursor-not-allowed disabled:opacity-50',
      className,
    )}
    ref={ref}
    {...props}
  />
));
Input.displayName = 'Input';
