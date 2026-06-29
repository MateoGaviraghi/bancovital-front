'use client';

import { SolicitanteAguaCombobox } from '@/components/domain/solicitante-agua-combobox';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { apiClient } from '@/lib/api/client';
import type { CreateMuestraAguaDto, MuestraAgua, SolicitanteAgua } from '@/lib/api/types';
import { MOTIVOS_ANALISIS_AGUA, TIPOS_MUESTRA_AGUA } from '@/lib/api/types';
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
  onCreated: (m: MuestraAgua) => void;
};

export function CreateMuestraAguaDialog({ open, onOpenChange, onCreated }: Props) {
  const qc = useQueryClient();
  const [solicitante, setSolicitante] = useState<SolicitanteAgua | null>(null);
  const [form, setForm] = useState<Omit<CreateMuestraAguaDto, 'solicitanteId'>>({
    fechaToma: '',
    fechaRecepcion: '',
    tipoMuestra: '',
    lugarToma: '',
    descripcionPunto: '',
    direccionPunto: '',
    localidadPunto: '',
    motivoAnalisis: '',
    recipienteAdecuado: false,
    recipienteEsteril: false,
    conservacionTransporte: '',
    volumenRecibido: '',
    muestraApta: true,
    observacionesRecepcion: '',
    analisisFisicoquimico: false,
    analisisMicrobiologico: false,
    observaciones: '',
  });

  const mut = useMutation({
    mutationFn: (dto: CreateMuestraAguaDto) =>
      apiClient.post<MuestraAgua>('/muestras-agua', dto).then((r) => r.data),
    onSuccess: (created) => {
      toast.success('Muestra creada');
      qc.invalidateQueries({ queryKey: ['muestras-agua'] });
      onCreated(created);
      onOpenChange(false);
    },
    onError: (err) => toast.error(apiError(err, 'Error al crear muestra')),
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const canSubmit =
    solicitante && form.fechaToma && form.fechaRecepcion && form.tipoMuestra && form.motivoAnalisis;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva muestra</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div>
            <h3 className="mb-3 font-semibold text-sm text-[var(--color-fg)]">
              Datos de la muestra
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField label="Solicitante" htmlFor="nm-sol" required>
                <SolicitanteAguaCombobox
                  id="nm-sol"
                  value={solicitante}
                  onChange={setSolicitante}
                />
              </FormField>
              <FormField label="Tipo de muestra" htmlFor="nm-tipo" required>
                <Select value={form.tipoMuestra} onValueChange={(v) => set('tipoMuestra', v)}>
                  <SelectTrigger id="nm-tipo">
                    <SelectValue placeholder="Seleccionar…" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_MUESTRA_AGUA.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Fecha y hora de toma" htmlFor="nm-ft" required>
                <Input
                  id="nm-ft"
                  type="datetime-local"
                  value={form.fechaToma}
                  onChange={(e) => set('fechaToma', e.target.value)}
                />
              </FormField>
              <FormField label="Fecha y hora de recepción" htmlFor="nm-fr" required>
                <Input
                  id="nm-fr"
                  type="datetime-local"
                  value={form.fechaRecepcion}
                  onChange={(e) => set('fechaRecepcion', e.target.value)}
                />
              </FormField>
              <FormField label="Lugar de toma" htmlFor="nm-lugar">
                <Input
                  id="nm-lugar"
                  value={form.lugarToma ?? ''}
                  onChange={(e) => set('lugarToma', e.target.value)}
                  placeholder="Ej: Pozo 1, Tanque principal..."
                />
              </FormField>
              <FormField label="Motivo del análisis" htmlFor="nm-motivo" required>
                <Select value={form.motivoAnalisis} onValueChange={(v) => set('motivoAnalisis', v)}>
                  <SelectTrigger id="nm-motivo">
                    <SelectValue placeholder="Seleccionar…" />
                  </SelectTrigger>
                  <SelectContent>
                    {MOTIVOS_ANALISIS_AGUA.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Dirección del punto" htmlFor="nm-dir">
                <Input
                  id="nm-dir"
                  value={form.direccionPunto ?? ''}
                  onChange={(e) => set('direccionPunto', e.target.value)}
                />
              </FormField>
              <FormField label="Localidad" htmlFor="nm-loc">
                <Input
                  id="nm-loc"
                  value={form.localidadPunto ?? ''}
                  onChange={(e) => set('localidadPunto', e.target.value)}
                />
              </FormField>
              <FormField label="Descripción del punto" htmlFor="nm-desc" className="md:col-span-2">
                <Textarea
                  id="nm-desc"
                  rows={2}
                  value={form.descripcionPunto ?? ''}
                  onChange={(e) => set('descripcionPunto', e.target.value)}
                />
              </FormField>
            </div>
          </div>

          <div>
            <h3 className="mb-3 font-semibold text-sm text-[var(--color-fg)]">Condiciones</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="nm-ra"
                  checked={form.recipienteAdecuado}
                  onCheckedChange={(v) => set('recipienteAdecuado', v === true)}
                />
                <label htmlFor="nm-ra" className="cursor-pointer text-sm">
                  Recipiente adecuado
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="nm-re"
                  checked={form.recipienteEsteril}
                  onCheckedChange={(v) => set('recipienteEsteril', v === true)}
                />
                <label htmlFor="nm-re" className="cursor-pointer text-sm">
                  Recipiente estéril
                </label>
              </div>
              <FormField label="Conservación transporte" htmlFor="nm-cons">
                <Input
                  id="nm-cons"
                  value={form.conservacionTransporte ?? ''}
                  onChange={(e) => set('conservacionTransporte', e.target.value)}
                />
              </FormField>
              <FormField label="Volumen recibido" htmlFor="nm-vol">
                <Input
                  id="nm-vol"
                  value={form.volumenRecibido ?? ''}
                  onChange={(e) => set('volumenRecibido', e.target.value)}
                />
              </FormField>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="nm-apta"
                  checked={form.muestraApta}
                  onCheckedChange={(v) => set('muestraApta', v === true)}
                />
                <label htmlFor="nm-apta" className="cursor-pointer text-sm">
                  Muestra apta para análisis
                </label>
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-3 font-semibold text-sm text-[var(--color-fg)]">
              Análisis solicitados
            </h3>
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="nm-fq"
                  checked={form.analisisFisicoquimico}
                  onCheckedChange={(v) => set('analisisFisicoquimico', v === true)}
                />
                <label htmlFor="nm-fq" className="cursor-pointer text-sm">
                  Físico-químico
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="nm-mb"
                  checked={form.analisisMicrobiologico}
                  onCheckedChange={(v) => set('analisisMicrobiologico', v === true)}
                />
                <label htmlFor="nm-mb" className="cursor-pointer text-sm">
                  Microbiológico
                </label>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={mut.isPending}>
            Cancelar
          </Button>
          <Button
            onClick={() => mut.mutate({ ...form, solicitanteId: solicitante!.id })}
            disabled={!canSubmit || mut.isPending}
          >
            {mut.isPending && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />}
            Crear muestra
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
