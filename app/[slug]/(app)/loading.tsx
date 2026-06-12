import { Loader2 } from 'lucide-react';

export default function AppLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex items-center gap-2 text-[var(--color-fg-muted)] text-sm">
        <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
        Cargando…
      </div>
    </div>
  );
}
