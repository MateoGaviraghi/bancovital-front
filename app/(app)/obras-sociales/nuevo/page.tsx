import { InsurerForm } from '@/components/domain/insurer-form';
import { PageHeader } from '@/components/layout/page-header';

export default function NuevaObraSocialPage() {
  return (
    <div>
      <PageHeader title="Nueva obra social" description="Alta de aseguradora." />
      <InsurerForm />
    </div>
  );
}
