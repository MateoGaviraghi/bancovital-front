'use client';

import { CreateMuestraAguaDialog } from '@/components/domain/create-muestra-agua-dialog';
import { CreateSolicitanteAguaDialog } from '@/components/domain/create-solicitante-agua-dialog';
import { MuestraAguaCombobox } from '@/components/domain/muestra-agua-combobox';
import { NbuGrid } from '@/components/domain/nbu-grid';
import { SolicitanteAguaCombobox } from '@/components/domain/solicitante-agua-combobox';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { apiClient } from '@/lib/api/client';
import type {
  MuestraAgua,
  OrderDetail,
  PracticeWithChildren,
  SolicitanteAgua,
  UpdateOrderDto,
} from '@/lib/api/types';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { AlertCircle, Loader2, Plus } from 'lucide-react';
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

type Errors = Partial<Record<'solicitante' | 'muestra' | 'practices', string>>;

type MuestraEntry = { key: string; muestra: MuestraAgua | null; identificador: string };

type Props = {
  order: OrderDetail;
  initialSolicitante: SolicitanteAgua | null;
  initialMuestras: Array<{ key: string; muestraAguaId: number; tipoMuestra: string; identificador: string }>;
  initialPractices: PracticeWithChildren[];
  hasResults?: boolean;
};

export function EditOrderAguaForm({
  order,
  initialSolicitante,
  initialMuestras,
  initialPractices,
  hasResults = false,
}: Props) {
  const router = useRouter();

  const [solicitante, setSolicitante] = useState<SolicitanteAgua | null>(initialSolicitante);
  const [muestras, setMuestras] = useState<MuestraEntry[]>(
    initialMuestras.length > 0
      ? initialMuestras.map((m) => ({
          key: m.key,
          muestra: { id: m.muestraAguaId, tipoMuestra: m.tipoMuestra } as MuestraAgua,
          identificador: m.identificador,
        }))
      : [{ key: '1', muestra: null, identificador: '' }],
  );
  const [notes, setNotes] = useState(order.notes ?? '');
  const [practices, setPractices] = useState<PracticeWithChildren[]>(initialPractices);
  const [errors, setErrors] = useState<Errors>({});
  const [solicitanteDialogOpen, setSolicitanteDialogOpen] = useState(false);
  const [muestraDialogOpen, setMuestraDialogOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<UpdateOrderDto | null>(null);

  const updateMut = useMutation({
    mutationFn: async (dto: UpdateOrderDto) => {
      const { data } = await apiClient.patch(`/orders/${order.id}`, dto);
      return data;
    },
    onSuccess: () => {
      toast.success('Orden actualizada');
      router.push(`/ordenes/${order.id}`);
      router.refresh();
    },
    onError: (err) => toast.error(apiError(err, 'No se pudo actualizar la orden')),
  });

  function validate(): boolean {
    const e: Errors = {};
    if (!solicitante) e.solicitante = 'Seleccioná un solicitante.';
    if (muestras.some((m) => !m.muestra)) e.muestra = 'Seleccioná el tipo de muestra para cada entrada.';
    if (practices.length === 0) e.practices = 'Agregá al menos un análisis.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    const payload: UpdateOrderDto = {
      solicitanteAguaId: solicitante!.id,
      muestras: muestras.map((m, idx) => ({
        muestraAguaId: m.muestra!.id,
        identificador: m.identificador.trim() || undefined,
        sortOrder: idx,
      })),
      notes: notes.trim() || null,
      practices: practices.map((p, idx) => ({ practiceId: p.id, sortOrder: idx })),
    };
    if (hasResults) {
      setPendingPayload(payload);
      setConfirmOpen(true);
    } else {
      updateMut.mutate(payload);
    }
  }

  function handleConfirm() {
    if (pendingPayload) updateMut.mutate(pendingPayload);
    setConfirmOpen(false);
  }

  return (
    <>
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Solicitante y muestra */}
      <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6 shadow-[var(--shadow-xs)]">
        <h2 className="mb-4 font-semibold text-[var(--color-fg)] text-base">
          Solicitante y muestra
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField label="Solicitante" htmlFor="solicitante" required error={errors.solicitante}>
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <SolicitanteAguaCombobox
                  id="solicitante"
                  value={solicitante}
                  onChange={(s) => {
                    setSolicitante(s);
                    if (s) setErrors((prev) => ({ ...prev, solicitante: undefined }));
                  }}
                  invalid={!!errors.solicitante}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                title="Crear solicitante"
                onClick={() => setSolicitanteDialogOpen(true)}
              >
                <Plus strokeWidth={2} />
              </Button>
            </div>
          </FormField>

          <div className="col-span-full">
            <div className="mb-1 flex items-center justify-between">
              <span className="font-medium text-[var(--color-fg)] text-sm">
                Muestras <span className="text-[var(--color-fg-muted)]">*</span>
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setMuestraDialogOpen(true)}
              >
                <Plus strokeWidth={2} className="mr-1 h-3 w-3" />
                Crear tipo
              </Button>
            </div>
            {errors.muestra && (
              <p className="mb-2 text-[var(--color-danger)] text-xs">{errors.muestra}</p>
            )}
            <div className="space-y-2">
              {muestras.map((entry, idx) => (
                <div key={entry.key} className="flex items-center gap-2">
                  <span className="w-5 shrink-0 text-center text-[var(--color-fg-muted)] text-xs">{idx + 1}</span>
                  <div className="min-w-0 flex-1">
                    <MuestraAguaCombobox
                      value={entry.muestra}
                      onChange={(m) => {
                        setMuestras((prev) =>
                          prev.map((x) => (x.key === entry.key ? { ...x, muestra: m } : x)),
                        );
                        if (m) setErrors((prev) => ({ ...prev, muestra: undefined }));
                      }}
                      invalid={!!errors.muestra && !entry.muestra}
                    />
                  </div>
                  <Input
                    placeholder="Etiqueta (ej: Punto A)"
                    value={entry.identificador}
                    onChange={(e) =>
                      setMuestras((prev) =>
                        prev.map((x) =>
                          x.key === entry.key ? { ...x, identificador: e.target.value } : x,
                        ),
                      )
                    }
                    className="w-36 shrink-0"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={muestras.length <= 1}
                    onClick={() =>
                      setMuestras((prev) => prev.filter((x) => x.key !== entry.key))
                    }
                  >
                    <span className="text-[var(--color-fg-muted)]">×</span>
                  </Button>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() =>
                setMuestras((prev) => [
                  ...prev,
                  { key: String(Date.now()), muestra: null, identificador: '' },
                ])
              }
            >
              <Plus strokeWidth={2} className="mr-1 h-3 w-3" />
              Agregar muestra
            </Button>
          </div>
        </div>
      </section>

      {/* Notas */}
      <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6 shadow-[var(--shadow-xs)]">
        <h2 className="mb-4 font-semibold text-[var(--color-fg)] text-base">Notas internas</h2>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Observaciones internas de la orden (no aparecen en el informe)"
          rows={3}
        />
      </section>

      {/* Prácticas */}
      <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6 shadow-[var(--shadow-xs)]">
        <h2 className="mb-4 font-semibold text-[var(--color-fg)] text-base">
          Análisis solicitados
        </h2>
        {errors.practices && (
          <p className="mb-3 text-[var(--color-danger)] text-sm">{errors.practices}</p>
        )}
        <NbuGrid
          selected={practices}
          onChange={(p) => {
            setPractices(p);
            if (p.length > 0) setErrors((prev) => ({ ...prev, practices: undefined }));
          }}
        />
      </section>

      {/* Submit */}
      <div className="flex justify-end gap-3 pb-8">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/ordenes/${order.id}`)}
          disabled={updateMut.isPending}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={updateMut.isPending}>
          {updateMut.isPending && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />}
          Guardar cambios
        </Button>
      </div>

      <CreateSolicitanteAguaDialog
        open={solicitanteDialogOpen}
        onOpenChange={setSolicitanteDialogOpen}
        onCreated={(s) => {
          setSolicitante(s);
          setSolicitanteDialogOpen(false);
        }}
      />
      <CreateMuestraAguaDialog
        open={muestraDialogOpen}
        onOpenChange={setMuestraDialogOpen}
        onCreated={() => setMuestraDialogOpen(false)}
      />
    </form>

    {confirmOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="w-full max-w-md rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6 shadow-lg">
          <div className="mb-4 flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-warning)]" strokeWidth={2} />
            <div>
              <p className="font-semibold text-[var(--color-fg)]">Esta orden tiene resultados cargados</p>
              <p className="mt-1 text-[var(--color-fg-muted)] text-sm">
                Modificar las prácticas puede afectar los resultados existentes. ¿Querés continuar de todas formas?
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="rounded-md border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-fg)] hover:bg-[var(--color-bg-subtle)]"
              onClick={() => setConfirmOpen(false)}
              disabled={updateMut.isPending}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="flex items-center gap-2 rounded-md bg-[var(--color-primary)] px-4 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50"
              onClick={handleConfirm}
              disabled={updateMut.isPending}
            >
              {updateMut.isPending && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />}
              Confirmar cambios
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
