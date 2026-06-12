import { cn } from '@/lib/cn';

type Props = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumb?: React.ReactNode;
  className?: string;
};

export function PageHeader({ title, description, actions, breadcrumb, className }: Props) {
  return (
    <header className={cn('mb-6 border-b border-[var(--color-border)] pb-4', className)}>
      {breadcrumb && <div className="mb-2">{breadcrumb}</div>}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-[var(--color-fg)]">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-[var(--color-fg-muted)]">{description}</p>
          )}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
