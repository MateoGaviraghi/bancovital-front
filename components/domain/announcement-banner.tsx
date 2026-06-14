'use client';

import { apiClient } from '@/lib/api/client';
import { queries } from '@/lib/api/queries';
import type { AnuncioPublic, AnuncioTipo } from '@/lib/api/types';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Info, Wrench } from 'lucide-react';

const TONE: Record<
  AnuncioTipo,
  { wrapper: string; Icon: typeof Info; role: 'alert' | undefined; live: 'polite' | undefined }
> = {
  info: {
    wrapper: 'border-[var(--color-info)]/20 bg-[var(--color-info-soft)] text-[var(--color-info)]',
    Icon: Info,
    role: undefined,
    live: 'polite',
  },
  advertencia: {
    wrapper:
      'border-[var(--color-warning)]/20 bg-[var(--color-warning-soft)] text-[var(--color-warning)]',
    Icon: AlertTriangle,
    role: 'alert',
    live: undefined,
  },
  mantenimiento: {
    wrapper:
      'border-[var(--color-warning)]/40 bg-[var(--color-warning-soft)] font-medium text-[var(--color-warning)]',
    Icon: Wrench,
    role: 'alert',
    live: undefined,
  },
};

export function AnnouncementBanner() {
  const { data: anuncios } = useQuery<AnuncioPublic[]>({
    queryKey: queries.announcements(),
    queryFn: () => apiClient.get<AnuncioPublic[]>('/announcements').then((r) => r.data),
    staleTime: 60_000,
    retry: false,
  });

  if (!anuncios || anuncios.length === 0) return null;

  return (
    <>
      {anuncios.map((a) => {
        const tone = TONE[a.tipo] ?? TONE.info;
        const { Icon } = tone;
        return (
          <div
            key={a.id}
            role={tone.role}
            aria-live={tone.live}
            className={`flex items-start gap-3 border-b px-6 py-3 text-sm ${tone.wrapper}`}
          >
            <Icon className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
            <p>{a.mensaje}</p>
          </div>
        );
      })}
    </>
  );
}
