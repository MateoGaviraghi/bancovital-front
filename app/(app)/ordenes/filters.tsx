'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/cn';
import { X } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

type Insurer = { id: number; name: string };

const STATUS_OPTIONS = [
  { value: 'borrador', label: 'Borrador' },
  { value: 'confirmada', label: 'Confirmada' },
  { value: 'en_proceso', label: 'En proceso' },
  { value: 'resultados_cargados', label: 'Resultados' },
  { value: 'emitida', label: 'Emitida' },
  { value: 'entregada', label: 'Entregada' },
  { value: 'anulada', label: 'Anulada' },
];

export function OrdersFilters({ insurers }: { insurers: Insurer[] }) {
  const router = useRouter();
  const params = useSearchParams();

  const [search, setSearch] = useState(params.get('q') ?? '');
  const [statuses, setStatuses] = useState<string[]>(() => params.getAll('status'));
  const [insurer, setInsurer] = useState(params.get('insurer') ?? '');
  const [from, setFrom] = useState(params.get('from') ?? '');
  const [to, setTo] = useState(params.get('to') ?? '');
  const isInitial = useRef(true);

  const hasFilters = useMemo(
    () => Boolean(search || statuses.length || insurer || from || to),
    [search, statuses, insurer, from, to],
  );

  useEffect(() => {
    if (isInitial.current) {
      isInitial.current = false;
      return;
    }
    const id = setTimeout(() => {
      const next = new URLSearchParams();
      if (search) next.set('q', search);
      for (const s of statuses) next.append('status', s);
      if (insurer) next.set('insurer', insurer);
      if (from) next.set('from', from);
      if (to) next.set('to', to);
      const qs = next.toString();
      router.replace(qs ? `/ordenes?${qs}` : '/ordenes');
    }, 250);
    return () => clearTimeout(id);
  }, [search, statuses, insurer, from, to, router]);

  function toggleStatus(value: string) {
    setStatuses((prev) =>
      prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value],
    );
  }

  function clearAll() {
    setSearch('');
    setStatuses([]);
    setInsurer('');
    setFrom('');
    setTo('');
  }

  const selectCls =
    'h-9 w-full rounded-md border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] px-3 pr-8 text-[var(--color-fg)] text-sm shadow-[var(--shadow-xs)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-soft)]';

  return (
    <div className="mb-4 space-y-2">
      <div className="flex flex-col gap-2 lg:flex-row lg:flex-wrap lg:items-center">
        <div className="min-w-[240px] flex-1">
          <Input
            placeholder="Buscar por protocolo, DNI, paciente…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          value={insurer}
          onChange={(e) => setInsurer(e.target.value)}
          className={`${selectCls} lg:w-[230px]`}
          aria-label="Filtrar por obra social"
        >
          <option value="">Todas las obras sociales</option>
          {insurers.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <Input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            aria-label="Desde"
            className="w-full lg:w-[150px]"
          />
          <Input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            aria-label="Hasta"
            className="w-full lg:w-[150px]"
          />
        </div>
        {hasFilters && (
          <Button variant="outline" size="sm" onClick={clearAll}>
            <X className="h-3.5 w-3.5" strokeWidth={2} />
            Limpiar
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[var(--color-fg-muted)] text-xs">Estado:</span>
        {STATUS_OPTIONS.map((o) => {
          const active = statuses.includes(o.value);
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => toggleStatus(o.value)}
              className={cn(
                'inline-flex items-center rounded-md border px-2.5 py-1 text-xs transition-colors',
                active
                  ? 'border-[var(--color-primary)]/30 bg-[var(--color-primary-soft)] font-medium text-[var(--color-primary)]'
                  : 'border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-fg-muted)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-fg)]',
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
