'use client';

import { apiClient } from '@/lib/api/client';
import axios from 'axios';
import { Download, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export function DownloadFichaButton({
  orderId,
  protocolNumber,
}: { orderId: number; protocolNumber: number }) {
  const [loading, setLoading] = useState(false);

  async function download() {
    setLoading(true);
    try {
      const res = await apiClient.get<Blob>(`/reports/${orderId}/ficha`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ficha-${String(protocolNumber).padStart(8, '0')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      let msg = 'No se pudo generar la ficha PDF';
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        if (status === 404) msg = 'Orden no encontrada';
        else if (status === 403) msg = 'Sin permisos para generar la ficha';
        else if (status) msg = `Error del servidor (${status})`;
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3 border-[var(--color-border)] border-b bg-[var(--color-bg-elevated)] px-6 py-3">
      <button
        type="button"
        onClick={download}
        disabled={loading}
        className="inline-flex items-center gap-1.5 rounded-md bg-[var(--color-primary)] px-3 py-1.5 font-medium text-[var(--color-primary-foreground)] text-sm hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
        ) : (
          <Download className="h-4 w-4" strokeWidth={2} />
        )}
        Descargar ficha PDF
      </button>
      <button
        type="button"
        onClick={() => window.close()}
        className="inline-flex items-center gap-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5 text-[var(--color-fg)] text-sm hover:bg-[var(--color-bg-subtle)]"
      >
        Cerrar
      </button>
    </div>
  );
}
