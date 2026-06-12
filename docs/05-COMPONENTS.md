# 05 — Componentes

Tres categorías:
1. **UI primitives** (`components/ui/`): Button, Input, etc. Reutilizables, sin lógica de negocio.
2. **Domain** (`components/domain/`): Componentes con lógica del laboratorio (MoneyDisplay, StatusPill, PatientForm).
3. **Layout** (`components/layout/`): Sidebar, Topbar, PageHeader.

## UI Primitives (`components/ui/`)

### Button (`button.tsx`)

Construido con Radix Slot + CVA.

```tsx
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4',
  {
    variants: {
      variant: {
        default: 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary-hover)]',
        destructive: 'bg-[var(--color-danger)] text-white hover:bg-[var(--color-danger)]/90',
        outline: 'border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-subtle)]',
        secondary: 'bg-[var(--color-bg-subtle)] hover:bg-[var(--color-bg-subtle)]/80',
        ghost: 'hover:bg-[var(--color-bg-subtle)]',
        link: 'text-[var(--color-primary)] underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-8',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = 'Button';
export { buttonVariants };
```

### Input (`input.tsx`)

Simple input con estilo del design system.

```tsx
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        'flex h-9 w-full rounded-md border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] px-3 py-1 text-sm shadow-[var(--shadow-xs)] placeholder:text-[var(--color-fg-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
);
```

### Otras primitives a crear (con Radix)

| Componente | Radix base | Notas |
|---|---|---|
| **Textarea** | `<textarea>` nativo | Mismos estilos que Input |
| **Label** | `@radix-ui/react-label` | Para forms |
| **Select** | `@radix-ui/react-select` | Trigger + Content + Item + Value |
| **Checkbox** | `@radix-ui/react-checkbox` | Con check icon de lucide |
| **Card** | div estilizado | Header, Title, Description, Content, Footer |
| **Dialog** | `@radix-ui/react-dialog` | Modal genérico |
| **AlertDialog** | `@radix-ui/react-alert-dialog` | Para confirmaciones destructivas |
| **DropdownMenu** | `@radix-ui/react-dropdown-menu` | Trigger + Content + Item + Separator |
| **Tabs** | `@radix-ui/react-tabs` | TabsList, TabsTrigger, TabsContent |
| **Toaster** | sonner | Wrapper con posición top-right |
| **FormField** | wrapper | label + control + error |
| **Form** | react-hook-form | FormProvider + helpers |

Cada uno: archivo `.tsx` aparte, exporta nombrado, estilos con tokens CSS via Tailwind.

## Domain (`components/domain/`)

### MoneyDisplay (`money-display.tsx`)

```tsx
import { Money } from '@/lib/money';

export function MoneyDisplay({
  value,
  emphasis = false,
  className,
}: { value: string | number | null; emphasis?: boolean; className?: string }) {
  if (value == null || value === '') return <span className="text-[var(--color-fg-subtle)]">—</span>;
  const display = Money.toDisplay(value);  // "$ 12.450,00"
  return (
    <span className={cn('tabular font-mono', emphasis && 'font-semibold', className)}>
      {display}
    </span>
  );
}
```

### StatusPill (`status-pill.tsx`)

```tsx
type OrderStatus = 'borrador' | 'confirmada' | 'en_proceso' | 'resultados_cargados' | 'emitida' | 'entregada' | 'anulada';

const STYLES: Record<OrderStatus, { label: string; className: string }> = {
  borrador: { label: 'Borrador', className: 'border-[var(--color-fg-subtle)]/15 bg-[var(--color-bg-subtle)] text-[var(--color-fg-muted)]' },
  confirmada: { label: 'Confirmada', className: 'border-[var(--color-info)]/15 bg-[var(--color-info-soft)] text-[var(--color-info)]' },
  en_proceso: { label: 'En proceso', className: 'border-[var(--color-warning)]/15 bg-[var(--color-warning-soft)] text-[var(--color-warning)]' },
  resultados_cargados: { label: 'Resultados', className: 'border-[var(--color-info)]/15 bg-[var(--color-info-soft)] text-[var(--color-info)]' },
  emitida: { label: 'Emitida', className: 'border-[var(--color-success)]/15 bg-[var(--color-success-soft)] text-[var(--color-success)]' },
  entregada: { label: 'Entregada', className: 'border-[var(--color-success)]/15 bg-[var(--color-success-soft)] text-[var(--color-success)]' },
  anulada: { label: 'Anulada', className: 'border-[var(--color-danger)]/15 bg-[var(--color-danger-soft)] text-[var(--color-danger)]' },
};

export function StatusPill({ status }: { status: OrderStatus }) {
  const { label, className } = STYLES[status];
  return (
    <span className={cn('inline-flex items-center rounded-md border px-2 py-0.5 font-medium text-[10px] uppercase tracking-wide', className)}>
      {label}
    </span>
  );
}
```

### ResultInput (`result-input.tsx`)

Input numérico con clasificación en vivo contra rango de referencia.

```tsx
'use client';
import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { type RangeRule, type ResultFlag, classifyResult } from '@/lib/reference-range';

type Props = {
  defaultValue?: string;
  unit?: string | null;
  rule: RangeRule | null;
  name: string;
};

const FLAG_STYLE: Record<ResultFlag, string> = {
  normal: 'text-[var(--color-success)]',
  low: 'text-[var(--color-warning)]',
  high: 'text-[var(--color-warning)]',
  critical_low: 'font-semibold text-[var(--color-danger)]',
  critical_high: 'font-semibold text-[var(--color-danger)]',
};

const FLAG_LABEL: Record<ResultFlag, string> = {
  normal: 'Normal',
  low: '↓ Bajo',
  high: '↑ Alto',
  critical_low: '‼ Crítico bajo',
  critical_high: '‼ Crítico alto',
};

export function ResultInput({ defaultValue = '', unit, rule, name }: Props) {
  const [value, setValue] = useState(defaultValue);
  const [flag, setFlag] = useState<ResultFlag | null>(null);

  useEffect(() => {
    if (!value.trim() || !rule) { setFlag(null); return; }
    setFlag(classifyResult(value.replace(',', '.'), rule));
  }, [value, rule]);

  const range = rule ? `${rule.band.low ?? '−∞'} – ${rule.band.high ?? '+∞'}${unit ? ` ${unit}` : ''}` : null;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Input name={name} value={value} onChange={(e) => setValue(e.target.value)} inputMode="decimal" placeholder="—" className="max-w-[140px] text-right font-mono" />
      {unit && <span className="text-[var(--color-fg-muted)] text-xs">{unit}</span>}
      {range && <span className="font-mono text-[var(--color-fg-muted)] text-xs">ref. {range}</span>}
      {flag && <span className={cn('ml-auto text-xs', FLAG_STYLE[flag])}>{FLAG_LABEL[flag]}</span>}
    </div>
  );
}
```

### PatientForm (`patient-form.tsx`)

Form completo con react-hook-form + axios.

```tsx
'use client';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/client';

type PatientForm = {
  dni: string;
  firstName: string;
  lastName: string;
  sex?: 'F' | 'M' | 'X';
  birthDate: string;
  phone?: string;
  email?: string;
  city?: string;
  streetAddress?: string;
  notes?: string;
};

export function PatientForm({ defaults }: { defaults?: Partial<PatientForm> & { id?: number } }) {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors } } = useForm<PatientForm>({ defaultValues: defaults });

  const mutation = useMutation({
    mutationFn: (data: PatientForm) =>
      defaults?.id
        ? apiClient.patch(`/patients/${defaults.id}`, data)
        : apiClient.post('/patients', data),
    onSuccess: () => {
      toast.success(defaults?.id ? 'Paciente actualizado' : 'Paciente creado');
      router.push('/pacientes');
      router.refresh();
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Error al guardar paciente'),
  });

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {/* DNI, fechaNacimiento, apellido, nombre, sexo, telefono, email, ciudad, direccion, notas */}
      {/* Cada FormField wrapeando un Input registrado */}
    </form>
  );
}
```

### Resto de domain components

| Componente | Props | Función |
|---|---|---|
| `DoctorForm` | `defaults?` | CRUD médico. Mismo patrón que PatientForm. |
| `PatientCombobox` | `onSelect: (id) => void` | Combobox con search debounced. |
| `DoctorCombobox` | `onSelect: (id) => void` | Idem para médicos. |
| `NbuGrid` | `selected: number[], onChange` | Grid con búsqueda + multiselect de prácticas. |
| `ConfirmDialog` | `open, onOpenChange, title, description, onConfirm, tone, loading` | Wrapper de AlertDialog con tonos warning/danger/info. |
| `InsurerRowActions` | `insurer` | Dropdown con Edit/Delete inline. |
| `DownloadPdfButton` | `orderId: number` | Llama `GET /reports/:id/signed-url`, abre URL en nueva pestaña. |

## Layout (`components/layout/`)

### Sidebar (`sidebar.tsx`)

```tsx
'use client';
import { Home, ClipboardList, Users, Stethoscope, FlaskConical, ShieldCheck, TrendingUp, Settings } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { AppRole } from '@/lib/auth/session';

type NavItem = { href: string; label: string; icon: typeof Home };

const PRIMARY: NavItem[] = [
  { href: '/', label: 'Inicio', icon: Home },
  { href: '/ordenes', label: 'Órdenes', icon: ClipboardList },
  { href: '/pacientes', label: 'Pacientes', icon: Users },
  { href: '/medicos', label: 'Médicos', icon: Stethoscope },
  { href: '/practicas', label: 'Prácticas', icon: FlaskConical },
  { href: '/obras-sociales', label: 'Obras sociales', icon: ShieldCheck },
  { href: '/reportes', label: 'Reportes', icon: TrendingUp },
];

const ADMIN: NavItem[] = [{ href: '/admin', label: 'Administración', icon: Settings }];

type Branding = {
  legalName: string;
  shortName: string | null;
  city: string;
  logoUrl: string | null;
};

export function Sidebar({ userRole, branding }: { userRole: AppRole; branding: Branding }) {
  const pathname = usePathname();
  const displayName = branding.shortName || branding.legalName;
  const logoSrc = branding.logoUrl || '/lab-logo.jpg';

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-bg-elevated)] md:flex">
      {/* Header con logo + displayName + city */}
      {/* Nav PRIMARY */}
      {/* Si admin, nav ADMIN */}
      {/* Footer con versión */}
    </aside>
  );
}
```

### Topbar (`topbar.tsx`)

```tsx
'use client';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase-browser';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import type { SessionUser } from '@/lib/auth/session';

export function Topbar({ user }: { user: SessionUser }) {
  const router = useRouter();

  async function signOut() {
    await getSupabase().auth.signOut();
    router.push('/login');
  }

  const initials = (user.displayName ?? user.email).split(' ').map(p => p[0]).join('').slice(0,2).toUpperCase();

  return (
    <header className="flex h-14 items-center justify-end border-b border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-6">
      <DropdownMenu>
        <DropdownMenuTrigger>{initials}</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={signOut}>Cerrar sesión</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
```

### PageHeader (`page-header.tsx`)

```tsx
type Props = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumb?: React.ReactNode;
};

export function PageHeader({ title, description, actions, breadcrumb }: Props) {
  return (
    <header className="mb-6 border-b border-[var(--color-border)] pb-4">
      {breadcrumb && <div className="mb-2">{breadcrumb}</div>}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-semibold text-[var(--color-fg)] text-xl">{title}</h1>
          {description && <p className="mt-1 text-[var(--color-fg-muted)] text-sm">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
```

### EmptyState (`empty-state.tsx`)

```tsx
import type { LucideIcon } from 'lucide-react';

export function EmptyState({ icon: Icon, title, description }: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <Icon className="h-10 w-10 text-[var(--color-fg-subtle)]" />
      <div>
        <p className="font-medium text-[var(--color-fg)] text-sm">{title}</p>
        <p className="mt-1 text-[var(--color-fg-muted)] text-xs">{description}</p>
      </div>
    </div>
  );
}
```

## Providers (`components/providers/`)

### QueryProvider (`query-provider.tsx`)

```tsx
'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { staleTime: 30_000, refetchOnWindowFocus: false },
    },
  }));
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
```
