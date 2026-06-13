import { getServerApi } from '@/lib/api/server';
import type { ReunionItem } from '@/lib/api/types';
import { ReunionesClient } from './reuniones-client';

export const dynamic = 'force-dynamic';

async function fetchReuniones(): Promise<ReunionItem[]> {
  try {
    const api = await getServerApi();
    const { data } = await api.get<ReunionItem[]>('/super/bookings');
    return data;
  } catch {
    return [];
  }
}

export default async function SuperReunionesPage() {
  const reuniones = await fetchReuniones();
  return <ReunionesClient initialReuniones={reuniones} />;
}
