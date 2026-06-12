import { DoctorForm } from '@/components/domain/doctor-form';
import { EmptyState } from '@/components/layout/empty-state';
import { PageHeader } from '@/components/layout/page-header';
import { getSessionUser } from '@/lib/auth/session';
import { Lock } from 'lucide-react';

export default async function NuevoMedicoPage() {
  const user = await getSessionUser();
  if (user?.role === 'recepcion' || user?.role === 'bioquimico') {
    return (
      <div>
        <PageHeader title="Nuevo médico" />
        <EmptyState icon={Lock} title="Acceso restringido" description="Solo administradores pueden dar de alta médicos." />
      </div>
    );
  }
  return (
    <div>
      <PageHeader title="Nuevo médico" description="Alta en el padrón de derivantes." />
      <DoctorForm />
    </div>
  );
}
