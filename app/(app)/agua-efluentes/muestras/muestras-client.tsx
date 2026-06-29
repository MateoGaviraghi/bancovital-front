'use client';

import { ConfirmDialog } from '@/components/domain/confirm-dialog';
import { Badge } from '@/components/ui/badge';
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
import { queries } from '@/lib/api/queries';
import type { CreateMuestraAguaDto, MuestraAgua, SolicitanteAgua } from '@/lib/api/types';
import { MOTIVOS_ANALISIS_AGUA, TIPOS_MUESTRA_AGUA } from '@/lib/api/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Droplets, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
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

const DATE_FMT = new Intl.DateTimeFormat('es-AR', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'America/Argentina/Buenos_Aires',
});

function MuestraDialog({
  open,
  onOpenChange,
  initial,
  solicitantes,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: MuestraAgua;
  solicitantes: SolicitanteAgua[];
}) {
  const qc = useQueryClient();
  const isEdit = !!initial;
  const [form, setForm] = useState<CreateMuestraAguaDto>({
    solicitanteId: initial?.solicitanteId ?? 0,
    fechaToma: initial?.fechaToma ? new Date(initial.fechaToma).toISOString().slice(0, 16) : '',
    fechaRecepcion: initial?.fechaRecepcion
      ? new Date(initial.fechaRecepcion).toISOString().slice(0, 16)
      : '',
    tipoMuestra: initial?.tipoMuestra ?? '',
    lugarToma: initial?.lugarToma ?? '',
    descripcionPunto: initial?.descripcionPunto ?? '',
    direccionPunto: initial?.direccionPunto ?? '',
    localidadPunto: initial?.localidadPunto ?? '',
    motivoAnalisis: initial?.motivoAnalisis ?? '',
    recipienteAdecuado: initial?.recipienteAdecuado ?? false,
    recipienteEsteril: initial?.recipienteEsteril ?? false,
    conservacionTransporte: initial?.conservacionTransporte ?? '',
    temperaturaRecepcion: initial?.temperaturaRecepcion
      ? Number(initial.temperaturaRecepcion)
      : undefined,
    volumenRecibido: initial?.volumenRecibido ?? '',
    muestraApta: initial?.muestraApta ?? true,
    observacionesRecepcion: initial?.observacionesRecepcion ?? '',
    analisisFisicoquimico: initial?.analisisFisicoquimico ?? false,
    analisisMicrobiologico: initial?.analisisMicrobiologico ?? false,
    observaciones: initial?.observaciones ?? '',
  });

  const mut = useMutation({
    mutationFn: (dto: CreateMuestraAguaDto) =>
      isEdit
        ? apiClient.patch(`/muestras-agua/${initial.id}`, dto)
        : apiClient.post('/muestras-agua', dto),
    onSuccess: () => {
      toast.success(isEdit ? 'Muestra actualizada' : 'Muestra creada');
      qc.invalidateQueries({ queryKey: queries.muestrasAgua.list() });
      onOpenChange(false);
    },
    onError: (err) => toast.error(apiError(err, 'Error al guardar muestra')),
  });

  function set<K extends keyof CreateMuestraAguaDto>(key: K, value: CreateMuestraAguaDto[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const canSubmit =
    form.solicitanteId > 0 &&
    form.fechaToma &&
    form.fechaRecepcion &&
    form.tipoMuestra &&
    form.motivoAnalisis;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar muestra' : 'Nueva muestra'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div>
            <h3 className="mb-3 font-semibold text-sm text-[var(--color-fg)]">
              Datos de la muestra
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField label="Solicitante" htmlFor="m-sol" required>
                <Select
                  value={form.solicitanteId ? String(form.solicitanteId) : ''}
                  onValueChange={(v) => set('solicitanteId', Number(v))}
                >
                  <SelectTrigger id="m-sol">
                    <SelectValue placeholder="Seleccionar…" />
                  </SelectTrigger>
                  <SelectContent>
                    {solicitantes.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.nombreApellido}
                        {s.razonSocial ? ` · ${s.razonSocial}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Tipo de muestra" htmlFor="m-tipo" required>
                <Select value={form.tipoMuestra} onValueChange={(v) => set('tipoMuestra', v)}>
                  <SelectTrigger id="m-tipo">
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
              <FormField label="Fecha y hora de toma" htmlFor="m-ftoma" required>
                <Input
                  id="m-ftoma"
                  type="datetime-local"
                  value={form.fechaToma}
                  onChange={(e) => set('fechaToma', e.target.value)}
                />
              </FormField>
              <FormField label="Fecha y hora de recepción" htmlFor="m-frec" required>
                <Input
                  id="m-frec"
                  type="datetime-local"
                  value={form.fechaRecepcion}
                  onChange={(e) => set('fechaRecepcion', e.target.value)}
                />
              </FormField>
              <FormField label="Lugar de toma" htmlFor="m-lugar">
                <Input
                  id="m-lugar"
                  value={form.lugarToma ?? ''}
                  onChange={(e) => set('lugarToma', e.target.value)}
                  placeholder="Ej: Pozo 1, Tanque principal..."
                />
              </FormField>
              <FormField label="Motivo del análisis" htmlFor="m-motivo" required>
                <Select value={form.motivoAnalisis} onValueChange={(v) => set('motivoAnalisis', v)}>
                  <SelectTrigger id="m-motivo">
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
              <FormField label="Descripción del punto" htmlFor="m-desc" className="md:col-span-2">
                <Textarea
                  id="m-desc"
                  rows={2}
                  value={form.descripcionPunto ?? ''}
                  onChange={(e) => set('descripcionPunto', e.target.value)}
                />
              </FormField>
              <FormField label="Dirección del punto" htmlFor="m-dir">
                <Input
                  id="m-dir"
                  value={form.direccionPunto ?? ''}
                  onChange={(e) => set('direccionPunto', e.target.value)}
                />
              </FormField>
              <FormField label="Localidad" htmlFor="m-loc">
                <Input
                  id="m-loc"
                  value={form.localidadPunto ?? ''}
                  onChange={(e) => set('localidadPunto', e.target.value)}
                />
              </FormField>
            </div>
          </div>

          <div>
            <h3 className="mb-3 font-semibold text-sm text-[var(--color-fg)]">
              Condiciones de la muestra
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="m-radec"
                  checked={form.recipienteAdecuado}
                  onCheckedChange={(v) => set('recipienteAdecuado', v === true)}
                />
                <label htmlFor="m-radec" className="cursor-pointer text-sm">
                  Recipiente adecuado
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="m-rest"
                  checked={form.recipienteEsteril}
                  onCheckedChange={(v) => set('recipienteEsteril', v === true)}
                />
                <label htmlFor="m-rest" className="cursor-pointer text-sm">
                  Recipiente estéril
                </label>
              </div>
              <FormField label="Conservación transporte" htmlFor="m-cons">
                <Input
                  id="m-cons"
                  value={form.conservacionTransporte ?? ''}
                  onChange={(e) => set('conservacionTransporte', e.target.value)}
                />
              </FormField>
              <FormField label="Temperatura al recibir (°C)" htmlFor="m-temp">
                <Input
                  id="m-temp"
                  type="number"
                  step="0.1"
                  value={form.temperaturaRecepcion ?? ''}
                  onChange={(e) =>
                    set('temperaturaRecepcion', e.target.value ? Number(e.target.value) : undefined)
                  }
                />
              </FormField>
              <FormField label="Volumen recibido" htmlFor="m-vol">
                <Input
                  id="m-vol"
                  value={form.volumenRecibido ?? ''}
                  onChange={(e) => set('volumenRecibido', e.target.value)}
                />
              </FormField>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="m-apta"
                  checked={form.muestraApta}
                  onCheckedChange={(v) => set('muestraApta', v === true)}
                />
                <label htmlFor="m-apta" className="cursor-pointer text-sm">
                  Muestra apta para análisis
                </label>
              </div>
              <FormField
                label="Observaciones de recepción"
                htmlFor="m-obsrec"
                className="md:col-span-2"
              >
                <Textarea
                  id="m-obsrec"
                  rows={2}
                  value={form.observacionesRecepcion ?? ''}
                  onChange={(e) => set('observacionesRecepcion', e.target.value)}
                />
              </FormField>
            </div>
          </div>

          <div>
            <h3 className="mb-3 font-semibold text-sm text-[var(--color-fg)]">
              Análisis solicitados
            </h3>
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="m-fq"
                  checked={form.analisisFisicoquimico}
                  onCheckedChange={(v) => set('analisisFisicoquimico', v === true)}
                />
                <label htmlFor="m-fq" className="cursor-pointer text-sm">
                  Físico-químico
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="m-mb"
                  checked={form.analisisMicrobiologico}
                  onCheckedChange={(v) => set('analisisMicrobiologico', v === true)}
                />
                <label htmlFor="m-mb" className="cursor-pointer text-sm">
                  Microbiológico
                </label>
              </div>
            </div>
          </div>

          <FormField label="Observaciones generales" htmlFor="m-obs">
            <Textarea
              id="m-obs"
              rows={2}
              value={form.observaciones ?? ''}
              onChange={(e) => set('observaciones', e.target.value)}
            />
          </FormField>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={mut.isPending}>
            Cancelar
          </Button>
          <Button onClick={() => mut.mutate(form)} disabled={!canSubmit || mut.isPending}>
            {mut.isPending && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />}
            {isEdit ? 'Guardar' : 'Crear muestra'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function MuestrasClient() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<MuestraAgua | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MuestraAgua | null>(null);

  const { data: muestras = [], isLoading } = useQuery({
    queryKey: queries.muestrasAgua.list(),
    queryFn: () => apiClient.get<MuestraAgua[]>('/muestras-agua').then((r) => r.data),
  });

  const { data: solicitantes = [] } = useQuery({
    queryKey: queries.solicitantesAgua.list(),
    queryFn: () => apiClient.get<SolicitanteAgua[]>('/solicitantes-agua').then((r) => r.data),
    staleTime: 5 * 60_000,
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/muestras-agua/${id}`),
    onSuccess: () => {
      toast.success('Muestra eliminada');
      setDeleteTarget(null);
      qc.invalidateQueries({ queryKey: queries.muestrasAgua.list() });
    },
    onError: (err) => toast.error(apiError(err, 'Error al eliminar')),
  });

  if (isLoading) {
    return (
      <div className="mt-12 flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--color-fg-muted)]" strokeWidth={2} />
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="flex items-center justify-end">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" strokeWidth={2} />
          Nueva muestra
        </Button>
      </div>

      {muestras.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-[var(--color-border-strong)] bg-[var(--color-bg-subtle)] py-16 text-center">
          <Droplets className="h-10 w-10 text-[var(--color-fg-subtle)]" strokeWidth={1.5} />
          <p className="font-medium text-[var(--color-fg)]">Sin muestras</p>
          <Button variant="outline" className="mt-2" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" strokeWidth={2} />
            Crear la primera
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--color-border)]">
          <table className="w-full text-sm">
            <thead className="border-b border-[var(--color-border)] bg-[var(--color-bg-subtle)]">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium text-[var(--color-fg-muted)]">
                  #
                </th>
                <th className="px-4 py-2.5 text-left font-medium text-[var(--color-fg-muted)]">
                  Solicitante
                </th>
                <th className="px-4 py-2.5 text-left font-medium text-[var(--color-fg-muted)]">
                  Tipo
                </th>
                <th className="px-4 py-2.5 text-left font-medium text-[var(--color-fg-muted)]">
                  Fecha toma
                </th>
                <th className="px-4 py-2.5 text-left font-medium text-[var(--color-fg-muted)]">
                  Motivo
                </th>
                <th className="px-4 py-2.5 text-left font-medium text-[var(--color-fg-muted)]">
                  Análisis
                </th>
                <th className="px-4 py-2.5 text-left font-medium text-[var(--color-fg-muted)]">
                  Apta
                </th>
                <th className="px-4 py-2.5 text-right font-medium text-[var(--color-fg-muted)]">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {muestras.map((m) => (
                <tr
                  key={m.id}
                  className="border-b border-[var(--color-border)] last:border-0 bg-[var(--color-bg-elevated)]"
                >
                  <td className="px-4 py-3 tabular text-[var(--color-fg-muted)]">{m.id}</td>
                  <td className="px-4 py-3 font-medium text-[var(--color-fg)]">
                    {m.solicitante?.nombreApellido ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-fg-muted)]">{m.tipoMuestra}</td>
                  <td className="px-4 py-3 text-[var(--color-fg-muted)]">
                    {DATE_FMT.format(new Date(m.fechaToma))}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-fg-muted)]">{m.motivoAnalisis}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {m.analisisFisicoquimico && <Badge variant="outline">FQ</Badge>}
                      {m.analisisMicrobiologico && <Badge variant="outline">MB</Badge>}
                      {!m.analisisFisicoquimico && !m.analisisMicrobiologico && (
                        <span className="text-[var(--color-fg-muted)]">—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={m.muestraApta ? 'default' : 'secondary'}>
                      {m.muestraApta ? 'Sí' : 'No'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setEditTarget(m)}>
                        <Pencil className="h-4 w-4" strokeWidth={2} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-[var(--color-danger)]"
                        onClick={() => setDeleteTarget(m)}
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={2} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(createOpen || editTarget) && (
        <MuestraDialog
          open
          onOpenChange={(v) => {
            if (!v) {
              setCreateOpen(false);
              setEditTarget(null);
            }
          }}
          initial={editTarget ?? undefined}
          solicitantes={solicitantes}
        />
      )}
      <ConfirmDialog
        open={deleteTarget != null}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="¿Eliminar muestra?"
        description={`Se eliminará la muestra #${deleteTarget?.id}. Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        tone="danger"
        loading={deleteMut.isPending}
        onConfirm={() => {
          if (deleteTarget) deleteMut.mutate(deleteTarget.id);
        }}
      />
    </div>
  );
}
