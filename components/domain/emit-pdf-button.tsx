'use client';

import { ConfirmDialog } from '@/components/domain/confirm-dialog';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api/client';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { FileText, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

function apiError(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const msg = err.response?.data?.message;
    if (Array.isArray(msg)) return msg.join('. ');
    if (typeof msg === 'string') return msg;
  }
  return fallback;
}

type Props = {
  orderId: number;
  label?: string;
};

export function EmitPdfButton({ orderId, label = 'Emitir informe' }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post<{ ok: boolean; path: string }>(`/reports/${orderId}/emit`);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Informe emitido');
      setOpen(false);
      router.refresh();
    },
    onError: (err) => toast.error(apiError(err, 'Error al emitir informe')),
  });

  return (
    <>
      <Button onClick={() => setOpen(true)} disabled={mutation.isPending}>
        {mutation.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
        ) : (
          <FileText className="h-4 w-4" strokeWidth={2} />
        )}
        {label}
      </Button>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="¿Emitir informe?"
        description="Se va a generar el PDF y la orden pasa a estado emitida. Asegurate de haber revisado todos los resultados."
        tone="warning"
        confirmLabel="Emitir"
        loading={mutation.isPending}
        onConfirm={async () => {
          await mutation.mutateAsync();
        }}
      />
    </>
  );
}
