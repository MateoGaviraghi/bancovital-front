'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const STATUS_OPTIONS = [
  { value: '', label: 'Todas' },
  { value: 'active', label: 'Solo activas' },
  { value: 'inactive', label: 'Solo inactivas' },
];

const ELABORATED_OPTIONS = [
  { value: '', label: 'Propias y derivadas' },
  { value: 'true', label: 'Solo propias' },
  { value: 'false', label: 'Solo derivadas' },
];

const PAGE_SIZE_OPTIONS = [25, 50, 100];

const selectCls =
  'h-9 rounded-md border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] px-3 pr-8 text-[var(--color-fg)] text-sm shadow-[var(--shadow-xs)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-soft)]';

export function PracticasFilters({ sections }: { sections: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const [q, setQ] = useState(sp.get('q') ?? '');
  const [section, setSection] = useState(sp.get('section') ?? '');
  const [status, setStatus] = useState(sp.get('status') ?? '');
  const [elaborated, setElaborated] = useState(sp.get('elaborated') ?? '');
  const [pageSize, setPageSize] = useState(sp.get('pageSize') ?? '50');
  const isInitial = useRef(true);

  const hasFilters = Boolean(q || section || status || elaborated);

  useEffect(() => {
    if (isInitial.current) {
      isInitial.current = false;
      return;
    }
    const t = setTimeout(() => {
      const next = new URLSearchParams();
      if (q) next.set('q', q);
      if (section) next.set('section', section);
      if (status) next.set('status', status);
      if (elaborated) next.set('elaborated', elaborated);
      if (pageSize !== '50') next.set('pageSize', pageSize);
      // page intentionally omitted — filter changes reset to page 1
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    }, 300);
    return () => clearTimeout(t);
  }, [q, section, status, elaborated, pageSize, router, pathname]);

  function clearAll() {
    setQ('');
    setSection('');
    setStatus('');
    setElaborated('');
    setPageSize('50');
  }

  return (
    <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:flex-wrap lg:items-center">
      <div className="relative min-w-[240px] flex-1">
        <Search
          className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-[var(--color-fg-subtle)]"
          strokeWidth={2}
        />
        <Input
          placeholder="Buscar por NBU o nombre…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-9"
        />
      </div>

      <select
        value={section}
        onChange={(e) => setSection(e.target.value)}
        className={`${selectCls} lg:w-[200px]`}
        aria-label="Filtrar por sección"
      >
        <option value="">Todas las secciones</option>
        {sections.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className={`${selectCls} lg:w-[160px]`}
        aria-label="Filtrar por estado"
      >
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      <select
        value={elaborated}
        onChange={(e) => setElaborated(e.target.value)}
        className={`${selectCls} lg:w-[180px]`}
        aria-label="Filtrar por elaboración"
      >
        {ELABORATED_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      <select
        value={pageSize}
        onChange={(e) => setPageSize(e.target.value)}
        className={`${selectCls} lg:w-[120px]`}
        aria-label="Resultados por página"
      >
        {PAGE_SIZE_OPTIONS.map((n) => (
          <option key={n} value={String(n)}>
            {n} por pág.
          </option>
        ))}
      </select>

      {hasFilters && (
        <Button variant="outline" size="sm" onClick={clearAll}>
          <X className="h-3.5 w-3.5" strokeWidth={2} />
          Limpiar
        </Button>
      )}
    </div>
  );
}
