'use client';

import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/api/client';
import { queries } from '@/lib/api/queries';
import type { LabAssetSignedUrlResponse, LabConfig, UpdateLabConfigDto } from '@/lib/api/types';
import { cn } from '@/lib/cn';
import { themePreviewVars } from '@/lib/tenant/theme';
import { useMutation, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Check, FileText, Home, Loader2, Upload, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type CSSProperties, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

const DEFAULT_PRIMARY = '#0db5b0';
const HEX_RE = /^#[0-9a-f]{6}$/i;
const LOGO_ACCEPT = 'image/png,image/jpeg,image/webp';
const LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const LOGO_MAX_BYTES = 5 * 1024 * 1024;
const PRESETS = ['#0db5b0', '#2563eb', '#7c3aed', '#0891b2', '#059669', '#b91c1c'];

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

  const initialColor =
    config.primaryColor && HEX_RE.test(config.primaryColor) ? config.primaryColor : DEFAULT_PRIMARY;
  const [color, setColor] = useState(initialColor);
  const [tagline, setTagline] = useState(config.tagline ?? '');

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [pickedLogoUrl, setPickedLogoUrl] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const validColor = HEX_RE.test(color);
  const dirty =
    (validColor && color.toLowerCase() !== initialColor.toLowerCase()) ||
    tagline !== (config.tagline ?? '');

  // Logo persistido (signed-url) para mostrar en el preview al cargar.
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
  const previewName = config.shortName?.trim() || config.legalName;

  const saveMut = useMutation({
    mutationFn: async () => {
      const payload: UpdateLabConfigDto = { primaryColor: color, tagline: tagline.trim() };
      return (await apiClient.patch<LabConfig>('/lab-config', payload)).data;
    },
    onSuccess: () => {
      toast.success('Marca actualizada');
      router.refresh();
    },
    onError: (err) => toast.error(apiError(err, 'No se pudo guardar la marca')),
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
        <h2 className="font-semibold text-[var(--color-fg)] text-base">Identidad de marca</h2>
        <p className="mt-1 text-[var(--color-fg-muted)] text-sm">
          Tu logo y color primario. La vista previa muestra cómo se ve el sistema antes de guardar.
        </p>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* ── Controles ── */}
        <div className="space-y-6">
          {/* Logo */}
          <div>
            <span className="font-medium text-[var(--color-fg)] text-sm">Logo</span>
            <p className="mt-0.5 text-[var(--color-fg-muted)] text-xs">
              PNG, JPG o WEBP, hasta 5 MB. Aparece en la barra lateral, el login y los informes.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
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

          {/* Color */}
          <FormField
            label="Color primario"
            htmlFor="primaryColor"
            error={validColor ? undefined : 'Usá un color hex válido (#rrggbb).'}
          >
            <div className="flex items-center gap-3">
              <input
                aria-label="Selector de color"
                type="color"
                value={validColor ? color : DEFAULT_PRIMARY}
                onChange={(e) => setColor(e.target.value)}
                className="h-9 w-12 shrink-0 cursor-pointer rounded-md border border-[var(--color-border)] bg-transparent p-0.5"
              />
              <Input
                id="primaryColor"
                value={color}
                spellCheck={false}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#0db5b0"
                className="max-w-[160px] font-mono"
              />
            </div>
          </FormField>

          <div className="-mt-2 flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                aria-label={`Usar color ${p}`}
                onClick={() => setColor(p)}
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full border transition-transform hover:scale-110 motion-reduce:transition-none',
                  color.toLowerCase() === p.toLowerCase()
                    ? 'border-[var(--color-fg)]'
                    : 'border-[var(--color-border)]',
                )}
                style={{ backgroundColor: p }}
              >
                {color.toLowerCase() === p.toLowerCase() && (
                  <Check className="h-3.5 w-3.5 text-white drop-shadow" strokeWidth={3} />
                )}
              </button>
            ))}
          </div>

          {/* Tagline */}
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
              disabled={!validColor || !dirty || saveMut.isPending}
            >
              {saveMut.isPending && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />}
              Guardar marca
            </Button>
            {dirty && !saveMut.isPending && (
              <span className="text-[var(--color-fg-muted)] text-xs">Cambios sin guardar</span>
            )}
          </div>
        </div>

        {/* ── Vista previa en vivo (tema scopeado a este contenedor) ── */}
        <div
          style={themePreviewVars(validColor ? color : DEFAULT_PRIMARY) as CSSProperties}
          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-4"
        >
          <span className="text-[var(--color-fg-subtle)] text-xs uppercase tracking-wide">
            Vista previa
          </span>
          <div className="mt-3 flex gap-3">
            <BrandingPreview logo={previewLogo} name={previewName} tagline={tagline} />
          </div>
        </div>
      </div>
    </section>
  );
}

/** Mock de sidebar + login que repinta desde las CSS vars del contenedor padre. */
function BrandingPreview({
  logo,
  name,
  tagline,
}: {
  logo: string | null;
  name: string;
  tagline: string;
}) {
  return (
    <div className="flex w-full gap-3 overflow-hidden rounded-md border border-[var(--color-border)] bg-white">
      {/* Sidebar mock */}
      <aside className="w-32 shrink-0 border-[var(--color-border)] border-r bg-[var(--color-bg)] p-3">
        <div className="flex items-center gap-2">
          {logo ? (
            <img src={logo} alt="" className="h-7 w-7 rounded object-contain" />
          ) : (
            <span
              className="flex h-7 w-7 items-center justify-center rounded font-bold text-[10px] text-[var(--color-primary-foreground)] transition-colors duration-300 motion-reduce:transition-none"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              {name.slice(0, 2).toUpperCase()}
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate font-semibold text-[10px] text-[var(--color-fg)]">{name}</p>
            <p className="truncate text-[8px] text-[var(--color-fg-muted)]">
              {tagline.trim() || 'Laboratorio'}
            </p>
          </div>
        </div>
        <nav className="mt-3 space-y-1">
          <PreviewNav icon={Home} label="Inicio" active />
          <PreviewNav icon={Users} label="Pacientes" />
          <PreviewNav icon={FileText} label="Órdenes" />
        </nav>
      </aside>

      {/* Content / login mock */}
      <div className="flex-1 p-3">
        <p className="font-semibold text-[11px] text-[var(--color-fg)]">Bienvenido</p>
        <p className="mt-0.5 text-[9px] text-[var(--color-fg-muted)]">Ingresá a tu laboratorio</p>
        <div className="mt-2 h-5 rounded border border-[var(--color-border)] bg-[var(--color-bg-subtle)]" />
        <div className="mt-1.5 h-5 rounded border border-[var(--color-border)] bg-[var(--color-bg-subtle)]" />
        <button
          type="button"
          tabIndex={-1}
          className="mt-2 w-full rounded py-1.5 font-medium text-[10px] text-[var(--color-primary-foreground)] transition-colors duration-300 motion-reduce:transition-none"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          Ingresar
        </button>
        <span
          className="mt-2 inline-block rounded-full px-2 py-0.5 font-medium text-[9px] transition-colors duration-300 motion-reduce:transition-none"
          style={{ backgroundColor: 'var(--color-primary-soft)', color: 'var(--color-primary)' }}
        >
          Activo
        </span>
      </div>
    </div>
  );
}

function PreviewNav({
  icon: Icon,
  label,
  active = false,
}: {
  icon: typeof Home;
  label: string;
  active?: boolean;
}) {
  return (
    <div
      className="flex items-center gap-1.5 rounded px-1.5 py-1 text-[9px] transition-colors duration-300 motion-reduce:transition-none"
      style={
        active
          ? { backgroundColor: 'var(--color-primary-soft)', color: 'var(--color-primary)' }
          : undefined
      }
    >
      <Icon
        className={cn('h-3 w-3', active ? '' : 'text-[var(--color-fg-muted)]')}
        strokeWidth={2}
      />
      <span className={active ? 'font-medium' : 'text-[var(--color-fg-muted)]'}>{label}</span>
    </div>
  );
}
