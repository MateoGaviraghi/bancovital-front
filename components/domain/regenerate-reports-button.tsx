'use client';

import { ConfirmDialog } from '@/components/domain/confirm-dialog';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api/client';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { Loader2, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

type RegenerateSummary = {
  total: number;
  regenerated: number;
  failures: Array<{ orderId: number; error: string }>;
};

function apiError(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const msg = err.response?.data?.message;
    if (Array.isArray(msg)) return msg.join('. ');
    if (typeof msg === 'string') return msg;
  }
  return fallback;
}

export function RegenerateReportsButton() {
  const [open, setOpen] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post<RegenerateSummary>('/reports/regenerate-all');
      return res.data;
    },
    onSuccess: (r) => {
      setOpen(false);
      if (r.failures.length > 0) {
        toast.warning(
          `${r.regenerated}/${r.total} informes regenerados · ${r.failures.length} con error`,
        );
      } else if (r.total === 0) {
        toast.info('No hay informes emitidos para regenerar');
      } else {
        toast.success(`${r.regenerated}/${r.total} informes regenerados`);
      }
    },
    onError: (err) => toast.error(apiError(err, 'Error al regenerar informes')),
  });

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)} disabled={mutation.isPending}>
        {mutation.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
        ) : (
          <RefreshCw className="h-4 w-4" strokeWidth={2} />
        )}
        Regenerar todos los informes
      </Button>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="¿Regenerar todos los informes?"
        description="Vuelve a generar el PDF de TODAS las órdenes ya emitidas usando la configuración actual del laboratorio (razón social, firma, logo). Puede tardar según la cantidad de órdenes. No afecta resultados ni estados."
        tone="warning"
        confirmLabel="Regenerar todo"
        loading={mutation.isPending}
        onConfirm={async () => {
          await mutation.mutateAsync();
        }}
      />
    </>
  );
}
