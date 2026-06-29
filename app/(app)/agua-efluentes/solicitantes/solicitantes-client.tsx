'use client';

import { ConfirmDialog } from '@/components/domain/confirm-dialog';
import { Badge } from '@/components/ui/badge';
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
import { queries } from '@/lib/api/queries';
import type { CreateSolicitanteAguaDto, SolicitanteAgua } from '@/lib/api/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Building2, Loader2, Pencil, Plus, Search, Trash2 } from 'lucide-react';
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

function SolicitanteDialog({
  open,
  onOpenChange,
  initial,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: SolicitanteAgua;
}) {
  const qc = useQueryClient();
  const isEdit = !!initial;
  const [form, setForm] = useState<CreateSolicitanteAguaDto>({
    nombreApellido: initial?.nombreApellido ?? '',
    razonSocial: initial?.razonSocial ?? '',
    cuit: initial?.cuit ?? '',
    domicilio: initial?.domicilio ?? '',
    localidad: initial?.localidad ?? '',
    provincia: initial?.provincia ?? '',
    telefono: initial?.telefono ?? '',
    email: initial?.email ?? '',
  });

  const mut = useMutation({
    mutationFn: (dto: CreateSolicitanteAguaDto) =>
      isEdit
        ? apiClient.patch(`/solicitantes-agua/${initial.id}`, dto)
        : apiClient.post('/solicitantes-agua', dto),
    onSuccess: () => {
      toast.success(isEdit ? 'Solicitante actualizado' : 'Solicitante creado');
      qc.invalidateQueries({ queryKey: queries.solicitantesAgua.list() });
      onOpenChange(false);
    },
    onError: (err) => toast.error(apiError(err, 'Error al guardar solicitante')),
  });

  function set(key: keyof CreateSolicitanteAguaDto, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar solicitante' : 'Nuevo solicitante'}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField label="Nombre y apellido" htmlFor="sol-nombre" required>
            <Input
              id="sol-nombre"
              value={form.nombreApellido}
              onChange={(e) => set('nombreApellido', e.target.value)}
            />
          </FormField>
          <FormField label="Razón social" htmlFor="sol-razon">
            <Input
              id="sol-razon"
              value={form.razonSocial ?? ''}
              onChange={(e) => set('razonSocial', e.target.value)}
            />
          </FormField>
          <FormField label="CUIT/CUIL" htmlFor="sol-cuit">
            <Input
              id="sol-cuit"
              value={form.cuit ?? ''}
              onChange={(e) => set('cuit', e.target.value)}
            />
          </FormField>
          <FormField label="Domicilio" htmlFor="sol-dom">
            <Input
              id="sol-dom"
              value={form.domicilio ?? ''}
              onChange={(e) => set('domicilio', e.target.value)}
            />
          </FormField>
          <FormField label="Localidad" htmlFor="sol-loc">
            <Input
              id="sol-loc"
              value={form.localidad ?? ''}
              onChange={(e) => set('localidad', e.target.value)}
            />
          </FormField>
          <FormField label="Provincia" htmlFor="sol-prov">
            <Input
              id="sol-prov"
              value={form.provincia ?? ''}
              onChange={(e) => set('provincia', e.target.value)}
            />
          </FormField>
          <FormField label="Teléfono" htmlFor="sol-tel">
            <Input
              id="sol-tel"
              value={form.telefono ?? ''}
              onChange={(e) => set('telefono', e.target.value)}
            />
          </FormField>
          <FormField label="Correo electrónico" htmlFor="sol-email">
            <Input
              id="sol-email"
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
            {isEdit ? 'Guardar' : 'Crear'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function SolicitantesClient() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SolicitanteAgua | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SolicitanteAgua | null>(null);
  const [search, setSearch] = useState('');

  const { data: solicitantes = [], isLoading } = useQuery({
    queryKey: queries.solicitantesAgua.list(),
    queryFn: () => apiClient.get<SolicitanteAgua[]>('/solicitantes-agua').then((r) => r.data),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/solicitantes-agua/${id}`),
    onSuccess: () => {
      toast.success('Solicitante eliminado');
      setDeleteTarget(null);
      qc.invalidateQueries({ queryKey: queries.solicitantesAgua.list() });
    },
    onError: (err) => toast.error(apiError(err, 'Error al eliminar')),
  });

  const filtered = search.trim()
    ? solicitantes.filter(
        (s) =>
          s.nombreApellido.toLowerCase().includes(search.toLowerCase()) ||
          s.razonSocial?.toLowerCase().includes(search.toLowerCase()) ||
          s.cuit?.includes(search),
      )
    : solicitantes;

  if (isLoading) {
    return (
      <div className="mt-12 flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--color-fg-muted)]" strokeWidth={2} />
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search
            className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--color-fg-muted)]"
            strokeWidth={2}
          />
          <Input
            placeholder="Buscar por nombre, razón social o CUIT..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" strokeWidth={2} />
          Nuevo solicitante
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-[var(--color-border-strong)] bg-[var(--color-bg-subtle)] py-16 text-center">
          <Building2 className="h-10 w-10 text-[var(--color-fg-subtle)]" strokeWidth={1.5} />
          <p className="font-medium text-[var(--color-fg)]">
            {search ? 'Sin resultados' : 'Sin solicitantes'}
          </p>
          {!search && (
            <Button variant="outline" className="mt-2" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" strokeWidth={2} />
              Crear el primero
            </Button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-[var(--color-border)]">
          <table className="w-full text-sm">
            <thead className="border-b border-[var(--color-border)] bg-[var(--color-bg-subtle)]">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium text-[var(--color-fg-muted)]">
                  Nombre
                </th>
                <th className="px-4 py-2.5 text-left font-medium text-[var(--color-fg-muted)]">
                  Razón social
                </th>
                <th className="px-4 py-2.5 text-left font-medium text-[var(--color-fg-muted)]">
                  CUIT
                </th>
                <th className="px-4 py-2.5 text-left font-medium text-[var(--color-fg-muted)]">
                  Localidad
                </th>
                <th className="px-4 py-2.5 text-right font-medium text-[var(--color-fg-muted)]">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-[var(--color-border)] last:border-0 bg-[var(--color-bg-elevated)]"
                >
                  <td className="px-4 py-3 font-medium text-[var(--color-fg)]">
                    {s.nombreApellido}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-fg-muted)]">{s.razonSocial || '—'}</td>
                  <td className="px-4 py-3 text-[var(--color-fg-muted)] tabular">
                    {s.cuit || '—'}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-fg-muted)]">{s.localidad || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setEditTarget(s)}>
                        <Pencil className="h-4 w-4" strokeWidth={2} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-[var(--color-danger)]"
                        onClick={() => setDeleteTarget(s)}
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

      <SolicitanteDialog open={createOpen} onOpenChange={setCreateOpen} />
      {editTarget && (
        <SolicitanteDialog
          open
          onOpenChange={(v) => {
            if (!v) setEditTarget(null);
          }}
          initial={editTarget}
        />
      )}
      <ConfirmDialog
        open={deleteTarget != null}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="¿Eliminar solicitante?"
        description={`Se eliminará "${deleteTarget?.nombreApellido}". Esta acción no se puede deshacer.`}
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
