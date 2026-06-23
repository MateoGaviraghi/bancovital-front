import { SearchInput } from '@/components/domain/search-input';
import { EmptyState } from '@/components/layout/empty-state';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { getServerApi } from '@/lib/api/server';
import type { Propietario } from '@/lib/api/types';
import { AlertTriangle, Plus, Users } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const LIMIT = 200;

async function fetchPropietarios(q: string): Promise<Propietario[]> {
  try {
    const api = await getServerApi();
    const { data } = await api.get<Propietario[]>('/propietarios', { params: { q, limit: LIMIT } });
    return data;
  } catch {
    return [];
  }
}

export default async function PropietariosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = '' } = await searchParams;
  const rows = await fetchPropietarios(q);
  const capped = rows.length === LIMIT;

  return (
    <div>
      <PageHeader
        title="Propietarios"
        description="Padrón de propietarios de mascotas."
        actions={
          <Button asChild>
            <Link href="/propietarios/nuevo">
              <Plus className="h-4 w-4" strokeWidth={2} />
              Nuevo propietario
            </Link>
          </Button>
        }
      />

      <div className="mb-4">
        <SearchInput placeholder="Buscar por DNI o nombre…" />
      </div>

      {capped && (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-[var(--color-warning)]/30 bg-[var(--color-warning-soft)] px-4 py-3 text-[var(--color-warning)] text-xs">
          <AlertTriangle className="h-4 w-4 shrink-0" strokeWidth={2} />
          Se muestran los primeros {LIMIT} propietarios. Refiná la búsqueda para ver resultados más
          precisos.
        </div>
      )}

      {rows.length === 0 ? (
        <EmptyState
          icon={Users}
          title={q ? 'Sin resultados' : 'Sin propietarios cargados'}
          description={
            q
              ? `No se encontraron propietarios para "${q}".`
              : 'Creá el primer propietario para empezar.'
          }
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] shadow-[var(--shadow-xs)]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-[var(--color-border)] border-b bg-[var(--color-bg-subtle)] text-[10px] text-[var(--color-fg-muted)] uppercase tracking-wide">
                  <th className="px-5 py-2.5 text-left font-medium">DNI</th>
                  <th className="px-5 py-2.5 text-left font-medium">Propietario</th>
                  <th className="px-5 py-2.5 text-left font-medium">Teléfono</th>
                  <th className="px-5 py-2.5 text-left font-medium">Ciudad</th>
                  <th className="px-5 py-2.5 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr
                    key={p.id}
                    className="border-[var(--color-border)] border-b last:border-b-0 hover:bg-[var(--color-bg-subtle)]"
                  >
                    <td className="tabular px-5 py-3 font-mono text-[var(--color-fg)]">{p.dni}</td>
                    <td className="px-5 py-3 text-[var(--color-fg)]">
                      {p.lastName}, {p.firstName}
                    </td>
                    <td className="px-5 py-3 text-[var(--color-fg-muted)]">{p.phone ?? '—'}</td>
                    <td className="px-5 py-3 text-[var(--color-fg-muted)]">{p.city ?? '—'}</td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={`/propietarios/${p.id}`}
                        className="font-medium text-[var(--color-primary)] hover:underline"
                      >
                        Editar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
