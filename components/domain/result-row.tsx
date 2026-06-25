'use client';

import { OrderPracticeUnidadesValues } from '@/components/domain/order-practice-unidades-values';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/api/client';
import type { OrderResult, ResultLine, UpsertResultDto } from '@/lib/api/types';
import { cn } from '@/lib/cn';
import { classifyResult, formatRangeHint } from '@/lib/reference-range';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

const FLAG_STYLE: Record<string, string> = {
  normal: 'text-[var(--color-success)]',
  low: 'text-[var(--color-warning)]',
  high: 'text-[var(--color-warning)]',
  critical_low: 'font-semibold text-[var(--color-danger)]',
  critical_high: 'font-semibold text-[var(--color-danger)]',
};

const FLAG_LABEL: Record<string, string> = {
  normal: 'Normal',
  low: '↓ Bajo',
  high: '↑ Alto',
  critical_low: '‼ Crítico bajo',
  critical_high: '‼ Crítico alto',
};

const SHORT_TO_LONG: Record<string, string> = { L: 'low', N: 'normal', H: 'high' };

function apiError(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const msg = err.response?.data?.message;
    if (Array.isArray(msg)) return msg.join('. ');
    if (typeof msg === 'string') return msg;
  }
  return fallback;
}

type Props = {
  line: ResultLine;
  disabled?: boolean;
  onBeforeSave: () => Promise<void>;
  saveTrigger: number;
  onDirtyChange: (id: number, isDirty: boolean) => void;
  onSaveSuccess: () => void;
};

export function ResultRow({
  line,
  disabled = false,
  onBeforeSave,
  saveTrigger,
  onDirtyChange,
  onSaveSuccess,
}: Props) {
  function displayNumeric(s: string | null | undefined): string {
    if (!s) return '';
    const clean = s.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '') || '0';
    return clean.replace('.', ',');
  }

  const initial = {
    resultado: line.result?.valueNumeric
      ? displayNumeric(line.result.valueNumeric)
      : (line.result?.valueText ?? ''),
    notes: line.result?.notes ?? '',
  };

  const [resultado, setResultado] = useState(initial.resultado);
  const [notes, setNotes] = useState(initial.notes);
  const [savedAt, setSavedAt] = useState<Date | null>(
    line.result?.enteredAt ? new Date(line.result.enteredAt) : null,
  );
  const [persistedFlag, setPersistedFlag] = useState<string | null>(
    line.result?.flag ? (SHORT_TO_LONG[line.result.flag] ?? null) : null,
  );

  const dirty =
    resultado !== initial.resultado ||
    notes !== initial.notes;

  // Report dirty state to parent
  // biome-ignore lint/correctness/useExhaustiveDependencies: onDirtyChange and id are stable; only dirty drives this
  useEffect(() => {
    onDirtyChange(line.orderPractice.id, dirty);
  }, [dirty]);

  // Live flag preview
  const [flag, setFlag] = useState<string | null>(null);
  const resultadoNormalized = resultado.trim().replace(',', '.');
  const isNumeric = /^-?\d+(\.\d+)?$/.test(resultadoNormalized);
  useEffect(() => {
    if (!isNumeric || !line.referenceRule) {
      setFlag(null);
      return;
    }
    setFlag(classifyResult(resultadoNormalized, line.referenceRule));
  }, [resultadoNormalized, isNumeric, line.referenceRule]);

  const refHint = formatRangeHint(line.referenceRule, line.defaultUnit ?? line.result?.unit ?? null);

  const mutation = useMutation({
    mutationFn: async () => {
      const raw = resultado.trim();
      if (!raw) throw new Error('Cargá un resultado.');
      const normalized = raw.replace(',', '.');
      const numericValue = /^-?\d+(\.\d+)?$/.test(normalized) ? normalized : undefined;
      const payload: UpsertResultDto = {
        orderPracticeId: line.orderPractice.id,
        valueNumeric: numericValue,
        valueText: numericValue ? undefined : raw,
        unit: (line.defaultUnit ?? '').trim() || undefined,
        notes: notes.trim() || undefined,
      };
      await onBeforeSave();
      const res = await apiClient.post<OrderResult>('/results', payload);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(`${line.orderPractice.nameSnapshot} guardado`);
      setSavedAt(new Date(data.enteredAt));
      setPersistedFlag(data.flag ? (SHORT_TO_LONG[data.flag] ?? null) : null);
      onSaveSuccess();
    },
    onError: (err) => {
      if (err instanceof Error && !axios.isAxiosError(err)) {
        toast.error(err.message);
      } else {
        toast.error(apiError(err, 'Error al guardar resultado'));
      }
    },
  });

  // Respond to "save all" trigger from parent
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally only fires on saveTrigger change; other deps are read from closure
  useEffect(() => {
    if (saveTrigger > 0 && dirty && !mutation.isPending) {
      if (resultado.trim()) mutation.mutate();
    }
  }, [saveTrigger]);

  return (
    <li className="space-y-3 px-5 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[var(--color-fg)] text-sm">{line.orderPractice.nameSnapshot}</div>
          <div className="flex flex-wrap items-center gap-2 text-[var(--color-fg-muted)] text-xs">
            <span className="font-mono">{line.orderPractice.nbuCodeSnapshot}</span>
            {refHint && <span>· ref. {refHint}</span>}
            {(() => {
              const shown = dirty ? flag : (persistedFlag ?? flag);
              return shown ? (
                <span className={cn('ml-2', FLAG_STYLE[shown])}>{FLAG_LABEL[shown]}</span>
              ) : null;
            })()}
          </div>
          {line.referenceValue && (
            <p className="mt-1 whitespace-pre-line text-[var(--color-fg-subtle)] text-xs leading-snug">
              <span className="font-medium text-[var(--color-fg-muted)]">Ref. orientativa: </span>
              {line.referenceValue}
            </p>
          )}
        </div>
        {savedAt && !dirty && (
          <span className="flex items-center gap-1 text-[var(--color-success)] text-xs">
            <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} />
            Guardado
          </span>
        )}
        {dirty && savedAt && (
          <span className="text-[var(--color-warning)] text-xs">Cambios sin guardar</span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_120px]">
        <Input
          placeholder="Resultado (numérico o texto)"
          value={resultado}
          disabled={disabled}
          onChange={(e) => setResultado(e.target.value)}
        />
        <Input
          value={line.defaultUnit ?? ''}
          disabled
          className="bg-[var(--color-bg-subtle)]"
          placeholder="—"
        />
      </div>

      <div className="flex items-center gap-3">
        <Input
          placeholder="Notas (opcional)"
          value={notes}
          disabled={disabled}
          onChange={(e) => setNotes(e.target.value)}
          className="max-w-md text-xs"
        />
        {mutation.isPending && (
          <Loader2
            className="h-3.5 w-3.5 shrink-0 animate-spin text-[var(--color-fg-muted)]"
            strokeWidth={2}
          />
        )}
      </div>

      <OrderPracticeUnidadesValues
        orderPracticeId={line.orderPractice.id}
        practiceId={line.orderPractice.practiceId}
        initialUnidades={line.unidades ?? []}
        disabled={disabled}
      />
    </li>
  );
}
