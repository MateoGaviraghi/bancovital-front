import { cn } from '@/lib/cn';
import { Slot } from '@radix-ui/react-slot';
import { type VariantProps, cva } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import * as React from 'react';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium text-sm tracking-[-0.01em] transition-[background-color,border-color,box-shadow,transform,color] duration-[var(--duration-fast)] ease-[var(--ease-out-app)] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)] disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-[var(--shadow-button)] hover:bg-[var(--color-primary-hover)] hover:shadow-[var(--shadow-button-hover)] active:shadow-none',
        destructive:
          'bg-[var(--color-danger)] text-[var(--color-danger-foreground)] shadow-[var(--shadow-button)] hover:bg-[var(--color-danger-hover)] hover:shadow-[var(--shadow-button-hover)] active:shadow-none',
        outline:
          'border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] text-[var(--color-fg)] shadow-[var(--shadow-xs)] hover:border-[var(--color-border-emphasis)] hover:bg-[var(--color-bg-hover)]',
        secondary:
          'border border-[var(--color-border)] bg-[var(--color-bg-subtle)] text-[var(--color-fg)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-bg-hover)]',
        ghost:
          'text-[var(--color-fg-muted)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-fg)]',
        link: 'text-[var(--color-primary)] underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-6',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean; loading?: boolean };

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      type,
      loading = false,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          aria-disabled={disabled || undefined}
          {...props}
        >
          {children}
        </Slot>
      );
    }
    return (
      <button
        type={type ?? 'button'}
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
        {children}
      </button>
    );
  },
);
Button.displayName = 'Button';

export { buttonVariants };
