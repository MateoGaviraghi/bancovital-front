# 06 — Lib (helpers)

Carpeta `lib/`. Helpers reutilizables sin componentes React.

## `lib/cn.ts`

Utility para combinar clases Tailwind sin conflictos.

```ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

## `lib/money.ts`

Display de plata. Decimal.js bajo el capó.

```ts
import Decimal from 'decimal.js';

Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

export const Money = {
  zero: '0.00',

  of(value: string | number | null | undefined): Decimal | null {
    if (value == null || value === '') return null;
    return new Decimal(value);
  },

  toWire(d: Decimal): string {
    return d.toFixed(2);
  },

  /** "$ 12.450,00" — formato Argentino */
  toDisplay(value: string | number | null | undefined): string {
    if (value == null || value === '') return '—';
    const d = new Decimal(value);
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(d.toNumber());  // OK porque es solo display
  },

  add(...values: (string | Decimal)[]): string {
    return values.reduce((acc, v) => acc.add(new Decimal(v)), new Decimal(0)).toFixed(2);
  },
};
```

## `lib/reference-range.ts`

Espejo del back para clasificación client-side.

```ts
import Decimal from 'decimal.js';

export type RangeRule = {
  sex: 'F' | 'M' | 'X' | null;
  ageFromYears: number | null;
  ageToYears: number | null;
  band: {
    low: string | null;
    high: string | null;
    criticalLow: string | null;
    criticalHigh: string | null;
  };
};

export type ResultFlag = 'normal' | 'low' | 'high' | 'critical_low' | 'critical_high';

export function classifyResult(valueStr: string, rule: RangeRule): ResultFlag {
  if (!valueStr) return 'normal';
  const v = new Decimal(valueStr);
  const { low, high, criticalLow, criticalHigh } = rule.band;

  if (criticalLow && v.lt(criticalLow)) return 'critical_low';
  if (criticalHigh && v.gt(criticalHigh)) return 'critical_high';
  if (low && v.lt(low)) return 'low';
  if (high && v.gt(high)) return 'high';
  return 'normal';
}

export function formatRangeHint(rule: RangeRule | null, unit: string | null): string | null {
  if (!rule) return null;
  const { low, high } = rule.band;
  if (!low && !high) return null;
  return `${low ?? '−∞'} – ${high ?? '+∞'}${unit ? ` ${unit}` : ''}`;
}
```

## `lib/supabase-browser.ts`

Cliente Supabase para el browser. Singleton.

```ts
'use client';
import { createBrowserClient, type SupabaseClient } from '@supabase/ssr';

let cached: SupabaseClient | undefined;

export function getSupabase(): SupabaseClient {
  if (cached) return cached;
  cached = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  return cached;
}
```

## `lib/supabase-server.ts`

Cliente Supabase para Server Components. Usa cookies de la request.

```ts
import { createServerClient, type SupabaseClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function getSupabaseServer(): Promise<SupabaseClient> {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Components no permiten set cookies, ignore.
          }
        },
      },
    },
  );
}
```

## `lib/auth/session.ts`

Helpers para extraer la sesión del usuario en Server Components.

```ts
import { cache } from 'react';
import { getSupabaseServer } from '@/lib/supabase-server';

export type AppRole = 'admin' | 'recepcion' | 'bioquimico';

export type SessionUser = {
  id: string;
  email: string;
  role: AppRole;
  displayName: string | null;
};

export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await getSupabaseServer();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  const role = (user.app_metadata?.role as AppRole | undefined) ?? null;
  if (!role) return null;

  return {
    id: user.id,
    email: user.email ?? '',
    role,
    displayName: (user.user_metadata?.display_name as string | undefined) ?? null,
  };
});

export const getSessionToken = cache(async (): Promise<string | null> => {
  const supabase = await getSupabaseServer();
  await supabase.auth.getUser();  // refresh si hace falta
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
});

export async function requireRole(allowed: AppRole[]): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new Error('UNAUTHENTICATED');
  if (!allowed.includes(user.role)) throw new Error('FORBIDDEN');
  return user;
}
```

## `lib/api/client.ts`

Cliente axios para el browser (client components).

Detalles completos en `09-API-CLIENT.md`. Resumen:

```ts
'use client';
import axios from 'axios';
import { getSupabase } from '@/lib/supabase-browser';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 30_000,
});

apiClient.interceptors.request.use(async (config) => {
  const supabase = getSupabase();
  const { data } = await supabase.auth.getSession();
  if (data.session?.access_token) {
    config.headers.Authorization = `Bearer ${data.session.access_token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return Promise.reject(err);
  },
);
```

## `lib/api/server.ts`

Cliente axios para Server Components.

```ts
import axios from 'axios';
import { cache } from 'react';
import { getSessionToken } from '@/lib/auth/session';

export const getServerApi = cache(async () => {
  const token = await getSessionToken();
  return axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    timeout: 30_000,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
});
```

## `lib/api/types.ts`

Interfaces compartidas. **Estos son los duplicados manuales del back.** Cuando el back cambia un DTO, hay que actualizar acá.

```ts
// Espejo de los DTOs / outputs del back

export type OrderStatus =
  | 'borrador' | 'confirmada' | 'en_proceso' | 'resultados_cargados'
  | 'emitida' | 'entregada' | 'anulada';

export type OrderOrigin = 'ambulatorio' | 'internacion' | 'urgencia';

export type Patient = {
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
};

export type OrderListItem = {
  id: number;
  protocolNumber: number;
  orderDate: string;
  status: OrderStatus;
  totalParticular: string;
  totalInsurer: string;
  patientFullName: string;
  patientDni: string;
  insurerName: string;
};

// ... etc para Insurer, Doctor, Practice, Result, LabConfig, AdminUser, etc.
```

**REGLA NO NEGOCIABLE:** cuando el back agrega/cambia un campo, hay que actualizar acá. **Sin shared package, la sincronización es manual.** Esto es el costo de tener 2 repos separados.
