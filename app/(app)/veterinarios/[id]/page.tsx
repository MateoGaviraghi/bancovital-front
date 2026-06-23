import { VeterinarioForm } from '@/components/domain/veterinario-form';
import { PageHeader } from '@/components/layout/page-header';
import { getServerApi } from '@/lib/api/server';
import type { Veterinario } from '@/lib/api/types';
import axios from 'axios';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

async function fetchVeterinario(id: number): Promise<Veterinario> {
  const api = await getServerApi();
  try {
    const { data } = await api.get<Veterinario>(`/veterinarios/${id}`);
    return data;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) notFound();
    throw err;
  }
}

export default async function EditVeterinarioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numId = Number(id);
  if (!Number.isInteger(numId)) notFound();

  const vet = await fetchVeterinario(numId);

  return (
    <div>
      <PageHeader
        title={`${vet.lastName}, ${vet.firstName}`}
        description={`Matrícula ${vet.matricula}`}
      />
      <VeterinarioForm veterinario={vet} />
    </div>
  );
}
