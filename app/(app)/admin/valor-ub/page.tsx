import { MoneyDisplay } from '@/components/domain/money-display';
import { UbHistoryDialog } from '@/components/domain/ub-history-dialog';
import { UbValueDialog } from '@/components/domain/ub-value-dialog';
import { EmptyState } from '@/components/layout/empty-state';
import { PageHeader } from '@/components/layout/page-header';
import { getServerApi } from '@/lib/api/server';
import type { InsurerWithUb } from '@/lib/api/types';
import { getSessionUser } from '@/lib/auth/session';
import { DollarSign, Lock } from 'lucide-react';

export const dynamic = 'force-dynamic';

async function fetchInsurersWithUb(): Promise<InsurerWithUb[]> {
  try {
    const api = await getServerApi();
    const { data } = await api.get<InsurerWithUb[]>('/insurers/with-ub');
    return data;
  } catch {
    return [];
  }
}

export default async function ValorUbPage() {
  const me = await getSessionUser();
  if (me?.role !== 'admin') {
    return (
      <div>
        <PageHeader title="Valor UB" />
        <EmptyState icon={Lock} title="Solo administradores" />
      </div>
    );
  }

  const rows = await fetchInsurersWithUb();

  return (
    <div>
      <PageHeader
        title="Valor UB"
        description="Unidad bioquímica por obra social. Cada cambio queda registrado en el historial."
      />

      {rows.length === 0 ? (
        <EmptyState
          icon={DollarSign}
          title="Sin obras sociales"
          description="Creá obras sociales antes de cargar valores UB."
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] shadow-[var(--shadow-xs)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-[var(--color-border)] border-b bg-[var(--color-bg-subtle)] text-[10px] text-[var(--color-fg-muted)] uppercase tracking-wide">
                <th className="px-5 py-2.5 text-left font-medium">Código</th>
                <th className="px-5 py-2.5 text-left font-medium">Obra social</th>
                <th className="px-5 py-2.5 text-right font-medium">Valor UB</th>
                <th className="px-5 py-2.5 text-left font-medium">Vigente desde</th>
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
                  <td className="px-5 py-3 text-[var(--color-fg)]">{i.name}</td>
                  <td className="px-5 py-3 text-right">
                    <MoneyDisplay value={i.currentUbValue} emphasis className="text-xs" />
                  </td>
                  <td className="tabular px-5 py-3 font-mono text-[var(--color-fg-muted)] text-xs">
                    {i.currentUbValidFrom ? i.currentUbValidFrom.slice(0, 10) : '—'}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <UbHistoryDialog insurerId={i.id} insurerName={i.name} />
                      <UbValueDialog insurer={i} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
