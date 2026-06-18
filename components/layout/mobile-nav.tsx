'use client';

import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

// Disparador + panel deslizante de navegación para mobile (<md). El contenido
// (`children`) es el mismo cuerpo de nav del sidebar (rail navy). Se cierra solo
// al cambiar de ruta.
export function MobileNav({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // biome-ignore lint/correctness/useExhaustiveDependencies: cerrar el panel al navegar.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Abrir menú"
          className="flex h-9 w-9 items-center justify-center rounded-md text-[var(--color-fg-muted)] outline-none transition-colors hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-fg)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] md:hidden"
        >
          <Menu className="h-5 w-5" strokeWidth={2} />
        </button>
      </SheetTrigger>
      <SheetContent className="bg-rail">{children}</SheetContent>
    </Sheet>
  );
}
