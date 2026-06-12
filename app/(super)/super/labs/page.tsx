import { getServerApi } from '@/lib/api/server';
import type { Laboratorio } from '@/lib/api/types';
import { LabsClient } from './labs-client';

export const dynamic = 'force-dynamic';

async function fetchLabs(): Promise<Laboratorio[]> {
  try {
    const api = await getServerApi();
    const { data } = await api.get<Laboratorio[]>('/super/labs');
    return data;
  } catch {
    return [];
  }
}

export default async function SuperLabsPage() {
  const initialLabs = await fetchLabs();
  return <LabsClient initialLabs={initialLabs} />;
}
