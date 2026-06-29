import { PageHeader } from '@/components/layout/page-header';
import { getSessionUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { ServiciosClient } from './servicios-client';

export const dynamic = 'force-dynamic';

export default async function ServiciosPage() {
  const user = await getSessionUser();
  if (!user || user.role !== 'super') redirect('/inicio');

  return (
    <div>
      <PageHeader
        title="Servicios"
        description="Gestioná los tipos de servicio de tu laboratorio."
      />
      <ServiciosClient />
    </div>
  );
}
