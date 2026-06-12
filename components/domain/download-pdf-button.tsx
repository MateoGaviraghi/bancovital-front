'use client';

import { StalePdfDialog } from '@/components/domain/stale-pdf-dialog';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api/client';
import type { SignedUrlResponse } from '@/lib/api/types';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { Download, Loader2 } from 'lucide-react';
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

/** Abre el PDF en pestaña nueva; si el navegador la bloquea, ofrece un toast con acción directa. */
function openPdf(url: string, withFallback: boolean) {
  const win = window.open(url, '_blank', 'noopener,noreferrer');
  if (!win && withFallback) {
    toast('PDF listo', {
      description: 'El navegador bloqueó la ventana emergente.',
      action: {
        label: 'Abrir PDF',
        onClick: () => window.open(url, '_blank', 'noopener,noreferrer'),
      },
      duration: 10_000,
    });
  }
}

type Props = {
  orderId: number;
  ttlSeconds?: number;
  label?: string;
  variant?: 'default' | 'outline';
  /** Compact inline style for table cells. */
  compact?: boolean;
};

export function DownloadPdfButton({
  orderId,
  ttlSeconds = 900,
  label = 'Descargar PDF',
  variant = 'default',
  compact = false,
}: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [staleUrl, setStaleUrl] = useState<string | null>(null);

  async function fetchSignedUrl(): Promise<SignedUrlResponse> {
    const res = await apiClient.get<SignedUrlResponse>(`/reports/${orderId}/signed-url`, {
      params: { ttlSeconds },
    });
    return res.data;
  }

  const mutation = useMutation({
    mutationFn: fetchSignedUrl,
    onSuccess: (data) => {
      if (data.stale) {
        // No abrir aún: preguntar si imprimir viejo o actualizar.
        setStaleUrl(data.url);
        setDialogOpen(true);
        return;
      }
      // Comportamiento actual (no-stale): abrir directo, sin alerta.
      if (data.regenerated) toast.info('PDF regenerado automáticamente');
      openPdf(data.url, false);
    },
    onError: (err) => toast.error(apiError(err, 'No se pudo obtener el PDF')),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post(`/reports/${orderId}/regenerate`);
      return fetchSignedUrl();
    },
    onSuccess: (data) => {
      setDialogOpen(false);
      setStaleUrl(null);
      toast.success('Informe actualizado');
      openPdf(data.url, true);
    },
    onError: (err) => toast.error(apiError(err, 'No se pudo actualizar el informe')),
  });

  function handleUseOld() {
    if (!staleUrl) return;
    const url = staleUrl;
    setDialogOpen(false);
    setStaleUrl(null);
    openPdf(url, false);
  }

  const dialog = (
    <StalePdfDialog
      open={dialogOpen}
      onOpenChange={(o) => {
        setDialogOpen(o);
        if (!o) setStaleUrl(null);
      }}
      loading={updateMutation.isPending}
      onUseOld={handleUseOld}
      onUpdate={() => updateMutation.mutate()}
    />
  );

  if (compact) {
    return (
      <>
        <button
          type="button"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          title="Descargar PDF"
          className="inline-flex h-7 items-center gap-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-2 text-[var(--color-fg)] text-xs transition-colors hover:bg-[var(--color-bg-subtle)] disabled:opacity-50"
        >
          {mutation.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
          ) : (
            <Download className="h-3.5 w-3.5" strokeWidth={2} />
          )}
          PDF
        </button>
        {dialog}
      </>
    );
  }

  return (
    <>
      <Button variant={variant} onClick={() => mutation.mutate()} disabled={mutation.isPending}>
        {mutation.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
        ) : (
          <Download className="h-4 w-4" strokeWidth={2} />
        )}
        {label}
      </Button>
      {dialog}
    </>
  );
}
