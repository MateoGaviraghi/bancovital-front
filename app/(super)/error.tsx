'use client';

import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';

export default function SuperError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex max-w-md flex-col items-center gap-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-8 py-10 text-center shadow-[var(--shadow-xs)]">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-danger-soft)] text-[var(--color-danger)]">
          <AlertTriangle className="h-5 w-5" strokeWidth={2} />
        </div>
        <div>
          <h1 className="font-semibold text-[var(--color-fg)] text-lg">Algo salió mal</h1>
          <p className="mt-1 text-[var(--color-fg-muted)] text-sm">
            No se pudo completar la operación. Reintentá en un momento.
          </p>
          {error.digest && (
            <p className="mt-2 font-mono text-[10px] text-[var(--color-fg-subtle)]">
              ref: {error.digest}
            </p>
          )}
        </div>
        <Button onClick={reset}>Reintentar</Button>
      </div>
    </div>
  );
}
