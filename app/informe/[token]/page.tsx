import type { PublicInformeMeta } from '@/lib/api/types';
import { themePreviewVars } from '@/lib/tenant/theme';
import type { Metadata } from 'next';
import { InformeFlujo } from './informe-flujo';

export const dynamic = 'force-dynamic';

async function fetchInformeMeta(token: string): Promise<PublicInformeMeta | null | 'not-found'> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return null;
  try {
    const res = await fetch(`${apiUrl}/public/informe/${token}`, { cache: 'no-store' });
    if (res.status === 404) return 'not-found';
    if (!res.ok) return null;
    return (await res.json()) as PublicInformeMeta;
  } catch {
    return null;
  }
}

export const metadata: Metadata = {
  title: 'Resultado de laboratorio',
  description: 'Ingresá tu DNI para ver tu informe de laboratorio.',
  robots: { index: false, follow: false },
};

// ─── Formatting ─────────────────────────────────────────────────────────────

function fmtFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

// ─── Static state shell ──────────────────────────────────────────────────────

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--color-bg-subtle)]">
      <main className="mx-auto max-w-md px-5 py-10 sm:py-16">{children}</main>
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
    <div className="flex flex-col items-center gap-5 rounded-xl border border-[var(--color-border)] bg-white px-7 py-11 text-center shadow-[var(--shadow-sm)]">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-bg-subtle)] text-[var(--color-fg-muted)]">
        {icon}
      </div>
      <div>
        <h1 className="font-semibold text-[var(--color-fg)] text-xl">{title}</h1>
        <div className="mt-2 text-[var(--color-fg-muted)] text-sm leading-relaxed">{body}</div>
      </div>
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function InformePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const result = await fetchInformeMeta(token);

  if (result === 'not-found') {
    return (
      <PageShell>
        <EstadoCard
          icon={IconBroken}
          title="Informe no encontrado"
          body="Este enlace no es válido o el informe ya no está disponible. Si creés que es un error, contactá al laboratorio."
        />
      </PageShell>
    );
  }

  if (result === null) {
    return (
      <PageShell>
        <EstadoCard
          icon={IconWarning}
          title="Servicio temporalmente no disponible"
          body="No pudimos cargar los datos del informe. Por favor intentá de nuevo en unos minutos."
        />
      </PageShell>
    );
  }

  // ── OK: tematizar con el color del lab y renderizar el flujo ──────────────
  const themeVars = themePreviewVars(result.primaryColor);

  return (
    <div
      style={themeVars as React.CSSProperties}
      className="min-h-screen bg-[var(--color-bg-subtle)]"
    >
      <main className="mx-auto max-w-md px-5 py-10 sm:py-16">
        {/* ── Header del lab ── */}
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          {result.logoUrl && (
            <img
              src={result.logoUrl}
              alt={result.shortName ?? result.labName}
              className="h-14 w-auto object-contain"
            />
          )}
          <div>
            <p className="font-bold text-[var(--color-fg)] text-lg leading-tight">
              {result.labName}
            </p>
            {result.tagline && (
              <p className="mt-0.5 text-[var(--color-fg-muted)] text-sm">{result.tagline}</p>
            )}
          </div>
          <div className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-white px-5 py-3 text-center">
            <p className="text-[var(--color-fg-subtle)] text-xs font-medium uppercase tracking-wide">
              Informe N°
            </p>
            <p className="mt-0.5 font-semibold text-[var(--color-fg)] text-base">
              {result.protocolNumber}
            </p>
            {result.emitidaAt && (
              <p className="mt-0.5 text-[var(--color-fg-muted)] text-xs">
                Emitido el {fmtFecha(result.emitidaAt)}
              </p>
            )}
          </div>
        </div>

        {/* ── Flujo de descarga (client) ── */}
        <InformeFlujo token={token} meta={result} />
      </main>
    </div>
  );
}
