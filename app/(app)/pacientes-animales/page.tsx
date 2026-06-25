import { SearchInput } from '@/components/domain/search-input';
import { EmptyState } from '@/components/layout/empty-state';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { getServerApi } from '@/lib/api/server';
import type { PacienteAnimal } from '@/lib/api/types';
import { AlertTriangle, PawPrint, Plus } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const LIMIT = 200;

async function fetchPacientesAnimales(q: string): Promise<PacienteAnimal[]> {
  try {
    const api = await getServerApi();
    const params: Record<string, unknown> = { limit: LIMIT };
    if (q) params.q = q;
    const { data } = await api.get<PacienteAnimal[]>('/pacientes-animales', { params });
    return data;
  } catch (err: any) {
    console.error('[pacientes-animales] fetch error:', err?.response?.status, err?.response?.data);
    return [];
  }
}

export default async function PacientesAnimalesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = '' } = await searchParams;
  const rows = await fetchPacientesAnimales(q);
  const capped = rows.length === LIMIT;

  return (
    <div>
      <PageHeader
        title="Pacientes animales"
        description="Registro de pacientes animales."
        actions={
          <Button asChild>
            <Link href="/pacientes-animales/nuevo">
              <Plus className="h-4 w-4" strokeWidth={2} />
              Nuevo paciente
            </Link>
          </Button>
        }
      />

      <div className="mb-4">
        <SearchInput placeholder="Buscar por nombre del animal…" />
      </div>

      {capped && (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-[var(--color-warning)]/30 bg-[var(--color-warning-soft)] px-4 py-3 text-[var(--color-warning)] text-xs">
          <AlertTriangle className="h-4 w-4 shrink-0" strokeWidth={2} />
          Se muestran los primeros {LIMIT} pacientes. Refiná la búsqueda para ver resultados más
          precisos.
        </div>
      )}

      {rows.length === 0 ? (
        <EmptyState
          icon={PawPrint}
          title={q ? 'Sin resultados' : 'Sin pacientes animales cargados'}
          description={
            q
              ? `No se encontraron pacientes animales para "${q}".`
              : 'Creá el primer paciente animal para empezar.'
          }
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] shadow-[var(--shadow-xs)]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-[var(--color-border)] border-b bg-[var(--color-bg-subtle)] text-[10px] text-[var(--color-fg-muted)] uppercase tracking-wide">
                  <th className="px-5 py-2.5 text-left font-medium">Nombre</th>
                  <th className="px-5 py-2.5 text-left font-medium">Especie</th>
                  <th className="px-5 py-2.5 text-left font-medium">Raza</th>
                  <th className="px-5 py-2.5 text-left font-medium">Propietario</th>
                  <th className="px-5 py-2.5 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => (
                  <tr
                    key={a.id}
                    className="border-[var(--color-border)] border-b last:border-b-0 hover:bg-[var(--color-bg-subtle)]"
                  >
                    <td className="px-5 py-3 font-medium text-[var(--color-fg)]">{a.nombre}</td>
                    <td className="px-5 py-3 text-[var(--color-fg-muted)]">
                      {a.especie?.nombre ?? '—'}
                    </td>
                    <td className="px-5 py-3 text-[var(--color-fg-muted)]">
                      {a.raza?.nombre ?? '—'}
                    </td>
                    <td className="px-5 py-3 text-[var(--color-fg-muted)]">
                      {a.propietario
                        ? `${a.propietario.lastName}, ${a.propietario.firstName}`
                        : '—'}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={`/pacientes-animales/${a.id}`}
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
