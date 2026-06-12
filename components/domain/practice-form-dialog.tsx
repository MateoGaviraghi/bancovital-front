'use client';

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
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { apiClient } from '@/lib/api/client';
import type { CreatePracticeDto, Practice, UpdatePracticeDto } from '@/lib/api/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

function apiError(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const msg = err.response?.data?.message;
    if (Array.isArray(msg)) return msg.join('. ');
    if (typeof msg === 'string') return msg;
  }
  return fallback;
}

type Mode =
  | { type: 'create' }
  | { type: 'edit'; practice: Practice };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: Mode;
  onSuccess?: (practice: Practice) => void;
};

function emptyFields() {
  return {
    nbuCode: '',
    name: '',
    shortName: '',
    category: '',
    section: '',
    units: '',
    notes: '',
    referenceValue: '',
    requiresAuthorization: false,
    isSpecialAct: false,
    isElaborated: false,
    active: true,
  };
}

function practiceToFields(p: Practice) {
  return {
    nbuCode: p.nbuCode,
    name: p.name,
    shortName: p.shortName ?? '',
    category: p.category ?? '',
    section: p.section ?? '',
    units: p.units ?? '',
    notes: p.notes ?? '',
    referenceValue: p.referenceValue ?? '',
    requiresAuthorization: p.requiresAuthorization,
    isSpecialAct: p.isSpecialAct,
    isElaborated: p.isElaborated,
    active: p.active,
  };
}

type Fields = ReturnType<typeof emptyFields>;
type Errors = Partial<Record<'nbuCode' | 'name' | 'units', string>>;

export function PracticeFormDialog({ open, onOpenChange, mode, onSuccess }: Props) {
  const qc = useQueryClient();
  const [fields, setFields] = useState<Fields>(emptyFields);
  const [errors, setErrors] = useState<Errors>({});

  useEffect(() => {
    if (!open) return;
    setFields(mode.type === 'edit' ? practiceToFields(mode.practice) : emptyFields());
    setErrors({});
  }, [open, mode]);

  function set<K extends keyof Fields>(key: K, value: Fields[K]) {
    setFields((prev) => ({ ...prev, [key]: value }));
    if (key in errors) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate(): Errors {
    const e: Errors = {};
    if (!fields.nbuCode.trim()) e.nbuCode = 'Requerido.';
    if (!fields.name.trim()) e.name = 'Requerido.';
    if (fields.units.trim() && Number.isNaN(Number(fields.units.trim()))) {
      e.units = 'Debe ser un número (ej: 2.50).';
    }
    return e;
  }

  const createMutation = useMutation({
    mutationFn: async (dto: CreatePracticeDto) => {
      const { data } = await apiClient.post<Practice>('/practices', dto);
      return data;
    },
    onSuccess: (p) => {
      toast.success('Práctica creada');
      qc.invalidateQueries({ queryKey: ['practices'] });
      onOpenChange(false);
      onSuccess?.(p);
    },
    onError: (err) => toast.error(apiError(err, 'No se pudo crear la práctica')),
  });

  const editMutation = useMutation({
    mutationFn: async ({ id, dto }: { id: number; dto: UpdatePracticeDto }) => {
      const { data } = await apiClient.patch<Practice>(`/practices/${id}`, dto);
      return data;
    },
    onSuccess: (p) => {
      toast.success('Práctica actualizada');
      qc.invalidateQueries({ queryKey: ['practices'] });
      onOpenChange(false);
      onSuccess?.(p);
    },
    onError: (err) => toast.error(apiError(err, 'No se pudo actualizar la práctica')),
  });

  const isPending = createMutation.isPending || editMutation.isPending;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const dto: CreatePracticeDto = {
      nbuCode: fields.nbuCode.trim(),
      name: fields.name.trim(),
      shortName: fields.shortName.trim() || null,
      category: fields.category.trim() || null,
      section: fields.section.trim() || null,
      units: fields.units.trim() || null,
      notes: fields.notes.trim() || null,
      referenceValue: fields.referenceValue.trim() || null,
      requiresAuthorization: fields.requiresAuthorization,
      isSpecialAct: fields.isSpecialAct,
      isElaborated: fields.isElaborated,
      active: fields.active,
    };

    if (mode.type === 'create') {
      createMutation.mutate(dto);
    } else {
      editMutation.mutate({ id: mode.practice.id, dto });
    }
  }

  const isEdit = mode.type === 'edit';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar práctica' : 'Nueva práctica'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Modificá los campos que querés actualizar.'
              : 'Completá los datos para agregar una práctica al catálogo.'}
          </DialogDescription>
        </DialogHeader>

        <form id="practice-form" onSubmit={handleSubmit} noValidate>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[140px_1fr]">
              <FormField label="Código NBU" htmlFor="nbuCode" required error={errors.nbuCode}>
                <Input
                  id="nbuCode"
                  value={fields.nbuCode}
                  onChange={(e) => set('nbuCode', e.target.value)}
                  placeholder="ej: 10201"
                  className="font-mono"
                  disabled={isPending}
                />
              </FormField>

              <FormField label="Nombre" htmlFor="pracName" required error={errors.name}>
                <Input
                  id="pracName"
                  value={fields.name}
                  onChange={(e) => set('name', e.target.value)}
                  placeholder="ej: Hemograma completo"
                  disabled={isPending}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Nombre corto" htmlFor="shortName">
                <Input
                  id="shortName"
                  value={fields.shortName}
                  onChange={(e) => set('shortName', e.target.value)}
                  placeholder="ej: Hemograma"
                  disabled={isPending}
                />
              </FormField>

              <FormField label="Sección" htmlFor="section">
                <Input
                  id="section"
                  value={fields.section}
                  onChange={(e) => set('section', e.target.value)}
                  placeholder="ej: Hematología"
                  disabled={isPending}
                />
              </FormField>

              <FormField label="Categoría" htmlFor="category">
                <Input
                  id="category"
                  value={fields.category}
                  onChange={(e) => set('category', e.target.value)}
                  placeholder="ej: Análisis de sangre"
                  disabled={isPending}
                />
              </FormField>

              <FormField label="Valor UB" htmlFor="units" error={errors.units}>
                <Input
                  id="units"
                  value={fields.units}
                  onChange={(e) => set('units', e.target.value)}
                  placeholder="ej: 2.50"
                  className="font-mono"
                  inputMode="decimal"
                  disabled={isPending}
                />
              </FormField>
            </div>

            <FormField label="Notas internas" htmlFor="notes">
              <Textarea
                id="notes"
                rows={2}
                value={fields.notes}
                onChange={(e) => set('notes', e.target.value)}
                placeholder="Observaciones internas…"
                disabled={isPending}
              />
            </FormField>

            <FormField
              label="Valores de referencia orientativos"
              htmlFor="referenceValue"
              description="Visible para el bioquímico al cargar resultados. No se imprime en el informe."
            >
              <Textarea
                id="referenceValue"
                rows={3}
                value={fields.referenceValue}
                onChange={(e) => set('referenceValue', e.target.value)}
                placeholder="Ej: Hombres: 70–100 mg/dL / Mujeres: 65–95 mg/dL"
                disabled={isPending}
              />
            </FormField>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="flex cursor-pointer items-start gap-2.5">
                <Checkbox
                  checked={fields.requiresAuthorization}
                  onCheckedChange={(v) => set('requiresAuthorization', v === true)}
                  disabled={isPending}
                  className="mt-0.5"
                />
                <span>
                  <span className="block text-[var(--color-fg)] text-sm font-medium">Requiere autorización</span>
                  <span className="text-[var(--color-fg-muted)] text-xs">OS debe aprobar antes</span>
                </span>
              </label>

              <label className="flex cursor-pointer items-start gap-2.5">
                <Checkbox
                  checked={fields.isSpecialAct}
                  onCheckedChange={(v) => set('isSpecialAct', v === true)}
                  disabled={isPending}
                  className="mt-0.5"
                />
                <span>
                  <span className="block text-[var(--color-fg)] text-sm font-medium">Acto especial</span>
                  <span className="text-[var(--color-fg-muted)] text-xs">Facturación diferenciada</span>
                </span>
              </label>

              <label className="flex cursor-pointer items-start gap-2.5">
                <Checkbox
                  checked={fields.isElaborated}
                  onCheckedChange={(v) => set('isElaborated', v === true)}
                  disabled={isPending}
                  className="mt-0.5"
                />
                <span>
                  <span className="block text-[var(--color-fg)] text-sm font-medium">Elaborada por el lab</span>
                  <span className="text-[var(--color-fg-muted)] text-xs">Se procesa internamente</span>
                </span>
              </label>

              <label className="flex cursor-pointer items-start gap-2.5">
                <Checkbox
                  checked={fields.active}
                  onCheckedChange={(v) => set('active', v === true)}
                  disabled={isPending}
                  className="mt-0.5"
                />
                <span>
                  <span className="block text-[var(--color-fg)] text-sm font-medium">Activa</span>
                  <span className="text-[var(--color-fg-muted)] text-xs">Disponible en órdenes</span>
                </span>
              </label>
            </div>
          </div>
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="submit" form="practice-form" disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />}
            {isEdit ? 'Guardar cambios' : 'Crear práctica'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
