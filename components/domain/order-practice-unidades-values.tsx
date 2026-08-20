'use client';

function trimDecimals(v: string | null | undefined): string | null {
  if (!v) return null;
  return v.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
}

import { UnidadesDialog } from '@/components/domain/practice-unidades-section';
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
import type {
  OrderPracticeUnidadItem,
  OrderPracticeUnidadValue,
  UpsertOrderPracticeUnidadDto,
} from '@/lib/api/types';
import { formatNumericAR } from '@/lib/money';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Loader2, Settings } from 'lucide-react';
import { memo, useEffect, useId, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

function apiError(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const msg = err.response?.data?.message;
    if (Array.isArray(msg)) return msg.join('. ');
    if (typeof msg === 'string') return msg;
  }
  return fallback;
}

function isNumericString(s: string): boolean {
  const trimmed = s.trim().replace(',', '.');
  if (trimmed === '') return false;
  return !Number.isNaN(Number(trimmed)) && /^-?\d+(\.\d+)?$/.test(trimmed);
}

function initialInputValue(item: OrderPracticeUnidadItem): string {
  if (!item.value) return '';
  if (item.value.valueNumeric) return formatNumericAR(item.value.valueNumeric);
  return item.value.valueText ?? '';
}

// ── Hemograma auto-calculation ───────────────────────────────────────

interface HemogramaIds {
  hctoId: number | null;
  rbcId: number | null;
  hbId: number | null;
  vcmId: number | null;
  hcmId: number | null;
  chcmId: number | null;
  derivedIds: Set<number>;
}

function detectHemogramaIds(items: OrderPracticeUnidadItem[]): HemogramaIds | null {
  const find = (pred: (n: string) => boolean) => items.find((u) => pred(u.nombre));

  const hcto = find((n) => /hematocrito/i.test(n));
  const rbc = find((n) => /gl[oó]bulos?\s*rojos?|eritrocit|\bGR\b|\bRBC\b/i.test(n));
  const hb = find((n) => /hemoglobin[ao]/i.test(n) && !/corpuscular/i.test(n));
  const vcm = find((n) => /\bVCM\b/i.test(n) && !/CHCM/i.test(n));
  const hcm = find((n) => /\bHCM\b/i.test(n) && !/CHCM/i.test(n));
  const chcm = find((n) => /\bCHCM\b/i.test(n));

  if (!vcm && !hcm && !chcm) return null;

  const derivedIds = new Set<number>();
  if (vcm) derivedIds.add(vcm.unidadId);
  if (hcm) derivedIds.add(hcm.unidadId);
  if (chcm) derivedIds.add(chcm.unidadId);

  return {
    hctoId: hcto?.unidadId ?? null,
    rbcId: rbc?.unidadId ?? null,
    hbId: hb?.unidadId ?? null,
    vcmId: vcm?.unidadId ?? null,
    hcmId: hcm?.unidadId ?? null,
    chcmId: chcm?.unidadId ?? null,
    derivedIds,
  };
}

function parseNumAR(s: string | null | undefined): number | null {
  if (!s) return null;
  const n = Number(String(s).replace(',', '.'));
  return Number.isNaN(n) ? null : n;
}

function computeHemogramaValues(
  items: OrderPracticeUnidadItem[],
  ids: HemogramaIds,
): Map<number, string> {
  const result = new Map<number, string>();
  const getVal = (id: number | null) => {
    if (!id) return null;
    const u = items.find((u) => u.unidadId === id);
    if (!u?.value) return null;
    return parseNumAR(u.value.valueNumeric ?? u.value.valueText ?? null);
  };

  const hcto = getVal(ids.hctoId);
  const rbcRaw = getVal(ids.rbcId);
  const hb = getVal(ids.hbId);

  // GR puede ingresarse en /mm³ absoluto (ej: 4720000) o en millones (ej: 4.72).
  // Las fórmulas VCM/HCM esperan millones, así que normalizamos si el valor > 1000.
  const rbc = rbcRaw != null && rbcRaw > 1000 ? rbcRaw / 1_000_000 : rbcRaw;

  const fmt = (n: number) => {
    const rounded = Math.round(n * 10) / 10;
    return String(rounded).replace('.', ',');
  };

  if (hcto != null && rbc != null && rbc !== 0 && ids.vcmId) {
    result.set(ids.vcmId, fmt((hcto * 10) / rbc));
  }
  if (hb != null && rbc != null && rbc !== 0 && ids.hcmId) {
    result.set(ids.hcmId, fmt((hb * 10) / rbc));
  }
  if (hb != null && hcto != null && hcto !== 0 && ids.chcmId) {
    result.set(ids.chcmId, fmt((hb * 100) / hcto));
  }

  return result;
}

// ── Bilirrubina Indirecta auto-calculation ───────────────────────────

interface BilirrubinaIds {
  directaId: number | null;
  totalId: number | null;
  indirectaId: number | null;
  derivedIds: Set<number>;
}

function detectBilirrubinaIds(items: OrderPracticeUnidadItem[]): BilirrubinaIds | null {
  const find = (pred: (n: string) => boolean) => items.find((u) => pred(u.nombre));

  const directa = find((n) => /bilirrub.*(directa)/i.test(n) && !/indirecta/i.test(n));
  const total = find((n) => /bilirrub.*total/i.test(n));

  if (!directa || !total) return null;

  // Try to find indirecta by name first
  let indirecta = find((n) => /indirecta/i.test(n));

  // Fallback: if there's exactly one remaining field, it must be the indirecta
  if (!indirecta) {
    const others = items.filter(
      (u) => u.unidadId !== directa.unidadId && u.unidadId !== total.unidadId,
    );
    if (others.length === 1) indirecta = others[0];
  }

  if (!indirecta) return null;

  const derivedIds = new Set<number>([indirecta.unidadId]);
  return {
    directaId: directa.unidadId,
    totalId: total.unidadId,
    indirectaId: indirecta.unidadId,
    derivedIds,
  };
}

function computeBilirrubinaValues(
  items: OrderPracticeUnidadItem[],
  ids: BilirrubinaIds,
): Map<number, string> {
  const result = new Map<number, string>();
  const getVal = (id: number | null) => {
    if (!id) return null;
    const u = items.find((u) => u.unidadId === id);
    if (!u?.value) return null;
    return parseNumAR(u.value.valueNumeric ?? u.value.valueText ?? null);
  };

  const directa = getVal(ids.directaId);
  const total = getVal(ids.totalId);

  if (directa != null && total != null && ids.indirectaId != null) {
    const indirecta = total - directa;
    if (indirecta >= 0) {
      const rounded = Math.round(indirecta * 100) / 100;
      result.set(ids.indirectaId, String(rounded).replace('.', ','));
    }
  }

  return result;
}

// ── UnidadValueInput ─────────────────────────────────────────────────

type UnidadValueInputProps = {
  orderPracticeId: number;
  item: OrderPracticeUnidadItem;
  disabled: boolean;
  /** Valor calculado automáticamente — muestra el campo como solo lectura */
  computedValue?: string | null;
};

const UnidadValueInput = memo(function UnidadValueInput({
  orderPracticeId,
  item,
  disabled,
  computedValue,
}: UnidadValueInputProps) {
  const qc = useQueryClient();
  const inputId = useId();
  const [value, setValue] = useState(() => initialInputValue(item));

  const isComputed = computedValue != null;
  const effectiveDisabled = disabled || isComputed;
  const dirty = !isComputed && value !== initialInputValue(item);

  // Sync computed value into local state when it changes
  useEffect(() => {
    if (computedValue != null) setValue(computedValue);
  }, [computedValue]);

  const upsertMutation = useMutation({
    mutationFn: async () => {
      const trimmed = value.trim();
      if (trimmed === '') {
        if (item.value) {
          await apiClient.delete(`/order-practices/${orderPracticeId}/unidades/${item.unidadId}`);
        }
        return null;
      }
      const payload: UpsertOrderPracticeUnidadDto = { unidadId: item.unidadId };
      if (isNumericString(trimmed)) {
        payload.valueNumeric = trimmed.replace(',', '.').replace(/\.(?=.*\.)/g, '');
      } else {
        payload.valueText = trimmed;
      }
      const { data } = await apiClient.post<OrderPracticeUnidadValue>(
        `/order-practices/${orderPracticeId}/unidades`,
        payload,
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queries.orderPracticeUnidades(orderPracticeId) });
    },
    onError: (err) => toast.error(apiError(err, `No se pudo guardar ${item.nombre}`)),
  });

  function handleBlur() {
    if (!dirty || effectiveDisabled || upsertMutation.isPending) return;
    upsertMutation.mutate();
  }

  const opciones = item.opcionesPredeterminadas;
  const hasOpciones = opciones && opciones.length > 0;

  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor={inputId}
        className="flex shrink-0 items-center gap-1 text-[var(--color-fg)] text-sm"
      >
        <span>{item.nombre}</span>
        {item.simbolo && (
          <span className="font-mono text-[var(--color-fg-muted)] text-xs">({item.simbolo})</span>
        )}
        {upsertMutation.isPending && (
          <Loader2 className="h-3 w-3 animate-spin text-[var(--color-fg-muted)]" strokeWidth={2} />
        )}
      </label>

      {hasOpciones ? (
        <Select
          value={value}
          onValueChange={(v) => {
            if (effectiveDisabled) return;
            setValue(v);
            setTimeout(() => {
              if (!v.trim()) return;
              upsertMutation.mutate();
            }, 0);
          }}
          disabled={effectiveDisabled}
        >
          <SelectTrigger id={inputId} className="h-8 w-40 text-sm">
            <SelectValue placeholder="Seleccionar…" />
          </SelectTrigger>
          <SelectContent>
            {opciones.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input
          id={inputId}
          value={value}
          disabled={effectiveDisabled}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !effectiveDisabled && dirty) {
              e.preventDefault();
              upsertMutation.mutate();
            }
          }}
          className={`h-8 w-32 text-sm${isComputed ? ' bg-[var(--color-bg)] font-mono text-[var(--color-fg-muted)]' : ''}`}
          placeholder="—"
        />
      )}

      {(item.rangeLow || item.rangeHigh || item.referenceText) && (
        <span className="text-[10px] text-[var(--color-fg-subtle)]">
          {item.rangeLow || item.rangeHigh
            ? `(${trimDecimals(item.rangeLow) ?? '—'} – ${trimDecimals(item.rangeHigh) ?? '—'})`
            : item.referenceText}
        </span>
      )}

      {isComputed && (
        <span className="text-[9px] text-[var(--color-fg-subtle)] italic">auto</span>
      )}
    </div>
  );
});

// ── OrderPracticeUnidadesValues ──────────────────────────────────────

type Props = {
  orderPracticeId: number;
  practiceId: number | null;
  initialUnidades: OrderPracticeUnidadItem[];
  disabled?: boolean;
};

export function OrderPracticeUnidadesValues({
  orderPracticeId,
  practiceId,
  initialUnidades,
  disabled = false,
}: Props) {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: unidades = initialUnidades } = useQuery({
    queryKey: queries.orderPracticeUnidades(orderPracticeId),
    queryFn: async () => {
      const { data } = await apiClient.get<OrderPracticeUnidadItem[]>(
        `/order-practices/${orderPracticeId}/unidades`,
      );
      return data;
    },
    initialData: initialUnidades,
  });

  const canConfigure = practiceId !== null && !disabled;
  const sorted = [...unidades].sort((a, b) => a.sortOrder - b.sortOrder);

  // Detect auto-calc rules (only recompute when the set of unidad IDs changes)
  const unidadIdsKey = unidades.map((u) => u.unidadId).join(',');
  const hemogramaIds = useMemo(() => detectHemogramaIds(sorted), [unidadIdsKey]);
  const bilirrubinaIds = useMemo(() => detectBilirrubinaIds(sorted), [unidadIdsKey]);

  // All derived unidad IDs across all rules
  const allDerivedIds = useMemo(() => {
    const s = new Set<number>();
    hemogramaIds?.derivedIds.forEach((id) => s.add(id));
    bilirrubinaIds?.derivedIds.forEach((id) => s.add(id));
    return s;
  }, [hemogramaIds, bilirrubinaIds]);

  // Stable key of source values — recompute derived only when sources change
  const sourceValKey = useMemo(() => {
    const sourceIds = new Set<number>();
    if (hemogramaIds) {
      [hemogramaIds.hctoId, hemogramaIds.rbcId, hemogramaIds.hbId]
        .filter((id): id is number => id != null)
        .forEach((id) => sourceIds.add(id));
    }
    if (bilirrubinaIds) {
      [bilirrubinaIds.directaId, bilirrubinaIds.totalId]
        .filter((id): id is number => id != null)
        .forEach((id) => sourceIds.add(id));
    }
    return [...sourceIds]
      .map((id) => {
        const u = unidades.find((u) => u.unidadId === id);
        return `${id}:${u?.value?.valueNumeric ?? u?.value?.valueText ?? ''}`;
      })
      .join('|');
  }, [unidades, hemogramaIds, bilirrubinaIds]);

  // Computed values for derived fields (shown in inputs)
  const computedMap = useMemo(() => {
    const merged = new Map<number, string>();
    if (hemogramaIds) {
      computeHemogramaValues(sorted, hemogramaIds).forEach((v, k) => merged.set(k, v));
    }
    if (bilirrubinaIds) {
      computeBilirrubinaValues(sorted, bilirrubinaIds).forEach((v, k) => merged.set(k, v));
    }
    return merged;
  }, [sourceValKey, hemogramaIds, bilirrubinaIds]);

  // Auto-save derived values when sources change
  const lastSaved = useRef<Map<number, string>>(new Map());

  const autoSaveMut = useMutation({
    mutationFn: async ({ unidadId, value }: { unidadId: number; value: string }) => {
      const payload: UpsertOrderPracticeUnidadDto = {
        unidadId,
        valueNumeric: value.replace(',', '.'),
      };
      await apiClient.post<OrderPracticeUnidadValue>(
        `/order-practices/${orderPracticeId}/unidades`,
        payload,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queries.orderPracticeUnidades(orderPracticeId) });
    },
  });

  useEffect(() => {
    if (disabled || computedMap.size === 0) return;
    for (const [unidadId, value] of computedMap) {
      if (lastSaved.current.get(unidadId) !== value) {
        lastSaved.current.set(unidadId, value);
        autoSaveMut.mutate({ unidadId, value });
      }
    }
  }, [sourceValKey]);

  if (sorted.length === 0 && !canConfigure) return null;

  return (
    <div className="border-[var(--color-border)] border-t pt-3">
      {sorted.length === 0 ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-[var(--color-fg-subtle)] text-xs">
            Esta práctica no tiene sub-prácticas configuradas.
          </p>
          {canConfigure && (
            <Button type="button" size="sm" variant="outline" onClick={() => setDialogOpen(true)}>
              <Settings className="h-3.5 w-3.5" strokeWidth={2} />
              Configurar prácticas
            </Button>
          )}
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {sorted.map((item) => (
            <UnidadValueInput
              key={item.associationId}
              orderPracticeId={orderPracticeId}
              item={item}
              disabled={disabled}
              computedValue={
                allDerivedIds.has(item.unidadId)
                  ? (computedMap.get(item.unidadId) ?? null)
                  : null
              }
            />
          ))}
          {canConfigure && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8"
              onClick={() => setDialogOpen(true)}
              title="Configurar prácticas de este análisis"
            >
              <Settings className="h-3.5 w-3.5" strokeWidth={2} />
            </Button>
          )}
        </div>
      )}

      {practiceId !== null && (
        <UnidadesDialog
          practiceId={practiceId}
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
        />
      )}
    </div>
  );
}
