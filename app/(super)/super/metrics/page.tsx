import { getServerApi } from '@/lib/api/server';
import type { SuperMetrics } from '@/lib/api/types';
import { MetricsClient } from './metrics-client';

export const dynamic = 'force-dynamic';

async function fetchMetrics(): Promise<SuperMetrics | null> {
  try {
    const api = await getServerApi();
    const { data } = await api.get<SuperMetrics>('/super/metrics');
    return data;
  } catch {
    return null;
  }
}

export default async function SuperMetricsPage() {
  const initialMetrics = await fetchMetrics();
  return <MetricsClient initialMetrics={initialMetrics} />;
}
