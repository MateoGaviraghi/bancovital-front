import { PageHeader } from '@/components/layout/page-header';
import { getSessionUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { PdfFormatListClient } from './pdf-config-client';

export const dynamic = 'force-dynamic';

export default async function ConfigPdfPage() {
  const user = await getSessionUser();
  if (!user || user.role !== 'admin') redirect('/inicio');

  return (
    <div>
      <PageHeader
        title="Formatos de impresión PDF"
        description="Administrá los formatos de membrete, campos y márgenes para informes y órdenes."
      />
      <PdfFormatListClient />
    </div>
  );
}
