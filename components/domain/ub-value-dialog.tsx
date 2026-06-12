'use client';

import { MoneyDisplay } from '@/components/domain/money-display';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { apiClient } from '@/lib/api/client';
import type { InsurerWithUb, SetUbValueDto } from '@/lib/api/types';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { DollarSign, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
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

function today(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

type Props = { insurer: InsurerWithUb };

export function UbValueDialog({ insurer }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [validFrom, setValidFrom] = useState(today());
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setValue('');
    setValidFrom(today());
    setNotes('');
    setError(null);
  }

  const mutation = useMutation({
    mutationFn: async () => {
      if (!/^\d+(\.\d{1,2})?$/.test(value)) {
        throw new Error('Valor inválido. Usá hasta 2 decimales (ej "1742.50").');
      }
      const payload: SetUbValueDto = {
        insurerId: insurer.id,
        value,
        validFrom,
        notes: notes.trim() || null,
      };
      await apiClient.post('/insurers/ub-values', payload);
    },
    onSuccess: () => {
      toast.success('Nuevo valor UB registrado');
      setOpen(false);
      reset();
      router.refresh();
    },
    onError: (err) => {
      if (err instanceof Error && !axios.isAxiosError(err)) setError(err.message);
      else toast.error(apiError(err, 'Error al actualizar UB'));
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <DollarSign className="h-3.5 w-3.5" strokeWidth={2} />
          Nuevo valor
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo valor UB · {insurer.name}</DialogTitle>
          <DialogDescription>
            Cierra el valor vigente y abre uno nuevo a partir de la fecha indicada.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-4 py-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-[var(--color-fg-muted)] text-xs">Valor vigente</span>
            <MoneyDisplay value={insurer.currentUbValue} emphasis />
          </div>
          {insurer.currentUbValidFrom && (
            <div className="flex items-center justify-between">
              <span className="text-[var(--color-fg-muted)] text-xs">Vigente desde</span>
              <span className="tabular font-mono text-[var(--color-fg-muted)] text-xs">
                {insurer.currentUbValidFrom.slice(0, 10)}
              </span>
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
          className="space-y-4"
          noValidate
        >
          <FormField
            label="Nuevo valor (ARS)"
            htmlFor="ub-value"
            required
            error={error ?? undefined}
          >
            <Input
              id="ub-value"
              inputMode="decimal"
              placeholder="1742.50"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setError(null);
              }}
              className="text-right font-mono"
            />
          </FormField>

          <FormField label="Vigente desde" htmlFor="ub-validFrom" required>
            <Input
              id="ub-validFrom"
              type="date"
              value={validFrom}
              onChange={(e) => setValidFrom(e.target.value)}
            />
          </FormField>

          <FormField label="Notas" htmlFor="ub-notes">
            <Textarea
              id="ub-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Resolución, fuente, etc."
            />
          </FormField>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={mutation.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />}
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
