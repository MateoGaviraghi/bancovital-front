'use client';

import type { PublicInformeMeta } from '@/lib/api/types';
import { cn } from '@/lib/cn';
import { CheckCircle2, Download, FileText, Loader2, TriangleAlert } from 'lucide-react';
import { useRef, useState } from 'react';

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Estado =
  | { tipo: 'idle' }
  | { tipo: 'cargando' }
  | { tipo: 'exito'; blobUrl: string; fallbackUrl: string }
  | { tipo: 'popup-bloqueado'; blobUrl: string }
  | { tipo: 'error-dni' }
  | { tipo: 'error-rate-limit' }
  | { tipo: 'error-generico' };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? '';
}

function normalizeDni(raw: string): string {
  // Elimina puntos y espacios; deja sólo dígitos
  return raw.replace(/[\s.]/g, '');
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function InformeFlujo({
  token,
}: {
  token: string;
  meta: PublicInformeMeta;
}) {
  const [dni, setDni] = useState('');
  const [estado, setEstado] = useState<Estado>({ tipo: 'idle' });
  const blobRef = useRef<string | null>(null);
  const fallbackAnchorRef = useRef<HTMLAnchorElement | null>(null);

  function revokePreviousBlob() {
    if (blobRef.current) {
      URL.revokeObjectURL(blobRef.current);
      blobRef.current = null;
    }
  }

  async function handleDescargar(e: React.FormEvent) {
    e.preventDefault();

    const dniNorm = normalizeDni(dni);
    if (!dniNorm) return;

    revokePreviousBlob();
    setEstado({ tipo: 'cargando' });

    try {
      const res = await fetch(`${getApiUrl()}/public/informe/${token}/descargar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dni: dniNorm }),
      });

      if (res.ok) {
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        blobRef.current = blobUrl;

        // Intentar abrir en nueva pestaña
        const ventana = window.open(blobUrl, '_blank');

        // Revocar el blob después de un momento (el navegador ya lo cachea)
        setTimeout(() => {
          URL.revokeObjectURL(blobUrl);
          blobRef.current = null;
        }, 60_000);

        if (!ventana) {
          // Popup bloqueado → guardar url para ofrecer descarga directa
          setEstado({ tipo: 'popup-bloqueado', blobUrl });
        } else {
          setEstado({ tipo: 'exito', blobUrl, fallbackUrl: blobUrl });
        }
        return;
      }

      if (res.status === 400) {
        setEstado({ tipo: 'error-dni' });
        return;
      }

      if (res.status === 429) {
        setEstado({ tipo: 'error-rate-limit' });
        return;
      }

      setEstado({ tipo: 'error-generico' });
    } catch {
      setEstado({ tipo: 'error-generico' });
    }
  }

  const cargando = estado.tipo === 'cargando';
  const mostrarFormulario =
    estado.tipo === 'idle' || estado.tipo === 'error-dni' || estado.tipo === 'error-generico';

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-xs)]">
      {/* ── Éxito normal ── */}
      {estado.tipo === 'exito' && (
        <div className="flex flex-col items-center gap-4 py-4 text-center" aria-live="polite">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-success-soft)]">
            <CheckCircle2 className="h-7 w-7 text-[var(--color-success)]" strokeWidth={2} />
          </div>
          <div>
            <p className="font-semibold text-[var(--color-fg)] text-base">
              Tu informe se abrió en una nueva pestaña
            </p>
            <p className="mt-1 text-[var(--color-fg-muted)] text-sm">
              Si no lo ves, revisá que no esté minimizado o bloqueado por el navegador.
            </p>
          </div>
          {/* Descarga directa como alternativa */}
          <a
            href={estado.blobUrl}
            download="informe.pdf"
            className="inline-flex items-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-4 py-2 text-[var(--color-fg-muted)] text-sm font-medium hover:bg-[var(--color-border)] transition-colors"
          >
            <Download className="h-4 w-4" strokeWidth={2} />
            Descargar PDF
          </a>
          <button
            type="button"
            onClick={() => {
              revokePreviousBlob();
              setDni('');
              setEstado({ tipo: 'idle' });
            }}
            className="text-[var(--color-primary)] text-xs hover:underline underline-offset-2"
          >
            Ingresar otro DNI
          </button>
        </div>
      )}

      {/* ── Popup bloqueado ── */}
      {estado.tipo === 'popup-bloqueado' && (
        <div
          className="flex flex-col items-center gap-4 py-4 text-center"
          role="alert"
          aria-live="assertive"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-warning-soft,#fef9ec)]">
            <FileText className="h-7 w-7 text-[var(--color-warning,#b45309)]" strokeWidth={1.5} />
          </div>
          <div>
            <p className="font-semibold text-[var(--color-fg)] text-base">
              Tu navegador bloqueó la apertura automática
            </p>
            <p className="mt-1 text-[var(--color-fg-muted)] text-sm">
              Descargá el informe directamente con el botón de abajo.
            </p>
          </div>
          <a
            href={estado.blobUrl}
            download="informe.pdf"
            className="inline-flex items-center gap-2 rounded-md bg-[var(--color-primary)] px-5 py-2.5 font-semibold text-[var(--color-primary-foreground)] text-sm shadow-[var(--shadow-xs)] transition-colors hover:bg-[var(--color-primary-hover)]"
            ref={fallbackAnchorRef}
          >
            <Download className="h-4 w-4" strokeWidth={2} />
            Descargar informe (PDF)
          </a>
          <button
            type="button"
            onClick={() => {
              revokePreviousBlob();
              setDni('');
              setEstado({ tipo: 'idle' });
            }}
            className="text-[var(--color-primary)] text-xs hover:underline underline-offset-2"
          >
            Ingresar otro DNI
          </button>
        </div>
      )}

      {/* ── Rate limit ── */}
      {estado.tipo === 'error-rate-limit' && (
        <div
          className="flex flex-col items-center gap-4 py-4 text-center"
          role="alert"
          aria-live="assertive"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-danger-soft,#fef2f2)]">
            <TriangleAlert className="h-7 w-7 text-[var(--color-danger)]" strokeWidth={1.5} />
          </div>
          <div>
            <p className="font-semibold text-[var(--color-fg)] text-base">Demasiados intentos</p>
            <p className="mt-1 text-[var(--color-fg-muted)] text-sm">
              Por seguridad, bloqueamos temporalmente el acceso. Esperá unos minutos e intentá de
              nuevo.
            </p>
          </div>
        </div>
      )}

      {/* ── Formulario (idle / error DNI / error genérico) ── */}
      {mostrarFormulario && (
        <form onSubmit={handleDescargar} noValidate>
          <div className="mb-1 flex items-center gap-2">
            <FileText
              className="h-5 w-5 shrink-0 text-[var(--color-primary)]"
              strokeWidth={1.5}
              aria-hidden="true"
            />
            <h2 className="font-semibold text-[var(--color-fg)] text-base">Ver tu informe</h2>
          </div>
          <p className="mb-5 text-[var(--color-fg-muted)] text-sm leading-relaxed">
            Ingresá tu número de DNI para acceder al informe.
          </p>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="dni"
                className="mb-1.5 block text-sm font-medium text-[var(--color-fg)]"
              >
                Número de DNI
              </label>
              <input
                id="dni"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={dni}
                onChange={(e) => {
                  setDni(e.target.value);
                  // Si había un error, lo limpiamos al tipear
                  if (estado.tipo === 'error-dni' || estado.tipo === 'error-generico') {
                    setEstado({ tipo: 'idle' });
                  }
                }}
                placeholder="Ej.: 30123456"
                disabled={cargando}
                aria-describedby={
                  estado.tipo === 'error-dni'
                    ? 'dni-error'
                    : estado.tipo === 'error-generico'
                      ? 'error-generico'
                      : undefined
                }
                aria-invalid={
                  estado.tipo === 'error-dni' || estado.tipo === 'error-generico'
                    ? 'true'
                    : undefined
                }
                className={cn(
                  'w-full rounded-md border px-3 py-2.5 text-sm text-[var(--color-fg)] placeholder:text-[var(--color-fg-subtle)] focus:outline-2 focus:outline-[var(--color-primary)] focus:outline-offset-0 disabled:opacity-50',
                  estado.tipo === 'error-dni'
                    ? 'border-[var(--color-danger)]'
                    : 'border-[var(--color-border)]',
                )}
              />

              {/* Error: DNI incorrecto */}
              {estado.tipo === 'error-dni' && (
                <p
                  id="dni-error"
                  className="mt-1.5 text-[var(--color-danger)] text-xs"
                  role="alert"
                >
                  DNI incorrecto. Revisá el número e intentá de nuevo.
                </p>
              )}
            </div>

            {/* Error genérico */}
            {estado.tipo === 'error-generico' && (
              <p
                id="error-generico"
                className="rounded-md bg-[var(--color-danger-soft,#fef2f2)] border border-[var(--color-danger)]/20 px-4 py-3 text-[var(--color-danger)] text-sm"
                role="alert"
              >
                Ocurrió un error. Por favor intentá de nuevo.
              </p>
            )}

            <button
              type="submit"
              disabled={cargando || !dni.trim()}
              className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-[var(--color-primary)] px-5 py-2.5 font-semibold text-[var(--color-primary-foreground)] text-sm shadow-[var(--shadow-xs)] transition-colors hover:bg-[var(--color-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-40"
              aria-busy={cargando}
            >
              {cargando && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />}
              {cargando ? 'Verificando...' : 'Ver informe'}
            </button>

            <p className="text-center text-[var(--color-fg-subtle)] text-xs">
              El número de DNI es necesario para proteger tu privacidad.
            </p>
          </div>
        </form>
      )}
    </div>
  );
}
