'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { TagInput } from '@/components/ui/tag-input';
import { apiClient } from '@/lib/api/client';
import { queries } from '@/lib/api/queries';
import type {
  AddPracticeUnidadDto,
  CreateUnidadMedidaDto,
  PracticeUnidad,
  PracticeUnidadListItem,
  UnidadMedida,
} from '@/lib/api/types';
import { cn } from '@/lib/cn';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Check, Loader2, Pencil, Plus, Ruler, Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

function apiError(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const msg = err.response?.data?.message;
    if (Array.isArray(msg)) return msg.join('. ');
    if (typeof msg === 'string') return msg;
  }
  return fallback;
}

// ─── Inner dialog ─────────────────────────────────────────────────────────

function UnidadesDialog({
  practiceId,
  open,
  onClose,
}: {
  practiceId: number;
  open: boolean;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newNombre, setNewNombre] = useState('');
  const [newSimbolo, setNewSimbolo] = useState('');
  const [newOpciones, setNewOpciones] = useState<string[]>([]);
  const [editingUnit, setEditingUnit] = useState<UnidadMedida | null>(null);
  const [editOpciones, setEditOpciones] = useState<string[]>([]);
  const [editRangeLow, setEditRangeLow] = useState('');
  const [editRangeHigh, setEditRangeHigh] = useState('');
  const [editRefText, setEditRefText] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setSearch('');
      setShowCreate(false);
      setNewNombre('');
      setNewSimbolo('');
      setNewOpciones([]);
      setEditingUnit(null);
      setTimeout(() => searchRef.current?.focus(), 80);
    }
  }, [open]);

  // All units in catalog
  const catalogQuery = useQuery({
    queryKey: ['unidades-medida', 'all'],
    queryFn: async () => {
      const { data } = await apiClient.get<UnidadMedida[]>('/unidades-medida', {
        params: { limit: 500 },
      });
      return data;
    },
    enabled: open,
    staleTime: 60_000,
  });

  // Units already associated with this practice
  const assocQuery = useQuery({
    queryKey: queries.practices.unidades(practiceId),
    queryFn: async () => {
      const { data } = await apiClient.get<PracticeUnidadListItem[]>(
        `/practices/${practiceId}/unidades`,
      );
      return data;
    },
    enabled: open,
  });

  function invalidate() {
    qc.invalidateQueries({ queryKey: queries.practices.unidades(practiceId) });
    qc.invalidateQueries({ queryKey: ['unidades-medida', 'all'] });
    qc.invalidateQueries({ queryKey: ['orders'] });
    qc.invalidateQueries({ queryKey: ['order-practices'] });
  }

  const addMutation = useMutation({
    mutationFn: async (unidadId: number) => {
      const payload: AddPracticeUnidadDto = { unidadId };
      const { data } = await apiClient.post<PracticeUnidad>(
        `/practices/${practiceId}/unidades`,
        payload,
      );
      return data;
    },
    onSuccess: () => invalidate(),
    onError: (err) => toast.error(apiError(err, 'No se pudo agregar la unidad')),
  });

  const removeMutation = useMutation({
    mutationFn: async (unidadId: number) => {
      await apiClient.delete(`/practices/${practiceId}/unidades/${unidadId}`);
    },
    onSuccess: () => invalidate(),
    onError: (err) => {
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      if (status === 409) {
        toast.error(
          'Esta unidad tiene valores cargados en órdenes existentes y no se puede quitar.',
        );
      } else {
        toast.error(apiError(err, 'No se pudo quitar la unidad'));
      }
    },
  });

  const createMutation = useMutation({
    mutationFn: async (dto: CreateUnidadMedidaDto) => {
      const { data } = await apiClient.post<UnidadMedida>('/unidades-medida', dto);
      return data;
    },
    onSuccess: async (newUnit) => {
      toast.success(`Unidad "${newUnit.nombre}" creada`);
      setNewNombre('');
      setNewSimbolo('');
      setNewOpciones([]);
      setShowCreate(false);
      qc.invalidateQueries({ queryKey: ['unidades-medida', 'all'] });
      addMutation.mutate(newUnit.id);
    },
    onError: (err) => toast.error(apiError(err, 'No se pudo crear la unidad')),
  });

  const updateOpcionesMut = useMutation({
    mutationFn: async ({ id, opciones }: { id: number; opciones: string[] }) => {
      const { data } = await apiClient.patch<UnidadMedida>(`/unidades-medida/${id}`, {
        opcionesPredeterminadas: opciones.length > 0 ? opciones : null,
      });
      return data;
    },
    onSuccess: () => {
      toast.success('Opciones guardadas');
      setEditingUnit(null);
      qc.invalidateQueries({ queryKey: ['unidades-medida', 'all'] });
    },
    onError: (err) => toast.error(apiError(err, 'No se pudieron guardar las opciones')),
  });

  const updateRefMut = useMutation({
    mutationFn: async ({
      unidadId,
      rangeLow,
      rangeHigh,
      referenceText,
    }: { unidadId: number; rangeLow: string; rangeHigh: string; referenceText: string }) => {
      const { data } = await apiClient.patch(`/practices/${practiceId}/unidades/${unidadId}`, {
        rangeLow: rangeLow.trim() || null,
        rangeHigh: rangeHigh.trim() || null,
        referenceText: referenceText.trim() || null,
      });
      return data;
    },
    onSuccess: () => {
      toast.success('Referencia guardada');
      setEditingUnit(null);
      invalidate();
    },
    onError: (err) => toast.error(apiError(err, 'No se pudo guardar la referencia')),
  });

  const assocItems = assocQuery.data ?? [];
  const associatedIds = new Set(assocItems.map((a) => a.unidad.id));

  const allUnits = catalogQuery.data ?? [];
  const filtered = search.trim()
    ? allUnits.filter(
        (u) =>
          u.nombre.toLowerCase().includes(search.toLowerCase()) ||
          (u.simbolo ?? '').toLowerCase().includes(search.toLowerCase()),
      )
    : allUnits;

  const busy = addMutation.isPending || removeMutation.isPending;

  function toggle(unit: UnidadMedida) {
    if (busy) return;
    if (associatedIds.has(unit.id)) {
      removeMutation.mutate(unit.id);
    } else {
      addMutation.mutate(unit.id);
    }
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const nombre = newNombre.trim();
    if (!nombre) return;
    createMutation.mutate({
      nombre,
      simbolo: newSimbolo.trim() || null,
      opcionesPredeterminadas: newOpciones.length > 0 ? newOpciones : null,
    });
  }

  const loading = catalogQuery.isLoading || assocQuery.isLoading;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="flex max-h-[80vh] max-w-md flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="border-[var(--color-border)] border-b px-5 py-4">
          <DialogTitle>Unidades de medida</DialogTitle>
          <DialogDescription>
            Seleccioná las unidades que se cargan para esta práctica.
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="border-[var(--color-border)] border-b px-3 py-2.5">
          <div className="flex items-center gap-2 rounded-md border border-[var(--color-border)] px-2.5 py-1.5 focus-within:border-[var(--color-primary)] focus-within:ring-2 focus-within:ring-[var(--color-primary-soft)]">
            <Search
              className="h-3.5 w-3.5 shrink-0 text-[var(--color-fg-subtle)]"
              strokeWidth={2}
            />
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar unidad…"
              className="min-w-0 flex-1 bg-transparent text-[var(--color-fg)] text-sm outline-none placeholder:text-[var(--color-fg-subtle)]"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="shrink-0 text-[var(--color-fg-subtle)] hover:text-[var(--color-fg)]"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
            )}
          </div>
        </div>

        {/* List */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-[var(--color-fg-muted)] text-sm">
              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
              Cargando…
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-[var(--color-fg-subtle)] text-sm">
              {search ? `Sin resultados para "${search}".` : 'No hay unidades en el catálogo.'}
            </p>
          ) : (
            <ul className="divide-y divide-[var(--color-border)]">
              {filtered.map((unit) => {
                const isAssoc = associatedIds.has(unit.id);
                const isPending =
                  (addMutation.isPending && addMutation.variables === unit.id) ||
                  (removeMutation.isPending && removeMutation.variables === unit.id);
                return (
                  <li key={unit.id}>
                    <button
                      type="button"
                      onClick={() => toggle(unit)}
                      disabled={busy}
                      className={cn(
                        'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--color-bg-subtle)] disabled:cursor-wait',
                        isAssoc && 'bg-[var(--color-primary-soft)]/30',
                      )}
                    >
                      {/* Checkbox visual */}
                      <span
                        className={cn(
                          'flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border transition-colors',
                          isAssoc
                            ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
                            : 'border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)]',
                        )}
                      >
                        {isPending ? (
                          <Loader2 className="h-2.5 w-2.5 animate-spin" strokeWidth={3} />
                        ) : isAssoc ? (
                          <Check className="h-2.5 w-2.5" strokeWidth={3} />
                        ) : null}
                      </span>

                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="flex items-baseline gap-2">
                          <span className="truncate text-[var(--color-fg)] text-sm">
                            {unit.nombre}
                          </span>
                          {unit.simbolo && (
                            <span className="shrink-0 font-mono text-[var(--color-fg-muted)] text-xs">
                              {unit.simbolo}
                            </span>
                          )}
                        </span>
                        {unit.opcionesPredeterminadas &&
                          unit.opcionesPredeterminadas.length > 0 && (
                            <span className="mt-0.5 flex flex-wrap gap-1">
                              {unit.opcionesPredeterminadas.map((o) => (
                                <span
                                  key={o}
                                  className="rounded bg-[var(--color-bg-subtle)] px-1.5 py-0.5 text-[10px] text-[var(--color-fg-muted)]"
                                >
                                  {o}
                                </span>
                              ))}
                            </span>
                          )}
                      </span>
                      {isAssoc && (
                        <button
                          type="button"
                          onClick={(ev) => {
                            ev.stopPropagation();
                            setEditingUnit(unit);
                            setEditOpciones(unit.opcionesPredeterminadas ?? []);
                            const assoc = assocItems.find((a) => a.unidad.id === unit.id);
                            setEditRangeLow(assoc?.rangeLow ?? '');
                            setEditRangeHigh(assoc?.rangeHigh ?? '');
                            setEditRefText(assoc?.referenceText ?? '');
                          }}
                          className="shrink-0 rounded p-1 text-[var(--color-fg-subtle)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-fg)]"
                          title="Editar opciones y referencia"
                        >
                          <Pencil className="h-3 w-3" strokeWidth={2} />
                        </button>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Create new unit */}
        {/* Edit opciones inline */}
        {editingUnit && (
          <div className="border-[var(--color-border)] border-t bg-[var(--color-bg-subtle)] px-4 py-3 space-y-3">
            <p className="font-medium text-[var(--color-fg)] text-xs">
              Editar — {editingUnit.nombre}
            </p>
            <div className="space-y-1">
              <span className="text-[var(--color-fg-muted)] text-[10px]">
                Opciones predeterminadas
              </span>
              <TagInput
                value={editOpciones}
                onChange={setEditOpciones}
                placeholder="Escribí una opción y presioná Enter…"
                disabled={updateOpcionesMut.isPending}
              />
            </div>
            <div className="flex gap-2">
              <div className="flex-1 space-y-1">
                <span className="text-[var(--color-fg-muted)] text-[10px]">Rango bajo</span>
                <input
                  value={editRangeLow}
                  onChange={(e) => setEditRangeLow(e.target.value)}
                  placeholder="ej: 70"
                  className="block w-full rounded-md border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] px-2 py-1 text-sm text-[var(--color-fg)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-soft)]"
                />
              </div>
              <div className="flex-1 space-y-1">
                <span className="text-[var(--color-fg-muted)] text-[10px]">Rango alto</span>
                <input
                  value={editRangeHigh}
                  onChange={(e) => setEditRangeHigh(e.target.value)}
                  placeholder="ej: 110"
                  className="block w-full rounded-md border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] px-2 py-1 text-sm text-[var(--color-fg)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-soft)]"
                />
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-[var(--color-fg-muted)] text-[10px]">Texto de referencia</span>
              <input
                value={editRefText}
                onChange={(e) => setEditRefText(e.target.value)}
                placeholder="ej: Valores normales entre 70 y 110 mg/dL"
                className="block w-full rounded-md border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] px-2 py-1 text-sm text-[var(--color-fg)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-soft)]"
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  updateOpcionesMut.mutate({ id: editingUnit.id, opciones: editOpciones });
                  updateRefMut.mutate({
                    unidadId: editingUnit.id,
                    rangeLow: editRangeLow,
                    rangeHigh: editRangeHigh,
                    referenceText: editRefText,
                  });
                }}
                disabled={updateOpcionesMut.isPending || updateRefMut.isPending}
              >
                {updateOpcionesMut.isPending || updateRefMut.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
                ) : (
                  'Guardar'
                )}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setEditingUnit(null)}
                disabled={updateOpcionesMut.isPending}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        <div className="border-[var(--color-border)] border-t">
          {showCreate ? (
            <form onSubmit={handleCreate} className="space-y-3 px-4 py-3">
              <div className="flex items-end gap-2">
                <div className="flex-1 space-y-1">
                  <label
                    htmlFor="new-unidad-nombre"
                    className="text-[var(--color-fg-muted)] text-xs"
                  >
                    Nombre
                  </label>
                  <input
                    id="new-unidad-nombre"
                    value={newNombre}
                    onChange={(e) => setNewNombre(e.target.value)}
                    placeholder="ej: Glucosa"
                    className="block w-full rounded-md border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] px-2.5 py-1.5 text-[var(--color-fg)] text-sm outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-soft)]"
                    disabled={createMutation.isPending}
                  />
                </div>
                <div className="w-24 space-y-1">
                  <label
                    htmlFor="new-unidad-simbolo"
                    className="text-[var(--color-fg-muted)] text-xs"
                  >
                    Símbolo
                  </label>
                  <input
                    id="new-unidad-simbolo"
                    value={newSimbolo}
                    onChange={(e) => setNewSimbolo(e.target.value)}
                    placeholder="ej: mg/dL"
                    className="block w-full rounded-md border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] px-2.5 py-1.5 font-mono text-[var(--color-fg)] text-sm outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-soft)]"
                    disabled={createMutation.isPending}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[var(--color-fg-muted)] text-xs">
                  Opciones predeterminadas (opcional)
                </span>
                <TagInput
                  value={newOpciones}
                  onChange={setNewOpciones}
                  placeholder="ej: Amarillo, Ámbar, Rojizo…"
                  disabled={createMutation.isPending}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="submit"
                  size="sm"
                  disabled={!newNombre.trim() || createMutation.isPending}
                >
                  {createMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
                  ) : (
                    'Crear'
                  )}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setShowCreate(false);
                    setNewNombre('');
                    setNewSimbolo('');
                    setNewOpciones([]);
                  }}
                  disabled={createMutation.isPending}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="flex w-full items-center gap-2 px-4 py-3 text-[var(--color-fg-muted)] text-sm transition-colors hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-fg)]"
            >
              <Plus className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
              Crear unidad nueva
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Public section ───────────────────────────────────────────────────────

type Props = {
  practiceId: number;
  readOnly?: boolean;
  onChange?: () => void;
};

export function PracticeUnidadesSection({ practiceId, readOnly = false, onChange }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const listQuery = useQuery({
    queryKey: queries.practices.unidades(practiceId),
    queryFn: async () => {
      const { data } = await apiClient.get<PracticeUnidadListItem[]>(
        `/practices/${practiceId}/unidades`,
      );
      return data;
    },
  });

  const items = listQuery.data ?? [];

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-[var(--color-fg)] text-sm">Unidades de medida</h3>
          <p className="text-[var(--color-fg-muted)] text-xs">
            Sub-componentes que se cargan junto al valor principal de la práctica.
          </p>
        </div>
        {!readOnly && (
          <Button type="button" size="sm" variant="outline" onClick={() => setDialogOpen(true)}>
            <Ruler className="h-3.5 w-3.5" strokeWidth={2} />
            Configurar unidades
          </Button>
        )}
      </div>

      {listQuery.isLoading ? (
        <div className="flex items-center gap-2 rounded-md border border-[var(--color-border)] border-dashed px-3 py-4 text-[var(--color-fg-muted)] text-sm">
          <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
          Cargando unidades…
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-md border border-[var(--color-border)] border-dashed px-3 py-4 text-[var(--color-fg-subtle)] text-sm">
          Sin unidades asociadas.
          {!readOnly && (
            <button
              type="button"
              onClick={() => setDialogOpen(true)}
              className="ml-2 text-[var(--color-primary)] hover:underline"
            >
              Agregar
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-1.5">
          {items.map((item) => (
            <div
              key={item.associationId}
              className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-3 py-2 text-xs"
            >
              <span className="font-medium text-[var(--color-fg)]">
                {item.unidad.nombre}
                {item.unidad.simbolo && (
                  <span className="ml-1 font-mono text-[var(--color-fg-muted)]">
                    ({item.unidad.simbolo})
                  </span>
                )}
              </span>
              {(item.rangeLow || item.rangeHigh) && (
                <span className="text-[var(--color-fg-muted)]">
                  Ref: {item.rangeLow ?? '—'} – {item.rangeHigh ?? '—'}
                </span>
              )}
              {item.referenceText && (
                <span className="text-[var(--color-fg-muted)] italic">{item.referenceText}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {!readOnly && (
        <UnidadesDialog
          practiceId={practiceId}
          open={dialogOpen}
          onClose={() => {
            setDialogOpen(false);
            onChange?.();
          }}
        />
      )}
    </section>
  );
}
