import type { ContratoPublicDetail } from '@/lib/api/types';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ContratoFlujo } from './contrato-flujo';

export const dynamic = 'force-dynamic';

async function fetchContrato(token: string): Promise<ContratoPublicDetail | null | 'not-found'> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return null;
  try {
    const res = await fetch(`${apiUrl}/public/contracts/${token}`, { cache: 'no-store' });
    if (res.status === 404) return 'not-found';
    if (!res.ok) return null;
    return (await res.json()) as ContratoPublicDetail;
  } catch {
    return null;
  }
}

export const metadata: Metadata = {
  title: 'Contrato de prestación de servicios — Nodo',
  description: 'Firma tu contrato de servicios con Nodo.',
  robots: { index: false, follow: false },
};

function fmtFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function diasRestantes(iso: string): number {
  const diff = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

// ─── Nodo brand theme (scoped to /contratar) ───────────────────────────────
// Values are literals — no user input interpolated here.
const NODO_THEME = `
:root {
  --color-primary: #8b2fef;
  --color-primary-hover: color-mix(in oklab, #8b2fef 85%, black);
  --color-primary-soft: color-mix(in oklab, #8b2fef 10%, white);
  --color-primary-foreground: #ffffff;
}
`.trim();

// ─── Static state pages ────────────────────────────────────────────────────

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: CSS literals only — no user data interpolated */}
      <style dangerouslySetInnerHTML={{ __html: NODO_THEME }} />
      <div className="min-h-screen bg-[#f8f7ff]">
        <header className="border-b border-[var(--color-border)] bg-white">
          <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-6">
            <span className="font-bold text-[var(--color-primary)] text-xl tracking-tight">
              NODO
            </span>
            <span className="text-[var(--color-fg-muted)] text-xs">
              Contrato de prestación de servicios
            </span>
          </div>
        </header>
        <main className="mx-auto max-w-3xl px-6 py-12">{children}</main>
      </div>
    </>
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
    <div className="flex flex-col items-center gap-5 rounded-lg border border-[var(--color-border)] bg-white px-8 py-12 text-center shadow-[var(--shadow-sm)]">
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
          href="mailto:hola@nodo.ar"
          className="text-[var(--color-primary)] underline underline-offset-2"
        >
          hola@nodo.ar
        </a>
      </p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default async function ContratoPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const result = await fetchContrato(token);

  if (result === 'not-found') {
    return (
      <PageShell>
        <EstadoCard
          icon={
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
          }
          title="Enlace no válido"
          body="Este enlace de contrato no existe o fue anulado. Contactá a Nodo para recibir uno nuevo."
        />
      </PageShell>
    );
  }

  // API error — degrade
  if (result === null) {
    return (
      <PageShell>
        <EstadoCard
          icon={
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
          }
          title="Servicio temporalmente no disponible"
          body="No pudimos cargar los datos del contrato. Por favor intentá de nuevo en unos minutos."
        />
      </PageShell>
    );
  }

  if (result.estado === 'anulado') {
    return (
      <PageShell>
        <EstadoCard
          icon={
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
          }
          title="Enlace no válido"
          body="Este enlace de contrato fue anulado. Contactá a Nodo para recibir un presupuesto actualizado."
        />
      </PageShell>
    );
  }

  if (result.estado === 'vencido') {
    return (
      <PageShell>
        <EstadoCard
          icon={
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
                d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"
              />
            </svg>
          }
          title="Presupuesto vencido"
          body={
            <>
              Este presupuesto venció el {fmtFecha(result.expiraAt)}. Pedile a Nodo que te envíe uno
              nuevo.
            </>
          }
        />
      </PageShell>
    );
  }

  if (result.estado === 'firmado') {
    return (
      <PageShell>
        <EstadoCard
          icon={
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
                d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"
              />
            </svg>
          }
          title="Contrato ya firmado"
          body="Este contrato fue firmado correctamente. No es necesario realizar ninguna acción adicional."
        />
      </PageShell>
    );
  }

  // estado === 'enviado' → render the signing flow
  return (
    <PageShell>
      <ContratoFlujo
        token={token}
        contrato={result}
        diasRestantes={diasRestantes(result.expiraAt)}
        fechaExpira={fmtFecha(result.expiraAt)}
      />
    </PageShell>
  );
}
