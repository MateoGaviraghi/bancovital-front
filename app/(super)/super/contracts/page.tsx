import { getServerApi } from '@/lib/api/server';
import type { ContratoSuperListItem, Plan } from '@/lib/api/types';
import { ContractsClient } from './contracts-client';

export const dynamic = 'force-dynamic';

async function fetchContracts(): Promise<ContratoSuperListItem[]> {
  try {
    const api = await getServerApi();
    const { data } = await api.get<ContratoSuperListItem[]>('/super/contracts');
    return data;
  } catch {
    return [];
  }
}

async function fetchPlans(): Promise<Plan[]> {
  try {
    const api = await getServerApi();
    const { data } = await api.get<Plan[]>('/super/plans');
    return data;
  } catch {
    return [];
  }
}

export default async function SuperContractsPage() {
  const [contracts, plans] = await Promise.all([fetchContracts(), fetchPlans()]);
  return <ContractsClient initialContracts={contracts} plans={plans} />;
}
