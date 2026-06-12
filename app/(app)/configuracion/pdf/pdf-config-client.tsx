'use client';

import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api/client';
import type { FondoSignedUrlResponse, PreferenciaPdf, UpdatePreferenciaPdfDto } from '@/lib/api/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { ImageOff, Loader2, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

const ACCEPT = 'image/png,image/jpeg,image/webp';
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_BYTES = 10 * 1024 * 1024;

function apiError(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const msg = err.response?.data?.message;
    if (Array.isArray(msg)) return msg.join('. ');
    if (typeof msg === 'string') return msg;
  }
  return fallback;
}

const DEFAULT_MARGINS = { marginTop: 20, marginBottom: 20, marginLeft: 20, marginRight: 20 };

// ─── Section: Imagen de fondo ────────────────────────────────────────

function FondoSection() {
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);

  const { data: signedUrl, isLoading: loadingUrl } = useQuery({
    queryKey: ['preferencia-pdf', 'fondo-url'],
    queryFn: () =>
      apiClient
        .get<FondoSignedUrlResponse>('/preferencia-pdf/fondo/signed-url')
        .then((r) => r.data),
    staleTime: 55 * 60 * 1000,
  });

  function pick(selected: File | null) {
    if (!selected) { setFile(null); return; }
    if (!ALLOWED_TYPES.includes(selected.type)) {
      toast.error('Formato no permitido. Usá PNG, JPG o WEBP.');
      return;
    }
    if (selected.size > MAX_BYTES) {
      toast.error('El archivo supera los 10 MB.');
      return;
    }
    setFile(selected);
  }

  const uploadMut = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error('Seleccioná un archivo');
      const fd = new FormData();
      fd.append('file', file);
      return apiClient
        .post<PreferenciaPdf>('/preferencia-pdf/fondo', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        .then((r) => r.data);
    },
    onSuccess: () => {
      toast.success('Imagen de fondo actualizada');
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
      qc.invalidateQueries({ queryKey: ['preferencia-pdf', 'fondo-url'] });
    },
    onError: (err) => toast.error(apiError(err, 'Error al subir la imagen')),
  });

  const previewSrc = file ? URL.createObjectURL(file) : (signedUrl?.url ?? null);

  return (
    <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6 shadow-[var(--shadow-xs)]">
      <div className="max-w-xl">
        <h2 className="font-semibold text-[var(--color-fg)] text-base">Imagen de fondo</h2>
        <p className="mt-1 text-[var(--color-fg-muted)] text-sm">
          La imagen se usa como membrete/hoja institucional del PDF. Formatos: PNG, JPG, WEBP.
          Máx 10 MB.
        </p>
      </div>

      <div className="mt-4 space-y-4">
        {loadingUrl ? (
          <div className="flex h-32 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-bg-subtle)]">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--color-fg-subtle)]" strokeWidth={2} />
          </div>
        ) : previewSrc ? (
          <div className="flex items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-3">
            {/* biome-ignore lint/performance/noImgElement: signed URL / object URL preview */}
            <img
              src={previewSrc}
              alt="Vista previa del fondo"
              className="max-h-48 w-auto object-contain"
            />
          </div>
        ) : (
          <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-md border border-dashed border-[var(--color-border-strong)] bg-[var(--color-bg-subtle)] text-[var(--color-fg-subtle)]">
            <ImageOff className="h-6 w-6" strokeWidth={1.5} />
            <span className="text-sm">Sin imagen de fondo</span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            disabled={uploadMut.isPending}
            onChange={(e) => pick(e.target.files?.[0] ?? null)}
            className="block text-[var(--color-fg-muted)] text-sm file:mr-3 file:rounded-md file:border-0 file:bg-[var(--color-bg-subtle)] file:px-3 file:py-1.5 file:font-medium file:text-[var(--color-fg)] file:text-sm hover:file:bg-[var(--color-bg-subtle)]/80 disabled:cursor-not-allowed disabled:opacity-50"
          />
          <Button
            onClick={() => uploadMut.mutate()}
            disabled={!file || uploadMut.isPending}
            size="sm"
          >
            {uploadMut.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
            ) : (
              <Upload className="h-4 w-4" strokeWidth={2} />
            )}
            Subir imagen
          </Button>
        </div>
      </div>
    </section>
  );
}

// ─── Section: Márgenes ────────────────────────────────────────────────

type MarginForm = { marginTop: number; marginBottom: number; marginLeft: number; marginRight: number };

function MarginsSection({ initialPreferencia }: { initialPreferencia: PreferenciaPdf | null }) {
  const qc = useQueryClient();

  const { data: preferencia } = useQuery({
    queryKey: ['preferencia-pdf'],
    queryFn: () =>
      apiClient.get<PreferenciaPdf | null>('/preferencia-pdf').then((r) => r.data ?? null),
    initialData: initialPreferencia,
  });

  const margins = preferencia
    ? {
        marginTop: preferencia.marginTop,
        marginBottom: preferencia.marginBottom,
        marginLeft: preferencia.marginLeft,
        marginRight: preferencia.marginRight,
      }
    : DEFAULT_MARGINS;

  const [form, setForm] = useState<MarginForm>(margins);

  function setField(key: keyof MarginForm) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = parseInt(e.target.value, 10);
      const val = Number.isNaN(raw) ? 0 : Math.min(200, Math.max(0, raw));
      setForm((prev) => ({ ...prev, [key]: val }));
    };
  }

  const saveMut = useMutation({
    mutationFn: (dto: UpdatePreferenciaPdfDto) =>
      apiClient.put<PreferenciaPdf>('/preferencia-pdf', dto).then((r) => r.data),
    onSuccess: () => {
      toast.success('Márgenes guardados');
      qc.invalidateQueries({ queryKey: ['preferencia-pdf'] });
    },
    onError: (err) => toast.error(apiError(err, 'Error al guardar márgenes')),
  });

  const inputCls =
    'w-24 rounded-md border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] px-3 py-2 text-right text-sm text-[var(--color-fg)] shadow-[var(--shadow-xs)] outline-none transition-colors focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-soft)] disabled:cursor-not-allowed disabled:opacity-60';

  return (
    <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6 shadow-[var(--shadow-xs)]">
      <div className="max-w-xl">
        <h2 className="font-semibold text-[var(--color-fg)] text-base">Márgenes del informe</h2>
        <p className="mt-1 text-[var(--color-fg-muted)] text-sm">
          Distancia en mm desde el borde de la página. Valor entre 0 y 200.
        </p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {(
          [
            { key: 'marginTop', label: 'Superior' },
            { key: 'marginBottom', label: 'Inferior' },
            { key: 'marginLeft', label: 'Izquierdo' },
            { key: 'marginRight', label: 'Derecho' },
          ] as { key: keyof MarginForm; label: string }[]
        ).map(({ key, label }) => (
          <div key={key} className="space-y-1.5">
            <label
              htmlFor={key}
              className="block text-xs font-medium text-[var(--color-fg-muted)]"
            >
              {label}
            </label>
            <input
              id={key}
              type="number"
              min={0}
              max={200}
              value={form[key]}
              onChange={setField(key)}
              disabled={saveMut.isPending}
              className={inputCls}
            />
          </div>
        ))}
      </div>

      <div className="mt-5">
        <Button
          onClick={() => saveMut.mutate(form)}
          disabled={saveMut.isPending}
        >
          {saveMut.isPending && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />}
          Guardar márgenes
        </Button>
      </div>
    </section>
  );
}

// ─── Main export ──────────────────────────────────────────────────────

export function PdfConfigClient({
  initialPreferencia,
}: {
  initialPreferencia: PreferenciaPdf | null;
}) {
  return (
    <div className="space-y-6">
      <FondoSection />
      <MarginsSection initialPreferencia={initialPreferencia} />
    </div>
  );
}
