'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { SessionUser } from '@/lib/auth/session';
import { getSupabase } from '@/lib/supabase-browser';
import { LogOut, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

const ROLE_LABEL: Record<SessionUser['role'], string> = {
  admin: 'Administrador',
  recepcion: 'Recepción',
  bioquimico: 'Bioquímico',
  super: 'Super Admin',
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters =
    parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}` : (parts[0]?.slice(0, 2) ?? '?');
  return letters.toUpperCase();
}

export function Topbar({ user }: { user: SessionUser }) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const initials = getInitials(user.displayName ?? user.email);

  async function signOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      const { error } = await getSupabase().auth.signOut();
      if (error) {
        toast.error(error.message);
        return;
      }
      router.replace('/login');
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <header className="flex h-14 items-center justify-end gap-3 border-b border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-6">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-2 rounded-md px-2 py-1 text-sm outline-none transition-colors hover:bg-[var(--color-bg-subtle)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-xs font-semibold text-[var(--color-primary)]">
              {initials}
            </span>
            <span className="hidden text-left sm:block">
              <span className="block text-sm font-medium text-[var(--color-fg)]">
                {user.displayName ?? user.email}
              </span>
              <span className="block text-[10px] uppercase tracking-wide text-[var(--color-fg-subtle)]">
                {ROLE_LABEL[user.role]}
              </span>
            </span>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" sideOffset={8} className="min-w-[14rem]">
          <DropdownMenuLabel className="flex flex-col gap-0.5">
            <span className="text-xs font-semibold normal-case text-[var(--color-fg)]">
              {user.displayName ?? 'Sin nombre'}
            </span>
            <span className="text-[10px] normal-case text-[var(--color-fg-muted)]">
              {user.email}
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled>
            <User className="h-4 w-4" strokeWidth={2} />
            {ROLE_LABEL[user.role]}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              void signOut();
            }}
            disabled={signingOut}
          >
            <LogOut className="h-4 w-4" strokeWidth={2} />
            {signingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
