import { FileQuestion } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4">
      <div className="flex max-w-md flex-col items-center gap-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-8 py-10 text-center shadow-[var(--shadow-xs)]">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-bg-subtle)] text-[var(--color-fg-subtle)]">
          <FileQuestion className="h-5 w-5" strokeWidth={2} />
        </div>
        <div>
          <h1 className="font-semibold text-[var(--color-fg)] text-xl">Página no encontrada</h1>
          <p className="mt-1 text-[var(--color-fg-muted)] text-sm">
            El recurso que buscás no existe o fue movido.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex h-9 items-center rounded-md bg-[var(--color-primary)] px-4 font-medium text-[var(--color-primary-foreground)] text-sm transition-colors hover:bg-[var(--color-primary-hover)]"
        >
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
