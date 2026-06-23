import { PropietarioForm } from '@/components/domain/propietario-form';
import { PageHeader } from '@/components/layout/page-header';
import { getServerApi } from '@/lib/api/server';
import type { Propietario } from '@/lib/api/types';
import axios from 'axios';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

async function fetchPropietario(id: number): Promise<Propietario> {
  const api = await getServerApi();
  try {
    const { data } = await api.get<Propietario>(`/propietarios/${id}`);
    return data;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) notFound();
    throw err;
  }
}

export default async function EditPropietarioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numId = Number(id);
  if (!Number.isInteger(numId)) notFound();

  const prop = await fetchPropietario(numId);

  return (
    <div>
      <PageHeader title={`${prop.lastName}, ${prop.firstName}`} description={`DNI ${prop.dni}`} />
      <PropietarioForm propietario={prop} />
    </div>
  );
}
