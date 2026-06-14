'use client';

import { PageHeader } from '@/components/layout/page-header';
import { Pagination } from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { AuditResponse, Laboratorio } from '@/lib/api/types';
import { cn } from '@/lib/cn';
import { ScrollText } from 'lucide-react';
import { useRouter } from 'next/navigation';

const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTH_LABELS = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
];

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const dow = DAY_LABELS[d.getDay()];
  const day = d.getDate();
  const month = MONTH_LABELS[d.getMonth()];
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${dow} ${day} ${month}, ${h}:${m}`;
}

const ALL = '__all__';

type Props = {
  audit: AuditResponse;
  labs: Laboratorio[];
  page: number;
  pageSize: number;
  labId: number | null;
};

export function AuditClient({ audit, labs, page, pageSize, labId }: Props) {
  const router = useRouter();

  function buildHref(p: number): string {
    const params = new URLSearchParams();
    if (p > 1) params.set('page', String(p));
    if (labId != null) params.set('labId', String(labId));
    const qs = params.toString();
    return qs ? `/super/audit?${qs}` : '/super/audit';
  }

  function onLabChange(value: string) {
    const params = new URLSearchParams();
    // Reset to page 1 when the filter changes.
    if (value !== ALL) params.set('labId', value);
    const qs = params.toString();
    router.push(qs ? `/super/audit?${qs}` : '/super/audit');
  }

  const rows = audit.data;

  return (
    <div>
      <PageHeader
        title="Auditoría"
        description={`${audit.total.toLocaleString('es-AR')} ${audit.total === 1 ? 'evento registrado' : 'eventos registrados'}`}
        actions={
          <div className="w-56">
            <Select value={labId != null ? String(labId) : ALL} onValueChange={onLabChange}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los labs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todos los labs</SelectItem>
                {labs.map((lab) => (
                  <SelectItem key={lab.id} value={String(lab.id)}>
                    {lab.shortName ?? lab.legalName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />

      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] px-6 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-bg-subtle)] text-[var(--color-fg-muted)]">
            <ScrollText className="h-6 w-6" strokeWidth={2} />
          </div>
          <div>
            <p className="font-medium text-[var(--color-fg)] text-sm">Sin eventos</p>
            <p className="mt-1 text-[var(--color-fg-muted)] text-xs">
              No hay eventos de auditoría para este filtro.
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] shadow-[var(--shadow-xs)]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-[var(--color-border)] border-b bg-[var(--color-bg-subtle)] text-[10px] text-[var(--color-fg-muted)] uppercase tracking-wide">
                  <th className="px-5 py-2.5 text-left font-medium">Fecha</th>
                  <th className="px-5 py-2.5 text-left font-medium">Laboratorio</th>
                  <th className="px-5 py-2.5 text-left font-medium">Actor</th>
                  <th className="px-5 py-2.5 text-left font-medium">Acción</th>
                  <th className="px-5 py-2.5 text-left font-medium">Entidad</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((e) => (
                  <tr
                    key={String(e.id)}
                    className="border-[var(--color-border)] border-b last:border-b-0 hover:bg-[var(--color-bg-subtle)]"
                  >
                    <td className="tabular whitespace-nowrap px-5 py-3 font-mono text-xs text-[var(--color-fg-muted)]">
                      {formatDateTime(e.createdAt)}
                    </td>
                    <td className="px-5 py-3 text-[var(--color-fg)]">
                      {e.labNombre ?? <span className="text-[var(--color-fg-subtle)]">—</span>}
                    </td>
                    <td className="px-5 py-3 text-[var(--color-fg-muted)]">
                      {e.actorEmail ?? <span className="text-[var(--color-fg-subtle)]">—</span>}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-md border border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-2 py-0.5 font-mono text-[11px] text-[var(--color-fg)]',
                        )}
                      >
                        {e.action}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[var(--color-fg-muted)] text-xs">
                      {e.entity ? (
                        <span className="tabular font-mono">
                          {e.entity}
                          {e.entityId != null && (
                            <span className="text-[var(--color-fg-subtle)]"> #{e.entityId}</span>
                          )}
                        </span>
                      ) : (
                        <span className="text-[var(--color-fg-subtle)]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Pagination page={page} pageSize={pageSize} total={audit.total} buildHref={buildHref} />
    </div>
  );
}
