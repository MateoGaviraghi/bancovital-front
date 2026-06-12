'use client';

import { ConsumoWidget } from '@/components/domain/consumo-widget';
import type { AppRole } from '@/lib/auth/session';
import { cn } from '@/lib/cn';
import { useTenant } from '@/lib/tenant/tenant-context';
import {
  BookOpen,
  Building2,
  ChevronDown,
  ClipboardList,
  DollarSign,
  FilePlus,
  FileText,
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

// ─── Types ───────────────────────────────────────────────────

type Leaf = {
  kind: 'leaf';
  /** Path relative to the slug root, e.g. "" (home) or "/ordenes" */
  path: string;
  label: string;
  icon: LucideIcon;
  roles?: AppRole[];
};

type Group = {
  kind: 'group';
  label: string;
  icon: LucideIcon;
  basePath: string;
  children: { path: string; label: string; icon: LucideIcon; roles?: AppRole[] }[];
  roles?: AppRole[];
};

type Entry = Leaf | Group;

// ─── Nav structure ───────────────────────────────────────────

const PRIMARY: Entry[] = [
  { kind: 'leaf', path: '', label: 'Inicio', icon: Home },
  {
    kind: 'group',
    label: 'Órdenes',
    icon: ClipboardList,
    basePath: '/ordenes',
    children: [
      { path: '/ordenes', label: 'Ver órdenes', icon: ClipboardList },
      { path: '/ordenes/nueva', label: 'Nueva orden', icon: FilePlus },
    ],
  },
  {
    kind: 'group',
    label: 'Pacientes',
    icon: Users,
    basePath: '/pacientes',
    children: [
      { path: '/pacientes', label: 'Ver pacientes', icon: Users },
      { path: '/pacientes/nuevo', label: 'Nuevo paciente', icon: UserPlus },
    ],
  },
  {
    kind: 'group',
    label: 'Médicos',
    icon: Stethoscope,
    basePath: '/medicos',
    children: [
      { path: '/medicos', label: 'Ver médicos', icon: Stethoscope },
      { path: '/medicos/nuevo', label: 'Nuevo médico', icon: UserPlus },
    ],
  },
  {
    kind: 'group',
    label: 'Prácticas',
    icon: FlaskConical,
    basePath: '/practicas',
    children: [
      { path: '/practicas', label: 'Catálogo', icon: BookOpen },
      { path: '/practicas/propias', label: 'Propias', icon: Building2, roles: ['admin'] },
    ],
  },
  { kind: 'leaf', path: '/obras-sociales', label: 'Obras sociales', icon: ShieldCheck },
  { kind: 'leaf', path: '/reportes', label: 'Reportes', icon: TrendingUp },
];

const ADMIN: Entry[] = [
  {
    kind: 'group',
    label: 'Administración',
    icon: LayoutDashboard,
    basePath: '/admin',
    children: [
      { path: '/admin', label: 'Panel', icon: LayoutDashboard },
      { path: '/admin/usuarios', label: 'Usuarios', icon: Users },
      { path: '/admin/valor-ub', label: 'Valor UB', icon: DollarSign },
      { path: '/admin/config-lab', label: 'Config. laboratorio', icon: Building2 },
    ],
  },
  { kind: 'leaf', path: '/configuracion/pdf', label: 'Config. PDF', icon: FileText },
];

// ─── Components ──────────────────────────────────────────────

function leafIsActive(href: string, pathname: string): boolean {
  if (href.includes('?')) return false;
  // Exact match for root; prefix match for others
  if (href === pathname) return true;
  // Strip trailing slash for comparison
  return false;
}

function LeafLink({
  item,
  slug,
  pathname,
  indent = false,
}: {
  item: { path: string; label: string; icon: LucideIcon };
  slug: string;
  pathname: string;
  indent?: boolean;
}) {
  const Icon = item.icon;
  const href = `/${slug}${item.path}`;
  const active = leafIsActive(href, pathname);
  return (
    <Link
      href={href}
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

function GroupItem({
  group,
  slug,
  pathname,
  userRole,
}: {
  group: Group;
  slug: string;
  pathname: string;
  userRole: AppRole;
}) {
  const isInSection = pathname.startsWith(`/${slug}${group.basePath}`);
  const Icon = group.icon;
  const visibleChildren = group.children.filter((c) => !c.roles || c.roles.includes(userRole));
  if (visibleChildren.length === 0) return null;

  return (
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
          <LeafLink key={child.path} item={child} slug={slug} pathname={pathname} indent />
        ))}
      </div>
    </details>
  );
}

function NavEntry({
  entry,
  slug,
  pathname,
  userRole,
}: {
  entry: Entry;
  slug: string;
  pathname: string;
  userRole: AppRole;
}) {
  if (entry.kind === 'leaf') {
    if (entry.roles && !entry.roles.includes(userRole)) return null;
    return <LeafLink item={entry} slug={slug} pathname={pathname} />;
  }
  return <GroupItem group={entry} slug={slug} pathname={pathname} userRole={userRole} />;
}

// ─── Sidebar ─────────────────────────────────────────────────

export function Sidebar({
  userRole,
  slug,
}: {
  userRole: AppRole;
  slug: string;
}) {
  const pathname = usePathname();
  const { branding } = useTenant();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-[var(--color-border)] border-r bg-[var(--color-bg-elevated)] md:flex">
      <div className="flex h-14 items-center gap-2.5 border-[var(--color-border)] border-b px-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md border border-[var(--color-border)] bg-[var(--color-primary-soft)]">
          {branding.logoUrl ? (
            <img src={branding.logoUrl} alt="" className="h-full w-full object-contain" />
          ) : (
            <span className="text-sm font-bold text-[var(--color-primary)] uppercase">
              {branding.name.slice(0, 2)}
            </span>
          )}
        </div>
        <div className="min-w-0 leading-tight">
          <p className="truncate font-semibold text-[var(--color-fg)] text-sm">{branding.name}</p>
          <p className="truncate text-[10px] text-[var(--color-fg-subtle)] uppercase tracking-wide">
            {branding.tagline ?? 'Laboratorio'}
          </p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-4">
        <p className="px-2 pb-1 font-medium text-[10px] text-[var(--color-fg-subtle)] uppercase tracking-wide">
          Operación
        </p>
        {PRIMARY.map((entry) => (
          <NavEntry
            key={entry.kind === 'leaf' ? entry.path : entry.basePath}
            entry={entry}
            slug={slug}
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
                key={entry.kind === 'leaf' ? entry.path : entry.basePath}
                entry={entry}
                slug={slug}
                pathname={pathname}
                userRole={userRole}
              />
            ))}
          </>
        )}
      </nav>

      <ConsumoWidget />

      <div className="border-[var(--color-border)] border-t px-4 py-3">
        <p className="text-[10px] text-[var(--color-fg-subtle)]">v0.1 · Phase 1</p>
      </div>
    </aside>
  );
}
