import { PageHeader } from '@/components/layout/page-header';
import { getServerApi } from '@/lib/api/server';
import type { CotizacionDetalle } from '@/lib/api/types';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { CotizacionDetailClient } from './cotizacion-detail-client';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }> };

export default async function CotizacionDetailPage({ params }: Props) {
  const { id } = await params;
  const numId = Number(id);
  if (Number.isNaN(numId)) notFound();

  const api = await getServerApi();
  const cot = await api
    .get<CotizacionDetalle>(`/cotizaciones/${numId}`)
    .then((r) => r.data)
    .catch(() => null);

  if (!cot) notFound();

  const receptorNombre =
    cot.tipo === 'paciente' && cot.patientInfo
      ? `${cot.patientInfo.lastName}, ${cot.patientInfo.firstName}`
      : cot.empresaNombre ?? '—';

  return (
    <div>
      <PageHeader
        title={`Cotización #${String(cot.id).padStart(4, '0')}`}
        description={receptorNombre}
        breadcrumb={
          <Link href="/cotizaciones" className="text-xs text-[var(--color-fg-muted)] hover:underline">
            ← Cotizaciones
          </Link>
        }
      />
      <CotizacionDetailClient cot={cot} />
    </div>
  );
}
