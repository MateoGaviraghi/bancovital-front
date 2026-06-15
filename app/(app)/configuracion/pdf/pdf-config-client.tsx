'use client';

import { ConfirmDialog } from '@/components/domain/confirm-dialog';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api/client';
import { queries } from '@/lib/api/queries';
import type {
  FondoSignedUrlResponse,
  PreferenciaPdf,
  UpdatePreferenciaPdfDto,
} from '@/lib/api/types';
import { cn } from '@/lib/cn';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { FileImage, ImageOff, Loader2, Trash2, Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

// ─── Constants ────────────────────────────────────────────────────────

const ACCEPT = 'image/png,image/jpeg';
const ALLOWED_TYPES = ['image/png', 'image/jpeg'];
const MAX_BYTES = 10 * 1024 * 1024;

// A4: 210 × 297 mm
const A4_RATIO = 210 / 297;

// ─── Helpers ──────────────────────────────────────────────────────────

function apiError(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const msg = err.response?.data?.message;
    if (Array.isArray(msg)) return msg.join('. ');
    if (typeof msg === 'string') return msg;
  }
  return fallback;
}

const FONDO_URL_KEY = ['preferencia-pdf', 'fondo-url'] as const;

// ─── Types ────────────────────────────────────────────────────────────

type MarginForm = {
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
};

const DEFAULT_MARGINS: MarginForm = {
  marginTop: 20,
  marginBottom: 20,
  marginLeft: 20,
  marginRight: 20,
};

function marginsFromPreferencia(p: PreferenciaPdf | null | undefined): MarginForm {
  if (!p) return DEFAULT_MARGINS;
  return {
    marginTop: p.marginTop,
    marginBottom: p.marginBottom,
    marginLeft: p.marginLeft,
    marginRight: p.marginRight,
  };
}

function usarFondoFromPreferencia(p: PreferenciaPdf | null | undefined): boolean {
  return p?.layoutConfig?.usarFondo ?? false;
}

// ─── A4 Mock ──────────────────────────────────────────────────────────

/**
 * Recuadro A4 en vivo.
 * Escala márgenes mm → px proporcional al ancho del mock.
 * A4 real: 210 mm ancho, 297 mm alto.
 */
function A4Mock({
  margins,
  fondoUrl,
  usarFondo,
}: {
  margins: MarginForm;
  fondoUrl: string | null;
  usarFondo: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mockW, setMockW] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setMockW(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Escala: mockW px = 210 mm
  const scale = mockW / 210;

  const topPx = margins.marginTop * scale;
  const bottomPx = margins.marginBottom * scale;
  const leftPx = margins.marginLeft * scale;
  const rightPx = margins.marginRight * scale;

  const showBg = fondoUrl && usarFondo;
  const dimBg = fondoUrl && !usarFondo;

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-md border border-[var(--color-border-strong)] bg-white shadow-[var(--shadow-sm)]"
      style={{ aspectRatio: `${A4_RATIO}` }}
    >
      {/* Fondo (membrete) */}
      {fondoUrl && (
        <img
          src={fondoUrl}
          alt="Membrete"
          className={cn(
            'absolute inset-0 h-full w-full object-contain transition-opacity duration-200',
            dimBg ? 'opacity-20' : 'opacity-100',
          )}
          aria-hidden="true"
        />
      )}

      {/* Cuadrícula de grises leve para identificar el papel */}
      {!fondoUrl && (
        <div className="absolute inset-0 bg-[var(--color-bg-subtle)]" aria-hidden="true" />
      )}

      {/* Área de contenido recuadrada por los márgenes */}
      {mockW > 0 && (
        <div
          className="absolute border border-dashed border-[var(--color-primary)] bg-[var(--color-primary)]/5"
          style={{
            top: topPx,
            bottom: bottomPx,
            left: leftPx,
            right: rightPx,
          }}
        >
          {/* Etiqueta centrada */}
          <span
            className="absolute inset-0 flex items-center justify-center font-mono text-[var(--color-primary)] opacity-60"
            style={{ fontSize: Math.max(7, mockW * 0.038) }}
          >
            Área de contenido
          </span>
        </div>
      )}

      {/* Overlay si no hay fondo y usarFondo está activo */}
      {!fondoUrl && (
        <div className="pointer-events-none absolute inset-0 flex items-end justify-center pb-2">
          <span
            className="rounded bg-[var(--color-bg-elevated)] px-1.5 py-0.5 font-mono text-[var(--color-fg-subtle)]"
            style={{ fontSize: Math.max(6, mockW * 0.032) }}
          >
            Sin membrete
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Toggle ───────────────────────────────────────────────────────────

function UsarFondoToggle({
  value,
  disabled,
  loading,
  onChange,
}: {
  value: boolean;
  disabled: boolean;
  loading: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={value}
        disabled={disabled || loading}
        onClick={() => onChange(!value)}
        className={cn(
          'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          value ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border-strong)]',
        )}
      >
        <span
          className={cn(
            'pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-[var(--shadow-xs)] transition-transform duration-200',
            value ? 'translate-x-4' : 'translate-x-0',
          )}
        />
        {loading && (
          <Loader2
            className="absolute right-0 top-0 h-3 w-3 -translate-y-0.5 translate-x-3 animate-spin text-[var(--color-fg-subtle)]"
            strokeWidth={2}
          />
        )}
      </button>
      <span className="text-sm text-[var(--color-fg)]">
        {value ? 'Fondo activo en el PDF' : 'Fondo desactivado'}
      </span>
    </div>
  );
}

// ─── Left column: controls ─────────────────────────────────────────────

function ControlsColumn({
  initialPreferencia,
  onMarginsChange,
}: {
  initialPreferencia: PreferenciaPdf | null;
  onMarginsChange: (m: MarginForm) => void;
}) {
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  // ── Preferencia principal ──
  const { data: preferencia } = useQuery({
    queryKey: queries.preferenciaPdf,
    queryFn: () =>
      apiClient.get<PreferenciaPdf | null>('/preferencia-pdf').then((r) => r.data ?? null),
    initialData: initialPreferencia,
  });

  const hasFondo = Boolean(preferencia?.fondoPath);
  const usarFondo = usarFondoFromPreferencia(preferencia);

  // ── Signed URL para previsualizar fondo actual ──
  const { data: signedUrlData, isLoading: loadingSignedUrl } = useQuery({
    queryKey: FONDO_URL_KEY,
    queryFn: () =>
      apiClient
        .get<FondoSignedUrlResponse>('/preferencia-pdf/fondo/signed-url')
        .then((r) => r.data),
    enabled: hasFondo,
    staleTime: 55 * 60 * 1000,
  });

  const fondoPreviewUrl: string | null = pendingFile
    ? URL.createObjectURL(pendingFile)
    : (signedUrlData?.url ?? null);

  // ── Márgenes form ──
  const [form, setForm] = useState<MarginForm>(marginsFromPreferencia(initialPreferencia));

  // Sync form when preferencia changes (e.g. after a successful save)
  useEffect(() => {
    if (preferencia) {
      const m = marginsFromPreferencia(preferencia);
      setForm(m);
      onMarginsChange(m);
    }
  }, [preferencia, onMarginsChange]);

  function setField(key: keyof MarginForm) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = Number.parseInt(e.target.value, 10);
      const val = Number.isNaN(raw) ? 0 : Math.min(200, Math.max(0, raw));
      const next = { ...form, [key]: val };
      setForm(next);
      onMarginsChange(next);
    };
  }

  // ── Mutation: subir fondo ──
  const uploadMut = useMutation({
    mutationFn: async () => {
      if (!pendingFile) throw new Error('Seleccioná un archivo');
      const fd = new FormData();
      fd.append('file', pendingFile);
      return apiClient
        .post<PreferenciaPdf>('/preferencia-pdf/fondo', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        .then((r) => r.data);
    },
    onSuccess: () => {
      toast.success('Imagen de fondo actualizada');
      setPendingFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      qc.invalidateQueries({ queryKey: queries.preferenciaPdf });
      qc.invalidateQueries({ queryKey: FONDO_URL_KEY });
    },
    onError: (err) => toast.error(apiError(err, 'Error al subir la imagen')),
  });

  // ── Mutation: quitar fondo ──
  const deleteFondoMut = useMutation({
    mutationFn: () =>
      apiClient.delete<PreferenciaPdf>('/preferencia-pdf/fondo').then((r) => r.data),
    onSuccess: () => {
      toast.success('Fondo eliminado');
      setConfirmDeleteOpen(false);
      qc.invalidateQueries({ queryKey: queries.preferenciaPdf });
      qc.invalidateQueries({ queryKey: FONDO_URL_KEY });
    },
    onError: (err) => {
      toast.error(apiError(err, 'Error al eliminar el fondo'));
      setConfirmDeleteOpen(false);
    },
  });

  // ── Mutation: toggle usarFondo ──
  const toggleFondoMut = useMutation({
    mutationFn: (val: boolean) =>
      apiClient
        .put<PreferenciaPdf>('/preferencia-pdf', {
          usarFondo: val,
        } satisfies UpdatePreferenciaPdfDto)
        .then((r) => r.data),
    onSuccess: (data, val) => {
      toast.success(val ? 'Fondo activado en el PDF' : 'Fondo desactivado');
      qc.invalidateQueries({ queryKey: queries.preferenciaPdf });
    },
    onError: (err) => toast.error(apiError(err, 'Error al cambiar el estado del fondo')),
  });

  // ── Mutation: guardar márgenes ──
  const saveMarginsMut = useMutation({
    mutationFn: (dto: UpdatePreferenciaPdfDto) =>
      apiClient.put<PreferenciaPdf>('/preferencia-pdf', dto).then((r) => r.data),
    onSuccess: () => {
      toast.success('Márgenes guardados');
      qc.invalidateQueries({ queryKey: queries.preferenciaPdf });
    },
    onError: (err) => toast.error(apiError(err, 'Error al guardar márgenes')),
  });

  function pickFile(file: File | null) {
    if (!file) {
      setPendingFile(null);
      return;
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Formato no permitido. Usá PNG o JPG.');
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error('El archivo supera los 10 MB.');
      return;
    }
    setPendingFile(file);
  }

  const inputCls =
    'w-24 rounded-md border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] px-3 py-2 text-right text-sm text-[var(--color-fg)] shadow-[var(--shadow-xs)] outline-none transition-colors focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 disabled:cursor-not-allowed disabled:opacity-60';

  return (
    <div className="space-y-6">
      {/* ── Sección: Fondo ── */}
      <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6 shadow-[var(--shadow-xs)]">
        <h2 className="font-semibold text-[var(--color-fg)] text-base">
          Imagen de fondo (membrete)
        </h2>
        <p className="mt-1 text-[var(--color-fg-muted)] text-sm">
          Se imprime como hoja institucional del PDF. Formatos: PNG, JPG. Máx 10 MB.
        </p>

        {/* Preview del fondo actual */}
        <div className="mt-4">
          {loadingSignedUrl && hasFondo ? (
            <div className="flex h-28 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-bg-subtle)]">
              <Loader2
                className="h-5 w-5 animate-spin text-[var(--color-fg-subtle)]"
                strokeWidth={2}
              />
            </div>
          ) : fondoPreviewUrl ? (
            <div className="flex items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-3">
              <img
                src={fondoPreviewUrl}
                alt="Vista previa del membrete"
                className="max-h-40 w-auto object-contain"
              />
            </div>
          ) : (
            <div className="flex h-28 flex-col items-center justify-center gap-2 rounded-md border border-dashed border-[var(--color-border-strong)] bg-[var(--color-bg-subtle)] text-[var(--color-fg-subtle)]">
              <ImageOff className="h-5 w-5" strokeWidth={1.5} />
              <span className="text-sm">Sin imagen de fondo</span>
            </div>
          )}
        </div>

        {/* File picker + subir */}
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <label
              htmlFor="fondo-file"
              className={cn(
                'flex cursor-pointer items-center gap-2 rounded-md border border-[var(--color-border-strong)] bg-[var(--color-bg-subtle)] px-3 py-1.5 text-sm font-medium text-[var(--color-fg)] transition-colors hover:bg-[var(--color-bg-subtle)]/80',
                uploadMut.isPending && 'cursor-not-allowed opacity-50',
              )}
            >
              <FileImage className="h-4 w-4" strokeWidth={2} />
              {pendingFile ? pendingFile.name : 'Seleccionar archivo'}
              <input
                id="fondo-file"
                ref={fileInputRef}
                type="file"
                accept={ACCEPT}
                disabled={uploadMut.isPending}
                onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
                className="sr-only"
              />
            </label>

            <Button
              onClick={() => uploadMut.mutate()}
              disabled={!pendingFile || uploadMut.isPending}
              size="sm"
            >
              {uploadMut.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
              ) : (
                <Upload className="h-4 w-4" strokeWidth={2} />
              )}
              Subir imagen
            </Button>

            {hasFondo && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmDeleteOpen(true)}
                disabled={deleteFondoMut.isPending}
                className="text-[var(--color-danger)] hover:text-[var(--color-danger)] border-[var(--color-danger)]/30 hover:bg-[var(--color-danger)]/5"
              >
                {deleteFondoMut.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                ) : (
                  <Trash2 className="h-4 w-4" strokeWidth={2} />
                )}
                Quitar fondo
              </Button>
            )}
          </div>

          {/* Toggle usarFondo */}
          <div className="pt-1">
            <UsarFondoToggle
              value={usarFondo}
              disabled={!hasFondo}
              loading={toggleFondoMut.isPending}
              onChange={(v) => toggleFondoMut.mutate(v)}
            />
            {!hasFondo && (
              <p className="mt-1.5 text-xs text-[var(--color-fg-subtle)]">
                Subí un membrete para activar esta opción.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ── Sección: Márgenes ── */}
      <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6 shadow-[var(--shadow-xs)]">
        <h2 className="font-semibold text-[var(--color-fg)] text-base">Márgenes del informe</h2>
        <p className="mt-1 text-[var(--color-fg-muted)] text-sm">
          Distancia en mm desde el borde de la página. Rango 0–200.
        </p>

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
                disabled={saveMarginsMut.isPending}
                className={inputCls}
              />
            </div>
          ))}
        </div>

        <div className="mt-5">
          <Button onClick={() => saveMarginsMut.mutate(form)} disabled={saveMarginsMut.isPending}>
            {saveMarginsMut.isPending && (
              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
            )}
            Guardar márgenes
          </Button>
        </div>
      </section>

      {/* ── Confirm: quitar fondo ── */}
      <ConfirmDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title="¿Quitar el fondo del PDF?"
        description="Se eliminará la imagen de membrete. Esta acción no se puede deshacer."
        confirmLabel="Sí, quitar fondo"
        cancelLabel="Cancelar"
        tone="danger"
        loading={deleteFondoMut.isPending}
        onConfirm={() => deleteFondoMut.mutate()}
      />
    </div>
  );
}

// ─── Right column: preview ─────────────────────────────────────────────

function PreviewColumn({
  initialPreferencia,
  liveMargins,
}: {
  initialPreferencia: PreferenciaPdf | null;
  liveMargins: MarginForm;
}) {
  const [previewLoading, setPreviewLoading] = useState(false);

  // Preferencia y signed-url se leen igual para saber qué mostrar en el mock
  const { data: preferencia } = useQuery({
    queryKey: queries.preferenciaPdf,
    queryFn: () =>
      apiClient.get<PreferenciaPdf | null>('/preferencia-pdf').then((r) => r.data ?? null),
    initialData: initialPreferencia,
  });

  const hasFondo = Boolean(preferencia?.fondoPath);
  const usarFondo = usarFondoFromPreferencia(preferencia);

  const { data: signedUrlData } = useQuery({
    queryKey: FONDO_URL_KEY,
    queryFn: () =>
      apiClient
        .get<FondoSignedUrlResponse>('/preferencia-pdf/fondo/signed-url')
        .then((r) => r.data),
    enabled: hasFondo,
    staleTime: 55 * 60 * 1000,
  });

  const fondoUrl = signedUrlData?.url ?? null;

  async function handlePreviewPdf() {
    setPreviewLoading(true);
    try {
      const res = await apiClient.get<Blob>('/preferencia-pdf/preview', {
        responseType: 'blob',
      });
      const url = URL.createObjectURL(res.data);
      const tab = window.open(url, '_blank');
      // Revoke after a short delay to allow the tab to load the blob
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      if (!tab) {
        toast.error('El navegador bloqueó la ventana emergente. Permitila e intentá de nuevo.');
      }
    } catch (err) {
      toast.error(apiError(err, 'Error al generar el PDF de muestra'));
    } finally {
      setPreviewLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-semibold text-[var(--color-fg)] text-base">Vista previa</h2>
        <p className="mt-1 text-[var(--color-fg-muted)] text-sm">
          Mock del área de contenido según los márgenes actuales.
        </p>
      </div>

      <A4Mock margins={liveMargins} fondoUrl={fondoUrl} usarFondo={usarFondo} />

      <div className="flex items-center gap-3 pt-1">
        <Button
          variant="outline"
          onClick={handlePreviewPdf}
          disabled={previewLoading}
          className="w-full sm:w-auto"
        >
          {previewLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
          ) : (
            <FileImage className="h-4 w-4" strokeWidth={2} />
          )}
          {previewLoading ? 'Generando PDF…' : 'Ver PDF de muestra'}
        </Button>
      </div>

      <p className="text-xs text-[var(--color-fg-subtle)]">
        El PDF de muestra incluye datos ficticios con la configuración actual del lab.
      </p>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────

export function PdfConfigClient({
  initialPreferencia,
}: {
  initialPreferencia: PreferenciaPdf | null;
}) {
  // Márgenes en vivo compartidos entre columnas (para el mock A4)
  const [liveMargins, setLiveMargins] = useState<MarginForm>(
    marginsFromPreferencia(initialPreferencia),
  );

  return (
    <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px] lg:items-start xl:grid-cols-[1fr_400px]">
      {/* Columna izquierda: controles */}
      <ControlsColumn initialPreferencia={initialPreferencia} onMarginsChange={setLiveMargins} />

      {/* Columna derecha: previsualización */}
      <div className="lg:sticky lg:top-8">
        <PreviewColumn initialPreferencia={initialPreferencia} liveMargins={liveMargins} />
      </div>
    </div>
  );
}
