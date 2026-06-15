'use client';

import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/api/client';
import { queries } from '@/lib/api/queries';
import type { LabAssetSignedUrlResponse, LabConfig, UpdateLabConfigDto } from '@/lib/api/types';
import { useMutation, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { ImageIcon, Loader2, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

const LOGO_ACCEPT = 'image/png,image/jpeg,image/webp';
const LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const LOGO_MAX_BYTES = 5 * 1024 * 1024;

function apiError(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    if (err.response?.status === 403) return 'Necesitás permisos de administrador.';
    const msg = err.response?.data?.message;
    if (Array.isArray(msg)) return msg.join('. ');
    if (typeof msg === 'string') return msg;
  }
  return fallback;
}

export function BrandingCustomizer({ config }: { config: LabConfig }) {
  const router = useRouter();
  const [tagline, setTagline] = useState(config.tagline ?? '');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [pickedLogoUrl, setPickedLogoUrl] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const taglineDirty = tagline !== (config.tagline ?? '');

  const { data: logoSigned } = useQuery({
    queryKey: [...queries.labConfig, 'logo-url'],
    queryFn: async () =>
      (await apiClient.get<LabAssetSignedUrlResponse>('/lab-config/logo/signed-url')).data,
    enabled: config.logoPath != null,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!logoFile) {
      setPickedLogoUrl(null);
      return;
    }
    const url = URL.createObjectURL(logoFile);
    setPickedLogoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [logoFile]);

  const previewLogo = pickedLogoUrl ?? logoSigned?.url ?? null;

  const saveMut = useMutation({
    mutationFn: async () => {
      const payload: UpdateLabConfigDto = { tagline: tagline.trim() };
      return (await apiClient.patch<LabConfig>('/lab-config', payload)).data;
    },
    onSuccess: () => {
      toast.success('Guardado');
      router.refresh();
    },
    onError: (err) => toast.error(apiError(err, 'No se pudo guardar')),
  });

  const logoMut = useMutation({
    mutationFn: async () => {
      if (!logoFile) throw new Error('Seleccioná un archivo');
      const fd = new FormData();
      fd.append('file', logoFile);
      return (
        await apiClient.post<LabConfig>('/lab-config/logo', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      ).data;
    },
    onSuccess: () => {
      toast.success('Logo actualizado');
      setLogoFile(null);
      if (logoInputRef.current) logoInputRef.current.value = '';
      router.refresh();
    },
    onError: (err) => toast.error(apiError(err, 'No se pudo subir el logo')),
  });

  function pickLogo(selected: File | null) {
    if (!selected) return;
    if (!LOGO_TYPES.includes(selected.type)) {
      toast.error('Formato no permitido. Usá PNG, JPG o WEBP.');
      return;
    }
    if (selected.size > LOGO_MAX_BYTES) {
      toast.error('El archivo supera los 5 MB.');
      return;
    }
    setLogoFile(selected);
  }

  return (
    <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6 shadow-[var(--shadow-xs)]">
      <div className="max-w-xl">
        <h2 className="font-semibold text-[var(--color-fg)] text-base">Logo del laboratorio</h2>
        <p className="mt-1 text-[var(--color-fg-muted)] text-sm">
          Aparece en el encabezado de la app y en el membrete de los informes. PNG, JPG o WEBP,
          hasta 5 MB.
        </p>
      </div>

      <div className="mt-6 max-w-xl space-y-6">
        {/* Logo: preview + subir */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-[var(--color-border)] bg-[var(--color-bg-subtle)]">
            {previewLogo ? (
              <img
                src={previewLogo}
                alt="Logo del laboratorio"
                className="h-full w-full object-contain"
              />
            ) : (
              <ImageIcon className="h-6 w-6 text-[var(--color-fg-subtle)]" strokeWidth={1.5} />
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={logoInputRef}
              type="file"
              accept={LOGO_ACCEPT}
              disabled={logoMut.isPending}
              onChange={(e) => pickLogo(e.target.files?.[0] ?? null)}
              className="block w-full max-w-xs text-[var(--color-fg-muted)] text-sm file:mr-3 file:rounded-md file:border-0 file:bg-[var(--color-bg-subtle)] file:px-3 file:py-1.5 file:font-medium file:text-[var(--color-fg)] file:text-sm disabled:cursor-not-allowed disabled:opacity-50"
            />
            <Button
              type="button"
              onClick={() => logoMut.mutate()}
              disabled={!logoFile || logoMut.isPending}
            >
              {logoMut.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
              ) : (
                <Upload className="h-4 w-4" strokeWidth={2} />
              )}
              Subir
            </Button>
          </div>
        </div>

        {/* Eslogan */}
        <FormField label="Eslogan (opcional)" htmlFor="tagline">
          <Input
            id="tagline"
            value={tagline}
            maxLength={120}
            onChange={(e) => setTagline(e.target.value)}
            placeholder="Análisis clínicos de confianza"
          />
        </FormField>

        <div className="flex items-center gap-3 border-[var(--color-border)] border-t pt-4">
          <Button
            type="button"
            onClick={() => saveMut.mutate()}
            disabled={!taglineDirty || saveMut.isPending}
          >
            {saveMut.isPending && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />}
            Guardar
          </Button>
          {taglineDirty && !saveMut.isPending && (
            <span className="text-[var(--color-fg-muted)] text-xs">Cambios sin guardar</span>
          )}
        </div>
      </div>
    </section>
  );
}
