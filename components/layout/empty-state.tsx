import { cn } from '@/lib/cn';
import type { LucideIcon } from 'lucide-react';

type Props = {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
};

export function EmptyState({ icon: Icon, title, description, action, className }: Props) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] px-6 py-16 text-center',
        className,
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-bg-subtle)] text-[var(--color-fg-subtle)]">
        <Icon className="h-5 w-5" strokeWidth={2} />
      </div>
      <div className="max-w-md">
        <p className="text-sm font-medium text-[var(--color-fg)]">{title}</p>
        {description && <p className="mt-1 text-xs text-[var(--color-fg-muted)]">{description}</p>}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
