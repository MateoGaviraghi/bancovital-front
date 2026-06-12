import { DownloadFichaButton } from './print-controls';
import { getServerApi } from '@/lib/api/server';
import type { OrderDetail } from '@/lib/api/types';
import { getSessionUser } from '@/lib/auth/session';
import axios from 'axios';
import { notFound, redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

async function fetchOrder(id: number): Promise<OrderDetail> {
  const api = await getServerApi();
  try {
    const { data } = await api.get<OrderDetail>(`/orders/${id}`);
    return data;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) notFound();
    throw err;
  }
}

export default async function FichaPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  const { id } = await params;
  const numId = Number(id);
  if (!Number.isInteger(numId)) notFound();

  const order = await fetchOrder(numId);

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <DownloadFichaButton orderId={order.id} protocolNumber={order.protocolNumber} />
      <div className="mx-auto max-w-sm px-6 py-16 text-center">
        <div className="text-4xl">📄</div>
        <h1 className="mt-4 font-semibold text-[var(--color-fg)] text-lg">
          Ficha de trabajo — Orden #{order.protocolNumber}
        </h1>
        <p className="mt-2 text-[var(--color-fg-muted)] text-sm">
          {order.patient.lastName}, {order.patient.firstName}
        </p>
        <p className="mt-4 text-[var(--color-fg-subtle)] text-xs">
          Hacé click en "Descargar ficha PDF" para generar y guardar el archivo.
        </p>
      </div>
    </div>
  );
}
