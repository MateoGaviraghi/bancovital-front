'use client';

import { cn } from '@/lib/cn';
import {
  Building2,
  Calendar,
  FileSignature,
  Layers,
  LayoutDashboard,
  type LucideIcon,
  Megaphone,
  ScrollText,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// El panel super es de Nodo (god-mode), NO un lab → rail navy FIJO (nunca teñido)
// + identidad con acento rojo para distinguirlo a simple vista de la app de un lab.

const NAV: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/super/metrics', label: 'Métricas', icon: LayoutDashboard },
  { href: '/super/labs', label: 'Laboratorios', icon: Building2 },
  { href: '/super/plans', label: 'Planes', icon: Layers },
  { href: '/super/contracts', label: 'Contratos', icon: FileSignature },
  { href: '/super/reuniones', label: 'Reuniones', icon: Calendar },
  { href: '/super/announcements', label: 'Anuncios', icon: Megaphone },
  { href: '/super/audit', label: 'Auditoría', icon: ScrollText },
];

function isActive(href: string, pathname: string): boolean {
  if (href === '/super/metrics') {
    return (
      pathname === '/super' ||
      pathname === '/super/metrics' ||
      pathname.startsWith('/super/metrics/')
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SuperSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col bg-rail md:flex">
      <div className="flex h-14 items-center gap-2.5 border-white/10 border-b px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[var(--color-accent)] text-white">
          <ShieldCheck className="h-[18px] w-[18px]" strokeWidth={2} />
        </div>
        <div className="min-w-0 leading-tight">
          <p className="truncate font-semibold text-sm text-white">Super Admin</p>
          <p className="truncate text-[10px] text-white/40 uppercase tracking-[0.14em]">
            Banco Vital · Nodo
          </p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-4">
        <p className="px-2.5 pb-1.5 font-medium text-[10px] text-white/35 uppercase tracking-[0.16em]">
          Administración
        </p>
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href, pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors',
                active
                  ? 'bg-white/10 font-medium text-white'
                  : 'text-white/60 hover:bg-white/5 hover:text-white',
              )}
            >
              {active && (
                <span className="-translate-y-1/2 absolute top-1/2 left-0 h-4 w-[3px] rounded-r bg-[var(--color-accent)]" />
              )}
              <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-white/10 border-t px-4 py-3">
        <p className="font-semibold text-[11px] text-white/45 tracking-tight">
          Banco Vital <span className="text-white/30">· Super</span>
        </p>
      </div>
    </aside>
  );
}
