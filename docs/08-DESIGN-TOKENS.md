# 08 — Design tokens

CSS custom properties + Tailwind v4. Light-only (sin dark mode), look profesional médico.

## Archivo `app/globals.css`

```css
@import 'tailwindcss';

@theme {
  /* === COLOR SYSTEM === */

  /* Surfaces */
  --color-bg: #f7f8fa;
  --color-bg-elevated: #ffffff;
  --color-bg-subtle: #f1f3f6;

  /* Borders */
  --color-border: #e5e7eb;
  --color-border-strong: #d1d5db;
  --color-border-emphasis: #94a3b8;

  /* Text */
  --color-fg: #0f172a;
  --color-fg-muted: #475569;
  --color-fg-subtle: #94a3b8;
  --color-fg-inverse: #ffffff;

  /* Primary (medical blue) */
  --color-primary: #0369a1;
  --color-primary-hover: #075985;
  --color-primary-soft: #e0f2fe;
  --color-primary-foreground: #ffffff;

  /* Semantic */
  --color-success: #15803d;
  --color-success-soft: #dcfce7;
  --color-warning: #b45309;
  --color-warning-soft: #fef3c7;
  --color-danger: #b91c1c;
  --color-danger-soft: #fee2e2;
  --color-danger-foreground: #ffffff;
  --color-info: #1e40af;
  --color-info-soft: #dbeafe;

  /* === SPACING & RADIUS === */
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
  --radius-pill: 999px;

  /* === SHADOWS === */
  --shadow-xs: 0 1px 2px 0 rgb(15 23 42 / 0.05);
  --shadow-sm: 0 1px 3px 0 rgb(15 23 42 / 0.1), 0 1px 2px -1px rgb(15 23 42 / 0.06);
  --shadow-md: 0 4px 6px -1px rgb(15 23 42 / 0.1), 0 2px 4px -2px rgb(15 23 42 / 0.06);
  --shadow-lg: 0 10px 15px -3px rgb(15 23 42 / 0.1), 0 4px 6px -4px rgb(15 23 42 / 0.06);

  /* === TYPOGRAPHY === */
  --font-sans: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'JetBrains Mono', 'SF Mono', Menlo, Monaco, Consolas, monospace;

  /* === MOTION === */
  --ease-out-app: cubic-bezier(0.2, 0.8, 0.2, 1);
  --duration-fast: 120ms;
  --duration-base: 180ms;
}

/* === GLOBAL RESETS === */
*, *::before, *::after { box-sizing: border-box; }

html {
  color-scheme: light;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

body {
  background: var(--color-bg);
  color: var(--color-fg);
  font-family: var(--font-sans);
  font-size: 14px;
  line-height: 1.4286;  /* 20/14 */
  letter-spacing: -0.005em;
  font-feature-settings: 'cv11', 'ss01', 'ss03';
  margin: 0;
}

/* === UTILS === */
.tabular { font-variant-numeric: tabular-nums; font-feature-settings: 'tnum'; }

/* Force light scheme on date/time inputs (Safari/Chrome dark theme override) */
input[type='date'], input[type='time'], input[type='datetime-local'] {
  color-scheme: light;
}
```

## Tipografía

- **Sans**: Inter desde `next/font/google`.
- **Mono**: JetBrains Mono para tablas numéricas y códigos.

`app/layout.tsx`:

```tsx
import { Inter, JetBrains_Mono } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR" className={`${inter.variable} ${mono.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
```

## Escala de tamaños de texto

Usar utilities de Tailwind:

| Uso | Class | px |
|---|---|---|
| Page title h1 | `text-xl font-semibold` | 20px |
| Section title h2/h3 | `text-base font-semibold` | 16px |
| Body | `text-sm` (default) | 14px |
| Caption / hint | `text-xs` | 12px |
| Micro / labels | `text-[10px]` | 10px |

## Paleta práctica de uso

### Estados de orden

| Estado | Color base | Soft (bg) |
|---|---|---|
| borrador | `--color-fg-subtle` | `--color-bg-subtle` |
| confirmada | `--color-info` | `--color-info-soft` |
| en_proceso | `--color-warning` | `--color-warning-soft` |
| resultados_cargados | `--color-info` | `--color-info-soft` |
| emitida / entregada | `--color-success` | `--color-success-soft` |
| anulada | `--color-danger` | `--color-danger-soft` |

### Roles de usuario

| Rol | Color base |
|---|---|
| admin | `--color-primary` |
| recepcion | `--color-warning` |
| bioquimico | `--color-success` |

### Flags de resultados

| Flag | Color |
|---|---|
| normal | `--color-success` |
| low / high | `--color-warning` |
| critical_low / critical_high | `--color-danger` (font-semibold) |

## Patrones de UI recurrentes

### Card / contenedor

```tsx
<section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] shadow-[var(--shadow-xs)]">
  {/* contenido */}
</section>
```

### Tabla

```tsx
<table className="w-full text-sm">
  <thead>
    <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-subtle)] text-[10px] uppercase tracking-wide text-[var(--color-fg-muted)]">
      <th className="px-5 py-2.5 text-left font-medium">Col</th>
    </tr>
  </thead>
  <tbody>
    <tr className="border-b border-[var(--color-border)] hover:bg-[var(--color-bg-subtle)]">
      <td className="px-5 py-3">Val</td>
    </tr>
  </tbody>
</table>
```

### Badge / Pill

```tsx
<span className="inline-flex items-center rounded-md border px-2 py-0.5 font-medium text-[10px] uppercase tracking-wide [border-color] [bg] [color]">
  Label
</span>
```

## Layout principal

- Sidebar: ancho fijo `w-60` (240px), `hidden md:flex` (oculto en mobile).
- Topbar: `h-14` (56px), justify-end.
- Main: `max-w-[1440px] mx-auto px-6 py-8 lg:px-8`.

## Iconos

Usar lucide-react. Tamaño default: `h-4 w-4`. Stroke width: `2`.

```tsx
import { Home } from 'lucide-react';

<Home className="h-4 w-4" strokeWidth={2} />
```

## Reglas estrictas

1. **NUNCA usar colores hardcoded** (`#ff0000`, `text-red-500`). Siempre tokens CSS o utilities Tailwind con tokens.
2. **NUNCA usar `<img>` con URLs de Tailwind**. Para logos externos, `<img>` simple con la URL de `logoUrl` del lab_config.
3. **Tablas siempre con `.tabular`** para números alineados.
4. **Toasts solo via sonner** (`import { toast } from 'sonner'`). No hardcodear feedback en el DOM.
