'use client';

import type { AppRole } from '@/lib/auth/session';
import { cn } from '@/lib/cn';
import {
  BookOpen,
  Building2,
  ChevronDown,
  ClipboardList,
  DollarSign,
  FileText,
  FilePlus,
  FlaskConical,
  Home,
  LayoutDashboard,
  type LucideIcon,
  ShieldCheck,
  Stethoscope,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export type SidebarBranding = {
  legalName: string;
  shortName: string | null;
  city: string;
  logoUrl: string | null;
};

// ─── Types ───────────────────────────────────────────────────

type Leaf = {
  kind: 'leaf';
  href: string;
  label: string;
  icon: LucideIcon;
  roles?: AppRole[];
};

type Group = {
  kind: 'group';
  label: string;
  icon: LucideIcon;
  basePath: string;
  children: { href: string; label: string; icon: LucideIcon; roles?: AppRole[] }[];
  roles?: AppRole[];
};

type Entry = Leaf | Group;

// ─── Nav structure ───────────────────────────────────────────

const PRIMARY: Entry[] = [
  { kind: 'leaf', href: '/', label: 'Inicio', icon: Home },
  {
    kind: 'group',
    label: 'Órdenes',
    icon: ClipboardList,
    basePath: '/ordenes',
    children: [
      { href: '/ordenes', label: 'Ver órdenes', icon: ClipboardList },
      { href: '/ordenes/nueva', label: 'Nueva orden', icon: FilePlus, roles: ['admin', 'bioquimico'] },
    ],
  },
  {
    kind: 'group',
    label: 'Pacientes',
    icon: Users,
    basePath: '/pacientes',
    children: [
      { href: '/pacientes', label: 'Ver pacientes', icon: Users },
      { href: '/pacientes/nuevo', label: 'Nuevo paciente', icon: UserPlus },
    ],
  },
  {
    kind: 'group',
    label: 'Médicos',
    icon: Stethoscope,
    basePath: '/medicos',
    children: [
      { href: '/medicos', label: 'Ver médicos', icon: Stethoscope },
      { href: '/medicos/nuevo', label: 'Nuevo médico', icon: UserPlus, roles: ['admin'] },
    ],
  },
  {
    kind: 'group',
    label: 'Prácticas',
    icon: FlaskConical,
    basePath: '/practicas',
    children: [
      { href: '/practicas', label: 'Catálogo', icon: BookOpen },
      { href: '/practicas/propias', label: 'Propias', icon: Building2, roles: ['admin'] },
    ],
  },
  { kind: 'leaf', href: '/obras-sociales', label: 'Obras sociales', icon: ShieldCheck },
  { kind: 'leaf', href: '/reportes', label: 'Reportes', icon: TrendingUp },
];

const ADMIN: Entry[] = [
  {
    kind: 'group',
    label: 'Administración',
    icon: LayoutDashboard,
    basePath: '/admin',
    children: [
      { href: '/admin', label: 'Panel', icon: LayoutDashboard },
      { href: '/admin/usuarios', label: 'Usuarios', icon: Users },
      { href: '/admin/valor-ub', label: 'Valor UB', icon: DollarSign },
      { href: '/admin/config-lab', label: 'Config. laboratorio', icon: Building2 },
    ],
  },
  { kind: 'leaf', href: '/configuracion/pdf', label: 'Config. PDF', icon: FileText },
];

// ─── Components ──────────────────────────────────────────────

function leafIsActive(href: string, pathname: string): boolean {
  // Links with query params can't be determined active by pathname alone — skip them
  if (href.includes('?')) return false;
  if (href === '/') return pathname === '/';
  return pathname === href;
}

function LeafLink({
  item,
  pathname,
  indent = false,
}: {
  item: { href: string; label: string; icon: LucideIcon };
  pathname: string;
  indent?: boolean;
}) {
  const Icon = item.icon;
  const active = leafIsActive(item.href, pathname);
  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-2 rounded-md py-1.5 text-sm transition-colors',
        indent ? 'px-2' : 'px-2.5',
        active
          ? 'bg-[var(--color-primary-soft)] font-medium text-[var(--color-primary-hover)]'
          : 'text-[var(--color-fg-muted)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-fg)]',
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

function GroupItem({ group, pathname, userRole }: { group: Group; pathname: string; userRole: AppRole }) {
  const isInSection = pathname.startsWith(group.basePath);
  const Icon = group.icon;
  const visibleChildren = group.children.filter(
    (c) => !c.roles || c.roles.includes(userRole),
  );
  if (visibleChildren.length === 0) return null;

  return (
    // open prop sets initial state server-side; browser handles toggle natively (no JS/hydration needed)
    <details open={isInSection} className="group/details">
      <summary
        className={cn(
          'flex cursor-pointer list-none items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors select-none',
          isInSection
            ? 'font-medium text-[var(--color-fg)]'
            : 'text-[var(--color-fg-muted)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-fg)]',
        )}
      >
        <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
        <span className="flex-1 truncate">{group.label}</span>
        <ChevronDown
          className="h-3.5 w-3.5 shrink-0 text-[var(--color-fg-subtle)] transition-transform duration-150 group-open/details:rotate-180"
          strokeWidth={2}
        />
      </summary>
      <div className="mt-0.5 ml-3.5 space-y-0.5 border-[var(--color-border)] border-l pl-3">
        {visibleChildren.map((child) => (
          <LeafLink key={child.href} item={child} pathname={pathname} indent />
        ))}
      </div>
    </details>
  );
}

function NavEntry({ entry, pathname, userRole }: { entry: Entry; pathname: string; userRole: AppRole }) {
  if (entry.kind === 'leaf') {
    if (entry.roles && !entry.roles.includes(userRole)) return null;
    return <LeafLink item={entry} pathname={pathname} />;
  }
  return <GroupItem group={entry} pathname={pathname} userRole={userRole} />;
}

// ─── Sidebar ─────────────────────────────────────────────────

export function Sidebar({
  userRole,
  branding,
}: {
  userRole: AppRole;
  branding: SidebarBranding;
}) {
  const pathname = usePathname();
  const displayName = branding.shortName || branding.legalName;
  const logoSrc =
    branding.logoUrl && /^https?:\/\//.test(branding.logoUrl)
      ? branding.logoUrl
      : '/labo.jpeg';

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-[var(--color-border)] border-r bg-[var(--color-bg-elevated)] md:flex">
      <div className="flex h-14 items-center gap-2.5 border-[var(--color-border)] border-b px-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md border border-[var(--color-border)] bg-[var(--color-primary-soft)]">
          <img src={logoSrc} alt={displayName} className="h-full w-full object-contain" />
        </div>
        <div className="min-w-0 leading-tight">
          <p className="truncate font-semibold text-[var(--color-fg)] text-sm">{displayName}</p>
          <p className="truncate text-[10px] text-[var(--color-fg-subtle)] uppercase tracking-wide">
            Laboratorio · {branding.city}
          </p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-4">
        <p className="px-2 pb-1 font-medium text-[10px] text-[var(--color-fg-subtle)] uppercase tracking-wide">
          Operación
        </p>
        {PRIMARY.map((entry) => (
          <NavEntry
            key={entry.kind === 'leaf' ? entry.href : entry.basePath}
            entry={entry}
            pathname={pathname}
            userRole={userRole}
          />
        ))}

        {userRole === 'admin' && (
          <>
            <p className="px-2 pt-4 pb-1 font-medium text-[10px] text-[var(--color-fg-subtle)] uppercase tracking-wide">
              Sistema
            </p>
            {ADMIN.map((entry) => (
              <NavEntry
                key={entry.kind === 'leaf' ? entry.href : entry.basePath}
                entry={entry}
                pathname={pathname}
                userRole={userRole}
              />
            ))}
          </>
        )}
      </nav>

      <div className="border-[var(--color-border)] border-t px-4 py-3">
        <p className="text-[10px] text-[var(--color-fg-subtle)]">v0.1 · Phase 1</p>
      </div>
    </aside>
  );
}
