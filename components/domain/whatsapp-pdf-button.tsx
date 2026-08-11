'use client';

import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api/client';
import type { Patient, SignedUrlResponse } from '@/lib/api/types';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { Loader2, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

function apiError(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const msg = err.response?.data?.message;
    if (Array.isArray(msg)) return msg.join('. ');
    if (typeof msg === 'string') return msg;
  }
  return fallback;
}

/** Limpia el teléfono y lo convierte a formato internacional argentino para wa.me */
function toWhatsAppNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('54')) return digits;
  if (digits.startsWith('0')) return `54${digits.slice(1)}`;
  return `54${digits}`;
}

type Props = {
  orderId: number;
  patientId: number;
  variant?: 'default' | 'outline';
};

export function WhatsAppPdfButton({ orderId, patientId, variant = 'outline' }: Props) {
  const mutation = useMutation({
    mutationFn: async () => {
      const [pdfRes, patientRes] = await Promise.all([
        apiClient.get<SignedUrlResponse>(`/reports/${orderId}/signed-url`, {
          params: { ttlSeconds: 86400 },
        }),
        apiClient.get<Patient>(`/patients/${patientId}`),
      ]);
      return { pdf: pdfRes.data, patient: patientRes.data };
    },
    onSuccess: ({ pdf, patient }) => {
      if (!patient.phone) {
        toast.error('El paciente no tiene teléfono cargado');
        return;
      }
      const phone = toWhatsAppNumber(patient.phone);
      const text = encodeURIComponent(`Informe de laboratorio:\n${pdf.url}`);
      const url = `https://wa.me/${phone}?text=${text}`;
      const win = window.open(url, '_blank', 'noopener,noreferrer');
      if (!win) {
        toast('Enlace generado', {
          description: 'El navegador bloqueó la ventana emergente.',
          action: { label: 'Abrir', onClick: () => window.open(url, '_blank', 'noopener,noreferrer') },
          duration: 10_000,
        });
      }
    },
    onError: (err) => toast.error(apiError(err, 'No se pudo enviar el informe')),
  });

  return (
    <Button variant={variant} onClick={() => mutation.mutate()} disabled={mutation.isPending}>
      {mutation.isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
      ) : (
        <MessageCircle className="h-4 w-4" strokeWidth={2} />
      )}
      Enviar por WhatsApp
    </Button>
  );
}
