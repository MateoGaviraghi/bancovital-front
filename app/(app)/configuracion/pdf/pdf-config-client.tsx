'use client';

import { ConfirmDialog } from '@/components/domain/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { apiClient } from '@/lib/api/client';
import { queries } from '@/lib/api/queries';
import type { CreatePreferenciaPdfDto, PreferenciaPdf, Servicio, TipoPdf } from '@/lib/api/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { FileText, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
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

const TIPO_LABELS: Record<TipoPdf, string> = {
  informe: 'Informe',
  orden: 'Orden',
};

function FormatCard({
  formato,
  servicioNombre,
  onEdit,
  onDelete,
}: {
  formato: PreferenciaPdf;
  servicioNombre?: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const updated = new Date(formato.updatedAt).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-5 py-4 shadow-[var(--shadow-xs)] transition-colors hover:border-[var(--color-border-strong)]">
      <div className="flex items-center gap-4 min-w-0">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
          <FileText className="h-5 w-5" strokeWidth={1.5} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-[var(--color-fg)] truncate">
              {formato.nombre}
            </span>
            <Badge variant={formato.tipo === 'informe' ? 'default' : 'secondary'}>
              {TIPO_LABELS[formato.tipo]}
            </Badge>
            {servicioNombre && <Badge variant="outline">{servicioNombre}</Badge>}
          </div>
          <p className="mt-0.5 text-xs text-[var(--color-fg-muted)]">
            Actualizado {updated}
            {formato.fondoPath && ' · Con membrete'}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button variant="ghost" size="sm" onClick={onEdit}>
          <Pencil className="h-4 w-4" strokeWidth={2} />
          Editar
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="text-[var(--color-danger)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger)]/5"
        >
          <Trash2 className="h-4 w-4" strokeWidth={2} />
        </Button>
      </div>
    </div>
  );
}

function CreateFormatDialog({
  open,
  onOpenChange,
  servicios,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  servicios: Servicio[];
}) {
  const router = useRouter();
  const qc = useQueryClient();
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState<TipoPdf>('informe');
  const [servicioId, setServicioId] = useState<string>('');

  const createMut = useMutation({
    mutationFn: (dto: CreatePreferenciaPdfDto) =>
      apiClient.post<PreferenciaPdf>('/preferencia-pdf', dto).then((r) => r.data),
    onSuccess: (created) => {
      toast.success('Formato creado');
      qc.invalidateQueries({ queryKey: queries.preferenciaPdf.list() });
      onOpenChange(false);
      setNombre('');
      setTipo('informe');
      setServicioId('');
      router.push(`/configuracion/pdf/${created.id}`);
    },
    onError: (err) => toast.error(apiError(err, 'Error al crear formato')),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo formato de PDF</DialogTitle>
          <DialogDescription>Elegí un nombre descriptivo y el tipo de documento.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <FormField label="Nombre" htmlFor="fmt-nombre" required>
            <Input
              id="fmt-nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Membrete institucional"
              maxLength={100}
            />
          </FormField>
          <FormField label="Tipo" htmlFor="fmt-tipo">
            <Select value={tipo} onValueChange={(v) => setTipo(v as TipoPdf)}>
              <SelectTrigger id="fmt-tipo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="informe">Informe (resultados)</SelectItem>
                <SelectItem value="orden">Orden (ficha de trabajo)</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
          {servicios.length > 0 && (
            <FormField label="Servicio" htmlFor="fmt-servicio">
              <Select value={servicioId} onValueChange={setServicioId}>
                <SelectTrigger id="fmt-servicio">
                  <SelectValue placeholder="General (todos los servicios)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">General (todos los servicios)</SelectItem>
                  {servicios.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createMut.isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={() =>
              createMut.mutate({
                nombre: nombre.trim(),
                tipo,
                ...(servicioId && servicioId !== 'none' ? { servicioId: Number(servicioId) } : {}),
              })
            }
            disabled={!nombre.trim() || createMut.isPending}
          >
            {createMut.isPending && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />}
            Crear formato
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function PdfFormatListClient() {
  const router = useRouter();
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PreferenciaPdf | null>(null);

  const { data: formatos = [], isLoading } = useQuery({
    queryKey: queries.preferenciaPdf.list(),
    queryFn: () => apiClient.get<PreferenciaPdf[]>('/preferencia-pdf').then((r) => r.data),
  });

  const { data: servicios = [] } = useQuery({
    queryKey: queries.servicios.list(),
    queryFn: () => apiClient.get<Servicio[]>('/servicios').then((r) => r.data),
    staleTime: 5 * 60_000,
  });

  const servicioMap = new Map(servicios.map((s) => [s.id, s]));

  const deleteMut = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/preferencia-pdf/${id}`),
    onSuccess: () => {
      toast.success('Formato eliminado');
      setDeleteTarget(null);
      qc.invalidateQueries({ queryKey: queries.preferenciaPdf.list() });
    },
    onError: (err) => {
      toast.error(apiError(err, 'Error al eliminar formato'));
      setDeleteTarget(null);
    },
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
          Crear formato
        </Button>
      </div>

      {formatos.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-[var(--color-border-strong)] bg-[var(--color-bg-subtle)] py-16 text-center">
          <FileText className="h-10 w-10 text-[var(--color-fg-subtle)]" strokeWidth={1.5} />
          <div>
            <p className="font-medium text-[var(--color-fg)]">Sin formatos</p>
            <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
              Creá tu primer formato de PDF para personalizar informes y órdenes.
            </p>
          </div>
          <Button variant="outline" className="mt-2" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" strokeWidth={2} />
            Crear el primero
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {formatos.map((f) => (
            <FormatCard
              key={f.id}
              formato={f}
              servicioNombre={f.servicioId ? servicioMap.get(f.servicioId)?.nombre : undefined}
              onEdit={() => router.push(`/configuracion/pdf/${f.id}`)}
              onDelete={() => setDeleteTarget(f)}
            />
          ))}
        </div>
      )}

      <CreateFormatDialog open={createOpen} onOpenChange={setCreateOpen} servicios={servicios} />

      <ConfirmDialog
        open={deleteTarget != null}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="¿Eliminar formato?"
        description={`Se eliminará "${deleteTarget?.nombre}". Esta acción no se puede deshacer.`}
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
