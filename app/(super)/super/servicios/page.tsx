import { PageHeader } from '@/components/layout/page-header';
import { getSessionUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { ServiciosSuperClient } from './servicios-super-client';

export const dynamic = 'force-dynamic';

export default async function ServiciosSuperPage() {
  const user = await getSessionUser();
  if (!user || user.role !== 'super') redirect('/');

  return (
    <div>
      <PageHeader
        title="Servicios por laboratorio"
        description="Gestioná los tipos de servicio habilitados para cada laboratorio."
      />
      <ServiciosSuperClient />
    </div>
  );
}
