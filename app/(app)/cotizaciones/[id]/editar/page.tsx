import { PageHeader } from '@/components/layout/page-header';
import { getServerApi } from '@/lib/api/server';
import type { CotizacionDetalle, Insurer } from '@/lib/api/types';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { EditCotizacionForm } from './edit-cotizacion-form';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }> };

export default async function EditCotizacionPage({ params }: Props) {
  const { id } = await params;
  const numId = Number(id);
  if (Number.isNaN(numId)) notFound();

  const api = await getServerApi();
  const [cot, insurers] = await Promise.all([
    api
      .get<CotizacionDetalle>(`/cotizaciones/${numId}`)
      .then((r) => r.data)
      .catch(() => null),
    api.get<Insurer[]>('/insurers?active=true').then((r) => r.data).catch(() => [] as Insurer[]),
  ]);

  if (!cot) notFound();

  return (
    <div>
      <PageHeader
        title={`Editar cotización #${String(cot.id).padStart(4, '0')}`}
        description="Modificá las prácticas, precios, obra social u observaciones."
        breadcrumb={
          <Link
            href={`/cotizaciones/${cot.id}`}
            className="text-xs text-[var(--color-fg-muted)] hover:underline"
          >
            ← Volver a la cotización
          </Link>
        }
      />
      <EditCotizacionForm cot={cot} insurers={insurers} />
    </div>
  );
}
