'use client';

import { ResultRow } from '@/components/domain/result-row';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api/client';
import type { OrderStatus, ResultLine } from '@/lib/api/types';
import { Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useRef, useState } from 'react';

type Props = {
  lines: ResultLine[];
  orderId: number;
  orderStatus: OrderStatus;
};

const EDITABLE_STATUSES: OrderStatus[] = [
  'borrador',
  'confirmada',
  'en_proceso',
  'resultados_cargados',
];

export function ResultsForm({ lines, orderId, orderStatus }: Props) {
  const router = useRouter();
  const editable = EDITABLE_STATUSES.includes(orderStatus);

  const [dirtyCount, setDirtyCount] = useState(0);
  const [saveTrigger, setSaveTrigger] = useState(0);

  // Shared one-time confirm: all rows that call ensureConfirmed() simultaneously
  // share the same promise — only one PATCH /confirm goes out.
  const confirmPromiseRef = useRef<Promise<void> | null>(null);
  const wasConfirmedRef = useRef(false);

  const ensureConfirmed = useCallback(async () => {
    if (orderStatus !== 'borrador') return;
    if (!confirmPromiseRef.current) {
      confirmPromiseRef.current = apiClient
        .patch(`/orders/${orderId}/confirm`)
        .then(() => {
          wasConfirmedRef.current = true;
        })
        .catch((err) => {
          confirmPromiseRef.current = null;
          throw err;
        });
    }
    await confirmPromiseRef.current;
  }, [orderId, orderStatus]);

  const handleDirtyChange = useCallback((id: number, isDirty: boolean) => {
    setDirtyCount((prev) => {
      const delta = isDirty ? 1 : -1;
      return Math.max(0, prev + delta);
    });
  }, []);

  const handleSaveSuccess = useCallback(() => {
    if (wasConfirmedRef.current) {
      wasConfirmedRef.current = false;
      router.refresh();
    }
  }, [router]);

  const reportable = lines.filter((l) => l.orderPractice.includeInReport);
  const excluded = lines.filter((l) => !l.orderPractice.includeInReport);

  return (
    <div className="space-y-6">
      {!editable && (
        <div className="rounded-md border border-[var(--color-warning)]/30 bg-[var(--color-warning-soft)] px-4 py-3 text-[var(--color-warning)] text-xs">
          La orden no admite cambios en estado <strong>{orderStatus}</strong>. Los valores se
          muestran como lectura.
        </div>
      )}

      {editable && (
        <div className="flex justify-end">
          <Button
            type="button"
            disabled={dirtyCount === 0}
            onClick={() => setSaveTrigger((t) => t + 1)}
          >
            <Save className="h-4 w-4" strokeWidth={2} />
            Guardar todo{dirtyCount > 0 ? ` (${dirtyCount})` : ''}
          </Button>
        </div>
      )}

      <section className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] shadow-[var(--shadow-xs)]">
        <header className="border-[var(--color-border)] border-b bg-[var(--color-bg-subtle)] px-5 py-2.5 font-medium text-[10px] text-[var(--color-fg-muted)] uppercase tracking-wide">
          Prácticas incluidas en informe ({reportable.length})
        </header>
        {reportable.length === 0 ? (
          <p className="px-5 py-6 text-[var(--color-fg-muted)] text-sm">
            Sin prácticas para reportar.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--color-border)]">
            {reportable.map((l) => (
              <ResultRow
                key={l.orderPractice.id}
                line={l}
                disabled={!editable}
                onBeforeSave={ensureConfirmed}
                saveTrigger={saveTrigger}
                onDirtyChange={handleDirtyChange}
                onSaveSuccess={handleSaveSuccess}
              />
            ))}
          </ul>
        )}
      </section>

      {excluded.length > 0 && (
        <section className="overflow-hidden rounded-lg border border-dashed border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)]">
          <header className="border-[var(--color-border)] border-b bg-[var(--color-bg-subtle)] px-5 py-2.5 font-medium text-[10px] text-[var(--color-fg-muted)] uppercase tracking-wide">
            Excluidas del informe ({excluded.length})
          </header>
          <ul className="divide-y divide-[var(--color-border)]">
            {excluded.map((l) => (
              <ResultRow
                key={l.orderPractice.id}
                line={l}
                disabled={!editable}
                onBeforeSave={ensureConfirmed}
                saveTrigger={saveTrigger}
                onDirtyChange={handleDirtyChange}
                onSaveSuccess={handleSaveSuccess}
              />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
