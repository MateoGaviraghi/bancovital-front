import { PageHeader } from '@/components/layout/page-header';
import Link from 'next/link';
import { PreciosCatalogClient } from './precios-catalog-client';

export default function PreciosCatalogPage() {
  return (
    <div>
      <PageHeader
        title="Catálogo de precios"
        description="Configurá los precios por práctica y obra social. Si no hay precio para una obra social específica se puede dejar en blanco y el operador ingresará el precio al crear la cotización."
        breadcrumb={
          <Link href="/cotizaciones" className="text-xs text-[var(--color-fg-muted)] hover:underline">
            ← Cotizaciones
          </Link>
        }
      />
      <PreciosCatalogClient />
    </div>
  );
}
