import { MoneyDisplay } from '@/components/domain/money-display';
import { UbHistoryDialog } from '@/components/domain/ub-history-dialog';
import { UbValueDialog } from '@/components/domain/ub-value-dialog';
import { EmptyState } from '@/components/layout/empty-state';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { getServerApi } from '@/lib/api/server';
import type { InsurerWithUb } from '@/lib/api/types';
import { getSessionUser } from '@/lib/auth/session';
import { cn } from '@/lib/cn';
import { Plus, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

async function fetchInsurers(): Promise<InsurerWithUb[]> {
  try {
    const api = await getServerApi();
    const { data } = await api.get<InsurerWithUb[]>('/insurers/with-ub');
    return data;
  } catch {
    return [];
  }
}

export default async function ObrasSocialesPage() {
  const [rows, me] = await Promise.all([fetchInsurers(), getSessionUser()]);
  const isAdmin = me?.role === 'admin';

  return (
    <div>
      <PageHeader
        title="Obras sociales"
        description="Aseguradoras y convenios. El valor UB determina el precio de las cotizaciones."
        actions={
          <Button asChild>
            <Link href="/obras-sociales/nuevo">
              <Plus className="h-4 w-4" strokeWidth={2} />
              Nueva obra social
            </Link>
          </Button>
        }
      />

      {rows.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="Sin obras sociales cargadas"
          description="Creá la primera obra social para empezar."
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] shadow-[var(--shadow-xs)]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-[var(--color-border)] border-b bg-[var(--color-bg-subtle)] text-[10px] text-[var(--color-fg-muted)] uppercase tracking-wide">
                  <th className="px-5 py-2.5 text-left font-medium">Código</th>
                  <th className="px-5 py-2.5 text-left font-medium">Nombre</th>
                  <th className="px-5 py-2.5 text-right font-medium">Valor UB</th>
                  <th className="px-5 py-2.5 text-left font-medium">Vigente desde</th>
                  <th className="px-5 py-2.5 text-left font-medium">Autorización</th>
                  <th className="px-5 py-2.5 text-left font-medium">Estado</th>
                  <th className="px-5 py-2.5 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((i) => (
                  <tr
                    key={i.id}
                    className="border-[var(--color-border)] border-b last:border-b-0 hover:bg-[var(--color-bg-subtle)]"
                  >
                    <td className="tabular px-5 py-3 font-mono text-[var(--color-fg)]">{i.code}</td>
                    <td className="px-5 py-3 font-medium text-[var(--color-fg)]">{i.name}</td>
                    <td className="px-5 py-3 text-right">
                      {i.currentUbValue ? (
                        <MoneyDisplay value={i.currentUbValue} emphasis className="text-xs" />
                      ) : (
                        <span className="text-xs text-[var(--color-warning)]">Sin valor UB</span>
                      )}
                    </td>
                    <td className="tabular px-5 py-3 font-mono text-[var(--color-fg-muted)] text-xs">
                      {i.currentUbValidFrom ? i.currentUbValidFrom.slice(0, 10) : '—'}
                    </td>
                    <td className="px-5 py-3 text-[var(--color-fg-muted)]">
                      {i.requiresAuthorization ? 'Requerida' : 'No requiere'}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-md border px-2 py-0.5 font-medium text-[10px] uppercase tracking-wide',
                          i.active
                            ? 'border-[var(--color-success)]/15 bg-[var(--color-success-soft)] text-[var(--color-success)]'
                            : 'border-[var(--color-fg-subtle)]/15 bg-[var(--color-bg-subtle)] text-[var(--color-fg-muted)]',
                        )}
                      >
                        {i.active ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isAdmin && (
                          <>
                            <UbHistoryDialog insurerId={i.id} insurerName={i.name} />
                            <UbValueDialog insurer={i} />
                          </>
                        )}
                        <Link
                          href={`/obras-sociales/${i.id}`}
                          className="font-medium text-[var(--color-primary)] text-xs hover:underline"
                        >
                          Editar
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
