# 01 — Stack tecnológico

## Decisiones principales

| Capa | Tecnología | Por qué |
|---|---|---|
| Framework | **Next.js 16** | App Router, Server Components, deploy fácil en Vercel |
| UI lib | **React 19** | última estable |
| Styling | **Tailwind v4** | utility-first, sin config-heavy |
| Componentes base | **Radix UI** (sin shadcn/ui registry, sin compras) | Primitives accesibles, sin estilo opinado |
| Variants | **class-variance-authority (CVA)** | Variantes tipadas en Button, Badge, etc. |
| Forms | **react-hook-form** + DTOs duplicados de back | Manejo de estado + validation |
| Data fetching | **axios** + **TanStack Query** | REST, cache automático, refetching, optimistic updates |
| Auth | **@supabase/ssr** | SSR-safe Supabase auth |
| Icons | **lucide-react** | Conjunto coherente, tree-shakeable |
| Toasts | **sonner** | Bonito y simple |
| Money | **decimal.js** | Mismo que back, display only |
| Format/Lint | **Biome** | Reemplaza ESLint + Prettier |
| Container | (no) | Vercel build directo |

## Dependencias (package.json)

### dependencies

```json
{
  "@hookform/resolvers": "3.10.0",
  "@radix-ui/react-alert-dialog": "1.1.4",
  "@radix-ui/react-checkbox": "1.3.3",
  "@radix-ui/react-dialog": "1.1.4",
  "@radix-ui/react-dropdown-menu": "2.1.4",
  "@radix-ui/react-label": "2.1.1",
  "@radix-ui/react-select": "2.2.6",
  "@radix-ui/react-slot": "1.1.1",
  "@radix-ui/react-tabs": "1.1.13",
  "@supabase/ssr": "0.5.2",
  "@supabase/supabase-js": "2.47.10",
  "@tanstack/react-query": "5.62.11",
  "axios": "^1.7.9",
  "class-variance-authority": "0.7.1",
  "clsx": "2.1.1",
  "decimal.js": "10.6.0",
  "lucide-react": "0.469.0",
  "next": "16.2.6",
  "react": "19.0.0",
  "react-dom": "19.0.0",
  "react-hook-form": "7.54.2",
  "sonner": "1.7.1",
  "tailwind-merge": "2.6.0",
  "zod": "3.24.1"
}
```

### devDependencies

```json
{
  "@biomejs/biome": "1.9.4",
  "@tailwindcss/postcss": "4.0.0",
  "@types/node": "22.10.5",
  "@types/react": "19.0.2",
  "@types/react-dom": "19.0.2",
  "postcss": "8.4.49",
  "rimraf": "6.0.1",
  "tailwindcss": "4.0.0",
  "typescript": "5.7.2"
}
```

## Comparación con la versión anterior

| Antes (con tRPC) | Ahora (REST) |
|---|---|
| `getTrpc(token).patients.search.query({})` | `api.get('/patients', { params: { q } })` |
| Type-safe end-to-end | Types **duplicados** entre back y front |
| Auto-completion del AppRouter | Manual: definir interfaces en `lib/api/types.ts` |
| `@trpc/client`, `@trpc/react-query` | Solo `axios` + `@tanstack/react-query` |

Lo que **NO cambia**:
- Pages y rutas (todas iguales)
- Componentes (Button, Form, ConfirmDialog, etc.)
- Layout (sidebar fijo + topbar + main)
- Auth flow (Supabase Auth)
- Design tokens
- Money display, reference range classification

## Documentación externa

- Next.js 16: https://nextjs.org/docs
- TanStack Query: https://tanstack.com/query/v5
- Radix UI: https://www.radix-ui.com/primitives
- Tailwind v4: https://tailwindcss.com/docs
- Supabase Auth: https://supabase.com/docs/guides/auth
