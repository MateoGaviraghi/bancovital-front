'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/api/client';
import { queries } from '@/lib/api/queries';
import type { LabAssetSignedUrlResponse, LabConfig, UpdateLabConfigDto } from '@/lib/api/types';
import { cleanHex, labThemeVars } from '@/lib/lab/theme';
import { useMutation, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { ImageIcon, Loader2, Palette, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

const LOGO_ACCEPT = 'image/png,image/jpeg,image/webp';
const LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const LOGO_MAX_BYTES = 5 * 1024 * 1024;

// Defaults Banco Vital (navy / rojo). Si el lab no eligió colores, parte de acá.
const BV_PRIMARY = '#1f2b5b';
const BV_ACCENT = '#cd0f0f';

const PRESETS: { name: string; primary: string; accent: string; group: string }[] = [
  // Clásicos
  { name: 'Banco Vital', primary: '#1f2b5b', accent: '#cd0f0f', group: 'Clásicos' },
  { name: 'Navy Gold', primary: '#1a2744', accent: '#c8a951', group: 'Clásicos' },
  { name: 'Borgoña', primary: '#7a1f2b', accent: '#c89b3c', group: 'Clásicos' },
  { name: 'Grafito', primary: '#1f2933', accent: '#0d9488', group: 'Clásicos' },
  // Naturaleza
  { name: 'Esmeralda', primary: '#0f5132', accent: '#d97706', group: 'Naturaleza' },
  { name: 'Bosque', primary: '#1a4731', accent: '#e07b39', group: 'Naturaleza' },
  { name: 'Oliva', primary: '#3d4f2f', accent: '#c49a2a', group: 'Naturaleza' },
  { name: 'Jade', primary: '#115e59', accent: '#f59e0b', group: 'Naturaleza' },
  // Oceánicos
  { name: 'Océano', primary: '#0e4a6e', accent: '#e0533d', group: 'Oceánicos' },
  { name: 'Celeste', primary: '#1e5a8a', accent: '#e57c23', group: 'Oceánicos' },
  { name: 'Atlántico', primary: '#1e3a5f', accent: '#d4a017', group: 'Oceánicos' },
  { name: 'Turquesa', primary: '#134e5e', accent: '#f2994a', group: 'Oceánicos' },
  // Cálidos
  { name: 'Terracota', primary: '#8b3a2a', accent: '#2d6a4f', group: 'Cálidos' },
  { name: 'Caramelo', primary: '#6b3410', accent: '#1a6b4b', group: 'Cálidos' },
  { name: 'Ladrillo', primary: '#922b21', accent: '#1a5276', group: 'Cálidos' },
  { name: 'Bronce', primary: '#5d4037', accent: '#00838f', group: 'Cálidos' },
  // Violetas
  { name: 'Violeta', primary: '#4c2a86', accent: '#e0a800', group: 'Violetas' },
  { name: 'Amatista', primary: '#5b2c6f', accent: '#d4ac0d', group: 'Violetas' },
  { name: 'Índigo', primary: '#3f2b96', accent: '#e67e22', group: 'Violetas' },
  { name: 'Uva', primary: '#6c3483', accent: '#27ae60', group: 'Violetas' },
  // Modernos
  { name: 'Carbón', primary: '#2c3e50', accent: '#e74c3c', group: 'Modernos' },
  { name: 'Acero', primary: '#34495e', accent: '#1abc9c', group: 'Modernos' },
  { name: 'Pizarra', primary: '#2c3e50', accent: '#f39c12', group: 'Modernos' },
  { name: 'Ébano', primary: '#1c1c1c', accent: '#c0392b', group: 'Modernos' },
  // Claros
  { name: 'Cielo', primary: '#4a90d9', accent: '#e8853d', group: 'Claros' },
  { name: 'Lavanda', primary: '#7c6bc4', accent: '#e09545', group: 'Claros' },
  { name: 'Menta', primary: '#3da88e', accent: '#d47c5a', group: 'Claros' },
  { name: 'Coral', primary: '#d06b5d', accent: '#4a90a4', group: 'Claros' },
  { name: 'Lila', primary: '#9b72cf', accent: '#5bb5a2', group: 'Claros' },
  { name: 'Durazno', primary: '#c87f5a', accent: '#5b8fc2', group: 'Claros' },
  { name: 'Aqua', primary: '#4db6ac', accent: '#c27688', group: 'Claros' },
  { name: 'Rosa', primary: '#c47a9b', accent: '#5aad82', group: 'Claros' },
  { name: 'Dorado', primary: '#b8860b', accent: '#4a6fa5', group: 'Claros' },
  { name: 'Miel', primary: '#d4a017', accent: '#5b7d9a', group: 'Claros' },
  { name: 'Ámbar', primary: '#c4972a', accent: '#6b8e7b', group: 'Claros' },
  { name: 'Mostaza', primary: '#c49b2a', accent: '#7a5ba5', group: 'Claros' },
];

function apiError(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    if (err.response?.status === 403) return 'Necesitás permisos de administrador.';
    const msg = err.response?.data?.message;
    if (Array.isArray(msg)) return msg.join('. ');
    if (typeof msg === 'string') return msg;
  }
  return fallback;
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const valid = cleanHex(value);
  return (
    <div>
      <p className="mb-1.5 font-medium text-[var(--color-fg)] text-sm">{label}</p>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={label}
          value={valid ?? BV_PRIMARY}
          onChange={(e) => onChange(e.target.value.toLowerCase())}
          className="h-9 w-11 shrink-0 cursor-pointer rounded-md border border-[var(--color-border)] bg-transparent p-0.5"
        />
        <Input
          value={value}
          spellCheck={false}
          maxLength={7}
          onChange={(e) => onChange(e.target.value.trim().toLowerCase())}
          className="w-28 font-mono"
        />
      </div>
    </div>
  );
}

const GROUPS = Array.from(new Set(PRESETS.map((p) => p.group)));

function ThemePicker({
  primary,
  accent,
  onSelect,
}: {
  primary: string;
  accent: string;
  onSelect: (primary: string, accent: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        <Palette className="h-4 w-4" strokeWidth={2} />
        Elegir tema
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Temas de color</DialogTitle>
            <DialogDescription>
              Elegí una paleta prediseñada. Después podés ajustar los colores manualmente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {GROUPS.map((group) => (
              <div key={group}>
                <p className="mb-2 font-semibold text-xs text-[var(--color-fg-muted)] uppercase tracking-wide">
                  {group}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {PRESETS.filter((p) => p.group === group).map((p) => {
                    const active = cleanHex(primary) === p.primary && cleanHex(accent) === p.accent;
                    return (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => {
                          onSelect(p.primary, p.accent);
                          setOpen(false);
                        }}
                        className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                          active
                            ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)]'
                            : 'border-[var(--color-border)] hover:bg-[var(--color-bg-subtle)]'
                        }`}
                      >
                        <div className="flex -space-x-1">
                          <span
                            className="h-6 w-6 rounded-full border-2 border-white shadow-sm"
                            style={{ background: p.primary }}
                          />
                          <span
                            className="h-6 w-6 rounded-full border-2 border-white shadow-sm"
                            style={{ background: p.accent }}
                          />
                        </div>
                        <span className="text-sm text-[var(--color-fg)]">{p.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function BrandingCustomizer({ config }: { config: LabConfig }) {
  const router = useRouter();
  const [tagline, setTagline] = useState(config.tagline ?? '');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [pickedLogoUrl, setPickedLogoUrl] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [primary, setPrimary] = useState(config.primaryColor ?? BV_PRIMARY);
  const [accent, setAccent] = useState(config.accentColor ?? BV_ACCENT);

  const taglineDirty = tagline !== (config.tagline ?? '');

  const vp = cleanHex(primary);
  const va = cleanHex(accent);
  const colorsValid = vp != null && va != null;
  const colorsDirty =
    primary !== (config.primaryColor ?? BV_PRIMARY) || accent !== (config.accentColor ?? BV_ACCENT);

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

  const colorsMut = useMutation({
    mutationFn: async () => {
      if (!vp || !va) throw new Error('Colores inválidos');
      const payload: UpdateLabConfigDto = { primaryColor: vp, accentColor: va };
      return (await apiClient.patch<LabConfig>('/lab-config', payload)).data;
    },
    onSuccess: () => {
      toast.success('Colores guardados');
      router.refresh();
    },
    onError: (err) => toast.error(apiError(err, 'No se pudieron guardar los colores')),
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
    <div className="space-y-6">
      {/* Logo + eslogan */}
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

      {/* Colores de marca */}
      <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6 shadow-[var(--shadow-xs)]">
        <div className="max-w-xl">
          <h2 className="font-semibold text-[var(--color-fg)] text-base">Colores de marca</h2>
          <p className="mt-1 text-[var(--color-fg-muted)] text-sm">
            El <strong>principal</strong> tiñe botones, links, la barra lateral y los acentos. El{' '}
            <strong>acento</strong> se usa para detalles y resaltados. Los tonos derivados (hover,
            fondos suaves, contraste de texto) se calculan solos.
          </p>
        </div>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_auto]">
          {/* Controles */}
          <div className="space-y-5">
            <div className="flex flex-wrap items-end gap-5">
              <ColorField label="Principal" value={primary} onChange={setPrimary} />
              <ColorField label="Acento" value={accent} onChange={setAccent} />
              <ThemePicker
                primary={primary}
                accent={accent}
                onSelect={(p, a) => {
                  setPrimary(p);
                  setAccent(a);
                }}
              />
            </div>

            {!colorsValid && (
              <p className="text-[var(--color-danger)] text-xs">
                Ingresá colores válidos en formato #rrggbb.
              </p>
            )}

            <div className="flex items-center gap-3 border-[var(--color-border)] border-t pt-4">
              <Button
                type="button"
                onClick={() => colorsMut.mutate()}
                disabled={!colorsValid || !colorsDirty || colorsMut.isPending}
              >
                {colorsMut.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                )}
                Guardar colores
              </Button>
              {colorsDirty && !colorsMut.isPending && (
                <span className="text-[var(--color-fg-muted)] text-xs">Cambios sin guardar</span>
              )}
            </div>
          </div>

          {/* Preview en vivo */}
          <div
            className="w-full max-w-xs overflow-hidden rounded-lg border border-[var(--color-border)] lg:w-64"
            style={labThemeVars({ primaryColor: vp, accentColor: va })}
          >
            <p className="border-[var(--color-border)] border-b bg-[var(--color-bg-subtle)] px-3 py-1.5 font-medium text-[10px] text-[var(--color-fg-muted)] uppercase tracking-[0.12em]">
              Vista previa
            </p>
            <div className="flex">
              {/* mini rail */}
              <div className="w-20 shrink-0 bg-[var(--color-rail)] p-2.5">
                <div className="mb-2 h-5 w-5 rounded bg-white/90" />
                <div className="relative mb-1 rounded bg-white/10 py-1 pl-2 text-[9px] text-white">
                  <span className="-translate-y-1/2 absolute top-1/2 left-0 h-3 w-[2px] rounded-r bg-[var(--color-accent)]" />
                  Inicio
                </div>
                <div className="py-1 pl-2 text-[9px] text-white/55">Órdenes</div>
                <div className="py-1 pl-2 text-[9px] text-white/55">Pacientes</div>
              </div>
              {/* mini contenido */}
              <div className="flex-1 space-y-2 bg-[var(--color-bg-elevated)] p-3">
                <div className="h-2 w-2/3 rounded bg-[var(--color-bg-subtle)]" />
                <button
                  type="button"
                  tabIndex={-1}
                  className="rounded-md bg-[var(--color-primary)] px-2.5 py-1 font-medium text-[10px] text-[var(--color-primary-foreground)]"
                >
                  Nueva orden
                </button>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-accent)]" />
                  <span className="text-[10px] text-[var(--color-primary)]">link de marca</span>
                </div>
                <div className="rounded bg-[var(--color-primary-soft)] px-2 py-1 text-[9px] text-[var(--color-primary)]">
                  fondo suave
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
