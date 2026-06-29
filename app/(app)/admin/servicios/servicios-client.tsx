'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AVAILABLE_ICONS, DynamicLucideIcon } from '@/components/ui/dynamic-lucide-icon';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/api/client';
import { queries } from '@/lib/api/queries';
import type { CreateServicioDto, Servicio, UpdateServicioDto } from '@/lib/api/types';
import { cn } from '@/lib/cn';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { ArrowDown, ArrowUp, ChevronRight, Loader2, Pencil, Plus, Power } from 'lucide-react';
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

const FLAG_LABELS: Array<{ key: keyof CreateServicioDto; label: string }> = [
  { key: 'usaPacienteHumano', label: 'Paciente humano' },
  { key: 'usaPacienteAnimal', label: 'Paciente animal' },
  { key: 'usaMedico', label: 'Médico derivante' },
  { key: 'usaVeterinario', label: 'Veterinario' },
  { key: 'usaPropietario', label: 'Propietario' },
];

function IconSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-8 gap-1.5 max-h-48 overflow-y-auto rounded-md border border-[var(--color-border)] p-2">
      {AVAILABLE_ICONS.map((name) => (
        <button
          key={name}
          type="button"
          onClick={() => onChange(name)}
          title={name}
          className={cn(
            'flex items-center justify-center rounded-md p-2 transition-colors',
            value === name
              ? 'bg-[var(--color-primary)] text-[var(--color-fg-inverse)]'
              : 'hover:bg-[var(--color-bg-subtle)] text-[var(--color-fg-muted)]',
          )}
        >
          <DynamicLucideIcon name={name} className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
}

function ServicioDialog({
  open,
  onOpenChange,
  initial,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial?: Servicio;
}) {
  const qc = useQueryClient();
  const isEdit = !!initial;

  const [nombre, setNombre] = useState(initial?.nombre ?? '');
  const [icono, setIcono] = useState(initial?.icono ?? 'stethoscope');
  const [usaPacienteHumano, setUsaPacienteHumano] = useState(initial?.usaPacienteHumano ?? false);
  const [usaPacienteAnimal, setUsaPacienteAnimal] = useState(initial?.usaPacienteAnimal ?? false);
  const [usaMedico, setUsaMedico] = useState(initial?.usaMedico ?? false);
  const [usaVeterinario, setUsaVeterinario] = useState(initial?.usaVeterinario ?? false);
  const [usaPropietario, setUsaPropietario] = useState(initial?.usaPropietario ?? false);

  const createMut = useMutation({
    mutationFn: (dto: CreateServicioDto) =>
      apiClient.post<Servicio>('/servicios', dto).then((r) => r.data),
    onSuccess: () => {
      toast.success('Servicio creado');
      qc.invalidateQueries({ queryKey: queries.servicios.listAll() });
      qc.invalidateQueries({ queryKey: queries.servicios.list() });
      onOpenChange(false);
    },
    onError: (err) => toast.error(apiError(err, 'Error al crear servicio')),
  });

  const updateMut = useMutation({
    mutationFn: (dto: UpdateServicioDto) =>
      apiClient.patch<Servicio>(`/servicios/${initial?.id}`, dto).then((r) => r.data),
    onSuccess: () => {
      toast.success('Servicio actualizado');
      qc.invalidateQueries({ queryKey: queries.servicios.listAll() });
      qc.invalidateQueries({ queryKey: queries.servicios.list() });
      onOpenChange(false);
    },
    onError: (err) => toast.error(apiError(err, 'Error al actualizar servicio')),
  });

  const isPending = createMut.isPending || updateMut.isPending;

  function handleSubmit() {
    const dto: CreateServicioDto = {
      nombre: nombre.trim(),
      icono,
      usaPacienteHumano,
      usaPacienteAnimal,
      usaMedico,
      usaVeterinario,
      usaPropietario,
    };
    if (isEdit) updateMut.mutate(dto);
    else createMut.mutate(dto);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar servicio' : 'Nuevo servicio'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Modificá las propiedades del servicio.'
              : 'Definí el nombre, ícono y qué campos muestra el formulario de orden.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <FormField label="Nombre" htmlFor="svc-nombre" required>
            <Input
              id="svc-nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Agua y efluentes"
              maxLength={100}
            />
          </FormField>

          <FormField label="Ícono" htmlFor="svc-icono">
            <IconSelector value={icono} onChange={setIcono} />
          </FormField>

          <div>
            <p className="mb-2 font-medium text-sm text-[var(--color-fg)]">Campos del formulario</p>
            <div className="space-y-2">
              {FLAG_LABELS.map(({ key, label }) => {
                const checked =
                  key === 'usaPacienteHumano'
                    ? usaPacienteHumano
                    : key === 'usaPacienteAnimal'
                      ? usaPacienteAnimal
                      : key === 'usaMedico'
                        ? usaMedico
                        : key === 'usaVeterinario'
                          ? usaVeterinario
                          : usaPropietario;
                const setter =
                  key === 'usaPacienteHumano'
                    ? setUsaPacienteHumano
                    : key === 'usaPacienteAnimal'
                      ? setUsaPacienteAnimal
                      : key === 'usaMedico'
                        ? setUsaMedico
                        : key === 'usaVeterinario'
                          ? setUsaVeterinario
                          : setUsaPropietario;

                return (
                  <div key={key} className="flex items-center gap-2">
                    <Checkbox
                      id={`svc-${key}`}
                      checked={checked}
                      onCheckedChange={(v) => setter(v === true)}
                    />
                    <label
                      htmlFor={`svc-${key}`}
                      className="text-sm text-[var(--color-fg)] cursor-pointer"
                    >
                      {label}
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!nombre.trim() || isPending}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />}
            {isEdit ? 'Guardar' : 'Crear servicio'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ServicioCard({
  servicio,
  onEdit,
  onToggleActive,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: {
  servicio: Servicio;
  onEdit: () => void;
  onToggleActive: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const activeFlags = FLAG_LABELS.filter(({ key }) => servicio[key as keyof Servicio] === true);

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 rounded-lg border bg-[var(--color-bg-elevated)] px-5 py-4 shadow-[var(--shadow-xs)] transition-colors',
        servicio.activo
          ? 'border-[var(--color-border)] hover:border-[var(--color-border-strong)]'
          : 'border-[var(--color-border)] opacity-60',
      )}
    >
      <div className="flex items-center gap-4 min-w-0">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
          <DynamicLucideIcon name={servicio.icono} className="h-5 w-5" strokeWidth={1.5} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-[var(--color-fg)] truncate">
              {servicio.nombre}
            </span>
            {!servicio.activo && <Badge variant="secondary">Inactivo</Badge>}
          </div>
          {activeFlags.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {activeFlags.map(({ key, label }) => (
                <Badge key={key} variant="outline" className="text-xs">
                  {label}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {!isFirst && (
          <Button variant="ghost" size="icon" onClick={onMoveUp} title="Subir">
            <ArrowUp className="h-4 w-4" strokeWidth={2} />
          </Button>
        )}
        {!isLast && (
          <Button variant="ghost" size="icon" onClick={onMoveDown} title="Bajar">
            <ArrowDown className="h-4 w-4" strokeWidth={2} />
          </Button>
        )}
        <Button variant="ghost" size="icon" onClick={onEdit} title="Editar">
          <Pencil className="h-4 w-4" strokeWidth={2} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleActive}
          title={servicio.activo ? 'Desactivar' : 'Activar'}
          className={cn(
            servicio.activo ? 'text-[var(--color-success)]' : 'text-[var(--color-fg-muted)]',
          )}
        >
          <Power className="h-4 w-4" strokeWidth={2} />
        </Button>
      </div>
    </div>
  );
}

export function ServiciosClient() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Servicio | null>(null);

  const { data: servicios = [], isLoading } = useQuery({
    queryKey: queries.servicios.listAll(),
    queryFn: () =>
      apiClient.get<Servicio[]>('/servicios', { params: { all: 'true' } }).then((r) => r.data),
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, activo }: { id: number; activo: boolean }) =>
      apiClient.patch(`/servicios/${id}/active`, { activo }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queries.servicios.listAll() });
      qc.invalidateQueries({ queryKey: queries.servicios.list() });
    },
    onError: (err) => toast.error(apiError(err, 'Error al cambiar estado')),
  });

  const reorderMut = useMutation({
    mutationFn: ({ id, orden }: { id: number; orden: number }) =>
      apiClient.patch(`/servicios/${id}`, { orden }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queries.servicios.listAll() });
      qc.invalidateQueries({ queryKey: queries.servicios.list() });
    },
  });

  function moveUp(idx: number) {
    if (idx <= 0) return;
    const current = servicios[idx];
    const above = servicios[idx - 1];
    reorderMut.mutate({ id: current.id, orden: above.orden });
    reorderMut.mutate({ id: above.id, orden: current.orden });
  }

  function moveDown(idx: number) {
    if (idx >= servicios.length - 1) return;
    const current = servicios[idx];
    const below = servicios[idx + 1];
    reorderMut.mutate({ id: current.id, orden: below.orden });
    reorderMut.mutate({ id: below.id, orden: current.orden });
  }

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
          Crear servicio
        </Button>
      </div>

      {servicios.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-[var(--color-border-strong)] bg-[var(--color-bg-subtle)] py-16 text-center">
          <ChevronRight className="h-10 w-10 text-[var(--color-fg-subtle)]" strokeWidth={1.5} />
          <div>
            <p className="font-medium text-[var(--color-fg)]">Sin servicios</p>
            <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
              Creá tu primer servicio o usá los valores por defecto.
            </p>
          </div>
          <Button variant="outline" className="mt-2" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" strokeWidth={2} />
            Crear servicio
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {servicios.map((s, idx) => (
            <ServicioCard
              key={s.id}
              servicio={s}
              onEdit={() => setEditTarget(s)}
              onToggleActive={() => toggleMut.mutate({ id: s.id, activo: !s.activo })}
              onMoveUp={() => moveUp(idx)}
              onMoveDown={() => moveDown(idx)}
              isFirst={idx === 0}
              isLast={idx === servicios.length - 1}
            />
          ))}
        </div>
      )}

      <ServicioDialog open={createOpen} onOpenChange={setCreateOpen} />
      {editTarget && (
        <ServicioDialog
          open
          onOpenChange={(v) => {
            if (!v) setEditTarget(null);
          }}
          initial={editTarget}
        />
      )}
    </div>
  );
}
