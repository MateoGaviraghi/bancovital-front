'use client';

import { CreateMuestraAguaDialog } from '@/components/domain/create-muestra-agua-dialog';
import { CreateSolicitanteAguaDialog } from '@/components/domain/create-solicitante-agua-dialog';
import { MuestraAguaCombobox } from '@/components/domain/muestra-agua-combobox';
import { NbuGrid } from '@/components/domain/nbu-grid';
import { SolicitanteAguaCombobox } from '@/components/domain/solicitante-agua-combobox';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
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
import { Loader2, Plus } from 'lucide-react';
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

type Props = {
  order: OrderDetail;
  initialSolicitante: SolicitanteAgua | null;
  initialMuestra: MuestraAgua | null;
  initialPractices: PracticeWithChildren[];
};

export function EditOrderAguaForm({
  order,
  initialSolicitante,
  initialMuestra,
  initialPractices,
}: Props) {
  const router = useRouter();

  const [solicitante, setSolicitante] = useState<SolicitanteAgua | null>(initialSolicitante);
  const [muestra, setMuestra] = useState<MuestraAgua | null>(initialMuestra);
  const [notes, setNotes] = useState(order.notes ?? '');
  const [practices, setPractices] = useState<PracticeWithChildren[]>(initialPractices);
  const [errors, setErrors] = useState<Errors>({});
  const [solicitanteDialogOpen, setSolicitanteDialogOpen] = useState(false);
  const [muestraDialogOpen, setMuestraDialogOpen] = useState(false);

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
    if (!muestra) e.muestra = 'Seleccioná una muestra.';
    if (practices.length === 0) e.practices = 'Agregá al menos un análisis.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    updateMut.mutate({
      solicitanteAguaId: solicitante!.id,
      muestraAguaId: muestra!.id,
      notes: notes.trim() || null,
      practices: practices.map((p, idx) => ({ practiceId: p.id, sortOrder: idx })),
    });
  }

  return (
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

          <FormField label="Muestra" htmlFor="muestra" required error={errors.muestra}>
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <MuestraAguaCombobox
                  id="muestra"
                  value={muestra}
                  onChange={(m) => {
                    setMuestra(m);
                    if (m) setErrors((prev) => ({ ...prev, muestra: undefined }));
                  }}
                  invalid={!!errors.muestra}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                title="Crear muestra"
                onClick={() => setMuestraDialogOpen(true)}
              >
                <Plus strokeWidth={2} />
              </Button>
            </div>
          </FormField>
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
        onCreated={(m) => {
          setMuestra(m);
          setMuestraDialogOpen(false);
        }}
      />
    </form>
  );
}
