import { PageHeader } from '@/components/layout/page-header';
import { SolicitantesClient } from './solicitantes-client';

export const dynamic = 'force-dynamic';

export default function SolicitantesPage() {
  return (
    <div>
      <PageHeader
        title="Solicitantes"
        description="Empresas y personas que solicitan análisis de agua."
      />
      <SolicitantesClient />
    </div>
  );
}
