'use client';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiClient } from '@/lib/api/client';
import { queries } from '@/lib/api/queries';
import type { Especie, PracticeUnidadRefEspecie } from '@/lib/api/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
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

function trimDec(v: string): string {
  return v.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
}

interface FormRow {
  especieId: string;
  rangeLow: string;
  rangeHigh: string;
  referenceText: string;
}

const EMPTY: FormRow = { especieId: '', rangeLow: '', rangeHigh: '', referenceText: '' };

export function UnidadRefEspecieSection({
  practiceId,
  unidadId,
}: {
  practiceId: number;
  unidadId: number;
}) {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [addRow, setAddRow] = useState<FormRow>(EMPTY);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editRow, setEditRow] = useState<FormRow>(EMPTY);

  const refKey = queries.practices.unidadRefEspecie(practiceId, unidadId);

  const { data: refs = [], isLoading } = useQuery({
    queryKey: refKey,
    queryFn: () =>
      apiClient
        .get<PracticeUnidadRefEspecie[]>(
          `/practices/${practiceId}/unidades/${unidadId}/ref-especie`,
        )
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
      apiClient.post(`/practices/${practiceId}/unidades/${unidadId}/ref-especie`, payload),
    onSuccess: () => {
      toast.success('Referencia por especie guardada');
      setShowAdd(false);
      setAddRow(EMPTY);
      setEditingId(null);
      invalidate();
    },
    onError: (err) => toast.error(apiError(err, 'Error al guardar')),
  });

  const deleteMut = useMutation({
    mutationFn: (especieId: number) =>
      apiClient.delete(`/practices/${practiceId}/unidades/${unidadId}/ref-especie/${especieId}`),
    onSuccess: () => {
      toast.success('Referencia eliminada');
      invalidate();
    },
    onError: (err) => toast.error(apiError(err, 'Error al eliminar')),
  });

  function submit(row: FormRow) {
    const n = (s: string) => (s.trim() === '' ? null : s.trim());
    upsertMut.mutate({
      especieId: Number(row.especieId),
      rangeLow: n(row.rangeLow),
      rangeHigh: n(row.rangeHigh),
      referenceText: n(row.referenceText),
    });
  }

  function startEdit(ref: PracticeUnidadRefEspecie) {
    setEditingId(ref.especieId);
    setEditRow({
      especieId: String(ref.especieId),
      rangeLow: ref.rangeLow ?? '',
      rangeHigh: ref.rangeHigh ?? '',
      referenceText: ref.referenceText ?? '',
    });
  }

  const especieMap = new Map(especies.map((e) => [e.id, e]));
  const available = especies.filter((e) => !usedIds.has(e.id));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[var(--color-fg-muted)] text-[10px] font-medium uppercase tracking-wide">
          Ref. por especie
        </span>
        {!showAdd && (
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1 text-[10px] text-[var(--color-primary)] hover:underline"
          >
            <Plus className="h-3 w-3" strokeWidth={2} />
            Agregar
          </button>
        )}
      </div>

      {showAdd && (
        <RefForm
          row={addRow}
          onChange={setAddRow}
          especies={available}
          onSubmit={() => submit(addRow)}
          onCancel={() => {
            setShowAdd(false);
            setAddRow(EMPTY);
          }}
          isPending={upsertMut.isPending}
          label="Guardar"
        />
      )}

      {isLoading ? (
        <div className="flex items-center gap-1.5 py-2 text-[var(--color-fg-muted)] text-[10px]">
          <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2} />
          Cargando…
        </div>
      ) : refs.length === 0 && !showAdd ? (
        <p className="py-1 text-[var(--color-fg-subtle)] text-[10px]">
          Sin referencias por especie.
        </p>
      ) : (
        <div className="space-y-1">
          {refs.map((ref) => {
            if (editingId === ref.especieId) {
              return (
                <RefForm
                  key={ref.especieId}
                  row={editRow}
                  onChange={setEditRow}
                  especies={especies.filter((e) => !usedIds.has(e.id) || e.id === ref.especieId)}
                  onSubmit={() => submit(editRow)}
                  onCancel={() => setEditingId(null)}
                  isPending={upsertMut.isPending}
                  label="Actualizar"
                />
              );
            }
            const range =
              ref.rangeLow || ref.rangeHigh
                ? `${ref.rangeLow ? trimDec(ref.rangeLow) : '—'} – ${ref.rangeHigh ? trimDec(ref.rangeHigh) : '—'}`
                : null;
            return (
              <div
                key={ref.especieId}
                className="flex items-center justify-between rounded border border-[var(--color-border)] px-2 py-1.5 text-[10px]"
              >
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                  <span className="font-medium text-[var(--color-fg)]">
                    {especieMap.get(ref.especieId)?.nombre ?? `#${ref.especieId}`}
                  </span>
                  {range && <span className="font-mono text-[var(--color-fg-muted)]">{range}</span>}
                  {ref.referenceText && (
                    <span className="text-[var(--color-fg-muted)] italic">{ref.referenceText}</span>
                  )}
                </div>
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => startEdit(ref)}
                    className="rounded p-0.5 text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
                  >
                    <Pencil className="h-3 w-3" strokeWidth={2} />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteMut.mutate(ref.especieId)}
                    disabled={deleteMut.isPending}
                    className="rounded p-0.5 text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)]"
                  >
                    {deleteMut.isPending && deleteMut.variables === ref.especieId ? (
                      <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2} />
                    ) : (
                      <Trash2 className="h-3 w-3" strokeWidth={2} />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function RefForm({
  row,
  onChange,
  especies,
  onSubmit,
  onCancel,
  isPending,
  label,
}: {
  row: FormRow;
  onChange: (r: FormRow) => void;
  especies: Especie[];
  onSubmit: () => void;
  onCancel: () => void;
  isPending: boolean;
  label: string;
}) {
  const inputCls =
    'block w-full rounded-md border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] px-2 py-1 text-[11px] text-[var(--color-fg)] outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary-soft)]';
  return (
    <div className="space-y-2 rounded border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-2">
      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2 space-y-0.5">
          <span className="text-[var(--color-fg-muted)] text-[10px]">Especie</span>
          <Select value={row.especieId} onValueChange={(v) => onChange({ ...row, especieId: v })}>
            <SelectTrigger className="h-7 text-[11px]">
              <SelectValue placeholder="Seleccionar…" />
            </SelectTrigger>
            <SelectContent>
              {especies.map((e) => (
                <SelectItem key={e.id} value={String(e.id)}>
                  {e.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-0.5">
          <span className="text-[var(--color-fg-muted)] text-[10px]">Rango bajo</span>
          <input
            value={row.rangeLow}
            onChange={(e) => onChange({ ...row, rangeLow: e.target.value })}
            placeholder="ej: 70"
            className={inputCls}
          />
        </div>
        <div className="space-y-0.5">
          <span className="text-[var(--color-fg-muted)] text-[10px]">Rango alto</span>
          <input
            value={row.rangeHigh}
            onChange={(e) => onChange({ ...row, rangeHigh: e.target.value })}
            placeholder="ej: 110"
            className={inputCls}
          />
        </div>
        <div className="col-span-2 space-y-0.5">
          <span className="text-[var(--color-fg-muted)] text-[10px]">Texto referencia</span>
          <input
            value={row.referenceText}
            onChange={(e) => onChange({ ...row, referenceText: e.target.value })}
            placeholder="ej: Valores normales entre…"
            className={inputCls}
          />
        </div>
      </div>
      <div className="flex gap-1.5">
        <Button
          type="button"
          size="sm"
          className="h-6 text-[10px]"
          onClick={onSubmit}
          disabled={!row.especieId || isPending}
        >
          {isPending && <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2} />}
          {label}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-6 text-[10px]"
          onClick={onCancel}
          disabled={isPending}
        >
          Cancelar
        </Button>
      </div>
    </div>
  );
}
