'use client';

import { ConfirmDialog } from '@/components/domain/confirm-dialog';
import { PdfCanvas } from '@/components/domain/pdf-canvas';
import { PdfFieldPanel } from '@/components/domain/pdf-field-panel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiClient } from '@/lib/api/client';
import { queries } from '@/lib/api/queries';
import type {
  FondoSignedUrlResponse,
  PdfLayoutCampo,
  PreferenciaPdf,
  TipoPdf,
  UpdatePreferenciaPdfDto,
} from '@/lib/api/types';
import { cn } from '@/lib/cn';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Eye, FileImage, ImageOff, Loader2, Save, Trash2, Upload } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
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

type MarginForm = {
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
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

// ─── Margins Tab ─────────────────────────────────────────────────────

function MarginsTab({
  formatoId,
  margins,
  onMarginsChange,
}: {
  formatoId: number;
  margins: MarginForm;
  onMarginsChange: (m: MarginForm) => void;
}) {
  const qc = useQueryClient();

  const saveMut = useMutation({
    mutationFn: (dto: UpdatePreferenciaPdfDto) =>
      apiClient.put<PreferenciaPdf>(`/preferencia-pdf/${formatoId}`, dto).then((r) => r.data),
    onSuccess: () => {
      toast.success('Márgenes guardados');
      qc.invalidateQueries({ queryKey: queries.preferenciaPdf.detail(formatoId) });
    },
    onError: (err) => toast.error(apiError(err, 'Error al guardar márgenes')),
  });

  function setField(key: keyof MarginForm) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = Number.parseInt(e.target.value, 10);
      const val = Number.isNaN(raw) ? 0 : Math.min(200, Math.max(0, raw));
      onMarginsChange({ ...margins, [key]: val });
    };
  }

  const inputCls =
    'w-24 rounded-md border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] px-3 py-2 text-right text-sm text-[var(--color-fg)] shadow-[var(--shadow-xs)] outline-none transition-colors focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 disabled:cursor-not-allowed disabled:opacity-60';

  return (
    <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6 shadow-[var(--shadow-xs)]">
      <h2 className="font-semibold text-[var(--color-fg)] text-base">Márgenes del documento</h2>
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
            <label htmlFor={key} className="block text-xs font-medium text-[var(--color-fg-muted)]">
              {label}
            </label>
            <input
              id={key}
              type="number"
              min={0}
              max={200}
              value={margins[key]}
              onChange={setField(key)}
              disabled={saveMut.isPending}
              className={inputCls}
            />
          </div>
        ))}
      </div>

      <div className="mt-5">
        <Button onClick={() => saveMut.mutate(margins)} disabled={saveMut.isPending}>
          {saveMut.isPending && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />}
          Guardar márgenes
        </Button>
      </div>
    </section>
  );
}

// ─── Campos Tab ──────────────────────────────────────────────────────

const INFORME_FIELDS = [
  { key: 'paciente.nombre', label: 'Paciente: Nombre' },
  { key: 'paciente.dni', label: 'Paciente: DNI' },
  { key: 'paciente.sexo', label: 'Paciente: Sexo' },
  { key: 'paciente.edad', label: 'Paciente: Edad' },
  { key: 'paciente.nacimiento', label: 'Paciente: Nacimiento' },
  { key: 'orden.protocolo', label: 'Orden: Protocolo' },
  { key: 'orden.fecha', label: 'Orden: Fecha' },
  { key: 'cobertura.obraSocial', label: 'Cobertura: Obra social' },
  { key: 'cobertura.nroAfiliado', label: 'Cobertura: Nro afiliado' },
  { key: 'medico.nombre', label: 'Médico: Nombre' },
  { key: 'medico.mp', label: 'Médico: M.P.' },
  { key: 'medico.diagnostico', label: 'Médico: Diagnóstico' },
  { key: 'tabla.resultados', label: 'Tabla de resultados' },
  { key: 'firma.nombre', label: 'Firma: Nombre' },
  { key: 'firma.matricula', label: 'Firma: Matrícula' },
] as const;

const ORDEN_FIELDS = [
  { key: 'paciente.nombre', label: 'Paciente: Nombre' },
  { key: 'paciente.dni', label: 'Paciente: DNI' },
  { key: 'orden.protocolo', label: 'Orden: Protocolo' },
  { key: 'orden.fecha', label: 'Orden: Fecha' },
  { key: 'cobertura.obraSocial', label: 'Cobertura: Obra social' },
  { key: 'medico.nombre', label: 'Médico: Nombre' },
  { key: 'tabla.practicas', label: 'Tabla de prácticas' },
] as const;

const GRID_OPTIONS = [
  { value: 5, label: '5 pt' },
  { value: 10, label: '10 pt' },
  { value: 20, label: '20 pt' },
  { value: 0, label: 'Libre' },
] as const;

function CamposTab({
  formatoId,
  tipo,
  campos,
  onCamposChange,
  fondoUrl,
}: {
  formatoId: number;
  tipo: TipoPdf;
  campos: Record<string, PdfLayoutCampo>;
  onCamposChange: (c: Record<string, PdfLayoutCampo>) => void;
  fondoUrl: string | null;
}) {
  const qc = useQueryClient();
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [gridSize, setGridSize] = useState(10);
  const availableFields = tipo === 'informe' ? INFORME_FIELDS : ORDEN_FIELDS;

  const saveMut = useMutation({
    mutationFn: () =>
      apiClient
        .put<PreferenciaPdf>(`/preferencia-pdf/${formatoId}`, {
          campos,
        } satisfies UpdatePreferenciaPdfDto)
        .then((r) => r.data),
    onSuccess: () => {
      toast.success('Campos guardados');
      qc.invalidateQueries({ queryKey: queries.preferenciaPdf.detail(formatoId) });
    },
    onError: (err) => toast.error(apiError(err, 'Error al guardar campos')),
  });

  const handleFieldDrop = useCallback(
    (key: string, x: number, y: number) => {
      onCamposChange({
        ...campos,
        [key]: {
          ...campos[key],
          x: Math.round(x),
          y: Math.round(y),
          fontSize: campos[key]?.fontSize ?? 10,
        },
      });
    },
    [campos, onCamposChange],
  );

  const handleFieldMove = useCallback(
    (key: string, x: number, y: number) => {
      onCamposChange({
        ...campos,
        [key]: { ...campos[key], x: Math.round(x), y: Math.round(y) },
      });
    },
    [campos, onCamposChange],
  );

  const handleRemoveField = useCallback(
    (key: string) => {
      const next = { ...campos };
      delete next[key];
      onCamposChange(next);
      if (selectedField === key) setSelectedField(null);
    },
    [campos, onCamposChange, selectedField],
  );

  const handleUpdateFieldProp = useCallback(
    (key: string, prop: 'fontSize' | 'color' | 'prefix', value: number | string) => {
      if (!campos[key]) return;
      onCamposChange({
        ...campos,
        [key]: { ...campos[key], [prop]: value },
      });
    },
    [campos, onCamposChange],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-[var(--color-fg-muted)]">Grilla:</span>
          <div className="flex rounded-md border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-0.5">
            {GRID_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setGridSize(opt.value)}
                className={cn(
                  'rounded px-2.5 py-1 text-xs font-medium transition-colors',
                  gridSize === opt.value
                    ? 'bg-[var(--color-bg-elevated)] text-[var(--color-fg)] shadow-[var(--shadow-xs)]'
                    : 'text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending} size="sm">
          {saveMut.isPending && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />}
          Guardar campos
        </Button>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="w-full shrink-0 lg:w-56">
          <PdfFieldPanel
            availableFields={availableFields}
            placedFields={campos}
            selectedField={selectedField}
            onSelectField={setSelectedField}
            onRemoveField={handleRemoveField}
            onUpdateProp={handleUpdateFieldProp}
          />
        </div>
        <div className="w-full max-w-md">
          <PdfCanvas
            campos={campos}
            availableFields={availableFields}
            fondoUrl={fondoUrl}
            selectedField={selectedField}
            gridSize={gridSize}
            onSelectField={setSelectedField}
            onFieldDrop={handleFieldDrop}
            onFieldMove={handleFieldMove}
          />
        </div>
      </div>
    </div>
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

  const { data: signedUrlData } = useQuery({
    queryKey: queries.preferenciaPdf.fondoUrl(formato.id),
    queryFn: () =>
      apiClient
        .get<FondoSignedUrlResponse>(`/preferencia-pdf/${formato.id}/fondo/signed-url`)
        .then((r) => r.data),
    enabled: hasFondo,
    staleTime: 55 * 60 * 1000,
  });

  const fondoUrl = signedUrlData?.url ?? null;

  const [margins, setMargins] = useState<MarginForm>({
    marginTop: formato.marginTop,
    marginBottom: formato.marginBottom,
    marginLeft: formato.marginLeft,
    marginRight: formato.marginRight,
  });

  const [campos, setCampos] = useState<Record<string, PdfLayoutCampo>>(
    formato.layoutConfig?.campos ?? {},
  );

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

      {/* Tabs */}
      <Tabs defaultValue="fondo">
        <TabsList>
          <TabsTrigger value="fondo">Fondo</TabsTrigger>
          <TabsTrigger value="campos">Campos</TabsTrigger>
          <TabsTrigger value="margenes">Márgenes</TabsTrigger>
        </TabsList>

        <TabsContent value="fondo">
          <FondoTab formatoId={formato.id} hasFondo={hasFondo} usarFondo={usarFondo} />
        </TabsContent>

        <TabsContent value="campos">
          <CamposTab
            formatoId={formato.id}
            tipo={formato.tipo}
            campos={campos}
            onCamposChange={setCampos}
            fondoUrl={fondoUrl}
          />
        </TabsContent>

        <TabsContent value="margenes">
          <MarginsTab formatoId={formato.id} margins={margins} onMarginsChange={setMargins} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
