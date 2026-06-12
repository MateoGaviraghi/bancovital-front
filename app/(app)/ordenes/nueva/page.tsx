import { NewOrderForm } from '@/components/domain/new-order-form';
import { EmptyState } from '@/components/layout/empty-state';
import { PageHeader } from '@/components/layout/page-header';
import { getSessionUser } from '@/lib/auth/session';
import { Lock } from 'lucide-react';

export default async function NuevaOrdenPage() {
  const user = await getSessionUser();
  const canCreate = user?.role === 'admin' || user?.role === 'bioquimico';

  if (!canCreate) {
    return (
      <div>
        <PageHeader title="Nueva orden" />
        <EmptyState
          icon={Lock}
          title="Acceso restringido"
          description="Solo recepción o admin pueden crear órdenes."
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Nueva orden"
        description="Paciente, obra social, prácticas y datos clínicos."
      />
      <NewOrderForm />
    </div>
  );
}
