import { CreateSedeDialog } from '@/components/domain/create-sede-dialog';
import { SedeRowActions } from '@/components/domain/sede-row-actions';
import { EmptyState } from '@/components/layout/empty-state';
import { PageHeader } from '@/components/layout/page-header';
import { getServerApi } from '@/lib/api/server';
import type { Sede } from '@/lib/api/types';
import { getSessionUser } from '@/lib/auth/session';
import { Lock, MapPin } from 'lucide-react';

export const dynamic = 'force-dynamic';

async function fetchSedes(): Promise<Sede[]> {
  try {
    const api = await getServerApi();
    const { data } = await api.get<Sede[]>('/sedes');
    return data;
  } catch {
    return [];
  }
}

export default async function SedesPage() {
  const user = await getSessionUser();
  if (user?.role !== 'admin') {
    return (
      <div>
        <PageHeader title="Sedes" />
        <EmptyState icon={Lock} title="Solo administradores" />
      </div>
    );
  }

  const sedes = await fetchSedes();

  return (
    <div>
      <PageHeader
        title="Sedes"
        description="Ubicaciones y sucursales del laboratorio."
        actions={<CreateSedeDialog />}
      />

      {sedes.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="Sin sedes cargadas"
          description="Creá la primera sede para empezar."
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] shadow-[var(--shadow-xs)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-[var(--color-border)] border-b bg-[var(--color-bg-subtle)] text-[10px] text-[var(--color-fg-muted)] uppercase tracking-wide">
                <th className="px-5 py-2.5 text-left font-medium">Nombre</th>
                <th className="px-5 py-2.5 text-left font-medium">Dirección</th>
                <th className="px-5 py-2.5 text-left font-medium">Localidad</th>
                <th className="px-5 py-2.5 text-left font-medium">Teléfono</th>
                <th className="px-5 py-2.5 text-left font-medium">Horarios</th>
                <th className="px-5 py-2.5 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {sedes.map((sede) => (
                <tr
                  key={sede.id}
                  className="border-[var(--color-border)] border-b last:border-b-0 hover:bg-[var(--color-bg-subtle)]"
                >
                  <td className="px-5 py-3 text-[var(--color-fg)]">
                    <div className="flex items-center gap-2">
                      {sede.nombre}
                      {sede.principal && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-primary)]/10 px-2 py-0.5 text-[10px] font-medium text-[var(--color-primary)] leading-none">
                          <MapPin className="h-3 w-3" strokeWidth={2} />
                          Principal
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-[var(--color-fg-muted)]">{sede.direccion}</td>
                  <td className="px-5 py-3 text-[var(--color-fg-muted)]">
                    {sede.localidad ?? '—'}
                  </td>
                  <td className="px-5 py-3 text-[var(--color-fg-muted)]">{sede.telefono ?? '—'}</td>
                  <td className="max-w-[200px] truncate px-5 py-3 text-[var(--color-fg-muted)]">
                    {sede.horarios ?? '—'}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <SedeRowActions sede={sede} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
