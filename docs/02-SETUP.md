# 02 — Setup desde cero

## Pre-requisitos

```bash
node --version       # >= 20.11.0
corepack enable
corepack prepare pnpm@9.15.4 --activate
```

## Paso 1: Crear el proyecto Next.js

```bash
cd ~/Desktop
pnpm create next-app@latest lab-front

# Responder:
# ✔ Would you like to use TypeScript?            Yes
# ✔ Would you like to use ESLint?                No  (usamos Biome)
# ✔ Would you like to use Tailwind CSS?          Yes
# ✔ Would you like your code inside a `src/`?    No
# ✔ Would you like to use App Router?            Yes
# ✔ Would you like to use Turbopack for `next dev`? Yes
# ✔ Would you like to customize the import alias `@/*`? No (default)

cd lab-front
```

## Paso 2: Instalar dependencias

```bash
# Radix UI primitives
pnpm add @radix-ui/react-alert-dialog@1.1.4 \
         @radix-ui/react-checkbox@1.3.3 \
         @radix-ui/react-dialog@1.1.4 \
         @radix-ui/react-dropdown-menu@2.1.4 \
         @radix-ui/react-label@2.1.1 \
         @radix-ui/react-select@2.2.6 \
         @radix-ui/react-slot@1.1.1 \
         @radix-ui/react-tabs@1.1.13

# Supabase
pnpm add @supabase/ssr@0.5.2 @supabase/supabase-js@2.47.10

# Data fetching
pnpm add @tanstack/react-query@5.62.11 axios

# Forms
pnpm add react-hook-form@7.54.2 @hookform/resolvers@3.10.0 zod@3.24.1

# Utility
pnpm add class-variance-authority@0.7.1 clsx@2.1.1 tailwind-merge@2.6.0 \
         lucide-react@0.469.0 sonner@1.7.1 decimal.js@10.6.0

# Dev
pnpm add -D @biomejs/biome@1.9.4 rimraf
```

## Paso 3: Configurar Biome

`biome.json`:

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "files": { "ignoreUnknown": true },
  "vcs": { "enabled": true, "clientKind": "git", "useIgnoreFile": true },
  "linter": { "enabled": true, "rules": { "recommended": true } },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "javascript": { "formatter": { "quoteStyle": "single", "semicolons": "always", "trailingCommas": "all" } }
}
```

Scripts en `package.json`:

```json
{
  "scripts": {
    "dev": "next dev --port 3000",
    "build": "next build",
    "start": "next start",
    "lint": "biome check .",
    "lint:fix": "biome check --write .",
    "typecheck": "tsc --noEmit",
    "clean": "rimraf .next .turbo"
  }
}
```

## Paso 4: Estructura de carpetas

```bash
mkdir -p app/{(app),(auth)}
mkdir -p app/(app)/{ordenes,pacientes,medicos,practicas,obras-sociales,reportes,admin}
mkdir -p app/(app)/admin/{config-lab,usuarios,valor-ub}
mkdir -p app/(auth)/login

mkdir -p components/{domain,layout,ui,providers}
mkdir -p lib/{auth,api}
```

Resultado:

```
lab-front/
├── app/
│   ├── (app)/              # Layout autenticado
│   │   ├── layout.tsx      # Sidebar + Topbar
│   │   ├── page.tsx        # Home dashboard
│   │   ├── ordenes/
│   │   │   ├── page.tsx
│   │   │   ├── nueva/page.tsx
│   │   │   └── [id]/
│   │   │       ├── page.tsx
│   │   │       ├── resultados/page.tsx
│   │   │       └── informe/page.tsx
│   │   ├── pacientes/
│   │   │   ├── page.tsx
│   │   │   └── nuevo/page.tsx
│   │   ├── medicos/ ...
│   │   ├── practicas/page.tsx
│   │   ├── obras-sociales/ ...
│   │   ├── reportes/page.tsx
│   │   └── admin/
│   │       ├── page.tsx
│   │       ├── config-lab/page.tsx
│   │       ├── usuarios/page.tsx
│   │       └── valor-ub/page.tsx
│   ├── (auth)/
│   │   └── login/page.tsx
│   ├── layout.tsx          # Root layout (TrpcProvider, Toaster)
│   └── globals.css         # Tokens CSS + Tailwind
├── components/
│   ├── domain/             # Componentes con lógica de negocio
│   ├── layout/             # Sidebar, Topbar, PageHeader
│   ├── ui/                 # Primitives (Button, Input, Dialog)
│   └── providers/          # QueryClientProvider, ToastProvider
├── lib/
│   ├── auth/
│   │   └── session.ts      # getSessionUser, AppRole types
│   ├── api/
│   │   ├── client.ts       # axios instance + interceptors
│   │   ├── server.ts       # SSR-safe axios
│   │   └── types.ts        # interfaces compartidas
│   ├── supabase-browser.ts
│   ├── supabase-server.ts
│   ├── money.ts
│   ├── reference-range.ts
│   └── cn.ts
├── middleware.ts           # Protección de rutas
├── next.config.ts
├── tailwind.config.ts
└── biome.json
```

## Paso 5: Tailwind v4 setup

`postcss.config.mjs`:

```javascript
export default {
  plugins: { '@tailwindcss/postcss': {} },
};
```

`app/globals.css` (mínimo inicial):

```css
@import 'tailwindcss';

:root {
  /* Los tokens completos van en 08-DESIGN-TOKENS.md */
  --color-primary: #0369a1;
  /* ... */
}
```

## Paso 6: Configurar TypeScript

`tsconfig.json` (Next ya lo crea con buenos defaults, agregar):

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

## Paso 7: Verificar que arranca

```bash
pnpm dev
```

Abrir `http://localhost:3000` → debería ver la home de Next por default.

## Paso 8: Init git

`.gitignore` (Next ya lo crea, asegurar):

```
node_modules/
.next/
.env*.local
.env
.vercel/
```

```bash
git init
git add .
git commit -m "chore: initial Next.js setup"
git branch -M main
git remote add origin https://github.com/<TU_USER>/lab-front.git
git push -u origin main
```

Listo. Después seguís con **03-ENV.md** → **08-DESIGN-TOKENS.md** → **05-COMPONENTS.md** → **04-PAGES.md** en ese orden.
