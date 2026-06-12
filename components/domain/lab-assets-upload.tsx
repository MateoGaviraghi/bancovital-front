'use client';

import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api/client';
import type { LabConfig } from '@/lib/api/types';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { CheckCircle2, Loader2, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

const ACCEPT = 'image/png,image/jpeg,image/webp';
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024;

function apiError(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    if (err.response?.status === 403) return 'Necesitás permisos de administrador.';
    const msg = err.response?.data?.message;
    if (Array.isArray(msg)) return msg.join('. ');
    if (typeof msg === 'string') return msg;
  }
  return fallback;
}

type AssetUploaderProps = {
  title: string;
  description: string;
  endpoint: '/lab-config/logo' | '/lab-config/signature';
  alreadyLoaded: boolean;
  previewBg: 'dark' | 'light';
};

function AssetUploader({
  title,
  description,
  endpoint,
  alreadyLoaded,
  previewBg,
}: AssetUploaderProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function pick(selected: File | null) {
    if (!selected) {
      setFile(null);
      return;
    }
    if (!ALLOWED_TYPES.includes(selected.type)) {
      toast.error('Formato no permitido. Usá PNG, JPG o WEBP.');
      return;
    }
    if (selected.size > MAX_BYTES) {
      toast.error('El archivo supera los 5 MB.');
      return;
    }
    setFile(selected);
  }

  const mutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error('Seleccioná un archivo');
      const fd = new FormData();
      fd.append('file', file);
      // The shared axios instance defaults to application/json; for FormData,
      // axios v1's xhr adapter resets Content-Type so the browser adds the boundary.
      const res = await apiClient.post<LabConfig>(endpoint, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success(`${title} actualizado`);
      setFile(null);
      if (inputRef.current) inputRef.current.value = '';
      router.refresh();
    },
    onError: (err) => toast.error(apiError(err, `Error al subir ${title.toLowerCase()}`)),
  });

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-medium text-[var(--color-fg)] text-sm">{title}</h3>
          <p className="mt-0.5 text-[var(--color-fg-muted)] text-xs">{description}</p>
        </div>
        {alreadyLoaded && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[var(--color-success-soft)] px-2 py-0.5 font-medium text-[var(--color-success)] text-xs">
            <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} />
            Cargado
          </span>
        )}
      </div>

      {previewUrl && (
        <div
          className={`mt-3 flex items-center justify-center rounded-md border border-[var(--color-border)] p-3 ${
            previewBg === 'light' ? 'bg-white' : 'bg-[var(--color-bg-subtle)]'
          }`}
        >
          {/* biome-ignore lint/performance/noImgElement: object URL preview, not a remote asset */}
          <img
            src={previewUrl}
            alt={`Vista previa de ${title.toLowerCase()}`}
            className="max-h-32 w-auto object-contain"
          />
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          disabled={mutation.isPending}
          onChange={(e) => pick(e.target.files?.[0] ?? null)}
          className="block w-full max-w-xs text-[var(--color-fg-muted)] text-sm file:mr-3 file:rounded-md file:border-0 file:bg-[var(--color-bg-subtle)] file:px-3 file:py-1.5 file:font-medium file:text-[var(--color-fg)] file:text-sm hover:file:bg-[var(--color-bg-subtle)]/80 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <Button onClick={() => mutation.mutate()} disabled={!file || mutation.isPending}>
          {mutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
          ) : (
            <Upload className="h-4 w-4" strokeWidth={2} />
          )}
          Subir
        </Button>
      </div>
    </div>
  );
}

export function LabAssetsUpload({ config }: { config: LabConfig }) {
  return (
    <section className="mt-8 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6 shadow-[var(--shadow-xs)]">
      <div className="max-w-xl">
        <h2 className="font-semibold text-[var(--color-fg)] text-base">Logo y firma</h2>
        <p className="mt-1 text-[var(--color-fg-muted)] text-sm">
          Imágenes usadas en los informes. PNG, JPG o WEBP, hasta 5 MB. Los informes nuevos saldrán
          con estas imágenes; los ya emitidos se actualizan al regenerarlos (botón de abajo).
        </p>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <AssetUploader
          title="Logo del laboratorio"
          description="Aparece en el encabezado de cada informe."
          endpoint="/lab-config/logo"
          alreadyLoaded={config.logoPath != null}
          previewBg="dark"
        />
        <AssetUploader
          title="Firma del profesional"
          description="Se inserta en la zona de firma del informe."
          endpoint="/lab-config/signature"
          alreadyLoaded={config.signingSignaturePath != null}
          previewBg="light"
        />
      </div>
    </section>
  );
}
