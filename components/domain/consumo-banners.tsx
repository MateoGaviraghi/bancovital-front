'use client';

import { apiClient } from '@/lib/api/client';
import { queries } from '@/lib/api/queries';
import type { ConsumoCiclo } from '@/lib/api/types';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, XOctagon } from 'lucide-react';

export function ConsumoBanners() {
  const { data: ciclo } = useQuery<ConsumoCiclo>({
    queryKey: queries.consumo.ciclo(),
    queryFn: () => apiClient.get<ConsumoCiclo>('/consumo').then((r) => r.data),
    staleTime: 60_000,
    retry: false,
  });

  // No plan, no data, or fetch failed: render nothing
  if (!ciclo || !ciclo.plan) return null;

  const pct = ciclo.porcentaje ?? 0;

  if (pct < 80) return null;

  const isOver = pct >= 100;

  if (isOver) {
    return (
      <div
        role="alert"
        className="flex items-start gap-3 border-b border-[var(--color-danger)]/20 bg-[var(--color-danger-soft)] px-6 py-3 text-sm text-[var(--color-danger)]"
        style={{
          animation: 'var(--animation-fade-slide, none)',
        }}
      >
        <XOctagon className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
        <p>
          <span className="font-semibold">Cupo mensual agotado.</span> Las nuevas órdenes se
          registran como excedentes y se facturan aparte.
          {ciclo.excedentes > 0 && (
            <span className="ml-1">
              Excedentes actuales: <span className="font-semibold">{ciclo.excedentes}</span>.
            </span>
          )}
        </p>
      </div>
    );
  }

  // 80–99%
  return (
    <div
      aria-live="polite"
      className="flex items-start gap-3 border-b border-[var(--color-warning)]/20 bg-[var(--color-warning-soft)] px-6 py-3 text-sm text-[var(--color-warning)]"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
      <p>
        Usaste el <span className="font-semibold">{Math.round(pct)}%</span> de tu cupo mensual (
        {ciclo.usadas} de {ciclo.cupoEfectivo ?? '?'} órdenes).
      </p>
    </div>
  );
}
