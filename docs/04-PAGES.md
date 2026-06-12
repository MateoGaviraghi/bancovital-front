# 04 — Páginas

Next.js App Router. Cada `page.tsx` es un route. Carpetas `(app)` y `(auth)` son route groups (no afectan URL, solo permiten layouts distintos).

## Inventario completo

### Login (público)

| Path | Archivo | Tipo | Descripción |
|---|---|---|---|
| `/login` | `app/(auth)/login/page.tsx` | Client Component | Form de email + password. Llama `supabase.auth.signInWithPassword()`. Redirect a `/` al éxito. |

### Home

| Path | Archivo | Tipo | Endpoints | Descripción |
|---|---|---|---|---|
| `/` | `app/(app)/page.tsx` | Server Component | (placeholder) | Dashboard con KPI cards: órdenes hoy, 30 días, pacientes, facturación. |

### Órdenes

| Path | Archivo | Tipo | Endpoints | Descripción |
|---|---|---|---|---|
| `/ordenes` | `ordenes/page.tsx` | Server Component | `GET /orders`, `GET /insurers` | Tabla con filtros (status, insurer, date range, search). Botón "Nueva orden". Botón PDF en filas emitidas. |
| `/ordenes/nueva` | `ordenes/nueva/page.tsx` | Server Component carga datos + Client form | `GET /insurers/with-ub`, `GET /practices`, `POST /orders` | Form de creación: paciente, médico, obra, prácticas (multi-select NBU grid). |
| `/ordenes/:id` | `ordenes/[id]/page.tsx` | Server Component | `GET /orders/:id`, `GET /orders/:id/lines` | Tabs: Datos, Líneas, Totales. Botones "Cargar resultados" + "Emitir informe" (según rol). |
| `/ordenes/:id/resultados` | `ordenes/[id]/resultados/page.tsx` | Server Component + Client form | `GET /orders/:id`, `GET /orders/:id/results`, `POST /results`, `PATCH /orders/:id/finalize` | Solo admin/bioquímico. Form con inputs por línea + clasificación en vivo. |
| `/ordenes/:id/informe` | `ordenes/[id]/informe/page.tsx` | Server Component + Client panel | `GET /orders/:id`, `POST /reports/:id/emit`, `GET /reports/:id/signed-url` | Panel para emitir / descargar PDF. |

### Pacientes

| Path | Archivo | Tipo | Endpoints | Descripción |
|---|---|---|---|---|
| `/pacientes` | `pacientes/page.tsx` | Server Component | `GET /patients?q=...` | Tabla con búsqueda. |
| `/pacientes/nuevo` | `pacientes/nuevo/page.tsx` | Client form | `POST /patients` | Form: DNI, nombre, apellido, sexo, fecha nacimiento, contacto. |

### Médicos

| Path | Archivo | Tipo | Endpoints | Descripción |
|---|---|---|---|---|
| `/medicos` | `medicos/page.tsx` | Server Component | `GET /doctors` | Tabla con búsqueda. Botón "Nuevo médico" si admin/recepcion. |
| `/medicos/nuevo` | `medicos/nuevo/page.tsx` | Client form | `POST /doctors` | Form: nombre, apellido, matrícula, especialidad, contacto. |

### Prácticas

| Path | Archivo | Tipo | Endpoints | Descripción |
|---|---|---|---|---|
| `/practicas` | `practicas/page.tsx` | Server Component | `GET /practices?q=...` | Catálogo NBU, agrupado por sección. Solo lectura. |

### Obras sociales

| Path | Archivo | Tipo | Endpoints | Descripción |
|---|---|---|---|---|
| `/obras-sociales` | `obras-sociales/page.tsx` | Server Component | `GET /insurers/with-ub` | Tabla con UB vigente. Botones: "Administrar UB" + "Nueva" (admin only). |
| `/obras-sociales/nueva` | `obras-sociales/nueva/page.tsx` | Client form | `POST /insurers` | Admin only. Form: código, nombre, requiresAuthorization. |

### Reportes

| Path | Archivo | Tipo | Endpoints | Descripción |
|---|---|---|---|---|
| `/reportes` | `reportes/page.tsx` | Server Component | `GET /orders?limit=200` | KPI cards + tabla por estado y por obra social. |

### Administración (admin only)

| Path | Archivo | Tipo | Endpoints | Descripción |
|---|---|---|---|---|
| `/admin` | `admin/page.tsx` | Server Component | (ninguno) | Hub con 3 cards: Usuarios, Valor UB, Datos del laboratorio. Redirect si no admin. |
| `/admin/config-lab` | `admin/config-lab/page.tsx` | Server Component + Client form | `GET /lab-config`, `PATCH /lab-config`, `POST /reports/regenerate-all` | Form completo: legal name, CUIT, dirección, firmante, logoUrl, shortName. ConfirmDialog con checkbox para regenerar informes. |
| `/admin/usuarios` | `admin/usuarios/page.tsx` | Server Component + Client table | `GET /users`, `POST /users/invite`, `PATCH /users/:id/role`, `PATCH /users/:id/active` | Tabla de usuarios. Invite dialog. Cambio de rol inline. Activar/desactivar. |
| `/admin/valor-ub` | `admin/valor-ub/page.tsx` | Server Component + Client editor | `GET /insurers/with-ub`, `POST /ub-values` | Editor por obra social: valor + fecha vigencia. ConfirmDialog con diff antes/después. |

## Convenciones de implementación

### Server Component que fetch del back

```tsx
// app/(app)/pacientes/page.tsx
import { getServerApi } from '@/lib/api/server';

export const dynamic = 'force-dynamic';

export default async function PacientesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const api = await getServerApi();
  const patients = await api.get('/patients', { params: { q: q ?? '', limit: 50 } });

  return (
    <>
      <PageHeader title="Pacientes" />
      <PatientsTable rows={patients.data} />
    </>
  );
}
```

### Client Component que muta

```tsx
'use client';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner';

export function PatientForm() {
  const create = useMutation({
    mutationFn: (data: CreatePatientInput) => apiClient.post('/patients', data),
    onSuccess: () => toast.success('Paciente creado'),
    onError: (e: any) => toast.error(e.response?.data?.message ?? 'Error'),
  });

  return <form onSubmit={(e) => { e.preventDefault(); create.mutate(formData); }}>...</form>;
}
```

### Redirección por rol

```tsx
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth/session';

export default async function AdminPage() {
  const user = await getSessionUser();
  if (user?.role !== 'admin') redirect('/');
  // ...
}
```

## Layout

### Root (`app/layout.tsx`)

```tsx
import { Inter } from 'next/font/google';
import { TrpcProvider } from '@/components/providers/query-provider'; // (renombrar a QueryProvider)
import { Toaster } from '@/components/ui/toaster';
import './globals.css';

export const metadata = { title: 'Lab Bioquímico', lang: 'es-AR' };

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR" className={inter.className}>
      <body>
        <QueryProvider>
          {children}
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  );
}
```

### App layout (`app/(app)/layout.tsx`)

Auth-gated. Carga branding del lab + sidebar + topbar.

```tsx
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { getSessionUser } from '@/lib/auth/session';
import { getServerApi } from '@/lib/api/server';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  const api = await getServerApi();
  let branding;
  try {
    const { data } = await api.get('/lab-config');
    branding = {
      legalName: data.legalName,
      shortName: data.shortName,
      city: data.city,
      logoUrl: data.logoUrl,
    };
  } catch {
    branding = { legalName: 'Laboratorio', shortName: null, city: 'Santa Fe', logoUrl: null };
  }

  return (
    <div className="flex min-h-screen bg-[var(--color-bg)]">
      <Sidebar userRole={user.role} branding={branding} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar user={user} />
        <main className="flex-1 overflow-auto">
          <div className="mx-auto w-full max-w-[1440px] px-6 py-8 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
```

## Server Components vs Client Components

- **Server**: pages que solo muestran datos. Hacen fetch server-side. NO importan `useState`, `useEffect`, ni hooks de React.
- **Client**: cualquier cosa con interactividad (forms, dialogs, search bars con debounce). Marcar con `'use client'` arriba del archivo.

Patrón típico:
- Page (Server) hace fetch inicial y pasa data como prop a un componente Client.
- Componente Client maneja interactividad y mutaciones.
