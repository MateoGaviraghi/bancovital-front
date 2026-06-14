import { getServerApi } from '@/lib/api/server';
import type { EstadoCuenta, Laboratorio } from '@/lib/api/types';
import { notFound } from 'next/navigation';
import { CuentaClient } from './cuenta-client';

export const dynamic = 'force-dynamic';

async function fetchLab(id: number): Promise<Laboratorio | null> {
  try {
    const api = await getServerApi();
    const { data } = await api.get<Laboratorio[]>('/super/labs');
    return data.find((l) => l.id === id) ?? null;
  } catch {
    return null;
  }
}

async function fetchEstado(id: number): Promise<EstadoCuenta | null> {
  try {
    const api = await getServerApi();
    const { data } = await api.get<EstadoCuenta>(`/super/labs/${id}/movimientos`);
    return data;
  } catch {
    return null;
  }
}

export default async function SuperLabCuentaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const labId = Number.parseInt(id, 10);
  if (Number.isNaN(labId)) notFound();

  const [lab, initialEstado] = await Promise.all([fetchLab(labId), fetchEstado(labId)]);
  if (!lab) notFound();

  return <CuentaClient lab={lab} labId={labId} initialEstado={initialEstado} />;
}
