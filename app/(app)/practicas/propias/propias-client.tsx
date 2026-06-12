'use client';

import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/api/client';
import type { Practice } from '@/lib/api/types';
import { cn } from '@/lib/cn';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { Building2, Search } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

function apiError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const msg = err.response?.data?.message;
    if (Array.isArray(msg)) return msg.join('. ');
    if (typeof msg === 'string') return msg;
  }
  return 'Error al guardar';
}

function PracticeRow({ practice }: { practice: Practice }) {
  const [isElaborated, setIsElaborated] = useState(practice.isElaborated);

  const mutation = useMutation({
    mutationFn: async (value: boolean) => {
      await apiClient.patch(`/practices/${practice.id}`, { isElaborated: value });
      return value;
    },
    onSuccess: (value) => setIsElaborated(value),
    onError: (err) => toast.error(apiError(err)),
  });

  return (
    <tr
      className={cn(
        'border-[var(--color-border)] border-b last:border-b-0 transition-colors',
        isElaborated ? 'bg-[var(--color-success-soft)]/30' : 'hover:bg-[var(--color-bg-subtle)]',
      )}
    >
      <td className="px-4 py-3 text-center">
        <button
          type="button"
          role="switch"
          aria-checked={isElaborated}
          onClick={() => !mutation.isPending && mutation.mutate(!isElaborated)}
          disabled={mutation.isPending}
          className={cn(
            'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-60',
            isElaborated ? 'bg-[var(--color-success)]' : 'bg-[var(--color-border-strong)]',
          )}
        >
          <span
            className={cn(
              'pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-150',
              isElaborated ? 'translate-x-4' : 'translate-x-0',
            )}
          />
        </button>
      </td>
      <td className="px-4 py-3 font-mono text-[var(--color-fg-muted)] text-xs tabular-nums">
        {practice.nbuCode}
      </td>
      <td className="px-4 py-3 text-[var(--color-fg)] text-sm">
        {practice.name}
        {practice.shortName && (
          <span className="ml-1.5 text-[var(--color-fg-subtle)] text-xs">({practice.shortName})</span>
        )}
      </td>
      <td className="px-4 py-3 text-[var(--color-fg-muted)] text-xs">{practice.section ?? '—'}</td>
      <td className="px-4 py-3">
        {isElaborated ? (
          <span className="inline-flex items-center gap-1 rounded-md border border-[var(--color-success)]/15 bg-[var(--color-success-soft)] px-2 py-0.5 font-medium text-[10px] text-[var(--color-success)] uppercase tracking-wide">
            <Building2 className="h-2.5 w-2.5" strokeWidth={2} />
            Propia
          </span>
        ) : (
          <span className="inline-flex items-center rounded-md border border-[var(--color-fg-subtle)]/15 bg-[var(--color-bg-subtle)] px-2 py-0.5 font-medium text-[10px] text-[var(--color-fg-muted)] uppercase tracking-wide">
            Derivada
          </span>
        )}
      </td>
    </tr>
  );
}

type Props = { practices: Practice[]; total: number; q: string };

export function PropiasClient({ practices, total, q: initialQ }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState(initialQ);
  const isInitial = useRef(true);

  useEffect(() => {
    if (isInitial.current) { isInitial.current = false; return; }
    const t = setTimeout(() => {
      const next = new URLSearchParams();
      if (q) next.set('q', q);
      // reset to page 1 on search change
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    }, 300);
    return () => clearTimeout(t);
  }, [q, router, pathname]);

  const propias = practices.filter((p) => p.isElaborated).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[260px] flex-1">
          <Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-[var(--color-fg-subtle)]" strokeWidth={2} />
          <Input
            placeholder="Buscar por NBU o nombre…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2 rounded-md border border-[var(--color-success)]/20 bg-[var(--color-success-soft)] px-3 py-1.5">
          <Building2 className="h-3.5 w-3.5 text-[var(--color-success)]" strokeWidth={2} />
          <span className="font-medium text-[var(--color-success)] text-sm">
            {propias} propia{propias !== 1 ? 's' : ''} en esta página
          </span>
          <span className="text-[var(--color-fg-subtle)] text-xs">· {total} total</span>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] shadow-[var(--shadow-xs)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-[var(--color-border)] border-b bg-[var(--color-bg-subtle)] text-[10px] text-[var(--color-fg-muted)] uppercase tracking-wide">
              <th className="px-4 py-2.5 text-center font-medium">Elaborada</th>
              <th className="px-4 py-2.5 text-left font-medium">NBU</th>
              <th className="px-4 py-2.5 text-left font-medium">Práctica</th>
              <th className="px-4 py-2.5 text-left font-medium">Sección</th>
              <th className="px-4 py-2.5 text-left font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {practices.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[var(--color-fg-subtle)] text-sm">
                  {q ? `Sin resultados para "${q}"` : 'No hay prácticas cargadas.'}
                </td>
              </tr>
            ) : (
              practices.map((p) => <PracticeRow key={p.id} practice={p} />)
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
