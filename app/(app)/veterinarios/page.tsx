import { SearchInput } from '@/components/domain/search-input';
import { EmptyState } from '@/components/layout/empty-state';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { getServerApi } from '@/lib/api/server';
import type { Veterinario } from '@/lib/api/types';
import { AlertTriangle, Heart, Plus } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const LIMIT = 200;

async function fetchVeterinarios(q: string): Promise<Veterinario[]> {
  try {
    const api = await getServerApi();
    const { data } = await api.get<Veterinario[]>('/veterinarios', { params: { q, limit: LIMIT } });
    return data;
  } catch {
    return [];
  }
}

export default async function VeterinariosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = '' } = await searchParams;
  const rows = await fetchVeterinarios(q);
  const capped = rows.length === LIMIT;

  return (
    <div>
      <PageHeader
        title="Veterinarios"
        description="Padrón de veterinarios."
        actions={
          <Button asChild>
            <Link href="/veterinarios/nuevo">
              <Plus className="h-4 w-4" strokeWidth={2} />
              Nuevo veterinario
            </Link>
          </Button>
        }
      />

      <div className="mb-4">
        <SearchInput placeholder="Buscar por matrícula o nombre…" />
      </div>

      {capped && (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-[var(--color-warning)]/30 bg-[var(--color-warning-soft)] px-4 py-3 text-[var(--color-warning)] text-xs">
          <AlertTriangle className="h-4 w-4 shrink-0" strokeWidth={2} />
          Se muestran los primeros {LIMIT} veterinarios. Refiná la búsqueda para ver resultados más
          precisos.
        </div>
      )}

      {rows.length === 0 ? (
        <EmptyState
          icon={Heart}
          title={q ? 'Sin resultados' : 'Sin veterinarios cargados'}
          description={
            q
              ? `No se encontraron veterinarios para "${q}".`
              : 'Creá el primer veterinario para empezar.'
          }
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] shadow-[var(--shadow-xs)]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-[var(--color-border)] border-b bg-[var(--color-bg-subtle)] text-[10px] text-[var(--color-fg-muted)] uppercase tracking-wide">
                  <th className="px-5 py-2.5 text-left font-medium">Matrícula</th>
                  <th className="px-5 py-2.5 text-left font-medium">Veterinario</th>
                  <th className="px-5 py-2.5 text-left font-medium">Clínica</th>
                  <th className="px-5 py-2.5 text-left font-medium">Teléfono</th>
                  <th className="px-5 py-2.5 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((v) => (
                  <tr
                    key={v.id}
                    className="border-[var(--color-border)] border-b last:border-b-0 hover:bg-[var(--color-bg-subtle)]"
                  >
                    <td className="tabular px-5 py-3 font-mono text-[var(--color-fg)]">
                      {v.matricula}
                    </td>
                    <td className="px-5 py-3 text-[var(--color-fg)]">
                      {v.lastName}, {v.firstName}
                    </td>
                    <td className="px-5 py-3 text-[var(--color-fg-muted)]">{v.clinica ?? '—'}</td>
                    <td className="px-5 py-3 text-[var(--color-fg-muted)]">{v.phone ?? '—'}</td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={`/veterinarios/${v.id}`}
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
