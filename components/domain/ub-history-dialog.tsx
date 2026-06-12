'use client';

import { MoneyDisplay } from '@/components/domain/money-display';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { apiClient } from '@/lib/api/client';
import type { UbHistoryItem } from '@/lib/api/types';
import { useQuery } from '@tanstack/react-query';
import { History, Loader2 } from 'lucide-react';
import { useState } from 'react';

type Props = { insurerId: number; insurerName: string };

export function UbHistoryDialog({ insurerId, insurerName }: Props) {
  const [open, setOpen] = useState(false);

  const { data = [], isLoading } = useQuery({
    queryKey: ['insurers', insurerId, 'ub-history'],
    queryFn: async () => {
      const res = await apiClient.get<UbHistoryItem[]>(`/insurers/${insurerId}/ub-history`);
      return res.data;
    },
    enabled: open,
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <History className="h-3.5 w-3.5" strokeWidth={2} />
          Historial
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Historial UB · {insurerName}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <p className="flex items-center gap-2 text-[var(--color-fg-muted)] text-sm">
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
            Cargando…
          </p>
        ) : data.length === 0 ? (
          <p className="text-[var(--color-fg-subtle)] text-sm">Sin historial registrado.</p>
        ) : (
          <div className="max-h-[400px] overflow-auto rounded-md border border-[var(--color-border)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-[var(--color-border)] border-b bg-[var(--color-bg-subtle)] text-[10px] text-[var(--color-fg-muted)] uppercase tracking-wide">
                  <th className="px-4 py-2 text-left font-medium">Desde</th>
                  <th className="px-4 py-2 text-left font-medium">Hasta</th>
                  <th className="px-4 py-2 text-right font-medium">Valor</th>
                  <th className="px-4 py-2 text-left font-medium">Notas</th>
                </tr>
              </thead>
              <tbody>
                {data.map((h) => (
                  <tr key={h.id} className="border-[var(--color-border)] border-b last:border-b-0">
                    <td className="tabular px-4 py-2 font-mono text-[var(--color-fg)]">
                      {h.validFrom.slice(0, 10)}
                    </td>
                    <td className="tabular px-4 py-2 font-mono text-[var(--color-fg-muted)]">
                      {h.validTo ? h.validTo.slice(0, 10) : 'vigente'}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <MoneyDisplay value={h.value} className="text-xs" />
                    </td>
                    <td className="px-4 py-2 text-[var(--color-fg-muted)] text-xs">
                      {h.notes ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
