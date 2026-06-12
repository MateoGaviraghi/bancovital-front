import { EditOrderForm } from '@/components/domain/edit-order-form';
import { PageHeader } from '@/components/layout/page-header';
import { getServerApi } from '@/lib/api/server';
import type { Doctor, OrderDetail, OrderLine, Patient, PracticeWithChildren } from '@/lib/api/types';
import axios from 'axios';
import { notFound, redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function EditOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numId = Number(id);
  if (!Number.isInteger(numId)) notFound();

  const api = await getServerApi();

  let order: OrderDetail;
  let lines: OrderLine[];

  try {
    const [orderRes, linesRes] = await Promise.all([
      api.get<OrderDetail>(`/orders/${numId}`),
      api.get<OrderLine[]>(`/orders/${numId}/lines`),
    ]);
    order = orderRes.data;
    lines = linesRes.data;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) notFound();
    throw err;
  }

  if (order.status !== 'borrador') redirect(`/ordenes/${numId}`);

  const [patientRes, doctorRes] = await Promise.all([
    api.get<Patient>(`/patients/${order.patientId}`),
    order.referringDoctorId
      ? api.get<Doctor>(`/doctors/${order.referringDoctorId}`).catch(() => null)
      : Promise.resolve(null),
  ]);

  const initialPatient = patientRes.data;
  const initialDoctor = doctorRes?.data ?? null;

  const initialPractices: PracticeWithChildren[] = lines
    .filter((l) => l.practiceId !== null)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((l) => ({
      id: l.practiceId as number,
      nbuCode: l.nbuCodeSnapshot,
      name: l.nameSnapshot,
      shortName: null,
      category: null,
      section: null,
      units: l.unitsSnapshot,
      parentId: null,
      requiresAuthorization: false,
      referenceValueTemplate: null,
      isSpecialAct: false,
      isElaborated: false,
      active: true,
      notes: null,
      methodology: null,
      referenceValue: null,
      createdAt: '',
      updatedAt: '',
      children: [],
    }));

  return (
    <div>
      <PageHeader
        title={`Editar orden #${order.protocolNumber}`}
        description={`${order.patient.lastName}, ${order.patient.firstName} · DNI ${order.patient.dni}`}
      />
      <EditOrderForm
        order={order}
        initialPatient={initialPatient}
        initialDoctor={initialDoctor}
        initialPractices={initialPractices}
      />
    </div>
  );
}
