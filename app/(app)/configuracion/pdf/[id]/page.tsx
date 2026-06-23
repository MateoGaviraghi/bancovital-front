import { PageHeader } from '@/components/layout/page-header';
import { getServerApi } from '@/lib/api/server';
import type { PreferenciaPdf } from '@/lib/api/types';
import { getSessionUser } from '@/lib/auth/session';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { PdfEditorClient } from './pdf-editor-client';

export const dynamic = 'force-dynamic';

async function fetchFormato(id: number): Promise<PreferenciaPdf | null> {
  try {
    const api = await getServerApi();
    const { data } = await api.get<PreferenciaPdf>(`/preferencia-pdf/${id}`);
    return data ?? null;
  } catch {
    return null;
  }
}

export default async function PdfEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user || user.role !== 'admin') redirect('/inicio');

  const { id: rawId } = await params;
  const id = Number(rawId);
  if (Number.isNaN(id)) notFound();

  const formato = await fetchFormato(id);
  if (!formato) notFound();

  return (
    <div>
      <PageHeader
        title={formato.nombre}
        description={`Formato de ${formato.tipo === 'informe' ? 'informe' : 'orden'}`}
        breadcrumb={
          <Link
            href="/configuracion/pdf"
            className="inline-flex items-center gap-1 text-sm text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
            Formatos de PDF
          </Link>
        }
      />
      <PdfEditorClient initialFormato={formato} />
    </div>
  );
}
