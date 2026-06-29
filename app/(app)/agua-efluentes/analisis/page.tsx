import { PageHeader } from '@/components/layout/page-header';
import { AnalisisClient } from './analisis-client';

export const dynamic = 'force-dynamic';

export default function AnalisisPage() {
  return (
    <div>
      <PageHeader
        title="Análisis solicitados"
        description="Análisis físico-químicos y microbiológicos solicitados por muestra."
      />
      <AnalisisClient />
    </div>
  );
}
