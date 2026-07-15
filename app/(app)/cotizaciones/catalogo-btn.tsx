'use client';

import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api/client';
import axios from 'axios';
import { FileText, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export function CatalogoBtn() {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await apiClient.get('/cotizaciones/precios/pdf', {
        responseType: 'blob',
        timeout: 120_000,
      });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 30_000);
    } catch (err) {
      let msg = 'Error al generar el catálogo';
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        if (status === 404) msg = 'Endpoint no encontrado — actualizá el backend';
        else if (status === 500) msg = 'Error del servidor al generar el catálogo';
        else if (status) msg = `Error ${status} al generar el catálogo`;
      }
      toast.error(msg);
      console.error('[CatalogoBtn]', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button size="sm" variant="outline" onClick={handleClick} disabled={loading}>
      {loading ? (
        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
      ) : (
        <FileText className="mr-1.5 h-4 w-4" strokeWidth={2} />
      )}
      Imprimir catálogo
    </Button>
  );
}
