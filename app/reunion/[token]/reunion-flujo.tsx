'use client';

import { Button } from '@/components/ui/button';
import type { BookingActionResponse, BookingPublicDetail } from '@/lib/api/types';
import { cn } from '@/lib/cn';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  VideoIcon,
  XCircle,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

type AccionInicial = 'confirmar' | 'cancelar' | null;

type Props = {
  token: string;
  reunion: BookingPublicDetail;
  fechaHora: string;
  accionInicial: AccionInicial;
};

type View = 'acciones' | 'confirmar-cancelacion' | 'ok-confirmada' | 'ok-cancelada';

export function ReunionFlujo({ token, reunion, fechaHora, accionInicial }: Props) {
  // Local copy so we can reflect the result of an action without a reload.
  const [estado, setEstado] = useState(reunion.estado);
  const [asistenciaConfirmada, setAsistenciaConfirmada] = useState(reunion.asistenciaConfirmada);
  const [view, setView] = useState<View>('acciones');

  const confirmBtnRef = useRef<HTMLButtonElement | null>(null);
  const cancelBtnRef = useRef<HTMLButtonElement | null>(null);

  const baseUrl = `${process.env.NEXT_PUBLIC_API_URL}/public/bookings/by-token/${token}`;

  const confirmMutation = useMutation({
    mutationFn: async () => {
      const { data } = await axios.post<BookingActionResponse>(`${baseUrl}/confirm`);
      return data;
    },
    onSuccess: (data) => {
      setEstado(data.estado);
      setAsistenciaConfirmada(data.asistenciaConfirmada ?? true);
      setView('ok-confirmada');
    },
    onError: (err: unknown) => {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        toast.error('Esta reunión fue cancelada y ya no se puede confirmar.');
        setEstado('cancelada');
      } else {
        toast.error('No se pudo confirmar. Intentá de nuevo en unos momentos.');
      }
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const { data } = await axios.post<BookingActionResponse>(`${baseUrl}/cancel`);
      return data;
    },
    onSuccess: () => {
      setEstado('cancelada');
      setView('ok-cancelada');
    },
    onError: () => {
      toast.error('No se pudo cancelar. Intentá de nuevo en unos momentos.');
    },
  });

  // Highlight + focus the button matching the email's intended action.
  // The action itself ALWAYS requires a click — never auto-fired from the query.
  useEffect(() => {
    if (estado === 'cancelada' || view !== 'acciones') return;
    if (accionInicial === 'confirmar' && !asistenciaConfirmada) {
      confirmBtnRef.current?.focus();
    } else if (accionInicial === 'cancelar') {
      cancelBtnRef.current?.focus();
    }
  }, [accionInicial, estado, asistenciaConfirmada, view]);

  // ── Success: confirmed ──────────────────────────────────────────────────
  if (view === 'ok-confirmada') {
    return (
      <ResultCard
        tone="success"
        icon={<CheckCircle2 className="h-7 w-7" />}
        title="¡Listo! Te esperamos"
        body={
          <>
            Confirmaste tu asistencia a la reunión del{' '}
            <span className="font-medium text-[var(--color-fg)]">{fechaHora}</span>.
          </>
        }
        meetLink={reunion.meetLink}
      />
    );
  }

  // ── Success: cancelled ──────────────────────────────────────────────────
  if (view === 'ok-cancelada') {
    return (
      <ResultCard
        tone="neutral"
        icon={<XCircle className="h-7 w-7" />}
        title="Reunión cancelada"
        body="Gracias por avisarnos. Si querés reagendar, escribinos y coordinamos una nueva fecha."
      />
    );
  }

  // ── Already cancelled (loaded state) ────────────────────────────────────
  if (estado === 'cancelada') {
    return (
      <ResultCard
        tone="neutral"
        icon={<XCircle className="h-7 w-7" />}
        title="Esta reunión fue cancelada"
        body={
          <>
            La reunión del <span className="font-medium text-[var(--color-fg)]">{fechaHora}</span>{' '}
            ya no está activa. Si fue un error, escribinos para reagendar.
          </>
        }
      />
    );
  }

  // ── Confirm-cancellation step ───────────────────────────────────────────
  if (view === 'confirmar-cancelacion') {
    return (
      <Card>
        <ReunionResumen fechaHora={fechaHora} meetLink={null} />
        <div className="mt-6 text-center">
          <h2 className="font-semibold text-[var(--color-fg)] text-lg">
            ¿Seguro que no podés asistir?
          </h2>
          <p className="mt-2 text-[var(--color-fg-muted)] text-sm">
            Vamos a cancelar tu reunión. Podés reagendar más adelante escribiéndonos.
          </p>
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row-reverse">
          <Button
            variant="destructive"
            className="min-h-11 flex-1"
            disabled={cancelMutation.isPending}
            onClick={() => cancelMutation.mutate()}
          >
            {cancelMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Cancelando…
              </>
            ) : (
              'Sí, cancelar reunión'
            )}
          </Button>
          <Button
            variant="outline"
            className="min-h-11 flex-1"
            disabled={cancelMutation.isPending}
            onClick={() => setView('acciones')}
          >
            Volver
          </Button>
        </div>
      </Card>
    );
  }

  // ── Normal / already-confirmed actions ──────────────────────────────────
  const yaConfirmada = asistenciaConfirmada;

  return (
    <Card>
      <ReunionResumen fechaHora={fechaHora} meetLink={reunion.meetLink} />

      {yaConfirmada ? (
        <>
          <div className="mt-6 flex items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-success-soft)] px-4 py-3 text-center">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-[var(--color-success)]" />
            <p className="font-medium text-[var(--color-success)] text-sm">
              Ya confirmaste tu asistencia
            </p>
          </div>
          <div className="mt-5">
            <Button
              ref={cancelBtnRef}
              variant="outline"
              className={cn(
                'min-h-11 w-full',
                accionInicial === 'cancelar' && 'ring-2 ring-[var(--color-danger)] ring-offset-2',
              )}
              onClick={() => setView('confirmar-cancelacion')}
            >
              <XCircle className="h-4 w-4" />
              No podré asistir (cancelar)
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="mt-6 text-center text-[var(--color-fg-muted)] text-sm">
            Confirmanos si vas a poder asistir.
          </p>
          <div className="mt-5 flex flex-col gap-3">
            <Button
              ref={confirmBtnRef}
              className={cn(
                'min-h-11 w-full',
                accionInicial === 'confirmar' && 'ring-2 ring-[var(--color-primary)] ring-offset-2',
              )}
              disabled={confirmMutation.isPending}
              onClick={() => confirmMutation.mutate()}
            >
              {confirmMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Confirmando…
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Confirmar asistencia
                </>
              )}
            </Button>
            <Button
              ref={cancelBtnRef}
              variant="outline"
              className={cn(
                'min-h-11 w-full',
                accionInicial === 'cancelar' && 'ring-2 ring-[var(--color-danger)] ring-offset-2',
              )}
              disabled={confirmMutation.isPending}
              onClick={() => setView('confirmar-cancelacion')}
            >
              <XCircle className="h-4 w-4" />
              No podré asistir
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}

// ─── Building blocks ──────────────────────────────────────────────────────────

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-white px-6 py-8 shadow-[var(--shadow-sm)] sm:px-8">
      {children}
    </div>
  );
}

function ReunionResumen({
  fechaHora,
  meetLink,
}: {
  fechaHora: string;
  meetLink: string | null;
}) {
  return (
    <div className="flex flex-col gap-3">
      <h1 className="font-semibold text-[var(--color-fg)] text-lg">Tu reunión con Nodo</h1>
      <div className="flex items-start gap-2.5 rounded-[var(--radius-md)] border border-[var(--color-primary-soft)] bg-[var(--color-primary-soft)] px-4 py-3">
        <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-primary)]" />
        <p className="font-medium text-[var(--color-primary-hover)] text-sm leading-snug">
          {fechaHora}
        </p>
      </div>
      {meetLink ? (
        <a
          href={meetLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 self-start text-[var(--color-primary)] text-sm hover:underline"
        >
          <VideoIcon className="h-4 w-4" />
          Enlace de Google Meet
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      ) : (
        <p className="inline-flex items-center gap-2 text-[var(--color-fg-subtle)] text-sm">
          <Clock className="h-4 w-4" />
          Te enviaremos el enlace por correo antes de la reunión.
        </p>
      )}
    </div>
  );
}

function ResultCard({
  tone,
  icon,
  title,
  body,
  meetLink,
}: {
  tone: 'success' | 'neutral';
  icon: React.ReactNode;
  title: string;
  body: React.ReactNode;
  meetLink?: string | null;
}) {
  const iconWrap =
    tone === 'success'
      ? 'bg-[var(--color-success-soft)] text-[var(--color-success)]'
      : 'bg-[var(--color-bg-subtle)] text-[var(--color-fg-muted)]';

  return (
    <div
      className="flex flex-col items-center gap-5 rounded-lg border border-[var(--color-border)] bg-white px-7 py-11 text-center shadow-[var(--shadow-sm)]"
      style={{ animation: 'reunionFadeIn 220ms var(--ease-out-app, ease-out) both' }}
    >
      <style>{`
        @keyframes reunionFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="reunionFadeIn"] { animation: none !important; }
        }
      `}</style>

      <div className={cn('flex h-14 w-14 items-center justify-center rounded-full', iconWrap)}>
        {icon}
      </div>

      <div>
        <h1 className="font-semibold text-[var(--color-fg)] text-xl">{title}</h1>
        <div className="mt-2 text-[var(--color-fg-muted)] text-sm leading-relaxed">{body}</div>
      </div>

      {meetLink && (
        <a
          href={meetLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-5 py-2.5 font-medium text-[var(--color-primary-foreground)] text-sm transition-colors hover:bg-[var(--color-primary-hover)]"
        >
          <VideoIcon className="h-4 w-4" />
          Unirse a la reunión
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}

      <p className="text-[var(--color-fg-subtle)] text-xs">
        ¿Preguntas? Escribinos a{' '}
        <a
          href="mailto:nodotech.dev@gmail.com"
          className="text-[var(--color-primary)] underline underline-offset-2"
        >
          nodotech.dev@gmail.com
        </a>
      </p>
    </div>
  );
}
