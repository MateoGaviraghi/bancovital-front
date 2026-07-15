'use client';

function trimDecimals(v: string | null | undefined): string | null {
  if (!v) return null;
  return v.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
}

import { PracticeUnidadesSection } from '@/components/domain/practice-unidades-section';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { memo, useId, useState } from 'react';
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

type UnidadValueInputProps = {
  orderPracticeId: number;
  item: OrderPracticeUnidadItem;
  disabled: boolean;
};

const UnidadValueInput = memo(function UnidadValueInput({
  orderPracticeId,
  item,
  disabled,
}: UnidadValueInputProps) {
  const qc = useQueryClient();
  const inputId = useId();
  const [value, setValue] = useState(() => initialInputValue(item));
  const dirty = value !== initialInputValue(item);

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
    if (!dirty || disabled || upsertMutation.isPending) return;
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
            setValue(v);
            setTimeout(() => {
              if (!v.trim()) return;
              upsertMutation.mutate();
            }, 0);
          }}
          disabled={disabled}
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
          disabled={disabled}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !disabled && dirty) {
              e.preventDefault();
              upsertMutation.mutate();
            }
          }}
          className="h-8 w-32 text-sm"
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
    </div>
  );
});

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

  if (sorted.length === 0 && !canConfigure) return null;

  return (
    <div className="border-[var(--color-border)] border-t pt-3">
      {sorted.length === 0 ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-[var(--color-fg-subtle)] text-xs">
            Esta práctica no tiene unidades de medida configuradas.
          </p>
          {canConfigure && (
            <Button type="button" size="sm" variant="outline" onClick={() => setDialogOpen(true)}>
              <Settings className="h-3.5 w-3.5" strokeWidth={2} />
              Configurar unidades
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
            />
          ))}
          {canConfigure && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8"
              onClick={() => setDialogOpen(true)}
              title="Configurar unidades de esta práctica"
            >
              <Settings className="h-3.5 w-3.5" strokeWidth={2} />
            </Button>
          )}
        </div>
      )}

      {practiceId !== null && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Unidades de la práctica</DialogTitle>
              <DialogDescription>
                Los cambios se aplican al catálogo de la práctica y se reflejan en todas las
                órdenes.
              </DialogDescription>
            </DialogHeader>
            <PracticeUnidadesSection practiceId={practiceId} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
