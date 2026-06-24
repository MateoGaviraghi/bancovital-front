'use client';

import { ConfirmDialog } from '@/components/domain/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/api/client';
import { queries } from '@/lib/api/queries';
import type {
  FondoSignedUrlResponse,
  PreferenciaPdf,
  TipoPdf,
  UpdatePreferenciaPdfDto,
} from '@/lib/api/types';
import { cn } from '@/lib/cn';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Eye, FileImage, ImageOff, Loader2, Trash2, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

function apiError(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const msg = err.response?.data?.message;
    if (Array.isArray(msg)) return msg.join('. ');
    if (typeof msg === 'string') return msg;
  }
  return fallback;
}

const ACCEPT = 'image/png,image/jpeg';
const ALLOWED_TYPES = ['image/png', 'image/jpeg'];
const MAX_BYTES = 10 * 1024 * 1024;

const TIPO_LABELS: Record<TipoPdf, string> = {
  informe: 'Informe',
  orden: 'Orden',
};

// ─── Fondo Tab ───────────────────────────────────────────────────────

function FondoTab({
  formatoId,
  hasFondo,
  usarFondo,
}: { formatoId: number; hasFondo: boolean; usarFondo: boolean }) {
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const { data: signedUrlData, isLoading: loadingUrl } = useQuery({
    queryKey: queries.preferenciaPdf.fondoUrl(formatoId),
    queryFn: () =>
      apiClient
        .get<FondoSignedUrlResponse>(`/preferencia-pdf/${formatoId}/fondo/signed-url`)
        .then((r) => r.data),
    enabled: hasFondo,
    staleTime: 55 * 60 * 1000,
  });

  const fondoPreviewUrl = pendingFile
    ? URL.createObjectURL(pendingFile)
    : (signedUrlData?.url ?? null);

  const uploadMut = useMutation({
    mutationFn: async () => {
      if (!pendingFile) throw new Error('Seleccioná un archivo');
      const fd = new FormData();
      fd.append('file', pendingFile);
      return apiClient
        .post<PreferenciaPdf>(`/preferencia-pdf/${formatoId}/fondo`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        .then((r) => r.data);
    },
    onSuccess: () => {
      toast.success('Imagen de fondo actualizada');
      setPendingFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      qc.invalidateQueries({ queryKey: queries.preferenciaPdf.detail(formatoId) });
      qc.invalidateQueries({ queryKey: queries.preferenciaPdf.fondoUrl(formatoId) });
    },
    onError: (err) => toast.error(apiError(err, 'Error al subir la imagen')),
  });

  const deleteFondoMut = useMutation({
    mutationFn: () => apiClient.delete(`/preferencia-pdf/${formatoId}/fondo`).then((r) => r.data),
    onSuccess: () => {
      toast.success('Fondo eliminado');
      setConfirmDeleteOpen(false);
      qc.invalidateQueries({ queryKey: queries.preferenciaPdf.detail(formatoId) });
      qc.invalidateQueries({ queryKey: queries.preferenciaPdf.fondoUrl(formatoId) });
    },
    onError: (err) => {
      toast.error(apiError(err, 'Error al eliminar el fondo'));
      setConfirmDeleteOpen(false);
    },
  });

  const toggleFondoMut = useMutation({
    mutationFn: (val: boolean) =>
      apiClient
        .put<PreferenciaPdf>(`/preferencia-pdf/${formatoId}`, {
          usarFondo: val,
        } satisfies UpdatePreferenciaPdfDto)
        .then((r) => r.data),
    onSuccess: (_data, val) => {
      toast.success(val ? 'Fondo activado' : 'Fondo desactivado');
      qc.invalidateQueries({ queryKey: queries.preferenciaPdf.detail(formatoId) });
    },
    onError: (err) => toast.error(apiError(err, 'Error al cambiar el estado del fondo')),
  });

  function pickFile(file: File | null) {
    if (!file) return;
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

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6 shadow-[var(--shadow-xs)]">
        <h2 className="font-semibold text-[var(--color-fg)] text-base">
          Imagen de fondo (membrete)
        </h2>
        <p className="mt-1 text-[var(--color-fg-muted)] text-sm">
          Se imprime como hoja institucional del PDF. Formatos: PNG, JPG. Máx 10 MB.
        </p>

        <div className="mt-4">
          {loadingUrl && hasFondo ? (
            <div className="flex h-28 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-bg-subtle)]">
              <Loader2
                className="h-5 w-5 animate-spin text-[var(--color-fg-subtle)]"
                strokeWidth={2}
              />
            </div>
          ) : fondoPreviewUrl ? (
            <div className="flex items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-2">
              <img
                src={fondoPreviewUrl}
                alt="Vista previa del membrete"
                className="max-h-24 w-auto object-contain"
              />
            </div>
          ) : (
            <div className="flex h-28 flex-col items-center justify-center gap-2 rounded-md border border-dashed border-[var(--color-border-strong)] bg-[var(--color-bg-subtle)] text-[var(--color-fg-subtle)]">
              <ImageOff className="h-5 w-5" strokeWidth={1.5} />
              <span className="text-sm">Sin imagen de fondo</span>
            </div>
          )}
        </div>

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

          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              role="switch"
              aria-checked={usarFondo}
              disabled={!hasFondo || toggleFondoMut.isPending}
              onClick={() => toggleFondoMut.mutate(!usarFondo)}
              className={cn(
                'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                usarFondo ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border-strong)]',
              )}
            >
              <span
                className={cn(
                  'pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-[var(--shadow-xs)] transition-transform duration-200',
                  usarFondo ? 'translate-x-4' : 'translate-x-0',
                )}
              />
            </button>
            <span className="text-sm text-[var(--color-fg)]">
              {usarFondo ? 'Fondo activo en el PDF' : 'Fondo desactivado'}
            </span>
          </div>
          {!hasFondo && (
            <p className="text-xs text-[var(--color-fg-subtle)]">
              Subí un membrete para activar esta opción.
            </p>
          )}
        </div>
      </section>

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

// ─── Color picker helper ─────────────────────────────────────────────

function ColorField({
  id,
  label,
  value,
  onChange,
}: { id: string; label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-medium text-[var(--color-fg-muted)]">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-8 cursor-pointer rounded border border-[var(--color-border-strong)]"
        />
        <span className="font-mono text-xs text-[var(--color-fg-muted)]">{value}</span>
      </div>
    </div>
  );
}

// ─── Colores Section ─────────────────────────────────────────────────

function ColoresSection({
  formatoId,
  layoutConfig,
}: { formatoId: number; layoutConfig: PreferenciaPdf['layoutConfig'] }) {
  const qc = useQueryClient();
  const tabla = layoutConfig?.campos?.['tabla.resultados'];
  const cuadros = layoutConfig?.campos?.cuadros;

  // Tabla
  const [headerBg, setHeaderBg] = useState(tabla?.headerBg ?? '#1f2b5b');
  const [headerColor, setHeaderColor] = useState(tabla?.headerColor ?? '#ffffff');
  const [borderColor, setBorderColor] = useState(tabla?.borderColor ?? '#dde2ec');
  const [rowColor, setRowColor] = useState(tabla?.rowColor ?? '#1a1f33');
  // Cuadros de paciente/cobertura
  const [cardTitleColor, setCardTitleColor] = useState(cuadros?.color ?? '#1f2b5b');
  const [cardBorderColor, setCardBorderColor] = useState(cuadros?.borderColor ?? '#dde2ec');
  const [cardBg, setCardBg] = useState(cuadros?.headerBg ?? '#f5f7fb');

  const saveMut = useMutation({
    mutationFn: () =>
      apiClient
        .put<PreferenciaPdf>(`/preferencia-pdf/${formatoId}`, {
          campos: {
            'tabla.resultados': {
              x: 0,
              y: 0,
              headerBg,
              headerColor,
              borderColor,
              rowColor,
            },
            cuadros: {
              x: 0,
              y: 0,
              color: cardTitleColor,
              borderColor: cardBorderColor,
              headerBg: cardBg,
            },
          },
        } satisfies UpdatePreferenciaPdfDto)
        .then((r) => r.data),
    onSuccess: () => {
      toast.success('Colores guardados');
      qc.invalidateQueries({ queryKey: queries.preferenciaPdf.detail(formatoId) });
    },
    onError: (err) => toast.error(apiError(err, 'Error al guardar colores')),
  });

  return (
    <section className="mt-6 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6 shadow-[var(--shadow-xs)]">
      <h2 className="font-semibold text-[var(--color-fg)] text-base">Colores del informe</h2>
      <p className="mt-1 text-[var(--color-fg-muted)] text-sm">
        Personalizá los colores de la tabla de resultados y los cuadros de datos.
      </p>

      {/* Cuadros de paciente/cobertura */}
      <h3 className="mt-5 mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-fg-muted)]">
        Cuadros de paciente y cobertura
      </h3>
      <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
        <ColorField
          id="col-card-title"
          label="Título del cuadro"
          value={cardTitleColor}
          onChange={setCardTitleColor}
        />
        <ColorField
          id="col-card-border"
          label="Borde del cuadro"
          value={cardBorderColor}
          onChange={setCardBorderColor}
        />
        <ColorField id="col-card-bg" label="Fondo del cuadro" value={cardBg} onChange={setCardBg} />
      </div>

      {/* Preview cuadros */}
      <div className="mt-3 flex max-w-md gap-3">
        <div
          className="flex-1 rounded-md border p-3"
          style={{ borderColor: cardBorderColor, backgroundColor: cardBg }}
        >
          <p
            className="mb-1 text-[9px] font-semibold uppercase tracking-wide"
            style={{ color: cardTitleColor }}
          >
            Paciente
          </p>
          <p className="text-xs">
            <span className="text-[var(--color-fg-muted)]">Nombre</span>{' '}
            <span className="font-medium">Pérez, María</span>
          </p>
        </div>
        <div
          className="flex-1 rounded-md border p-3"
          style={{ borderColor: cardBorderColor, backgroundColor: cardBg }}
        >
          <p
            className="mb-1 text-[9px] font-semibold uppercase tracking-wide"
            style={{ color: cardTitleColor }}
          >
            Cobertura
          </p>
          <p className="text-xs">
            <span className="text-[var(--color-fg-muted)]">Obra social</span>{' '}
            <span className="font-medium">OSDE</span>
          </p>
        </div>
      </div>

      {/* Tabla de resultados */}
      <h3 className="mt-6 mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-fg-muted)]">
        Tabla de resultados
      </h3>
      <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
        <ColorField
          id="col-header-bg"
          label="Fondo encabezado"
          value={headerBg}
          onChange={setHeaderBg}
        />
        <ColorField
          id="col-header-color"
          label="Texto encabezado"
          value={headerColor}
          onChange={setHeaderColor}
        />
        <ColorField id="col-border" label="Bordes" value={borderColor} onChange={setBorderColor} />
        <ColorField id="col-row" label="Texto filas" value={rowColor} onChange={setRowColor} />
      </div>

      {/* Preview tabla */}
      <div className="mt-3 max-w-md overflow-hidden rounded-md border border-[var(--color-border)]">
        <div
          className="flex gap-4 px-3 py-2 text-xs font-semibold"
          style={{ backgroundColor: headerBg, color: headerColor }}
        >
          <span className="w-1/3">PRÁCTICA</span>
          <span className="w-1/4">RESULTADO</span>
          <span className="w-1/6">UNIDAD</span>
          <span>REFERENCIA</span>
        </div>
        <div
          className="flex gap-4 px-3 py-2 text-xs"
          style={{ borderTop: `1px solid ${borderColor}`, color: rowColor }}
        >
          <span className="w-1/3 font-medium">Hemograma</span>
          <span className="w-1/4">92</span>
          <span className="w-1/6 opacity-60">mg/dL</span>
          <span className="opacity-60">70 – 110</span>
        </div>
      </div>

      <div className="mt-5">
        <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
          {saveMut.isPending && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />}
          Guardar colores
        </Button>
      </div>
    </section>
  );
}

// ─── Main Editor ─────────────────────────────────────────────────────

export function PdfEditorClient({ initialFormato }: { initialFormato: PreferenciaPdf }) {
  const qc = useQueryClient();
  const [previewLoading, setPreviewLoading] = useState(false);

  const { data: formato } = useQuery({
    queryKey: queries.preferenciaPdf.detail(initialFormato.id),
    queryFn: () =>
      apiClient.get<PreferenciaPdf>(`/preferencia-pdf/${initialFormato.id}`).then((r) => r.data),
    initialData: initialFormato,
  });

  const hasFondo = Boolean(formato.fondoPath);
  const usarFondo = formato.layoutConfig?.usarFondo ?? false;

  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(formato.nombre);

  const renameMut = useMutation({
    mutationFn: (nombre: string) =>
      apiClient
        .put<PreferenciaPdf>(`/preferencia-pdf/${formato.id}`, {
          nombre,
        } satisfies UpdatePreferenciaPdfDto)
        .then((r) => r.data),
    onSuccess: () => {
      toast.success('Nombre actualizado');
      setEditingName(false);
      qc.invalidateQueries({ queryKey: queries.preferenciaPdf.detail(formato.id) });
      qc.invalidateQueries({ queryKey: queries.preferenciaPdf.list() });
    },
    onError: (err) => toast.error(apiError(err, 'Error al renombrar')),
  });

  async function handlePreviewPdf() {
    setPreviewLoading(true);
    try {
      const res = await apiClient.get<Blob>(`/preferencia-pdf/${formato.id}/preview`, {
        responseType: 'blob',
      });
      const url = URL.createObjectURL(res.data);
      const tab = window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      if (!tab) toast.error('El navegador bloqueó la ventana emergente.');
    } catch (err) {
      toast.error(apiError(err, 'Error al generar el PDF de muestra'));
    } finally {
      setPreviewLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Barra superior */}
      <div className="flex flex-wrap items-center gap-3">
        {editingName ? (
          <div className="flex items-center gap-2">
            <Input
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              className="w-64"
              maxLength={100}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && nameValue.trim()) renameMut.mutate(nameValue.trim());
                if (e.key === 'Escape') {
                  setEditingName(false);
                  setNameValue(formato.nombre);
                }
              }}
            />
            <Button
              size="sm"
              onClick={() => nameValue.trim() && renameMut.mutate(nameValue.trim())}
              disabled={!nameValue.trim() || renameMut.isPending}
            >
              {renameMut.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
              ) : (
                'Guardar'
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setEditingName(false);
                setNameValue(formato.nombre);
              }}
            >
              Cancelar
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEditingName(true)}
            className="text-left text-sm font-medium text-[var(--color-fg)] hover:underline"
          >
            {formato.nombre}
          </button>
        )}
        <Badge variant={formato.tipo === 'informe' ? 'default' : 'secondary'}>
          {TIPO_LABELS[formato.tipo]}
        </Badge>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" onClick={handlePreviewPdf} disabled={previewLoading} size="sm">
            {previewLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
            ) : (
              <Eye className="h-4 w-4" strokeWidth={2} />
            )}
            Vista previa
          </Button>
        </div>
      </div>

      <FondoTab formatoId={formato.id} hasFondo={hasFondo} usarFondo={usarFondo} />
      <ColoresSection formatoId={formato.id} layoutConfig={formato.layoutConfig} />
    </div>
  );
}
