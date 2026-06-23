import { PacienteAnimalForm } from '@/components/domain/paciente-animal-form';
import { PageHeader } from '@/components/layout/page-header';
import { getServerApi } from '@/lib/api/server';
import type { PacienteAnimal } from '@/lib/api/types';
import axios from 'axios';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

async function fetchAnimal(id: number): Promise<PacienteAnimal> {
  const api = await getServerApi();
  try {
    const { data } = await api.get<PacienteAnimal>(`/pacientes-animales/${id}`);
    return data;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) notFound();
    throw err;
  }
}

export default async function EditPacienteAnimalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numId = Number(id);
  if (!Number.isInteger(numId)) notFound();

  const animal = await fetchAnimal(numId);

  const especieNombre = animal.especie?.nombre ?? 'Especie desconocida';
  const propietarioNombre = animal.propietario
    ? `${animal.propietario.lastName}, ${animal.propietario.firstName}`
    : null;

  return (
    <div>
      <PageHeader
        title={animal.nombre}
        description={
          propietarioNombre ? `${especieNombre} — Propietario: ${propietarioNombre}` : especieNombre
        }
      />
      <PacienteAnimalForm animal={animal} initialPropietario={animal.propietario} />
    </div>
  );
}
