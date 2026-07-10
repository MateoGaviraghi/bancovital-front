'use client';

import { ConsumoWidget } from '@/components/domain/consumo-widget';
import { ThemePickerButton } from '@/components/domain/theme-picker-button';
import { DynamicLucideIcon } from '@/components/ui/dynamic-lucide-icon';
import { apiClient } from '@/lib/api/client';
import { queries } from '@/lib/api/queries';
import type { Servicio } from '@/lib/api/types';
import type { AppRole } from '@/lib/auth/session';
import { cn } from '@/lib/cn';
import { useLab } from '@/lib/lab/lab-info';
import { useQuery } from '@tanstack/react-query';
import {
  BookOpen,
  Building2,
  Cat,
  ChevronDown,
  ClipboardList,
  DollarSign,
  Droplets,
  FilePlus,
  FileText,
  FlaskConical,
  Heart,
  Home,
  LayoutDashboard,
  type LucideIcon,
  MapPin,
  PawPrint,
  ScrollText,
  ShieldCheck,
  Stethoscope,
  TestTube,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// ─── Types ───────────────────────────────────────────────────

type Leaf = {
  kind: 'leaf';
  /** Ruta absoluta (sin slug), ej. "/inicio" o "/ordenes". */
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
  { kind: 'leaf', path: '/inicio', label: 'Inicio', icon: Home },
  {
    kind: 'group',
    label: 'Órdenes',
    icon: ClipboardList,
    basePath: '/ordenes',
    children: [
      { path: '/ordenes', label: 'Órdenes', icon: ClipboardList },
      { path: '/ordenes/nueva', label: 'Crear orden', icon: FilePlus },
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
  {
    kind: 'group',
    label: 'Cotizaciones',
    icon: ScrollText,
    basePath: '/cotizaciones',
    children: [
      { path: '/cotizaciones', label: 'Cotizaciones', icon: ScrollText },
      { path: '/cotizaciones/precios', label: 'Catálogo de precios', icon: DollarSign, roles: ['admin'] },
    ],
  },
  { kind: 'leaf', path: '/reportes', label: 'Reportes', icon: TrendingUp },
];

const HISTORIA_CLINICA: Entry[] = [
  { kind: 'leaf', path: '/pacientes', label: 'Pacientes', icon: Users },
  { kind: 'leaf', path: '/medicos', label: 'Médicos', icon: Stethoscope },
];

const VETERINARIA: Entry[] = [
  { kind: 'leaf', path: '/propietarios', label: 'Propietarios', icon: Users },
  { kind: 'leaf', path: '/pacientes-animales', label: 'Pacientes animales', icon: PawPrint },
  { kind: 'leaf', path: '/veterinarios', label: 'Veterinarios', icon: Heart },
  {
    kind: 'leaf',
    path: '/admin/especies',
    label: 'Especies y razas',
    icon: PawPrint,
    roles: ['admin'],
  },
];

const AGUA_EFLUENTES: Entry[] = [
  { kind: 'leaf', path: '/agua-efluentes/solicitantes', label: 'Solicitantes', icon: Users },
  { kind: 'leaf', path: '/agua-efluentes/muestras', label: 'Muestras', icon: Droplets },
  { kind: 'leaf', path: '/agua-efluentes/analisis', label: 'Análisis', icon: TestTube },
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
      { path: '/admin/sedes', label: 'Sedes', icon: MapPin },
      { path: '/admin/servicios', label: 'Servicios', icon: FlaskConical },
      { path: '/admin/especies', label: 'Especies y razas', icon: PawPrint },
    ],
  },
  { kind: 'leaf', path: '/configuracion/pdf', label: 'Config. PDF', icon: FileText },
];

// ─── Components ──────────────────────────────────────────────

function leafIsActive(href: string, pathname: string): boolean {
  if (href.includes('?')) return false;
  return href === pathname;
}

function LeafLink({
  item,
  pathname,
  indent = false,
}: {
  item: { path: string; label: string; icon: LucideIcon };
  pathname: string;
  indent?: boolean;
}) {
  const Icon = item.icon;
  const active = leafIsActive(item.path, pathname);
  return (
    <Link
      href={item.path}
      className={cn(
        'relative flex items-center gap-2.5 rounded-md py-1.5 text-sm transition-colors',
        indent ? 'px-2.5' : 'px-2.5',
        active
          ? 'bg-white/10 font-medium text-white'
          : 'text-white/60 hover:bg-white/5 hover:text-white',
      )}
    >
      {active && !indent && (
        <span className="-translate-y-1/2 absolute top-1/2 left-0 h-4 w-[3px] rounded-r bg-[var(--color-accent)]" />
      )}
      <Icon className={cn('h-4 w-4 shrink-0', indent && 'h-3.5 w-3.5')} strokeWidth={2} />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

function GroupItem({
  group,
  pathname,
  userRole,
}: {
  group: Group;
  pathname: string;
  userRole: AppRole;
}) {
  const isInSection = pathname.startsWith(group.basePath);
  const Icon = group.icon;
  const visibleChildren = group.children.filter((c) => !c.roles || c.roles.includes(userRole));
  if (visibleChildren.length === 0) return null;

  return (
    <details open={isInSection} className="group/details">
      <summary
        className={cn(
          'flex cursor-pointer list-none items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors select-none',
          isInSection
            ? 'font-medium text-white'
            : 'text-white/60 hover:bg-white/5 hover:text-white',
        )}
      >
        <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
        <span className="flex-1 truncate">{group.label}</span>
        <ChevronDown
          className="h-3.5 w-3.5 shrink-0 text-white/40 transition-transform duration-150 group-open/details:rotate-180"
          strokeWidth={2}
        />
      </summary>
      <div className="mt-0.5 ml-[1.1rem] space-y-0.5 border-white/10 border-l pl-3">
        {visibleChildren.map((child) => (
          <LeafLink key={child.path} item={child} pathname={pathname} indent />
        ))}
      </div>
    </details>
  );
}

function NavEntry({
  entry,
  pathname,
  userRole,
}: {
  entry: Entry;
  pathname: string;
  userRole: AppRole;
}) {
  if (entry.kind === 'leaf') {
    if (entry.roles && !entry.roles.includes(userRole)) return null;
    return <LeafLink item={entry} pathname={pathname} />;
  }
  return <GroupItem group={entry} pathname={pathname} userRole={userRole} />;
}

// ─── Sidebar ─────────────────────────────────────────────────

export function SidebarNavBody({
  userRole,
  isSuper = false,
}: { userRole: AppRole; isSuper?: boolean }) {
  const pathname = usePathname();
  const { labName, logoUrl, primaryColor, accentColor, veterinariaHabilitada } = useLab();
  const name = labName ?? 'Mi laboratorio';

  const { data: servicios = [] } = useQuery({
    queryKey: queries.servicios.list(),
    queryFn: () => apiClient.get<Servicio[]>('/servicios').then((r) => r.data),
    staleTime: 5 * 60_000,
  });

  const hasVeterinaria =
    veterinariaHabilitada || servicios.some((s) => s.usaPacienteAnimal || s.usaVeterinario);

  const hasAguaEfluentes = servicios.some(
    (s) => s.activo && (s.usaSolicitanteAgua || s.usaMuestraAgua),
  );

  // Filtrar entradas de admin según permisos
  const adminEntries: Entry[] = ADMIN.map((e) => {
    if (e.kind !== 'group' || e.basePath !== '/admin') return e;
    let children = e.children;
    if (!hasVeterinaria) children = children.filter((c) => c.path !== '/admin/especies');
    if (!isSuper) children = children.filter((c) => c.path !== '/admin/servicios');
    return { ...e, children };
  });

  return (
    <>
      <div className="flex h-14 items-center gap-2.5 border-white/10 border-b px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-white">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt=""
              width={36}
              height={36}
              className="h-full w-full object-contain"
            />
          ) : (
            <span className="font-bold text-[var(--color-primary)] text-sm uppercase">
              {name.slice(0, 2)}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate font-semibold text-sm text-white">{name}</p>
          <p className="truncate text-[10px] text-white/40 uppercase tracking-[0.14em]">
            Laboratorio
          </p>
        </div>
        {userRole === 'admin' && <ThemePickerButton currentPrimary={primaryColor} />}
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-4">
        <p className="px-2.5 pb-1.5 font-medium text-[10px] text-white/35 uppercase tracking-[0.16em]">
          Operación
        </p>
        {PRIMARY.map((entry) => (
          <NavEntry
            key={entry.kind === 'leaf' ? entry.path : entry.basePath}
            entry={entry}
            pathname={pathname}
            userRole={userRole}
          />
        ))}

        <p className="px-2.5 pt-5 pb-1.5 font-medium text-[10px] text-white/35 uppercase tracking-[0.16em]">
          Historia clínica
        </p>
        {HISTORIA_CLINICA.map((entry) => (
          <NavEntry
            key={entry.kind === 'leaf' ? entry.path : entry.basePath}
            entry={entry}
            pathname={pathname}
            userRole={userRole}
          />
        ))}

        {(hasVeterinaria || userRole === 'admin') && (
          <>
            <p className="px-2.5 pt-5 pb-1.5 font-medium text-[10px] text-white/35 uppercase tracking-[0.16em]">
              Veterinaria
            </p>
            {VETERINARIA.map((entry) => (
              <NavEntry
                key={entry.kind === 'leaf' ? entry.path : entry.basePath}
                entry={entry}
                pathname={pathname}
                userRole={userRole}
              />
            ))}
          </>
        )}

        {hasAguaEfluentes && (
          <>
            <p className="px-2.5 pt-5 pb-1.5 font-medium text-[10px] text-white/35 uppercase tracking-[0.16em]">
              Agua y efluentes
            </p>
            {AGUA_EFLUENTES.map((entry) => (
              <NavEntry
                key={entry.kind === 'leaf' ? entry.path : entry.basePath}
                entry={entry}
                pathname={pathname}
                userRole={userRole}
              />
            ))}
          </>
        )}

        {userRole === 'admin' && (
          <>
            <p className="px-2.5 pt-5 pb-1.5 font-medium text-[10px] text-white/35 uppercase tracking-[0.16em]">
              Sistema
            </p>
            {adminEntries.map((entry) => (
              <NavEntry
                key={entry.kind === 'leaf' ? entry.path : entry.basePath}
                entry={entry}
                pathname={pathname}
                userRole={userRole}
              />
            ))}
          </>
        )}
      </nav>

      <ConsumoWidget />

      <div className="border-white/10 border-t px-4 py-3">
        <p className="font-semibold text-[11px] text-white/45 tracking-tight">Banco Vital</p>
      </div>
    </>
  );
}

export function Sidebar({ userRole, isSuper = false }: { userRole: AppRole; isSuper?: boolean }) {
  return (
    <aside className="hidden w-60 shrink-0 flex-col bg-rail md:flex">
      <SidebarNavBody userRole={userRole} isSuper={isSuper} />
    </aside>
  );
}
