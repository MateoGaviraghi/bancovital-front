'use client';

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
import type { Especie, Raza } from '@/lib/api/types';
import { cn } from '@/lib/cn';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { ChevronDown, Loader2, PawPrint, Pencil, Plus, Power, Trash2 } from 'lucide-react';
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

// ─── Raza row ────────────────────────────────────────────────

function RazaRow({ raza, especieId }: { raza: Raza; especieId: number }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [nombre, setNombre] = useState(raza.nombre);

  const updateMut = useMutation({
    mutationFn: (body: { nombre?: string }) =>
      apiClient.patch<Raza>(`/especies/razas/${raza.id}`, body).then((r) => r.data),
    onSuccess: () => {
      toast.success('Raza actualizada');
      setEditing(false);
      qc.invalidateQueries({ queryKey: queries.especies.razas(especieId) });
    },
    onError: (err) => toast.error(apiError(err, 'Error al actualizar raza')),
  });

  const toggleMut = useMutation({
    mutationFn: () =>
      apiClient
        .patch<Raza>(`/especies/razas/${raza.id}/active`, { active: !raza.active })
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queries.especies.razas(especieId) });
    },
    onError: (err) => toast.error(apiError(err, 'Error al cambiar estado')),
  });

  if (editing) {
    return (
      <div className="flex items-center gap-2 py-1.5 pl-8">
        <Input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="h-7 text-xs"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter' && nombre.trim()) updateMut.mutate({ nombre: nombre.trim() });
            if (e.key === 'Escape') {
              setEditing(false);
              setNombre(raza.nombre);
            }
          }}
        />
        <Button
          size="sm"
          className="h-7 text-xs"
          onClick={() => nombre.trim() && updateMut.mutate({ nombre: nombre.trim() })}
          disabled={!nombre.trim() || updateMut.isPending}
        >
          {updateMut.isPending ? (
            <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2} />
          ) : (
            'OK'
          )}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-xs"
          onClick={() => {
            setEditing(false);
            setNombre(raza.nombre);
          }}
        >
          Cancelar
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-2 py-1.5 pl-8 pr-2 text-sm',
        !raza.active && 'opacity-50',
      )}
    >
      <span className="text-[var(--color-fg)]">{raza.nombre}</span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded p-1 text-[var(--color-fg-muted)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-fg)]"
          title="Editar"
        >
          <Pencil className="h-3 w-3" strokeWidth={2} />
        </button>
        <button
          type="button"
          onClick={() => toggleMut.mutate()}
          disabled={toggleMut.isPending}
          className={cn(
            'rounded p-1 hover:bg-[var(--color-bg-subtle)]',
            raza.active
              ? 'text-[var(--color-fg-muted)] hover:text-[var(--color-danger)]'
              : 'text-[var(--color-success)]',
          )}
          title={raza.active ? 'Desactivar' : 'Activar'}
        >
          <Power className="h-3 w-3" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

// ─── Especie card ────────────────────────────────────────────

function EspecieCard({ especie }: { especie: Especie }) {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nombre, setNombre] = useState(especie.nombre);
  const [nombreCientifico, setNombreCientifico] = useState(especie.nombreCientifico ?? '');
  const [addRaza, setAddRaza] = useState(false);
  const [newRazaNombre, setNewRazaNombre] = useState('');

  const { data: razas = [], isLoading: razasLoading } = useQuery({
    queryKey: queries.especies.razas(especie.id),
    queryFn: () => apiClient.get<Raza[]>(`/especies/${especie.id}/razas`).then((r) => r.data),
    enabled: expanded,
  });

  const updateMut = useMutation({
    mutationFn: (body: { nombre?: string; nombreCientifico?: string | null }) =>
      apiClient.patch<Especie>(`/especies/${especie.id}`, body).then((r) => r.data),
    onSuccess: () => {
      toast.success('Especie actualizada');
      setEditingName(false);
      qc.invalidateQueries({ queryKey: queries.especies.list() });
    },
    onError: (err) => toast.error(apiError(err, 'Error al actualizar')),
  });

  const toggleMut = useMutation({
    mutationFn: () =>
      apiClient
        .patch<Especie>(`/especies/${especie.id}/active`, { active: !especie.active })
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queries.especies.list() });
    },
    onError: (err) => toast.error(apiError(err, 'Error al cambiar estado')),
  });

  const addRazaMut = useMutation({
    mutationFn: (razaNombre: string) =>
      apiClient
        .post<Raza>(`/especies/${especie.id}/razas`, { nombre: razaNombre })
        .then((r) => r.data),
    onSuccess: () => {
      toast.success('Raza creada');
      setNewRazaNombre('');
      setAddRaza(false);
      qc.invalidateQueries({ queryKey: queries.especies.razas(especie.id) });
    },
    onError: (err) => toast.error(apiError(err, 'Error al crear raza')),
  });

  return (
    <div
      className={cn(
        'rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] shadow-[var(--shadow-xs)]',
        !especie.active && 'opacity-60',
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 min-w-0 flex-1 text-left"
        >
          <ChevronDown
            className={cn(
              'h-4 w-4 shrink-0 text-[var(--color-fg-muted)] transition-transform',
              expanded && 'rotate-180',
            )}
            strokeWidth={2}
          />
          {editingName ? (
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <Input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="h-7 w-40 text-sm"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && nombre.trim()) {
                    updateMut.mutate({
                      nombre: nombre.trim(),
                      nombreCientifico: nombreCientifico.trim() || null,
                    });
                  }
                  if (e.key === 'Escape') {
                    setEditingName(false);
                    setNombre(especie.nombre);
                    setNombreCientifico(especie.nombreCientifico ?? '');
                  }
                }}
              />
              <Input
                value={nombreCientifico}
                onChange={(e) => setNombreCientifico(e.target.value)}
                placeholder="Nombre científico"
                className="h-7 w-40 text-xs italic"
              />
              <Button
                size="sm"
                className="h-7 text-xs"
                onClick={() => {
                  if (nombre.trim()) {
                    updateMut.mutate({
                      nombre: nombre.trim(),
                      nombreCientifico: nombreCientifico.trim() || null,
                    });
                  }
                }}
                disabled={!nombre.trim() || updateMut.isPending}
              >
                {updateMut.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2} />
                ) : (
                  'OK'
                )}
              </Button>
            </div>
          ) : (
            <div className="min-w-0">
              <span className="font-medium text-sm text-[var(--color-fg)]">{especie.nombre}</span>
              {especie.nombreCientifico && (
                <span className="ml-2 text-xs italic text-[var(--color-fg-muted)]">
                  {especie.nombreCientifico}
                </span>
              )}
            </div>
          )}
        </button>

        <div className="flex shrink-0 items-center gap-1">
          {!especie.active && (
            <Badge variant="secondary" className="text-[10px]">
              Inactiva
            </Badge>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setEditingName(true);
              setExpanded(true);
            }}
            className="rounded p-1.5 text-[var(--color-fg-muted)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-fg)]"
            title="Editar especie"
          >
            <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleMut.mutate();
            }}
            disabled={toggleMut.isPending}
            className={cn(
              'rounded p-1.5 hover:bg-[var(--color-bg-subtle)]',
              especie.active
                ? 'text-[var(--color-fg-muted)] hover:text-[var(--color-danger)]'
                : 'text-[var(--color-success)]',
            )}
            title={especie.active ? 'Desactivar' : 'Activar'}
          >
            <Power className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Razas */}
      {expanded && (
        <div className="border-[var(--color-border)] border-t px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <p className="font-medium text-[10px] text-[var(--color-fg-muted)] uppercase tracking-wide">
              Razas
            </p>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-6 text-xs"
              onClick={() => setAddRaza(true)}
            >
              <Plus className="h-3 w-3" strokeWidth={2} />
              Agregar
            </Button>
          </div>

          {razasLoading ? (
            <div className="flex items-center gap-2 py-3 text-xs text-[var(--color-fg-muted)]">
              <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2} />
              Cargando razas…
            </div>
          ) : razas.length === 0 && !addRaza ? (
            <p className="py-2 pl-8 text-xs text-[var(--color-fg-subtle)]">Sin razas cargadas.</p>
          ) : (
            <div className="divide-y divide-[var(--color-border)]/50">
              {razas.map((r) => (
                <RazaRow key={r.id} raza={r} especieId={especie.id} />
              ))}
            </div>
          )}

          {addRaza && (
            <div className="mt-2 flex items-center gap-2 pl-8">
              <Input
                value={newRazaNombre}
                onChange={(e) => setNewRazaNombre(e.target.value)}
                placeholder="Nombre de la raza"
                className="h-7 text-xs"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newRazaNombre.trim())
                    addRazaMut.mutate(newRazaNombre.trim());
                  if (e.key === 'Escape') {
                    setAddRaza(false);
                    setNewRazaNombre('');
                  }
                }}
              />
              <Button
                size="sm"
                className="h-7 text-xs"
                onClick={() => newRazaNombre.trim() && addRazaMut.mutate(newRazaNombre.trim())}
                disabled={!newRazaNombre.trim() || addRazaMut.isPending}
              >
                {addRazaMut.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2} />
                ) : (
                  'Crear'
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
                onClick={() => {
                  setAddRaza(false);
                  setNewRazaNombre('');
                }}
              >
                Cancelar
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────

export function EspeciesClient() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [newNombre, setNewNombre] = useState('');
  const [newCientifico, setNewCientifico] = useState('');

  const { data: especies = [], isLoading } = useQuery({
    queryKey: queries.especies.list(),
    queryFn: () => apiClient.get<Especie[]>('/especies').then((r) => r.data),
  });

  const createMut = useMutation({
    mutationFn: (body: { nombre: string; nombreCientifico?: string | null }) =>
      apiClient.post<Especie>('/especies', body).then((r) => r.data),
    onSuccess: () => {
      toast.success('Especie creada');
      setCreateOpen(false);
      setNewNombre('');
      setNewCientifico('');
      qc.invalidateQueries({ queryKey: queries.especies.list() });
    },
    onError: (err) => toast.error(apiError(err, 'Error al crear especie')),
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
          Nueva especie
        </Button>
      </div>

      {especies.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-[var(--color-border-strong)] bg-[var(--color-bg-subtle)] py-16 text-center">
          <PawPrint className="h-10 w-10 text-[var(--color-fg-subtle)]" strokeWidth={1.5} />
          <div>
            <p className="font-medium text-[var(--color-fg)]">Sin especies</p>
            <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
              Creá la primera especie para empezar a cargar razas.
            </p>
          </div>
          <Button variant="outline" className="mt-2" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" strokeWidth={2} />
            Crear la primera
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {especies.map((e) => (
            <EspecieCard key={e.id} especie={e} />
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva especie</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <FormField label="Nombre" htmlFor="esp-nombre" required>
              <Input
                id="esp-nombre"
                value={newNombre}
                onChange={(e) => setNewNombre(e.target.value)}
                placeholder="Ej: Canino"
                maxLength={100}
                autoFocus
              />
            </FormField>
            <FormField label="Nombre científico (opcional)" htmlFor="esp-cientifico">
              <Input
                id="esp-cientifico"
                value={newCientifico}
                onChange={(e) => setNewCientifico(e.target.value)}
                placeholder="Ej: Canis lupus familiaris"
                maxLength={200}
              />
            </FormField>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateOpen(false)}
              disabled={createMut.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={() =>
                createMut.mutate({
                  nombre: newNombre.trim(),
                  nombreCientifico: newCientifico.trim() || null,
                })
              }
              disabled={!newNombre.trim() || createMut.isPending}
            >
              {createMut.isPending && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />}
              Crear especie
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
