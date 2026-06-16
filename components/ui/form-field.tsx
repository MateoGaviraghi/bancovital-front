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
  const errorId = htmlFor && error ? `${htmlFor}-error` : undefined;
  const descriptionId = htmlFor && description && !error ? `${htmlFor}-description` : undefined;
  const describedBy = errorId ?? descriptionId;

  // Asocia el mensaje de error/ayuda con el control para lectores de pantalla.
  const child = React.isValidElement(children)
    ? (children as React.ReactElement<Record<string, unknown>>)
    : null;
  const control =
    child && (describedBy || error)
      ? React.cloneElement(child, {
          'aria-describedby':
            [child.props['aria-describedby'] as string | undefined, describedBy]
              .filter(Boolean)
              .join(' ') || undefined,
          'aria-invalid':
            (child.props['aria-invalid'] as boolean | undefined) ?? (error ? true : undefined),
        })
      : children;

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <Label htmlFor={htmlFor}>
          {label}
          {required && <span className="ml-0.5 text-[var(--color-danger)]">*</span>}
        </Label>
      )}
      {control}
      {description && !error && (
        <p id={descriptionId} className="text-xs text-[var(--color-fg-muted)]">
          {description}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-xs font-medium text-[var(--color-danger)]">
          {error}
        </p>
      )}
    </div>
  );
}
