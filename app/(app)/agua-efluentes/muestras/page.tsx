import { PageHeader } from '@/components/layout/page-header';
import { MuestrasClient } from './muestras-client';

export const dynamic = 'force-dynamic';

export default function MuestrasPage() {
  return (
    <div>
      <PageHeader title="Muestras" description="Muestras de agua y efluentes registradas." />
      <MuestrasClient />
    </div>
  );
}
