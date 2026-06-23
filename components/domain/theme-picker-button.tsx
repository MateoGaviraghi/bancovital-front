'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { apiClient } from '@/lib/api/client';
import { queries } from '@/lib/api/queries';
import type { LabConfig, UpdateLabConfigDto } from '@/lib/api/types';
import { cleanHex } from '@/lib/lab/theme';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Check, Loader2, Palette } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

const COLORS: { name: string; hex: string }[] = [
  // Oscuros clásicos
  { name: 'Navy', hex: '#1f2b5b' },
  { name: 'Borgoña', hex: '#7a1f2b' },
  { name: 'Esmeralda', hex: '#0f5132' },
  { name: 'Océano', hex: '#0e4a6e' },
  { name: 'Violeta', hex: '#4c2a86' },
  { name: 'Grafito', hex: '#1f2933' },
  { name: 'Índigo', hex: '#3f2b96' },
  { name: 'Carbón', hex: '#2c3e50' },
  // Medios
  { name: 'Bosque', hex: '#1a4731' },
  { name: 'Atlántico', hex: '#1e3a5f' },
  { name: 'Terracota', hex: '#8b3a2a' },
  { name: 'Caramelo', hex: '#6b3410' },
  { name: 'Bronce', hex: '#5d4037' },
  { name: 'Amatista', hex: '#5b2c6f' },
  { name: 'Jade', hex: '#115e59' },
  { name: 'Ladrillo', hex: '#922b21' },
  // Claros
  { name: 'Cielo', hex: '#4a90d9' },
  { name: 'Lavanda', hex: '#7c6bc4' },
  { name: 'Menta', hex: '#3da88e' },
  { name: 'Coral', hex: '#d06b5d' },
  { name: 'Lila', hex: '#9b72cf' },
  { name: 'Aqua', hex: '#4db6ac' },
  { name: 'Rosa', hex: '#c47a9b' },
  { name: 'Celeste', hex: '#5ba4d9' },
  // Dorados / cálidos claros
  { name: 'Dorado', hex: '#b8860b' },
  { name: 'Miel', hex: '#d4a017' },
  { name: 'Ámbar', hex: '#c4972a' },
  { name: 'Mostaza', hex: '#c49b2a' },
  { name: 'Durazno', hex: '#c87f5a' },
  { name: 'Naranja', hex: '#d4763a' },
  { name: 'Teja', hex: '#c4633a' },
  { name: 'Canela', hex: '#a0522d' },
];

function deriveAccent(hex: string): string {
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  const cr = 255 - r;
  const cg = 255 - g;
  const cb = 255 - b;
  const mr = Math.round(cr * 0.6 + r * 0.4);
  const mg = Math.round(cg * 0.6 + g * 0.4);
  const mb = Math.round(cb * 0.6 + b * 0.4);
  return `#${mr.toString(16).padStart(2, '0')}${mg.toString(16).padStart(2, '0')}${mb.toString(16).padStart(2, '0')}`;
}

function apiError(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const msg = err.response?.data?.message;
    if (Array.isArray(msg)) return msg.join('. ');
    if (typeof msg === 'string') return msg;
  }
  return fallback;
}

export function ThemePickerButton({
  currentPrimary,
}: {
  currentPrimary?: string | null;
  currentAccent?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const qc = useQueryClient();

  const saveMut = useMutation({
    mutationFn: async (hex: string) => {
      const payload: UpdateLabConfigDto = {
        primaryColor: hex,
        accentColor: deriveAccent(hex),
      };
      return (await apiClient.patch<LabConfig>('/lab-config', payload)).data;
    },
    onSuccess: () => {
      toast.success('Tema aplicado');
      qc.invalidateQueries({ queryKey: queries.labConfig });
      qc.invalidateQueries({ queryKey: queries.me });
      setOpen(false);
      router.refresh();
    },
    onError: (err) => toast.error(apiError(err, 'No se pudo cambiar el tema')),
  });

  const active = cleanHex(currentPrimary);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Cambiar tema de colores"
        className="flex h-7 w-7 items-center justify-center rounded-md text-white/50 transition-colors hover:bg-white/10 hover:text-white"
      >
        <Palette className="h-4 w-4" strokeWidth={2} />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tema de colores</DialogTitle>
            <DialogDescription>Elegí el color principal de tu laboratorio.</DialogDescription>
          </DialogHeader>
          {saveMut.isPending && (
            <div className="flex items-center justify-center py-2">
              <Loader2
                className="h-5 w-5 animate-spin text-[var(--color-primary)]"
                strokeWidth={2}
              />
            </div>
          )}
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
            {COLORS.map((c) => {
              const isActive = active === c.hex;
              return (
                <button
                  key={c.hex}
                  type="button"
                  title={c.name}
                  disabled={saveMut.isPending}
                  onClick={() => saveMut.mutate(c.hex)}
                  className="group flex flex-col items-center gap-1.5 rounded-lg border border-transparent p-2 transition-colors hover:border-[var(--color-border-strong)] hover:bg-[var(--color-bg-subtle)] disabled:opacity-50"
                >
                  <span
                    className={`relative flex h-10 w-10 items-center justify-center rounded-full shadow-sm ring-offset-2 ring-offset-[var(--color-bg-elevated)] transition-shadow group-hover:shadow-md ${isActive ? 'ring-2' : 'ring-0'}`}
                    style={
                      {
                        background: c.hex,
                        '--tw-ring-color': c.hex,
                      } as React.CSSProperties
                    }
                  >
                    {isActive && <Check className="h-4 w-4 text-white" strokeWidth={3} />}
                  </span>
                  <span className="text-[10px] leading-tight text-[var(--color-fg-muted)]">
                    {c.name}
                  </span>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
