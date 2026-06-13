'use client';

import { cn } from '@/lib/cn';
import { Building2, Layers } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function SuperSidebar() {
  const pathname = usePathname();
  const labsActive = pathname === '/super/labs' || pathname.startsWith('/super/labs/');
  const plansActive = pathname === '/super/plans' || pathname.startsWith('/super/plans/');

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-[var(--color-border)] border-r bg-[var(--color-bg-elevated)] md:flex">
      <div className="flex h-14 items-center gap-2.5 border-[var(--color-border)] border-b px-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
          <Building2 className="h-4 w-4" strokeWidth={2} />
        </div>
        <div className="min-w-0 leading-tight">
          <p className="truncate font-semibold text-[var(--color-fg)] text-sm">Super Admin</p>
          <p className="truncate text-[10px] text-[var(--color-fg-subtle)] uppercase tracking-wide">
            Panel global
          </p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-4">
        <p className="px-2 pb-1 font-medium text-[10px] text-[var(--color-fg-subtle)] uppercase tracking-wide">
          Administración
        </p>
        <Link
          href="/super/labs"
          className={cn(
            'flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors',
            labsActive
              ? 'bg-[var(--color-primary-soft)] font-medium text-[var(--color-primary-hover)]'
              : 'text-[var(--color-fg-muted)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-fg)]',
          )}
        >
          <Building2 className="h-4 w-4 shrink-0" strokeWidth={2} />
          <span className="truncate">Laboratorios</span>
        </Link>
        <Link
          href="/super/plans"
          className={cn(
            'flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors',
            plansActive
              ? 'bg-[var(--color-primary-soft)] font-medium text-[var(--color-primary-hover)]'
              : 'text-[var(--color-fg-muted)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-fg)]',
          )}
        >
          <Layers className="h-4 w-4 shrink-0" strokeWidth={2} />
          <span className="truncate">Planes</span>
        </Link>
      </nav>

      <div className="border-[var(--color-border)] border-t px-4 py-3">
        <p className="text-[10px] text-[var(--color-fg-subtle)]">v0.1 · Super</p>
      </div>
    </aside>
  );
}
