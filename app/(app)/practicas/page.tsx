import { EmptyState } from '@/components/layout/empty-state';
import { PageHeader } from '@/components/layout/page-header';
import { Pagination } from '@/components/ui/pagination';
import { getServerApi } from '@/lib/api/server';
import type { PracticeWithChildren, PracticesCatalogPage } from '@/lib/api/types';
import { cn } from '@/lib/cn';
import { FlaskConical, GitBranch } from 'lucide-react';
import Link from 'next/link';
import { PracticasFilters } from './filters';
import { NuevaPracticaButton } from './nueva-practica-button';

export const dynamic = 'force-dynamic';

const DEFAULT_PAGE_SIZE = 50;
const VALID_PAGE_SIZES = [25, 50, 100];

async function fetchCatalog(params: {
  q: string;
  page: number;
  pageSize: number;
  section: string;
  status: string;
  elaborated: string;
}): Promise<PracticesCatalogPage> {
  try {
    const api = await getServerApi();
    const { data } = await api.get<PracticesCatalogPage>('/practices/catalog', {
      params: {
        q: params.q || undefined,
        page: params.page,
        pageSize: params.pageSize,
        section: params.section || undefined,
        status: params.status || undefined,
        isElaborated: params.elaborated !== '' ? params.elaborated === 'true' : undefined,
      },
    });
    return data;
  } catch {
    return { data: [], total: 0, page: 1, pageSize: params.pageSize, sections: [] };
  }
}

type SearchParams = Promise<{
  q?: string;
  page?: string;
  pageSize?: string;
  section?: string;
  status?: string;
  elaborated?: string;
}>;

export default async function PracticasPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const q = sp.q ?? '';
  const section = sp.section ?? '';
  const status = sp.status ?? '';
  const elaborated = sp.elaborated ?? '';
  const pageSize = VALID_PAGE_SIZES.includes(Number(sp.pageSize))
    ? Number(sp.pageSize)
    : DEFAULT_PAGE_SIZE;
  const page = Math.max(1, Number.parseInt(sp.page ?? '1') || 1);

  const result = await fetchCatalog({ q, page, pageSize, section, status, elaborated });

  function buildHref(p: number): string {
    const next = new URLSearchParams();
    if (q) next.set('q', q);
    if (section) next.set('section', section);
    if (status) next.set('status', status);
    if (elaborated) next.set('elaborated', elaborated);
    if (pageSize !== DEFAULT_PAGE_SIZE) next.set('pageSize', String(pageSize));
    if (p > 1) next.set('page', String(p));
    const qs = next.toString();
    return qs ? `/practicas?${qs}` : '/practicas';
  }

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, result.total);

  return (
    <div>
      <PageHeader
        title="Prácticas"
        description="Catálogo de prácticas del laboratorio."
        actions={<NuevaPracticaButton />}
      />

      <PracticasFilters sections={result.sections} />

      {result.total > 0 && (
        <p className="mb-3 text-right text-[var(--color-fg-muted)] text-xs">
          {result.total === 0 ? 'Sin resultados' : `${from}–${to} de ${result.total} prácticas`}
        </p>
      )}

      {result.data.length === 0 ? (
        <EmptyState
          icon={FlaskConical}
          title={q || section || status ? 'Sin resultados' : 'Catálogo vacío'}
          description={
            q || section || status
              ? 'No se encontraron prácticas con los filtros aplicados.'
              : 'No hay prácticas cargadas en el catálogo.'
          }
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] shadow-[var(--shadow-xs)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-[var(--color-border)] border-b bg-[var(--color-bg-subtle)] text-[10px] text-[var(--color-fg-muted)] uppercase tracking-wide">
                  <th className="px-5 py-2.5 text-left font-medium">NBU</th>
                  <th className="px-5 py-2.5 text-left font-medium">Práctica</th>
                  <th className="px-5 py-2.5 text-left font-medium">Sección</th>
                  <th className="px-5 py-2.5 text-right font-medium">UB</th>
                  <th className="px-5 py-2.5 text-left font-medium">Atributos</th>
                  <th className="px-5 py-2.5 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {(result.data as PracticeWithChildren[]).map((p) => (
                  <tr
                    key={p.id}
                    className="border-[var(--color-border)] border-b last:border-b-0 hover:bg-[var(--color-bg-subtle)]"
                  >
                    <td className="tabular px-5 py-3 font-mono text-[var(--color-fg)]">
                      {p.nbuCode}
                    </td>
                    <td className="px-5 py-3 text-[var(--color-fg)]">
                      {p.name}
                      {p.shortName && (
                        <span className="ml-2 text-[var(--color-fg-subtle)] text-xs">
                          ({p.shortName})
                        </span>
                      )}
                      {p.children && p.children.length > 0 && (
                        <span
                          title={`Incluye: ${p.children.map((c) => c.name).join(', ')}`}
                          className="ml-2 inline-flex items-center gap-0.5 rounded-sm bg-[var(--color-info-soft)] px-1.5 py-0.5 font-medium text-[10px] text-[var(--color-info)]"
                        >
                          <GitBranch className="h-3 w-3" strokeWidth={2} />
                          {p.children.length} subprácticas
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-[var(--color-fg-muted)]">{p.section ?? '—'}</td>
                    <td className="tabular px-5 py-3 text-right font-mono text-[var(--color-fg)]">
                      {p.units}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap items-center gap-1">
                        {p.isElaborated ? (
                          <span className="inline-flex items-center rounded-md border border-[var(--color-success)]/15 bg-[var(--color-success-soft)] px-2 py-0.5 font-medium text-[10px] text-[var(--color-success)] uppercase tracking-wide">
                            Propia
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-md border border-[var(--color-fg-subtle)]/15 bg-[var(--color-bg-subtle)] px-2 py-0.5 font-medium text-[10px] text-[var(--color-fg-muted)] uppercase tracking-wide">
                            Derivada
                          </span>
                        )}
                        {p.requiresAuthorization && (
                          <span className="inline-flex items-center rounded-md border border-[var(--color-warning)]/15 bg-[var(--color-warning-soft)] px-2 py-0.5 font-medium text-[10px] text-[var(--color-warning)] uppercase tracking-wide">
                            Autorización
                          </span>
                        )}
                        {p.isSpecialAct && (
                          <span className="inline-flex items-center rounded-md border border-[var(--color-info)]/15 bg-[var(--color-info-soft)] px-2 py-0.5 font-medium text-[10px] text-[var(--color-info)] uppercase tracking-wide">
                            Especial
                          </span>
                        )}
                        {!p.active && (
                          <span
                            className={cn(
                              'inline-flex items-center rounded-md border border-[var(--color-fg-subtle)]/15 bg-[var(--color-bg-subtle)] px-2 py-0.5 font-medium text-[10px] text-[var(--color-fg-muted)] uppercase tracking-wide',
                            )}
                          >
                            Inactiva
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={`/practicas/${p.id}`}
                        className="font-medium text-[var(--color-primary)] hover:underline"
                      >
                        Configurar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination page={page} pageSize={pageSize} total={result.total} buildHref={buildHref} />
        </>
      )}
    </div>
  );
}
