import { PageHeader } from '@/components/layout/page-header';
import Link from 'next/link';
import { NuevaCotizacionForm } from '../nueva-cotizacion-form';

export default function NuevaCotizacionPage() {
  return (
    <div>
      <PageHeader
        title="Nueva cotización"
        description="Seleccioná el tipo de receptor, la obra social y las prácticas a cotizar."
        breadcrumb={
          <Link href="/cotizaciones" className="text-xs text-[var(--color-fg-muted)] hover:underline">
            ← Cotizaciones
          </Link>
        }
      />
      <NuevaCotizacionForm />
    </div>
  );
}
