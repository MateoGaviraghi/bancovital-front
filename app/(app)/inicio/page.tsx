import { ConsumoCard } from '@/components/domain/consumo-card';
import { MoneyDisplay } from '@/components/domain/money-display';
import { StatusPill } from '@/components/domain/status-pill';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { getServerApi } from '@/lib/api/server';
import type { OrderListItem, OrderStatus, Patient, Practice } from '@/lib/api/types';
import { getSessionUser } from '@/lib/auth/session';
import { cn } from '@/lib/cn';
import { ClipboardList, FlaskConical, Plus, TrendingUp, Users } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const AR_DATE = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Argentina/Buenos_Aires',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function arDateKey(d: string | Date): string {
  return AR_DATE.format(typeof d === 'string' ? new Date(d) : d);
}

function isToday(d: string | Date): boolean {
  return arDateKey(d) === arDateKey(new Date());
}

function fmtDate(d: string | Date): string {
  const [yyyy, mm, dd] = arDateKey(d).split('-');
  return `${dd}/${mm}/${yyyy}`;
}

async function loadDashboard() {
  try {
    const api = await getServerApi();
    const [ordersRes, patientsRes, practicesRes] = await Promise.all([
      api.get<OrderListItem[]>('/orders', { params: { limit: 200 } }),
      api.get<Patient[]>('/patients', { params: { limit: 200 } }),
      api.get<Practice[]>('/practices', { params: { limit: 200 } }),
    ]);
    return {
      orders: ordersRes.data,
      patientCount: patientsRes.data.length,
      practiceCount: practicesRes.data.length,
    };
  } catch {
    return { orders: [] as OrderListItem[], patientCount: 0, practiceCount: 0 };
  }
}

function KpiCard({
  icon: Icon,
  label,
  value,
  accent = false,
}: {
  icon: typeof ClipboardList;
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-5 shadow-[var(--shadow-xs)]',
        accent && 'border-l-[3px] border-l-[var(--color-primary)]',
      )}
    >
      <div className="flex items-start justify-between">
        <p className="font-medium text-[10px] text-[var(--color-fg-muted)] uppercase tracking-[0.12em]">
          {label}
        </p>
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        </div>
      </div>
      <p className="tabular mt-3 font-mono font-semibold text-2xl text-[var(--color-fg)] tracking-tight">
        {value}
      </p>
    </div>
  );
}

export default async function HomePage() {
  const user = await getSessionUser();
  const canCreate = user?.role === 'admin' || user?.role === 'bioquimico';
  const { orders, patientCount, practiceCount } = await loadDashboard();

  const ordersToday = orders.filter((o) => isToday(o.orderDate)).length;
  const recent = orders.slice(0, 8);

  const byStatus = orders.reduce(
    (acc, o) => {
      acc[o.status] = (acc[o.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<OrderStatus, number>,
  );
  const statusEntries = (Object.entries(byStatus) as [OrderStatus, number][]).sort(
    (a, b) => b[1] - a[1],
  );

  return (
    <>
      <PageHeader
        title="Inicio"
        description={`${ordersToday} ${ordersToday === 1 ? 'orden' : 'órdenes'} hoy · ${orders.length} en total`}
        actions={
          canCreate && (
            <Button asChild>
              <Link href="/ordenes/nueva">
                <Plus className="h-4 w-4" strokeWidth={2} />
                Nueva orden
              </Link>
            </Button>
          )
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={ClipboardList} label="Órdenes hoy" value={ordersToday} accent />
        <KpiCard icon={TrendingUp} label="Órdenes totales" value={orders.length} />
        <KpiCard icon={Users} label="Pacientes" value={patientCount} />
        <KpiCard icon={FlaskConical} label="Prácticas en catálogo" value={practiceCount} />
      </div>

      <div className="mb-6">
        <ConsumoCard />
      </div>

      <section className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] shadow-[var(--shadow-xs)]">
        <div className="flex items-center justify-between border-[var(--color-border)] border-b px-5 py-3">
          <h2 className="font-semibold text-[var(--color-fg)] text-sm">Órdenes recientes</h2>
          <Link href="/ordenes" className="text-[var(--color-primary)] text-xs hover:underline">
            Ver todas
          </Link>
        </div>

        {statusEntries.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-[var(--color-border)] border-b bg-[var(--color-bg-subtle)] px-5 py-2.5">
            {statusEntries.map(([status, count]) => (
              <span key={status} className="inline-flex items-center gap-1.5">
                <StatusPill status={status} />
                <span className="tabular font-medium font-mono text-[var(--color-fg)] text-xs">
                  {count}
                </span>
              </span>
            ))}
          </div>
        )}

        {recent.length === 0 ? (
          <p className="px-5 py-10 text-center text-[var(--color-fg-muted)] text-sm">
            Sin órdenes todavía.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-[var(--color-border)] border-b bg-[var(--color-bg-subtle)] text-[10px] text-[var(--color-fg-muted)] uppercase tracking-wide">
                  <th className="px-5 py-2.5 text-left font-medium">Protocolo</th>
                  <th className="px-5 py-2.5 text-left font-medium">Paciente</th>
                  <th className="px-5 py-2.5 text-left font-medium">Obra social</th>
                  <th className="px-5 py-2.5 text-left font-medium">Fecha</th>
                  <th className="px-5 py-2.5 text-right font-medium">$ Particular</th>
                  <th className="px-5 py-2.5 text-left font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((o) => (
                  <tr
                    key={o.id}
                    className="border-[var(--color-border)] border-b transition-colors last:border-0 hover:bg-[var(--color-bg-subtle)]"
                  >
                    <td className="tabular px-5 py-3 font-mono text-xs">
                      <Link
                        href={`/ordenes/${o.id}`}
                        className="text-[var(--color-primary)] hover:underline"
                      >
                        #{String(o.protocolNumber).padStart(5, '0')}
                      </Link>
                      {o.isUrgent && (
                        <span
                          className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-danger)] align-middle"
                          title="Urgente"
                        />
                      )}
                    </td>
                    <td className="px-5 py-3 text-[var(--color-fg)]">
                      {o.patient.lastName}, {o.patient.firstName}
                    </td>
                    <td className="px-5 py-3 text-[var(--color-fg-muted)] text-xs">
                      {o.insurer.name}
                    </td>
                    <td className="tabular px-5 py-3 font-mono text-[var(--color-fg-muted)] text-xs">
                      {fmtDate(o.orderDate)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <MoneyDisplay value={o.totalParticular} />
                    </td>
                    <td className="px-5 py-3">
                      <StatusPill status={o.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
