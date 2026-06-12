import { PracticeHierarchySection } from '@/components/domain/practice-hierarchy-section';
import { PracticeInlineField } from '@/components/domain/practice-inline-field';
import { PracticeUnidadesSection } from '@/components/domain/practice-unidades-section';
import { PageHeader } from '@/components/layout/page-header';
import { EditPracticeButton } from './edit-practice-button';
import { getServerApi } from '@/lib/api/server';
import type { Practice } from '@/lib/api/types';
import { cn } from '@/lib/cn';
import axios from 'axios';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

async function fetchPractice(id: number): Promise<Practice> {
  const api = await getServerApi();
  try {
    const { data } = await api.get<Practice>(`/practices/${id}`);
    return data;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) notFound();
    throw err;
  }
}

export default async function PracticaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numId = Number(id);
  if (!Number.isInteger(numId)) notFound();

  const practice = await fetchPractice(numId);

  return (
    <div className="space-y-6">
      <PageHeader
        title={practice.name}
        description={`NBU ${practice.nbuCode}${practice.shortName ? ` · ${practice.shortName}` : ''}`}
        actions={<EditPracticeButton practice={practice} />}
      />

      <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-5 shadow-[var(--shadow-xs)]">
        <h3 className="mb-3 font-semibold text-[var(--color-fg)] text-sm">Información</h3>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm md:grid-cols-2">
          <div className="flex justify-between gap-3">
            <dt className="text-[var(--color-fg-muted)]">Sección</dt>
            <dd className="text-[var(--color-fg)]">{practice.section ?? '—'}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-[var(--color-fg-muted)]">Categoría</dt>
            <dd className="text-[var(--color-fg)]">{practice.category ?? '—'}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-[var(--color-fg-muted)]">UB</dt>
            <dd className="tabular font-mono text-[var(--color-fg)]">{practice.units}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-[var(--color-fg-muted)]">Estado</dt>
            <dd>
              <span
                className={cn(
                  'inline-flex items-center rounded-md border px-2 py-0.5 font-medium text-[10px] uppercase tracking-wide',
                  practice.active
                    ? 'border-[var(--color-success)]/15 bg-[var(--color-success-soft)] text-[var(--color-success)]'
                    : 'border-[var(--color-fg-subtle)]/15 bg-[var(--color-bg-subtle)] text-[var(--color-fg-muted)]',
                )}
              >
                {practice.active ? 'Activa' : 'Inactiva'}
              </span>
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-[var(--color-fg-muted)]">Autorización</dt>
            <dd className="text-[var(--color-fg)]">
              {practice.requiresAuthorization ? 'Requerida' : 'No requerida'}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-[var(--color-fg-muted)]">Acto especial</dt>
            <dd className="text-[var(--color-fg)]">{practice.isSpecialAct ? 'Sí' : 'No'}</dd>
          </div>
          <PracticeInlineField
            practiceId={practice.id}
            field="notes"
            value={practice.notes}
            label="Notas internas"
            placeholder="Agregar notas internas…"
            rows={2}
          />
          <PracticeInlineField
            practiceId={practice.id}
            field="methodology"
            value={practice.methodology}
            label="Metodología"
            placeholder="Agregar metodología por defecto…"
            rows={2}
          />
          <PracticeInlineField
            practiceId={practice.id}
            field="referenceValue"
            value={practice.referenceValue}
            label="Valores de referencia"
            placeholder="Agregar valores de referencia orientativos…"
            rows={4}
          />
        </dl>
      </section>

      <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-5 shadow-[var(--shadow-xs)]">
        <PracticeHierarchySection practice={practice} />
      </section>

      <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-5 shadow-[var(--shadow-xs)]">
        <PracticeUnidadesSection practiceId={practice.id} />
      </section>
    </div>
  );
}
