import { Label } from '@/components/ui/label';
import { cn } from '@/lib/cn';
import * as React from 'react';

type FormFieldProps = {
  label?: React.ReactNode;
  htmlFor?: string;
  description?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
};

export function FormField({
  label,
  htmlFor,
  description,
  error,
  required,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <Label htmlFor={htmlFor}>
          {label}
          {required && <span className="ml-0.5 text-[var(--color-danger)]">*</span>}
        </Label>
      )}
      {children}
      {description && !error && (
        <p className="text-xs text-[var(--color-fg-muted)]">{description}</p>
      )}
      {error && <p className="text-xs font-medium text-[var(--color-danger)]">{error}</p>}
    </div>
  );
}
