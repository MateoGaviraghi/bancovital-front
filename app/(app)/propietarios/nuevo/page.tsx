import { PropietarioForm } from '@/components/domain/propietario-form';
import { PageHeader } from '@/components/layout/page-header';

export default async function NuevoPropietarioPage() {
  return (
    <div>
      <PageHeader title="Nuevo propietario" description="Alta de propietario." />
      <PropietarioForm />
    </div>
  );
}
