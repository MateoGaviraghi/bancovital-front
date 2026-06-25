'use client';

function trimDec(v: string): string {
  return v.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
}

import { Button } from '@/components/ui/button';
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
import type { Especie, PracticeReferenciaEspecie } from '@/lib/api/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';
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

type FormRow = {
  especieId: string;
  rangeLow: string;
  rangeHigh: string;
  unit: string;
  referenceText: string;
  notes: string;
};

const EMPTY_ROW: FormRow = {
  especieId: '',
  rangeLow: '',
  rangeHigh: '',
  unit: '',
  referenceText: '',
  notes: '',
};

function RefForm({
  row,
  onChange,
  especies,
  usedEspecieIds,
  onSubmit,
  onCancel,
  isPending,
  submitLabel,
}: {
  row: FormRow;
  onChange: (r: FormRow) => void;
  especies: Especie[];
  usedEspecieIds: Set<number>;
  onSubmit: () => void;
  onCancel: () => void;
  isPending: boolean;
  submitLabel: string;
}) {
  const available = especies.filter(
    (e) => !usedEspecieIds.has(e.id) || String(e.id) === row.especieId,
  );
  return (
    <div className="space-y-3 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1">
          <span className="text-[var(--color-fg-muted)] text-xs">Especie *</span>
          <Select value={row.especieId} onValueChange={(v) => onChange({ ...row, especieId: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar…" />
            </SelectTrigger>
            <SelectContent>
              {available.map((e) => (
                <SelectItem key={e.id} value={String(e.id)}>
                  {e.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <span className="text-[var(--color-fg-muted)] text-xs">Rango bajo</span>
          <Input
            value={row.rangeLow}
            onChange={(e) => onChange({ ...row, rangeLow: e.target.value })}
            placeholder="ej: 70"
          />
        </div>
        <div className="space-y-1">
          <span className="text-[var(--color-fg-muted)] text-xs">Rango alto</span>
          <Input
            value={row.rangeHigh}
            onChange={(e) => onChange({ ...row, rangeHigh: e.target.value })}
            placeholder="ej: 110"
          />
        </div>
        <div className="space-y-1">
          <span className="text-[var(--color-fg-muted)] text-xs">Unidad</span>
          <Input
            value={row.unit}
            onChange={(e) => onChange({ ...row, unit: e.target.value })}
            placeholder="ej: mg/dL"
          />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <span className="text-[var(--color-fg-muted)] text-xs">Texto de referencia</span>
          <Input
            value={row.referenceText}
            onChange={(e) => onChange({ ...row, referenceText: e.target.value })}
            placeholder="ej: Valores normales entre 70 y 110 mg/dL"
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button type="button" size="sm" onClick={onSubmit} disabled={!row.especieId || isPending}>
          {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />}
          {submitLabel}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel} disabled={isPending}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}

export function PracticeReferenciasEspecieSection({ practiceId }: { practiceId: number }) {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [addRow, setAddRow] = useState<FormRow>(EMPTY_ROW);
  const [editingEspecieId, setEditingEspecieId] = useState<number | null>(null);
  const [editRow, setEditRow] = useState<FormRow>(EMPTY_ROW);

  const refKey = ['practices', practiceId, 'referencias-especie'] as const;

  const { data: refs = [], isLoading } = useQuery({
    queryKey: refKey,
    queryFn: () =>
      apiClient
        .get<PracticeReferenciaEspecie[]>(`/practices/${practiceId}/referencias-especie`)
        .then((r) => r.data),
  });

  const { data: especies = [] } = useQuery({
    queryKey: queries.especies.list(),
    queryFn: () => apiClient.get<Especie[]>('/especies').then((r) => r.data),
    staleTime: 5 * 60_000,
  });

  const usedIds = new Set(refs.map((r) => r.especieId));

  function invalidate() {
    qc.invalidateQueries({ queryKey: refKey });
  }

  const upsertMut = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiClient.post(`/practices/${practiceId}/referencias-especie`, payload),
    onSuccess: () => {
      toast.success('Referencia guardada');
      setShowAdd(false);
      setAddRow(EMPTY_ROW);
      setEditingEspecieId(null);
      invalidate();
    },
    onError: (err) => toast.error(apiError(err, 'Error al guardar referencia')),
  });

  const deleteMut = useMutation({
    mutationFn: (especieId: number) =>
      apiClient.delete(`/practices/${practiceId}/referencias-especie/${especieId}`),
    onSuccess: () => {
      toast.success('Referencia eliminada');
      invalidate();
    },
    onError: (err) => toast.error(apiError(err, 'Error al eliminar referencia')),
  });

  function submitRow(row: FormRow) {
    const nullify = (s: string) => (s.trim() === '' ? null : s.trim());
    upsertMut.mutate({
      especieId: Number(row.especieId),
      rangeLow: nullify(row.rangeLow),
      rangeHigh: nullify(row.rangeHigh),
      unit: nullify(row.unit),
      referenceText: nullify(row.referenceText),
      notes: nullify(row.notes),
    });
  }

  function startEdit(ref: PracticeReferenciaEspecie) {
    setEditingEspecieId(ref.especieId);
    setEditRow({
      especieId: String(ref.especieId),
      rangeLow: ref.rangeLow ?? '',
      rangeHigh: ref.rangeHigh ?? '',
      unit: ref.unit ?? '',
      referenceText: ref.referenceText ?? '',
      notes: ref.notes ?? '',
    });
  }

  const especieMap = new Map(especies.map((e) => [e.id, e]));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-[var(--color-fg)] text-sm">
            Valores de referencia por especie
          </h3>
          <p className="text-[var(--color-fg-muted)] text-xs">
            Rangos específicos por especie animal para esta práctica.
          </p>
        </div>
        {!showAdd && (
          <Button type="button" size="sm" variant="outline" onClick={() => setShowAdd(true)}>
            <Plus className="h-3.5 w-3.5" strokeWidth={2} />
            Agregar especie
          </Button>
        )}
      </div>

      {showAdd && (
        <RefForm
          row={addRow}
          onChange={setAddRow}
          especies={especies}
          usedEspecieIds={usedIds}
          onSubmit={() => submitRow(addRow)}
          onCancel={() => {
            setShowAdd(false);
            setAddRow(EMPTY_ROW);
          }}
          isPending={upsertMut.isPending}
          submitLabel="Guardar"
        />
      )}

      {isLoading ? (
        <div className="flex items-center gap-2 rounded-md border border-dashed border-[var(--color-border)] px-3 py-4 text-[var(--color-fg-muted)] text-sm">
          <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
          Cargando…
        </div>
      ) : refs.length === 0 && !showAdd ? (
        <div className="rounded-md border border-dashed border-[var(--color-border)] px-3 py-4 text-[var(--color-fg-subtle)] text-sm">
          Sin valores de referencia por especie.
        </div>
      ) : refs.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-[var(--color-border)] border-b bg-[var(--color-bg-subtle)] text-[10px] text-[var(--color-fg-muted)] uppercase tracking-wide">
                <th className="px-4 py-2 text-left font-medium">Especie</th>
                <th className="px-4 py-2 text-left font-medium">Rango bajo</th>
                <th className="px-4 py-2 text-left font-medium">Rango alto</th>
                <th className="px-4 py-2 text-left font-medium">Unidad</th>
                <th className="px-4 py-2 text-left font-medium">Texto referencia</th>
                <th className="px-4 py-2 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {refs.map((ref) => {
                if (editingEspecieId === ref.especieId) {
                  return (
                    <tr key={ref.especieId}>
                      <td colSpan={6} className="p-3">
                        <RefForm
                          row={editRow}
                          onChange={setEditRow}
                          especies={especies}
                          usedEspecieIds={usedIds}
                          onSubmit={() => submitRow(editRow)}
                          onCancel={() => setEditingEspecieId(null)}
                          isPending={upsertMut.isPending}
                          submitLabel="Actualizar"
                        />
                      </td>
                    </tr>
                  );
                }
                return (
                  <tr
                    key={ref.especieId}
                    className="border-[var(--color-border)] border-b last:border-b-0"
                  >
                    <td className="px-4 py-2.5 font-medium text-[var(--color-fg)]">
                      {especieMap.get(ref.especieId)?.nombre ?? `#${ref.especieId}`}
                    </td>
                    <td className="tabular px-4 py-2.5 font-mono text-[var(--color-fg)]">
                      {ref.rangeLow ? trimDec(ref.rangeLow) : '—'}
                    </td>
                    <td className="tabular px-4 py-2.5 font-mono text-[var(--color-fg)]">
                      {ref.rangeHigh ? trimDec(ref.rangeHigh) : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-[var(--color-fg-muted)]">{ref.unit ?? '—'}</td>
                    <td className="px-4 py-2.5 text-[var(--color-fg-muted)]">
                      {ref.referenceText ?? '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => startEdit(ref)}
                          className="rounded p-1 text-[var(--color-fg-muted)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-fg)]"
                        >
                          <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteMut.mutate(ref.especieId)}
                          disabled={deleteMut.isPending}
                          className="rounded p-1 text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)]"
                        >
                          {deleteMut.isPending && deleteMut.variables === ref.especieId ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
