import { getServerApi } from '@/lib/api/server';
import type { AuditResponse, Laboratorio } from '@/lib/api/types';
import { AuditClient } from './audit-client';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 25;

async function fetchAudit(page: number, labId: number | null): Promise<AuditResponse> {
  try {
    const api = await getServerApi();
    const { data } = await api.get<AuditResponse>('/super/audit', {
      params: {
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
        ...(labId != null ? { labId } : {}),
      },
    });
    return data;
  } catch {
    return { data: [], total: 0 };
  }
}

async function fetchLabs(): Promise<Laboratorio[]> {
  try {
    const api = await getServerApi();
    const { data } = await api.get<Laboratorio[]>('/super/labs');
    return data;
  } catch {
    return [];
  }
}

export default async function SuperAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; labId?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(sp.page ?? '1', 10) || 1);
  const labId = sp.labId ? Number.parseInt(sp.labId, 10) : null;

  const [audit, labs] = await Promise.all([
    fetchAudit(page, Number.isNaN(labId) ? null : labId),
    fetchLabs(),
  ]);

  return (
    <AuditClient
      audit={audit}
      labs={labs}
      page={page}
      pageSize={PAGE_SIZE}
      labId={Number.isNaN(labId) ? null : labId}
    />
  );
}
