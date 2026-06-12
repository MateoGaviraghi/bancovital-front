import { LabAssetsUpload } from '@/components/domain/lab-assets-upload';
import { LabConfigForm } from '@/components/domain/lab-config-form';
import { RegenerateReportsButton } from '@/components/domain/regenerate-reports-button';
import { EmptyState } from '@/components/layout/empty-state';
import { PageHeader } from '@/components/layout/page-header';
import { getServerApi } from '@/lib/api/server';
import type { LabConfig } from '@/lib/api/types';
import { getSessionUser } from '@/lib/auth/session';
import { Lock } from 'lucide-react';

export const dynamic = 'force-dynamic';

async function fetchConfig(): Promise<LabConfig | null> {
  try {
    const api = await getServerApi();
    const { data } = await api.get<LabConfig>('/lab-config');
    return data;
  } catch {
    return null;
  }
}

export default async function ConfigLabPage() {
  const user = await getSessionUser();
  if (user?.role !== 'admin') {
    return (
      <div>
        <PageHeader title="Configuración del laboratorio" />
        <EmptyState icon={Lock} title="Solo administradores" />
      </div>
    );
  }

  const config = await fetchConfig();

  return (
    <div>
      <PageHeader
        title="Configuración del laboratorio"
        description="Datos legales, firma profesional y branding usados en los informes."
      />
      {config ? (
        <>
          <LabConfigForm config={config} />

          <LabAssetsUpload config={config} />

          <section className="mt-8 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6 shadow-[var(--shadow-xs)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-xl">
                <h2 className="font-semibold text-[var(--color-fg)] text-base">
                  Regenerar informes emitidos
                </h2>
                <p className="mt-1 text-[var(--color-fg-muted)] text-sm">
                  Si cambiaste datos del laboratorio (razón social, firma, logo), los PDF ya
                  emitidos siguen con los datos viejos. Esto los vuelve a generar con la config
                  actual. Pide confirmación antes de ejecutar.
                </p>
              </div>
              <RegenerateReportsButton />
            </div>
          </section>
        </>
      ) : (
        <EmptyState
          icon={Lock}
          title="No se pudo cargar la configuración"
          description="Revisá la conexión con el back."
        />
      )}
    </div>
  );
}
