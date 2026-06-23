import { VeterinarioForm } from '@/components/domain/veterinario-form';
import { EmptyState } from '@/components/layout/empty-state';
import { PageHeader } from '@/components/layout/page-header';
import { getSessionUser } from '@/lib/auth/session';
import { Lock } from 'lucide-react';

export default async function NuevoVeterinarioPage() {
  const user = await getSessionUser();
  if (user?.role === 'recepcion' || user?.role === 'bioquimico') {
    return (
      <div>
        <PageHeader title="Nuevo veterinario" />
        <EmptyState
          icon={Lock}
          title="Acceso restringido"
          description="Solo administradores pueden dar de alta veterinarios."
        />
      </div>
    );
  }
  return (
    <div>
      <PageHeader title="Nuevo veterinario" description="Alta en el padrón de veterinarios." />
      <VeterinarioForm />
    </div>
  );
}
