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
import type { CotizacionPrecio, Insurer, Practice, UpsertPrecioDto } from '@/lib/api/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Download, Loader2, Plus, Trash2 } from 'lucide-react';
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

const AR_MONEY = new Intl.NumberFormat('es-AR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  useGrouping: true,
});

export function PreciosCatalogClient() {
  const qc = useQueryClient();

  const [filterInsurerId, setFilterInsurerId] = useState<string>('all');
  const [tableSearch, setTableSearch] = useState('');
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [practiceSearch, setPracticeSearch] = useState('');
  const [newPracticeId, setNewPracticeId] = useState<number | null>(null);
  const [newPracticaNombre, setNewPracticaNombre] = useState('');
  const [newInsurerId, setNewInsurerId] = useState<string>('0');
  const [newPrecio, setNewPrecio] = useState('');

  const insKey = filterInsurerId === 'all' ? {} : { insurerId: filterInsurerId };
  const preciosKey = queries.cotizaciones.precios(insKey);

  const { data: precios = [], isLoading } = useQuery({
    queryKey: preciosKey,
    queryFn: () => {
      const qs = filterInsurerId !== 'all' ? `?insurerId=${filterInsurerId}` : '';
      return apiClient
        .get<CotizacionPrecio[]>(`/cotizaciones/precios/lista${qs}`)
        .then((r) => r.data);
    },
  });

  const { data: insurers = [] } = useQuery({
    queryKey: queries.insurers.list(),
    queryFn: () => apiClient.get<Insurer[]>('/insurers?active=true').then((r) => r.data),
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

  function invalidate() {
    qc.invalidateQueries({ queryKey: ['cotizaciones', 'precios'] });
  }

  const upsertMut = useMutation({
    mutationFn: (dto: UpsertPrecioDto) =>
      apiClient.post('/cotizaciones/precios', dto),
    onSuccess: () => {
      toast.success('Precio guardado');
      setNewPracticeId(null);
      setNewPracticaNombre('');
      setPracticeSearch('');
      setNewPrecio('');
      invalidate();
    },
    onError: (err) => toast.error(apiError(err, 'Error al guardar precio')),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) =>
      apiClient.delete(`/cotizaciones/precios/${id}`),
    onSuccess: () => {
      toast.success('Precio eliminado');
      invalidate();
    },
    onError: (err) => toast.error(apiError(err, 'Error al eliminar')),
  });

  function handleAdd() {
    if (!newPracticeId) {
      toast.error('Seleccioná una práctica');
      return;
    }
    if (!newPrecio.trim() || Number(newPrecio) < 0) {
      toast.error('Ingresá un precio válido');
      return;
    }
    const dto: UpsertPrecioDto = {
      practiceId: newPracticeId,
      ...(newInsurerId !== '0' && { insurerId: Number(newInsurerId) }),
      precio: String(Number(newPrecio).toFixed(2)),
    };
    upsertMut.mutate(dto);
  }

  async function downloadCatalogPdf() {
    setDownloadingPdf(true);
    try {
      const res = await apiClient.get('/cotizaciones/precios/pdf', { responseType: 'blob' });
      const url = URL.createObjectURL(res.data as Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'catalogo-precios.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Error al generar el PDF');
    } finally {
      setDownloadingPdf(false);
    }
  }

  const insurerMap = new Map(insurers.map((i) => [i.id, i.name]));

  const filtered = precios.filter(
    (p) =>
      (!tableSearch || p.practicaNombre.toLowerCase().includes(tableSearch.toLowerCase())),
  );

  return (
    <div className="space-y-5">
      {/* Agregar nuevo precio */}
      <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-4">
        <h2 className="mb-3 font-medium text-sm text-[var(--color-fg)]">Agregar precio</h2>
        <div className="grid grid-cols-[1fr_180px_120px_auto] items-end gap-3">
          <div>
            <Label className="mb-1 text-xs">Práctica</Label>
            <Input
              placeholder="Buscar práctica…"
              value={newPracticeId ? newPracticaNombre : practiceSearch}
              onChange={(e) => {
                if (newPracticeId) {
                  setNewPracticeId(null);
                  setNewPracticaNombre('');
                }
                setPracticeSearch(e.target.value);
              }}
            />
            {practiceResults.length > 0 && !newPracticeId && (
              <ul className="mt-1 max-h-48 overflow-y-auto divide-y divide-[var(--color-border)] rounded-md border border-[var(--color-border)] bg-[var(--color-bg-elevated)] shadow-sm">
                {practiceResults.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setNewPracticeId(p.id);
                        setNewPracticaNombre(p.name);
                        setPracticeSearch('');
                      }}
                      className="w-full px-3 py-1.5 text-left text-xs hover:bg-[var(--color-bg-subtle)]"
                    >
                      {p.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <Label className="mb-1 text-xs">Obra social</Label>
            <Select value={newInsurerId} onValueChange={setNewInsurerId}>
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="Particular" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Particular</SelectItem>
                {insurers.map((ins) => (
                  <SelectItem key={ins.id} value={String(ins.id)} className="text-xs">
                    {ins.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-1 text-xs">Precio ($)</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              placeholder="0.00"
              value={newPrecio}
              onChange={(e) => setNewPrecio(e.target.value)}
            />
          </div>

          <Button onClick={handleAdd} disabled={upsertMut.isPending} size="sm">
            {upsertMut.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Plus className="h-3.5 w-3.5" strokeWidth={2} />
            )}
            <span className="ml-1">Guardar</span>
          </Button>
        </div>
      </section>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-[var(--color-fg-muted)]">Filtrar:</span>
        <Input
          placeholder="Buscar práctica…"
          value={tableSearch}
          onChange={(e) => setTableSearch(e.target.value)}
          className="h-7 w-52 text-xs"
        />
        <Select value={filterInsurerId} onValueChange={setFilterInsurerId}>
          <SelectTrigger className="h-7 w-48 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">Todas las obras sociales</SelectItem>
            <SelectItem value="0" className="text-xs">Particular</SelectItem>
            {insurers.map((ins) => (
              <SelectItem key={ins.id} value={String(ins.id)} className="text-xs">
                {ins.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto h-7 text-xs"
          onClick={downloadCatalogPdf}
          disabled={downloadingPdf}
        >
          {downloadingPdf ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Download className="mr-1.5 h-3.5 w-3.5" strokeWidth={2} />
          )}
          Descargar catálogo PDF
        </Button>
      </div>

      {/* Tabla de precios */}
      {isLoading ? (
        <div className="flex items-center gap-1.5 py-8 text-sm text-[var(--color-fg-muted)]">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando…
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-6 text-center text-sm text-[var(--color-fg-muted)]">
          No hay precios configurados.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-subtle)] text-left text-xs text-[var(--color-fg-muted)]">
                <th className="px-4 py-2.5 font-medium">Práctica</th>
                <th className="px-4 py-2.5 font-medium">Obra social</th>
                <th className="px-4 py-2.5 text-right font-medium">Precio</th>
                <th className="w-10 px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-[var(--color-bg-subtle)]">
                  <td className="px-4 py-2.5 font-medium text-[var(--color-fg)]">
                    {p.practicaNombre}
                  </td>
                  <td className="px-4 py-2.5 text-[var(--color-fg-muted)]">
                    {p.insurerId ? (insurerMap.get(p.insurerId) ?? `#${p.insurerId}`) : 'Particular'}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono font-semibold text-[var(--color-fg)]">
                    $ {AR_MONEY.format(Number(p.precio))}
                  </td>
                  <td className="px-4 py-2.5">
                    <button
                      type="button"
                      onClick={() => deleteMut.mutate(p.id)}
                      disabled={deleteMut.isPending}
                      className="text-[var(--color-fg-subtle)] hover:text-[var(--color-danger)]"
                    >
                      <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
