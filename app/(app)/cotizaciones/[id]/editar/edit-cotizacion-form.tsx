'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  CotizacionDetalle,
  CotizacionItemInputDto,
  Insurer,
  Practice,
  UpdateCotizacionDto,
} from '@/lib/api/types';
import { useMutation } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Loader2, Plus, Trash2 } from 'lucide-react';
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

interface ItemRow {
  practiceId: number | null;
  practicaNombre: string;
  precioUnitario: string;
  cantidad: number;
}

const AR_MONEY = new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, useGrouping: true });

export function EditCotizacionForm({
  cot,
  insurers,
}: {
  cot: CotizacionDetalle;
  insurers: Insurer[];
}) {
  const router = useRouter();

  const [insurerId, setInsurerId] = useState<number>(cot.insurerInfo?.id ?? 0);
  const [validezDias, setValidezDias] = useState(cot.validezDias);
  const [observaciones, setObservaciones] = useState(cot.observaciones ?? '');
  const [empresaNombre, setEmpresaNombre] = useState(cot.empresaNombre ?? '');
  const [empresaCuit, setEmpresaCuit] = useState(cot.empresaCuit ?? '');
  const [empresaEmail, setEmpresaEmail] = useState(cot.empresaEmail ?? '');
  const [empresaTelefono, setEmpresaTelefono] = useState(cot.empresaTelefono ?? '');
  const [empresaContacto, setEmpresaContacto] = useState(cot.empresaContacto ?? '');

  const [items, setItems] = useState<ItemRow[]>(
    cot.items.map((i) => ({
      practiceId: i.practiceId ?? null,
      practicaNombre: i.practicaNombre,
      precioUnitario: i.precioUnitario,
      cantidad: i.cantidad,
    })),
  );

  const [practiceSearch, setPracticeSearch] = useState('');
  const [practicaManual, setPracticaManual] = useState('');
  const [precioManual, setPrecioManual] = useState('');

  const { data: practiceResults = [] } = useQuery({
    queryKey: queries.practices.list({ search: practiceSearch }),
    queryFn: () =>
      apiClient
        .get<Practice[]>(`/practices?q=${encodeURIComponent(practiceSearch)}&limit=15`)
        .then((r) => r.data),
    enabled: practiceSearch.length >= 2,
    staleTime: 10_000,
  });

  async function fetchPrecio(pId: number, insId: number): Promise<string> {
    try {
      const qs = insId > 0 ? `?insurerId=${insId}` : '';
      const { data } = await apiClient.get<{ precio: string | null }>(
        `/cotizaciones/precios/practica/${pId}${qs}`,
      );
      return data.precio ?? '';
    } catch {
      return '';
    }
  }

  async function addPractice(p: Practice) {
    const precio = await fetchPrecio(p.id, insurerId);
    if (!precio) {
      const insName = insurerId > 0
        ? (insurers.find((i) => i.id === insurerId)?.name ?? 'esta obra social')
        : 'Particular';
      toast.warning(`Sin precio cargado para "${p.name}" — ${insName}. Podés ingresarlo manualmente.`);
    }
    setItems((prev) => [
      ...prev,
      { practiceId: p.id, practicaNombre: p.name, precioUnitario: precio, cantidad: 1 },
    ]);
    setPracticeSearch('');
  }

  function addManual() {
    if (!practicaManual.trim()) return;
    setItems((prev) => [
      ...prev,
      { practiceId: null, practicaNombre: practicaManual.trim(), precioUnitario: precioManual.trim() || '0', cantidad: 1 },
    ]);
    setPracticaManual('');
    setPrecioManual('');
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateItem(idx: number, field: keyof ItemRow, value: string | number) {
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  }

  async function handleInsurerChange(newVal: string) {
    const newId = Number(newVal);
    setInsurerId(newId);
    const itemsWithPractice = items.filter((item) => item.practiceId !== null);
    if (itemsWithPractice.length === 0) return;
    const updated = await Promise.all(
      items.map(async (item) => {
        if (!item.practiceId) return item;
        const precio = await fetchPrecio(item.practiceId, newId);
        return { ...item, precioUnitario: precio };
      }),
    );
    setItems(updated);
  }

  const total = items.reduce((acc, item) => acc + (Number(item.precioUnitario) || 0) * item.cantidad, 0);

  const updateMut = useMutation({
    mutationFn: (dto: UpdateCotizacionDto) =>
      apiClient.patch<CotizacionDetalle>(`/cotizaciones/${cot.id}`, dto).then((r) => r.data),
    onSuccess: () => {
      toast.success('Cotización actualizada');
      router.push(`/cotizaciones/${cot.id}`);
    },
    onError: (err) => toast.error(apiError(err, 'Error al guardar')),
  });

  function handleSubmit() {
    if (items.length === 0) {
      toast.error('Agregá al menos una práctica');
      return;
    }

    const dto: UpdateCotizacionDto = {
      insurerId,
      validezDias,
      observaciones: observaciones.trim() || undefined,
      ...(cot.tipo === 'empresa' && {
        empresaNombre: empresaNombre.trim() || undefined,
        empresaCuit: empresaCuit.trim() || undefined,
        empresaEmail: empresaEmail.trim() || undefined,
        empresaTelefono: empresaTelefono.trim() || undefined,
        empresaContacto: empresaContacto.trim() || undefined,
      }),
      items: items.map((item, idx) => ({
        practiceId: item.practiceId ?? undefined,
        practicaNombre: item.practicaNombre,
        precioUnitario: String(Number(item.precioUnitario || '0').toFixed(2)),
        cantidad: item.cantidad,
        sort: idx,
      } satisfies CotizacionItemInputDto)),
    };

    updateMut.mutate(dto);
  }

  const receptorLabel =
    cot.tipo === 'paciente' && cot.patientInfo
      ? `${cot.patientInfo.lastName}, ${cot.patientInfo.firstName} — DNI ${cot.patientInfo.dni}`
      : cot.empresaNombre ?? '—';

  return (
    <div className="space-y-6">
      {/* Receptor (read-only info) */}
      <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-4">
        <h2 className="mb-2 font-medium text-sm text-[var(--color-fg)]">
          {cot.tipo === 'empresa' ? 'Empresa' : 'Paciente'}
        </h2>
        <p className="text-sm text-[var(--color-fg-muted)]">{receptorLabel}</p>

        {/* Editable only for empresa */}
        {cot.tipo === 'empresa' && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label className="mb-1 text-xs">Nombre / razón social</Label>
              <Input value={empresaNombre} onChange={(e) => setEmpresaNombre(e.target.value)} />
            </div>
            <div>
              <Label className="mb-1 text-xs">CUIT</Label>
              <Input value={empresaCuit} onChange={(e) => setEmpresaCuit(e.target.value)} placeholder="XX-XXXXXXXX-X" />
            </div>
            <div>
              <Label className="mb-1 text-xs">Contacto</Label>
              <Input value={empresaContacto} onChange={(e) => setEmpresaContacto(e.target.value)} />
            </div>
            <div>
              <Label className="mb-1 text-xs">Email</Label>
              <Input type="email" value={empresaEmail} onChange={(e) => setEmpresaEmail(e.target.value)} />
            </div>
            <div>
              <Label className="mb-1 text-xs">Teléfono</Label>
              <Input value={empresaTelefono} onChange={(e) => setEmpresaTelefono(e.target.value)} />
            </div>
          </div>
        )}
      </section>

      {/* Obra social */}
      <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-4">
        <h2 className="mb-3 font-medium text-sm text-[var(--color-fg)]">Obra social</h2>
        <Select value={String(insurerId)} onValueChange={handleInsurerChange}>
          <SelectTrigger className="max-w-sm">
            <SelectValue placeholder="Particular" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">Particular</SelectItem>
            {insurers.map((ins) => (
              <SelectItem key={ins.id} value={String(ins.id)}>
                {ins.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </section>

      {/* Prácticas */}
      <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-4">
        <h2 className="mb-3 font-medium text-sm text-[var(--color-fg)]">Prácticas</h2>

        <div className="mb-3">
          <Label className="mb-1 text-xs text-[var(--color-fg-muted)]">Buscar en catálogo</Label>
          <Input
            placeholder="Nombre de práctica…"
            value={practiceSearch}
            onChange={(e) => setPracticeSearch(e.target.value)}
            className="max-w-sm"
          />
          {practiceResults.length > 0 && (
            <ul className="mt-1 max-w-sm divide-y divide-[var(--color-border)] overflow-hidden rounded-md border border-[var(--color-border)] bg-[var(--color-bg-elevated)] shadow-sm">
              {practiceResults.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => addPractice(p)}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-xs hover:bg-[var(--color-bg-subtle)]"
                  >
                    <span className="font-medium">{p.name}</span>
                    <Plus className="h-3.5 w-3.5 text-[var(--color-primary)]" strokeWidth={2} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mb-4 flex items-end gap-2">
          <div className="flex-1">
            <Label className="mb-1 text-xs text-[var(--color-fg-muted)]">Práctica manual</Label>
            <Input
              placeholder="Nombre libre"
              value={practicaManual}
              onChange={(e) => setPracticaManual(e.target.value)}
            />
          </div>
          <div className="w-28">
            <Label className="mb-1 text-xs text-[var(--color-fg-muted)]">Precio</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              placeholder="0.00"
              value={precioManual}
              onChange={(e) => setPrecioManual(e.target.value)}
            />
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addManual}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>

        {items.length > 0 && (
          <div className="overflow-hidden rounded-md border border-[var(--color-border)]">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-subtle)] text-[var(--color-fg-muted)]">
                  <th className="px-3 py-2 text-left font-medium">Práctica</th>
                  <th className="w-28 px-3 py-2 text-center font-medium">Precio unit.</th>
                  <th className="w-20 px-3 py-2 text-center font-medium">Cant.</th>
                  <th className="w-24 px-3 py-2 text-right font-medium">Subtotal</th>
                  <th className="w-8 px-2 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {items.map((item, idx) => {
                  const sub = (Number(item.precioUnitario) || 0) * item.cantidad;
                  return (
                    <tr key={idx} className="bg-[var(--color-bg-elevated)]">
                      <td className="px-3 py-2 font-medium text-[var(--color-fg)]">
                        {item.practicaNombre}
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={item.precioUnitario}
                          onChange={(e) => updateItem(idx, 'precioUnitario', e.target.value)}
                          className="h-8 text-center text-xs"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          type="number"
                          min={1}
                          value={item.cantidad}
                          onChange={(e) => updateItem(idx, 'cantidad', Number(e.target.value))}
                          className="h-8 w-16 text-center text-sm"
                        />
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-semibold text-[var(--color-fg)]">
                        $ {AR_MONEY.format(sub)}
                      </td>
                      <td className="px-2 py-2">
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          className="text-[var(--color-fg-subtle)] hover:text-[var(--color-danger)]"
                        >
                          <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="flex justify-end border-t border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-3 py-2">
              <span className="text-sm font-semibold text-[var(--color-fg)]">
                Total: $ {AR_MONEY.format(total)}
              </span>
            </div>
          </div>
        )}
      </section>

      {/* Condiciones */}
      <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-4">
        <h2 className="mb-3 font-medium text-sm text-[var(--color-fg)]">Condiciones</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="mb-1 text-xs">Validez (días)</Label>
            <Input
              type="number"
              min={1}
              value={validezDias}
              onChange={(e) => setValidezDias(Number(e.target.value))}
            />
          </div>
          <div className="col-span-2">
            <Label className="mb-1 text-xs">Observaciones</Label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-fg)] placeholder:text-[var(--color-fg-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] resize-none"
              placeholder="Condiciones, aclaraciones, vigencia del precio…"
            />
          </div>
        </div>
      </section>

      <div className="flex justify-end gap-2">
        <Button variant="outline" type="button" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} disabled={updateMut.isPending}>
          {updateMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Guardar cambios
        </Button>
      </div>
    </div>
  );
}
