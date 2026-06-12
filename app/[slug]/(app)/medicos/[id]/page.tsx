import { DoctorForm } from '@/components/domain/doctor-form';
import { PageHeader } from '@/components/layout/page-header';
import { getServerApi } from '@/lib/api/server';
import type { Doctor } from '@/lib/api/types';
import axios from 'axios';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

async function fetchDoctor(id: number): Promise<Doctor> {
  const api = await getServerApi();
  try {
    const { data } = await api.get<Doctor>(`/doctors/${id}`);
    return data;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) notFound();
    throw err;
  }
}

export default async function EditMedicoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numId = Number(id);
  if (!Number.isInteger(numId)) notFound();

  const doctor = await fetchDoctor(numId);

  return (
    <div>
      <PageHeader
        title={`${doctor.lastName}, ${doctor.firstName}`}
        description={`Matrícula ${doctor.matricula}`}
      />
      <DoctorForm doctor={doctor} />
    </div>
  );
}
