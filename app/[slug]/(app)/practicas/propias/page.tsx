import { PageHeader } from '@/components/layout/page-header';
import { Pagination } from '@/components/ui/pagination';
import { getServerApi } from '@/lib/api/server';
import type { PracticesCatalogPage } from '@/lib/api/types';
import { PropiasClient } from './propias-client';

export const dynamic = 'force-dynamic';

const DEFAULT_PAGE_SIZE = 50;
const VALID_PAGE_SIZES = [25, 50, 100];

type SearchParams = Promise<{ q?: string; page?: string; pageSize?: string }>;

async function fetchPage(params: { q: string; page: number; pageSize: number }) {
  try {
    const api = await getServerApi();
    const { data } = await api.get<PracticesCatalogPage>('/practices/catalog', {
      params: {
        q: params.q || undefined,
        page: params.page,
        pageSize: params.pageSize,
        status: 'all',
      },
    });
    return data;
  } catch {
    return { data: [], total: 0, page: params.page, pageSize: params.pageSize, sections: [] };
  }
}

export default async function PropiasPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const q = sp.q ?? '';
  const pageSize = VALID_PAGE_SIZES.includes(Number(sp.pageSize))
    ? Number(sp.pageSize)
    : DEFAULT_PAGE_SIZE;
  const page = Math.max(1, Number.parseInt(sp.page ?? '1') || 1);

  const result = await fetchPage({ q, page, pageSize });

  function buildHref(p: number): string {
    const next = new URLSearchParams();
    if (q) next.set('q', q);
    if (pageSize !== DEFAULT_PAGE_SIZE) next.set('pageSize', String(pageSize));
    if (p > 1) next.set('page', String(p));
    const qs = next.toString();
    return qs ? `/practicas/propias?${qs}` : '/practicas/propias';
  }

  return (
    <div>
      <PageHeader
        title="Prácticas propias del laboratorio"
        description="Activá el toggle en las prácticas que el laboratorio elabora internamente. Las demás se consideran derivadas."
      />
      <PropiasClient practices={result.data} total={result.total} q={q} />
      <Pagination page={page} pageSize={pageSize} total={result.total} buildHref={buildHref} />
    </div>
  );
}
