'use client';

import { Badge } from '@/components/ui/badge';
import { apiClient } from '@/lib/api/client';
import { queries } from '@/lib/api/queries';
import type { MuestraAgua } from '@/lib/api/types';
import { useQuery } from '@tanstack/react-query';
import { Loader2, TestTube } from 'lucide-react';

const DATE_FMT = new Intl.DateTimeFormat('es-AR', {
  dateStyle: 'short',
  timeZone: 'America/Argentina/Buenos_Aires',
});

export function AnalisisClient() {
  const { data: muestras = [], isLoading } = useQuery({
    queryKey: queries.muestrasAgua.list(),
    queryFn: () => apiClient.get<MuestraAgua[]>('/muestras-agua').then((r) => r.data),
  });

  const conAnalisis = muestras.filter((m) => m.analisisFisicoquimico || m.analisisMicrobiologico);

  if (isLoading) {
    return (
      <div className="mt-12 flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--color-fg-muted)]" strokeWidth={2} />
      </div>
    );
  }

  if (conAnalisis.length === 0) {
    return (
      <div className="mt-6 flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-[var(--color-border-strong)] bg-[var(--color-bg-subtle)] py-16 text-center">
        <TestTube className="h-10 w-10 text-[var(--color-fg-subtle)]" strokeWidth={1.5} />
        <p className="font-medium text-[var(--color-fg)]">Sin análisis solicitados</p>
        <p className="text-sm text-[var(--color-fg-muted)]">
          Los análisis se definen al crear una muestra.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 overflow-x-auto rounded-lg border border-[var(--color-border)]">
      <table className="w-full text-sm">
        <thead className="border-b border-[var(--color-border)] bg-[var(--color-bg-subtle)]">
          <tr>
            <th className="px-4 py-2.5 text-left font-medium text-[var(--color-fg-muted)]">
              Muestra
            </th>
            <th className="px-4 py-2.5 text-left font-medium text-[var(--color-fg-muted)]">
              Solicitante
            </th>
            <th className="px-4 py-2.5 text-left font-medium text-[var(--color-fg-muted)]">Tipo</th>
            <th className="px-4 py-2.5 text-left font-medium text-[var(--color-fg-muted)]">
              Fecha toma
            </th>
            <th className="px-4 py-2.5 text-center font-medium text-[var(--color-fg-muted)]">
              Físico-químico
            </th>
            <th className="px-4 py-2.5 text-center font-medium text-[var(--color-fg-muted)]">
              Microbiológico
            </th>
            <th className="px-4 py-2.5 text-left font-medium text-[var(--color-fg-muted)]">
              Observaciones
            </th>
          </tr>
        </thead>
        <tbody>
          {conAnalisis.map((m) => (
            <tr
              key={m.id}
              className="border-b border-[var(--color-border)] last:border-0 bg-[var(--color-bg-elevated)]"
            >
              <td className="px-4 py-3 tabular font-medium text-[var(--color-fg)]">#{m.id}</td>
              <td className="px-4 py-3 text-[var(--color-fg)]">
                {m.solicitante?.nombreApellido ?? '—'}
              </td>
              <td className="px-4 py-3 text-[var(--color-fg-muted)]">{m.tipoMuestra}</td>
              <td className="px-4 py-3 text-[var(--color-fg-muted)]">
                {DATE_FMT.format(new Date(m.fechaToma))}
              </td>
              <td className="px-4 py-3 text-center">
                <Badge variant={m.analisisFisicoquimico ? 'default' : 'secondary'}>
                  {m.analisisFisicoquimico ? 'Sí' : 'No'}
                </Badge>
              </td>
              <td className="px-4 py-3 text-center">
                <Badge variant={m.analisisMicrobiologico ? 'default' : 'secondary'}>
                  {m.analisisMicrobiologico ? 'Sí' : 'No'}
                </Badge>
              </td>
              <td className="px-4 py-3 text-[var(--color-fg-muted)] max-w-[200px] truncate">
                {m.observaciones || '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
