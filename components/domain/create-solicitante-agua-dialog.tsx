'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/api/client';
import type { CreateSolicitanteAguaDto, SolicitanteAgua } from '@/lib/api/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Loader2 } from 'lucide-react';
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
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: (s: SolicitanteAgua) => void;
};

export function CreateSolicitanteAguaDialog({ open, onOpenChange, onCreated }: Props) {
  const qc = useQueryClient();
  const [form, setForm] = useState<CreateSolicitanteAguaDto>({
    nombreApellido: '',
    razonSocial: '',
    cuit: '',
    domicilio: '',
    localidad: '',
    provincia: '',
    telefono: '',
    email: '',
  });

  const mut = useMutation({
    mutationFn: (dto: CreateSolicitanteAguaDto) =>
      apiClient.post<SolicitanteAgua>('/solicitantes-agua', dto).then((r) => r.data),
    onSuccess: (created) => {
      toast.success('Solicitante creado');
      qc.invalidateQueries({ queryKey: ['solicitantes-agua'] });
      onCreated(created);
      onOpenChange(false);
      setForm({ nombreApellido: '' });
    },
    onError: (err) => toast.error(apiError(err, 'Error al crear solicitante')),
  });

  function set(key: keyof CreateSolicitanteAguaDto, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo solicitante</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField label="Nombre y apellido" htmlFor="ns-nombre" required>
            <Input
              id="ns-nombre"
              value={form.nombreApellido}
              onChange={(e) => set('nombreApellido', e.target.value)}
            />
          </FormField>
          <FormField label="Razón social" htmlFor="ns-razon">
            <Input
              id="ns-razon"
              value={form.razonSocial ?? ''}
              onChange={(e) => set('razonSocial', e.target.value)}
            />
          </FormField>
          <FormField label="CUIT/CUIL" htmlFor="ns-cuit">
            <Input
              id="ns-cuit"
              value={form.cuit ?? ''}
              onChange={(e) => set('cuit', e.target.value)}
            />
          </FormField>
          <FormField label="Domicilio" htmlFor="ns-dom">
            <Input
              id="ns-dom"
              value={form.domicilio ?? ''}
              onChange={(e) => set('domicilio', e.target.value)}
            />
          </FormField>
          <FormField label="Localidad" htmlFor="ns-loc">
            <Input
              id="ns-loc"
              value={form.localidad ?? ''}
              onChange={(e) => set('localidad', e.target.value)}
            />
          </FormField>
          <FormField label="Provincia" htmlFor="ns-prov">
            <Input
              id="ns-prov"
              value={form.provincia ?? ''}
              onChange={(e) => set('provincia', e.target.value)}
            />
          </FormField>
          <FormField label="Teléfono" htmlFor="ns-tel">
            <Input
              id="ns-tel"
              value={form.telefono ?? ''}
              onChange={(e) => set('telefono', e.target.value)}
            />
          </FormField>
          <FormField label="Correo electrónico" htmlFor="ns-email">
            <Input
              id="ns-email"
              type="email"
              value={form.email ?? ''}
              onChange={(e) => set('email', e.target.value)}
            />
          </FormField>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={mut.isPending}>
            Cancelar
          </Button>
          <Button
            onClick={() => mut.mutate(form)}
            disabled={!form.nombreApellido.trim() || mut.isPending}
          >
            {mut.isPending && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />}
            Crear
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
