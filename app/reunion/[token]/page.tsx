import type { BookingPublicDetail } from '@/lib/api/types';
import type { Metadata } from 'next';
import { ReunionFlujo } from './reunion-flujo';

export const dynamic = 'force-dynamic';

async function fetchReunion(token: string): Promise<BookingPublicDetail | null | 'not-found'> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return null;
  try {
    const res = await fetch(`${apiUrl}/public/bookings/by-token/${token}`, { cache: 'no-store' });
    if (res.status === 404) return 'not-found';
    if (!res.ok) return null;
    return (await res.json()) as BookingPublicDetail;
  } catch {
    return null;
  }
}

export const metadata: Metadata = {
  title: 'Tu reunión con Banco Vital',
  description: 'Confirmá tu asistencia o cancelá tu reunión con Banco Vital.',
  robots: { index: false, follow: false },
};

// ─── Date formatting (es-AR, America/Argentina/Buenos_Aires) ────────────────

const TZ = 'America/Argentina/Buenos_Aires';

const fechaFmt = new Intl.DateTimeFormat('es-AR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: TZ,
});

const horaFmt = new Intl.DateTimeFormat('es-AR', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: TZ,
});

function fmtFechaHora(inicioIso: string, finIso: string): string {
  const inicio = new Date(inicioIso);
  const fin = new Date(finIso);
  const fecha = fechaFmt.format(inicio);
  // Capitalize first letter (es-AR weekday comes lowercase).
  const fechaCap = fecha.charAt(0).toUpperCase() + fecha.slice(1);
  return `${fechaCap}, de ${horaFmt.format(inicio)} a ${horaFmt.format(fin)} hs`;
}

// ─── Static state shell ─────────────────────────────────────────────────────

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <header className="border-[var(--color-border)] border-b bg-[var(--color-bg-elevated)]">
        <div className="mx-auto flex h-16 max-w-xl items-center justify-between px-5">
          <span className="font-semibold text-[var(--color-fg)] text-xl tracking-tight">
            Banco Vital
          </span>
          <span className="text-[var(--color-fg-muted)] text-xs">Tu reunión</span>
        </div>
      </header>
      <main className="mx-auto max-w-xl px-5 py-10 sm:py-14">{children}</main>
    </div>
  );
}

function EstadoCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-5 rounded-lg border border-[var(--color-border)] bg-white px-7 py-11 text-center shadow-[var(--shadow-sm)]">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-bg-subtle)] text-[var(--color-fg-muted)]">
        {icon}
      </div>
      <div>
        <h1 className="font-semibold text-[var(--color-fg)] text-xl">{title}</h1>
        <div className="mt-2 text-[var(--color-fg-muted)] text-sm leading-relaxed">{body}</div>
      </div>
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

const IconBroken = (
  <svg
    className="h-6 w-6"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636"
    />
  </svg>
);

const IconWarning = (
  <svg
    className="h-6 w-6"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
    />
  </svg>
);

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function ReunionPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ accion?: string }>;
}) {
  const { token } = await params;
  const { accion } = await searchParams;
  const result = await fetchReunion(token);

  if (result === 'not-found') {
    return (
      <PageShell>
        <EstadoCard
          icon={IconBroken}
          title="Enlace no válido"
          body="Este enlace de reunión no existe o ya no está disponible. Contactá a Banco Vital para coordinar una nueva fecha."
        />
      </PageShell>
    );
  }

  // API error — degrade gracefully.
  if (result === null) {
    return (
      <PageShell>
        <EstadoCard
          icon={IconWarning}
          title="Servicio temporalmente no disponible"
          body="No pudimos cargar los datos de tu reunión. Por favor intentá de nuevo en unos minutos."
        />
      </PageShell>
    );
  }

  const accionInicial =
    accion === 'confirmar' ? 'confirmar' : accion === 'cancelar' ? 'cancelar' : null;

  return (
    <PageShell>
      <ReunionFlujo
        token={token}
        reunion={result}
        fechaHora={fmtFechaHora(result.slotInicio, result.slotFin)}
        accionInicial={accionInicial}
      />
    </PageShell>
  );
}
