import { PageHeader } from '@/components/layout/page-header';
import { getServerApi } from '@/lib/api/server';
import type { PreferenciaPdf } from '@/lib/api/types';
import { getSessionUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { PdfConfigClient } from './pdf-config-client';

export const dynamic = 'force-dynamic';

async function fetchPreferencia(): Promise<PreferenciaPdf | null> {
  try {
    const api = await getServerApi();
    const { data } = await api.get<PreferenciaPdf | null>('/preferencia-pdf');
    return data ?? null;
  } catch {
    return null;
  }
}

export default async function ConfigPdfPage() {
  const user = await getSessionUser();
  if (!user || user.role !== 'admin') redirect('/');

  const preferencia = await fetchPreferencia();

  return (
    <div>
      <PageHeader
        title="Configuración de PDF"
        description="Imagen de fondo institucional y márgenes del informe."
      />
      <PdfConfigClient initialPreferencia={preferencia} />
    </div>
  );
}
