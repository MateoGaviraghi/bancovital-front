# 09 — API Client

Cómo el front se comunica con el back. Stack: **axios + TanStack Query**.

## Estructura

```
lib/api/
├── client.ts      # axios instance para Client Components
├── server.ts      # axios instance para Server Components
├── types.ts       # interfaces (DTOs duplicados)
└── queries.ts     # query keys + helpers de TanStack Query
```

## Client axios (`lib/api/client.ts`)

Para uso en componentes con `'use client'`. Lee el token via `supabase.auth.getSession()` en el interceptor.

```ts
'use client';
import axios, { type AxiosInstance } from 'axios';
import { getSupabase } from '@/lib/supabase-browser';

let cached: AxiosInstance | undefined;

export function getApiClient(): AxiosInstance {
  if (cached) return cached;

  const client = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,  // ej: http://localhost:4000/api
    timeout: 30_000,
    headers: { 'Content-Type': 'application/json' },
  });

  // Inyectar Bearer token en cada request
  client.interceptors.request.use(async (config) => {
    const supabase = getSupabase();
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) {
      config.headers.Authorization = `Bearer ${data.session.access_token}`;
    }
    return config;
  });

  // Redirect a /login en 401
  client.interceptors.response.use(
    (res) => res,
    (err) => {
      if (err.response?.status === 401 && typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return Promise.reject(err);
    },
  );

  cached = client;
  return client;
}

export const apiClient = getApiClient();
```

## Server axios (`lib/api/server.ts`)

Para Server Components. Lee el token via cookies de Next.

```ts
import axios from 'axios';
import { cache } from 'react';
import { getSessionToken } from '@/lib/auth/session';

export const getServerApi = cache(async () => {
  const token = await getSessionToken();
  return axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    timeout: 30_000,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });
});
```

## Uso en Server Components

```tsx
import { getServerApi } from '@/lib/api/server';
import type { OrderListItem } from '@/lib/api/types';

export default async function OrdersPage({ searchParams }) {
  const sp = await searchParams;
  const api = await getServerApi();

  try {
    const { data } = await api.get<OrderListItem[]>('/orders', {
      params: { limit: 100, status: sp.status, search: sp.q },
    });
    return <OrdersTable rows={data} />;
  } catch (err: any) {
    if (err.response?.status === 401) redirect('/login');
    throw err;  // pasa al error.tsx boundary
  }
}
```

## Uso en Client Components con TanStack Query

### Query

```tsx
'use client';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import type { Patient } from '@/lib/api/types';

export function PatientSearch({ query }: { query: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['patients', { query }],
    queryFn: async () => {
      const res = await apiClient.get<Patient[]>('/patients', { params: { q: query, limit: 50 } });
      return res.data;
    },
    enabled: query.length >= 2,  // No buscar antes de 2 caracteres
    staleTime: 30_000,
  });

  if (isLoading) return <Spinner />;
  return <PatientList rows={data ?? []} />;
}
```

### Mutation

```tsx
'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export function PatientForm() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: CreatePatientInput) =>
      apiClient.post('/patients', data).then((r) => r.data),

    onSuccess: () => {
      toast.success('Paciente creado');
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      router.push('/pacientes');
    },

    onError: (err: any) => {
      const msg = err.response?.data?.message ?? 'Error al guardar';
      toast.error(Array.isArray(msg) ? msg.join('. ') : msg);
    },
  });

  return <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(formData); }}>...</form>;
}
```

## Convenciones

### Query keys

```ts
// lib/api/queries.ts
export const queries = {
  patients: {
    list: (filters: object) => ['patients', filters] as const,
    detail: (id: number) => ['patients', id] as const,
  },
  orders: {
    list: (filters: object) => ['orders', filters] as const,
    detail: (id: number) => ['orders', id] as const,
    lines: (orderId: number) => ['orders', orderId, 'lines'] as const,
    results: (orderId: number) => ['orders', orderId, 'results'] as const,
  },
  labConfig: ['lab-config'] as const,
};
```

### Invalidación

Después de mutar, invalidar lo relacionado:

```ts
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['orders'] });
  queryClient.invalidateQueries({ queryKey: ['orders', orderId] });
},
```

### Error handling

NestJS devuelve error en formato:

```json
{
  "statusCode": 422,
  "message": ["dni must match pattern", "firstName is too short"],
  "error": "Unprocessable Entity"
}
```

El interceptor de axios rejecta. En el handler:

```ts
onError: (err: any) => {
  if (err.response?.status === 422) {
    // Errores de validación
    const messages = err.response.data?.message ?? ['Error de validación'];
    toast.error(Array.isArray(messages) ? messages.join('. ') : messages);
  } else if (err.response?.status === 409) {
    // Conflicto (ej: DNI duplicado)
    toast.error(err.response.data?.message ?? 'Conflicto');
  } else if (err.response?.status === 403) {
    toast.error('No tenés permisos para esta acción');
  } else {
    toast.error('Error inesperado. Reintentá en un momento.');
  }
}
```

## Tipos compartidos (`lib/api/types.ts`)

**IMPORTANTE: estos tipos son ESPEJO de los DTOs del back.** Cuando el back cambia, hay que actualizar acá. Sin lab-shared, la sincronización es manual.

```ts
// ENUMS
export type OrderStatus = 'borrador' | 'confirmada' | 'en_proceso' | 'resultados_cargados' | 'emitida' | 'entregada' | 'anulada';
export type OrderOrigin = 'ambulatorio' | 'internacion' | 'urgencia';
export type ResultFlag = 'normal' | 'low' | 'high' | 'critical_low' | 'critical_high';
export type UserRole = 'admin' | 'recepcion' | 'bioquimico';
export type AuthorizationStatus = 'no_aplica' | 'pendiente' | 'autorizada' | 'rechazada';

// ENTITIES (output del back)
export interface Patient {
  id: number;
  dni: string;
  firstName: string;
  lastName: string;
  sex: 'F' | 'M' | 'X' | null;
  birthDate: string;
  phone: string | null;
  email: string | null;
  streetAddress: string | null;
  city: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Doctor {
  id: number;
  firstName: string;
  lastName: string;
  matricula: string;
  specialty: string | null;
  phone: string | null;
  email: string | null;
}

export interface Insurer {
  id: number;
  code: string;
  name: string;
  requiresAuthorization: boolean;
  active: boolean;
}

export interface InsurerWithCurrentUb {
  insurerId: number;
  insurerCode: string;
  insurerName: string;
  requiresAuthorization: boolean;
  currentValue: string | null;
  validFrom: string | null;
}

export interface Practice {
  id: number;
  nbuCode: string;
  name: string;
  shortName: string | null;
  section: string | null;
  units: string;
  isSpecialAct: boolean;
}

export interface OrderListItem {
  id: number;
  protocolNumber: number;
  orderDate: string;
  status: OrderStatus;
  totalParticular: string;
  totalInsurer: string;
  patientFullName: string;
  patientDni: string;
  insurerName: string;
}

export interface OrderDetail {
  order: { /* todas las cols de la tabla order */ };
  patient: { id, dni, firstName, lastName, birthDate, sex };
  insurer: { id, code, name };
}

export interface LabConfig {
  id: number;
  legalName: string;
  cuit: string;
  streetAddress: string;
  city: string;
  province: string;
  phone: string | null;
  email: string | null;
  signingProfessionalName: string;
  signingProfessionalMp: string;
  logoUrl: string | null;
  shortName: string | null;
}

export interface AdminUser {
  id: string;
  email: string;
  role: UserRole | null;
  displayName: string | null;
  matricula: string | null;
  active: boolean;
  createdAt: string;
  lastSignInAt: string | null;
}

// DTOs (input al back)
export interface CreatePatientDto {
  dni: string;
  firstName: string;
  lastName: string;
  sex?: 'F' | 'M' | 'X';
  birthDate: string;
  phone?: string;
  email?: string;
  streetAddress?: string;
  city?: string;
  notes?: string;
}

// ... etc
```

## Workflow cuando el back cambia un DTO

Suponé que el back agrega `secondaryInsurerId` al `CreatePatientDto`:

1. **Back**: agregar el campo al DTO + service + schema + migration.
2. **Front**: agregar el mismo campo en `lib/api/types.ts` (interface `CreatePatientDto`) + en el form (`PatientForm` registra el input nuevo).
3. **Verificar:** `pnpm typecheck` en los dos.

Sin shared package, esto es el costo. Anotalo en el PR del back para no olvidar.
