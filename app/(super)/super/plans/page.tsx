import { getServerApi } from '@/lib/api/server';
import type { Plan } from '@/lib/api/types';
import { PlansClient } from './plans-client';

export const dynamic = 'force-dynamic';

async function fetchPlans(): Promise<Plan[]> {
  try {
    const api = await getServerApi();
    const { data } = await api.get<Plan[]>('/super/plans');
    return data;
  } catch {
    return [];
  }
}

export default async function SuperPlansPage() {
  const initialPlans = await fetchPlans();
  return <PlansClient initialPlans={initialPlans} />;
}
