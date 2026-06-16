import { cn } from '@/lib/cn';
import * as React from 'react';

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    className={cn(
      'flex min-h-24 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 py-2 text-sm text-[var(--color-fg)] shadow-[var(--shadow-inset)] outline-none transition-[border-color,box-shadow] duration-[var(--duration-fast)] ease-[var(--ease-out-app)] placeholder:text-[var(--color-fg-subtle)] hover:border-[var(--color-border-strong)] focus-visible:border-[var(--color-primary)] focus-visible:shadow-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-soft)] aria-[invalid=true]:border-[var(--color-danger)] aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-[var(--color-danger-soft)] disabled:cursor-not-allowed disabled:opacity-50',
      className,
    )}
    ref={ref}
    {...props}
  />
));
Textarea.displayName = 'Textarea';
