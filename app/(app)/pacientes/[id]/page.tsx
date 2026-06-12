import { PatientForm } from '@/components/domain/patient-form';
import { PageHeader } from '@/components/layout/page-header';
import { getServerApi } from '@/lib/api/server';
import type { Patient } from '@/lib/api/types';
import axios from 'axios';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

async function fetchPatient(id: number): Promise<Patient> {
  const api = await getServerApi();
  try {
    const { data } = await api.get<Patient>(`/patients/${id}`);
    return data;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) notFound();
    throw err;
  }
}

export default async function EditPacientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numId = Number(id);
  if (!Number.isInteger(numId)) notFound();

  const patient = await fetchPatient(numId);

  return (
    <div>
      <PageHeader
        title={`${patient.lastName}, ${patient.firstName}`}
        description={`DNI ${patient.dni}`}
      />
      <PatientForm patient={patient} />
    </div>
  );
}
