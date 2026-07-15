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
  CreateCotizacionDto,
  InsurerWithUb,
  Patient,
  Practice,
  PrecioParaPracticaResponse,
} from '@/lib/api/types';
import { useMutation, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { AlertCircle, Loader2, Plus, Trash2 } from 'lucide-react';
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

const AR_MONEY = new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, useGrouping: true });
const AR_NUM = new Intl.NumberFormat('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

function fmtMoney(s: string | null | undefined) {
  if (!s) return '—';
  const n = Number(s);
  return Number.isNaN(n) ? s : `$ ${AR_MONEY.format(n)}`;
}
function fmtNum(s: string | null | undefined) {
  if (!s) return '—';
  const n = Number(s);
  return Number.isNaN(n) ? s : AR_NUM.format(n);
}

interface ItemRow {
  practiceId: number | null;
  practicaNombre: string;
  ubsSnapshot: string | null;
  ubValueSnapshot: string | null;
  precioUnitario: string;
  cantidad: number;
  sinPrecio: boolean;
}

export function NuevaCotizacionForm() {
  const router = useRouter();

  const [tipo, setTipo] = useState<'paciente' | 'empresa' | 'generica'>('paciente');
  const [patientSearch, setPatientSearch] = useState('');
  const [patientId, setPatientId] = useState<number | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [empresaNombre, setEmpresaNombre] = useState('');
  const [empresaCuit, setEmpresaCuit] = useState('');
  const [empresaEmail, setEmpresaEmail] = useState('');
  const [empresaTelefono, setEmpresaTelefono] = useState('');
  const [empresaContacto, setEmpresaContacto] = useState('');
  const [insurerId, setInsurerId] = useState<number | null>(null);
  const [copagoPorc, setCopagoPorc] = useState<string>('');
  const [validezDias, setValidezDias] = useState(30);
  const [observaciones, setObservaciones] = useState('');
  const [items, setItems] = useState<ItemRow[]>([]);

  const [practiceSearch, setPracticeSearch] = useState('');
  const [practicaManual, setPracticaManual] = useState('');
  const [precioManual, setPrecioManual] = useState('');

  const { data: patients = [] } = useQuery({
    queryKey: queries.patients.list({ search: patientSearch }),
    queryFn: () =>
      apiClient
        .get<Patient[]>(`/patients?q=${encodeURIComponent(patientSearch)}&limit=10`)
        .then((r) => r.data),
    enabled: tipo === 'paciente' && patientSearch.length >= 2,
    staleTime: 10_000,
  });

  const { data: insurers = [] } = useQuery({
    queryKey: queries.insurers.withUb,
    queryFn: () =>
      apiClient
        .get<InsurerWithUb[]>('/insurers/with-ub')
        .then((r) => r.data.filter((i) => i.active)),
    staleTime: 60_000,
  });

  const { data: practiceResults = [] } = useQuery({
    queryKey: queries.practices.list({ search: practiceSearch }),
    queryFn: () =>
      apiClient
        .get<Practice[]>(`/practices?q=${encodeURIComponent(practiceSearch)}&limit=15`)
        .then((r) => r.data),
    enabled: practiceSearch.length >= 2,
    staleTime: 10_000,
  });

  const createMut = useMutation({
    mutationFn: (dto: CreateCotizacionDto) =>
      apiClient.post<CotizacionDetalle>('/cotizaciones', dto).then((r) => r.data),
    onSuccess: (cot) => {
      toast.success('Cotización creada');
      router.push(`/cotizaciones/${cot.id}`);
    },
    onError: (err) => toast.error(apiError(err, 'Error al crear cotización')),
  });

  async function fetchPrecioInfo(
    pId: number,
    insId: number | null = insurerId,
  ): Promise<PrecioParaPracticaResponse> {
    try {
      const { data } = await apiClient.get<PrecioParaPracticaResponse>(
        `/cotizaciones/precios/practica/${pId}${insId ? `?insurerId=${insId}` : ''}`,
      );
      return data;
    } catch {
      return { precio: null, ubsSnapshot: null, ubValueSnapshot: null };
    }
  }

  async function addPractice(p: Practice) {
    const info = await fetchPrecioInfo(p.id);
    const sinPrecio = !info.precio;
    if (sinPrecio) {
      const insName = insurerId
        ? (insurers.find((i) => i.id === insurerId)?.name ?? 'esta obra social')
        : 'Particular';
      toast.warning(
        `Sin precio para "${p.name}" — ${insName}. Ingresalo manualmente o cargá el valor UB.`,
      );
    }
    setItems((prev) => [
      ...prev,
      {
        practiceId: p.id,
        practicaNombre: p.name,
        ubsSnapshot: info.ubsSnapshot,
        ubValueSnapshot: info.ubValueSnapshot,
        precioUnitario: info.precio ?? '',
        cantidad: 1,
        sinPrecio,
      },
    ]);
    setPracticeSearch('');
  }

  async function handleInsurerChange(newVal: string) {
    const newId = newVal === '0' ? null : Number(newVal);
    setInsurerId(newId);
    const itemsWithPractice = items.filter((item) => item.practiceId !== null);
    if (itemsWithPractice.length === 0) return;
    const updated = await Promise.all(
      items.map(async (item) => {
        if (!item.practiceId) return item;
        const info = await fetchPrecioInfo(item.practiceId, newId);
        return {
          ...item,
          ubsSnapshot: info.ubsSnapshot,
          ubValueSnapshot: info.ubValueSnapshot,
          precioUnitario: info.precio ?? item.precioUnitario,
          sinPrecio: !info.precio,
        };
      }),
    );
    setItems(updated);
  }

  function addManual() {
    if (!practicaManual.trim() || !precioManual.trim()) return;
    setItems((prev) => [
      ...prev,
      {
        practiceId: null,
        practicaNombre: practicaManual.trim(),
        ubsSnapshot: null,
        ubValueSnapshot: null,
        precioUnitario: precioManual.trim(),
        cantidad: 1,
        sinPrecio: false,
      },
    ]);
    setPracticaManual('');
    setPrecioManual('');
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateItem(idx: number, field: 'precioUnitario' | 'cantidad', value: string | number) {
    setItems((prev) =>
      prev.map((item, i) =>
        i === idx
          ? { ...item, [field]: value, sinPrecio: field === 'precioUnitario' ? !value : item.sinPrecio }
          : item,
      ),
    );
  }

  const total = items.reduce((acc, item) => acc + (Number(item.precioUnitario) || 0) * item.cantidad, 0);
  const copagoPorcNum = Number(copagoPorc) || 0;
  const totalCopago = copagoPorcNum > 0 ? (total * copagoPorcNum) / 100 : 0;
  const totalOs = copagoPorcNum > 0 ? total - totalCopago : 0;
  const hasUb = items.some((i) => i.ubsSnapshot != null);

  function handleSubmit() {
    if (tipo === 'paciente' && !patientId) {
      toast.error('Seleccioná un paciente');
      return;
    }
    if (tipo === 'empresa' && !empresaNombre.trim()) {
      toast.error('Ingresá el nombre de la empresa');
      return;
    }
    // tipo 'generica': no requiere validación de receptor
    if (items.length === 0) {
      toast.error('Agregá al menos una práctica');
      return;
    }

    const dto: CreateCotizacionDto = {
      tipo,
      ...(tipo === 'paciente' && patientId && { patientId }),
      ...(tipo === 'empresa' && {
        empresaNombre: empresaNombre.trim(),
        empresaCuit: empresaCuit.trim() || undefined,
        empresaEmail: empresaEmail.trim() || undefined,
        empresaTelefono: empresaTelefono.trim() || undefined,
        empresaContacto: empresaContacto.trim() || undefined,
      }),
      ...(insurerId && { insurerId }),
      validezDias,
      ...(copagoPorcNum > 0 && { copagoPorc: copagoPorcNum }),
      observaciones: observaciones.trim() || undefined,
      items: items.map((item, idx) => ({
        practiceId: item.practiceId ?? undefined,
        practicaNombre: item.practicaNombre,
        precioUnitario: String(item.precioUnitario || '0'),
        cantidad: item.cantidad,
        sort: idx,
      })),
    };

    createMut.mutate(dto);
  }

  const selectedInsurer = insurerId
    ? insurers.find((i) => i.id === insurerId)
    : insurers.find((i) => i.code === 'PARTICULAR');

  return (
    <div className="space-y-6">
      {/* Tipo de receptor */}
      <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-4">
        <h2 className="mb-3 font-medium text-sm text-[var(--color-fg)]">Tipo</h2>
        <div className="flex gap-2">
          {([
            { key: 'paciente', label: 'Paciente' },
            { key: 'empresa', label: 'Empresa' },
            { key: 'generica', label: 'Genérica' },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTipo(key)}
              className={`rounded-md border px-4 py-1.5 text-sm transition-colors ${
                tipo === key
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white'
                  : 'border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-fg-muted)] hover:border-[var(--color-border-strong)]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tipo === 'generica' && (
          <p className="mt-3 text-xs text-[var(--color-fg-muted)]">
            Presupuesto sin destinatario específico — ideal para enviar a potenciales clientes o publicar en redes.
          </p>
        )}

        <div className="mt-4 space-y-3">
          {tipo === 'generica' ? null : tipo === 'paciente' ? (
            <>
              <div>
                <Label className="mb-1 text-xs">Buscar paciente</Label>
                <Input
                  placeholder="Nombre, apellido o DNI…"
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  className="max-w-sm"
                />
              </div>
              {patients.length > 0 && !selectedPatient && (
                <ul className="max-w-sm divide-y divide-[var(--color-border)] overflow-hidden rounded-md border border-[var(--color-border)] bg-[var(--color-bg-elevated)] shadow-sm">
                  {patients.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--color-bg-subtle)]"
                        onClick={() => {
                          setPatientId(p.id);
                          setSelectedPatient(p);
                          setPatientSearch('');
                        }}
                      >
                        <span className="font-medium">
                          {p.lastName}, {p.firstName}
                        </span>{' '}
                        <span className="text-xs text-[var(--color-fg-muted)]">DNI {p.dni}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {selectedPatient && (
                <div className="flex max-w-sm items-center justify-between rounded-md border border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-3 py-2">
                  <div>
                    <div className="text-sm font-medium">
                      {selectedPatient.lastName}, {selectedPatient.firstName}
                    </div>
                    <div className="text-xs text-[var(--color-fg-muted)]">DNI {selectedPatient.dni}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setSelectedPatient(null); setPatientId(null); }}
                    className="ml-2 text-[var(--color-fg-subtle)] hover:text-[var(--color-danger)]"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="mb-1 text-xs">Nombre / razón social *</Label>
                <Input
                  value={empresaNombre}
                  onChange={(e) => setEmpresaNombre(e.target.value)}
                  placeholder="Nombre de la empresa"
                />
              </div>
              <div>
                <Label className="mb-1 text-xs">CUIT</Label>
                <Input value={empresaCuit} onChange={(e) => setEmpresaCuit(e.target.value)} placeholder="XX-XXXXXXXX-X" />
              </div>
              <div>
                <Label className="mb-1 text-xs">Contacto</Label>
                <Input value={empresaContacto} onChange={(e) => setEmpresaContacto(e.target.value)} placeholder="Nombre del contacto" />
              </div>
              <div>
                <Label className="mb-1 text-xs">Email</Label>
                <Input type="email" value={empresaEmail} onChange={(e) => setEmpresaEmail(e.target.value)} placeholder="contacto@empresa.com" />
              </div>
              <div>
                <Label className="mb-1 text-xs">Teléfono</Label>
                <Input value={empresaTelefono} onChange={(e) => setEmpresaTelefono(e.target.value)} placeholder="(xxx) xxx-xxxx" />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Obra social */}
      <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-4">
        <h2 className="mb-3 font-medium text-sm text-[var(--color-fg)]">Obra social</h2>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <Select value={insurerId ? String(insurerId) : '0'} onValueChange={handleInsurerChange}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Particular (sin obra social)" />
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
          </div>

          {insurerId === null ? (
            <div className="text-xs text-[var(--color-fg-muted)]">
              Precios tomados del{' '}
              <span className="font-semibold text-[var(--color-fg)]">precio particular</span>{' '}
              de cada práctica.
            </div>
          ) : selectedInsurer?.currentUbValue ? (
            <div className="text-xs text-[var(--color-fg-muted)]">
              Valor UB vigente:{' '}
              <span className="font-semibold text-[var(--color-fg)]">
                {fmtMoney(selectedInsurer.currentUbValue)}
              </span>
              {selectedInsurer.currentUbValidFrom && (
                <> desde {selectedInsurer.currentUbValidFrom.slice(0, 10)}</>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 rounded-md border border-[var(--color-warning)]/30 bg-[var(--color-warning-soft)] px-3 py-1.5 text-xs text-[var(--color-warning)]">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
              Sin valor UB configurado — los precios no se calcularán automáticamente.
              <a href="/obras-sociales" className="ml-1 underline" target="_blank" rel="noreferrer">
                Configurar
              </a>
            </div>
          )}

          <div className="flex items-end gap-2">
            <div>
              <Label className="mb-1 text-xs text-[var(--color-fg-muted)]">Copago paciente (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                step={0.5}
                placeholder="0"
                value={copagoPorc}
                onChange={(e) => setCopagoPorc(e.target.value)}
                className="w-24"
              />
            </div>
          </div>
        </div>
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
              {practiceResults.map((p) => {
                const isParticular = insurerId === null;
                const estimatedPrice = isParticular
                  ? (p.precioParticular ? Number(p.precioParticular) : null)
                  : p.units && selectedInsurer?.currentUbValue
                  ? Number(p.units) * Number(selectedInsurer.currentUbValue)
                  : null;
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => addPractice(p)}
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-xs hover:bg-[var(--color-bg-subtle)]"
                    >
                      <div>
                        <span className="font-medium text-[var(--color-fg)]">{p.name}</span>
                        {p.nbuCode && (
                          <span className="ml-1.5 font-mono text-[10px] text-[var(--color-fg-subtle)]">
                            {p.nbuCode}
                          </span>
                        )}
                      </div>
                      <span className="flex items-center gap-2 text-[var(--color-fg-subtle)]">
                        {isParticular ? (
                          estimatedPrice != null ? (
                            <span className="font-semibold text-[var(--color-fg)]">
                              {fmtMoney(String(estimatedPrice))}
                            </span>
                          ) : (
                            <span className="text-[var(--color-warning)]">Sin precio particular</span>
                          )
                        ) : p.units ? (
                          <span className="text-right">
                            <span className="text-[var(--color-fg-muted)]">{fmtNum(p.units)} UBs</span>
                            {estimatedPrice != null && (
                              <span className="ml-1.5 font-semibold text-[var(--color-fg)]">
                                {fmtMoney(String(estimatedPrice))}
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-[var(--color-fg-subtle)]">Sin UBs</span>
                        )}
                        <Plus className="h-3.5 w-3.5 text-[var(--color-primary)]" strokeWidth={2} />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="mb-4 flex items-end gap-2">
          <div className="flex-1">
            <Label className="mb-1 text-xs text-[var(--color-fg-muted)]">Práctica manual</Label>
            <Input placeholder="Nombre libre" value={practicaManual} onChange={(e) => setPracticaManual(e.target.value)} />
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
                  {hasUb && <th className="w-16 px-3 py-2 text-center font-medium">UBs</th>}
                  {hasUb && <th className="w-24 px-3 py-2 text-right font-medium">Valor UB</th>}
                  <th className="w-28 px-3 py-2 text-center font-medium">Precio unit.</th>
                  <th className="w-16 px-3 py-2 text-center font-medium">Cant.</th>
                  <th className="w-24 px-3 py-2 text-right font-medium">Subtotal</th>
                  <th className="w-8 px-2 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {items.map((item, idx) => {
                  const sub = (Number(item.precioUnitario) || 0) * item.cantidad;
                  return (
                    <tr key={idx} className="bg-[var(--color-bg-elevated)]">
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1.5">
                          {item.sinPrecio && (
                            <AlertCircle className="h-3.5 w-3.5 shrink-0 text-[var(--color-warning)]" strokeWidth={2} />
                          )}
                          <span className="font-medium text-[var(--color-fg)]">{item.practicaNombre}</span>
                        </div>
                      </td>
                      {hasUb && (
                        <td className="px-3 py-2 text-center text-[var(--color-fg-muted)]">
                          {fmtNum(item.ubsSnapshot)}
                        </td>
                      )}
                      {hasUb && (
                        <td className="px-3 py-2 text-right text-[var(--color-fg-muted)]">
                          {fmtMoney(item.ubValueSnapshot)}
                        </td>
                      )}
                      <td className="px-3 py-2">
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={item.precioUnitario}
                          onChange={(e) => updateItem(idx, 'precioUnitario', e.target.value)}
                          className="h-7 text-center text-xs"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          type="number"
                          min={1}
                          value={item.cantidad}
                          onChange={(e) => updateItem(idx, 'cantidad', Number(e.target.value))}
                          className="h-7 w-14 text-center text-xs"
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
            {/* Totals */}
            <div className="border-t border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-3 py-2">
              {copagoPorcNum > 0 ? (
                <div className="space-y-1">
                  <div className="flex justify-end gap-6 text-xs text-[var(--color-fg-muted)]">
                    <span>Cubre OS ({(100 - copagoPorcNum).toFixed(0)}%)</span>
                    <span className="w-24 text-right font-mono">$ {AR_MONEY.format(totalOs)}</span>
                  </div>
                  <div className="flex justify-end gap-6 text-xs text-[var(--color-fg-muted)]">
                    <span>Copago paciente ({copagoPorcNum}%)</span>
                    <span className="w-24 text-right font-mono">$ {AR_MONEY.format(totalCopago)}</span>
                  </div>
                  <div className="flex justify-end border-t border-[var(--color-border)] pt-1 text-sm font-semibold text-[var(--color-fg)]">
                    <span className="mr-4">Total</span>
                    <span className="w-24 text-right font-mono">$ {AR_MONEY.format(total)}</span>
                  </div>
                </div>
              ) : (
                <div className="flex justify-end">
                  <span className="text-sm font-semibold text-[var(--color-fg)]">
                    Total: $ {AR_MONEY.format(total)}
                  </span>
                </div>
              )}
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
        <Button onClick={handleSubmit} disabled={createMut.isPending}>
          {createMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Crear cotización
        </Button>
      </div>
    </div>
  );
}
