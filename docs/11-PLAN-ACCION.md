# 11 — Plan de acción

Orden de tareas para construir `lab-front` desde cero. Pre-requisito: **`lab-back` ya debe estar arriba** (en Railway o local) para poder probar end-to-end.

Estimado total: **3-4 días** trabajando full time.

## FASE 0 — Infraestructura externa (30 min)

1. Crear repo en GitHub: `lab-front` (privado).
2. Tener a mano:
   - URL del back (`lab-back-production-xxxx.up.railway.app/api` o `http://localhost:4000/api`)
   - Supabase project URL + anon key
3. Crear proyecto en Vercel (después del primer commit).

## FASE 1 — Setup base (medio día)

Seguir **02-SETUP.md** punto por punto.

- [ ] `pnpm create next-app@latest lab-front`
- [ ] Instalar todas las dependencies de `01-STACK.md`
- [ ] Configurar Biome
- [ ] Crear estructura de carpetas
- [ ] Configurar `tsconfig.json` con paths `@/*`
- [ ] Configurar `.env.local` (ver `03-ENV.md`)
- [ ] Crear `app/globals.css` con tokens de `08-DESIGN-TOKENS.md`
- [ ] Configurar `next/font` para Inter + JetBrains Mono
- [ ] Bootstrap: `app/layout.tsx` con `<html lang="es-AR">` y QueryProvider + Toaster
- [ ] Verificar que arranca: `pnpm dev` → `http://localhost:3000`
- [ ] `git init`, primer commit, push a GitHub

**Salida:** repo vacío con Next.js arrancando.

## FASE 2 — Auth (medio día)

Seguir **06-LIB.md** + **07-MIDDLEWARE.md**.

- [ ] `lib/supabase-browser.ts`
- [ ] `lib/supabase-server.ts`
- [ ] `lib/auth/session.ts` con `getSessionUser`, `getSessionToken`, `requireRole`
- [ ] `middleware.ts` con protección de rutas
- [ ] `app/(auth)/login/page.tsx` con form de email + password
- [ ] Verificar: ir a `/` sin login → redirect a `/login`. Login → redirect a `/`.

**Salida:** auth flow funcional contra Supabase.

## FASE 3 — UI Primitives (1 día)

Seguir **05-COMPONENTS.md** sección UI.

- [ ] `components/ui/button.tsx` con CVA variants
- [ ] `components/ui/input.tsx`
- [ ] `components/ui/textarea.tsx`
- [ ] `components/ui/label.tsx` (Radix)
- [ ] `components/ui/select.tsx` (Radix)
- [ ] `components/ui/checkbox.tsx` (Radix)
- [ ] `components/ui/card.tsx`
- [ ] `components/ui/dialog.tsx` (Radix)
- [ ] `components/ui/alert-dialog.tsx` (Radix)
- [ ] `components/ui/dropdown-menu.tsx` (Radix)
- [ ] `components/ui/tabs.tsx` (Radix)
- [ ] `components/ui/form-field.tsx` (wrapper label + control + error)
- [ ] `components/ui/toaster.tsx` (Sonner wrapper)
- [ ] `components/providers/query-provider.tsx` (QueryClientProvider)

**Salida:** primitives listas para componer.

## FASE 4 — Layout (medio día)

Seguir **05-COMPONENTS.md** sección Layout.

- [ ] `components/layout/sidebar.tsx` (con branding desde lab_config)
- [ ] `components/layout/topbar.tsx` (dropdown con logout)
- [ ] `components/layout/page-header.tsx`
- [ ] `components/layout/empty-state.tsx`
- [ ] `app/(app)/layout.tsx` que protege rutas + carga branding + arma sidebar + topbar
- [ ] `app/(app)/page.tsx` Home con KPI cards placeholder

**Salida:** shell del app navegable.

## FASE 5 — Domain components (medio día)

Seguir **05-COMPONENTS.md** sección Domain.

- [ ] `components/domain/money-display.tsx`
- [ ] `components/domain/status-pill.tsx`
- [ ] `components/domain/confirm-dialog.tsx`
- [ ] `lib/money.ts`
- [ ] `lib/reference-range.ts`
- [ ] `components/domain/result-input.tsx`

**Salida:** componentes específicos del negocio listos.

## FASE 6 — API client (medio día)

Seguir **06-LIB.md** + **09-API-CLIENT.md**.

- [ ] `lib/api/client.ts` (axios browser con interceptor de auth)
- [ ] `lib/api/server.ts` (axios SSR con token de cookie)
- [ ] `lib/api/types.ts` (interfaces espejo del back)
- [ ] `lib/api/queries.ts` (query keys helpers)
- [ ] Probar manualmente: una página Server Component que hace `api.get('/healthz')` y muestra el resultado

**Salida:** front se puede comunicar con back.

## FASE 7 — Pages básicas (1.5 días)

Seguir **04-PAGES.md**.

Orden recomendado (de lo más simple a lo más complejo):

- [ ] `pacientes/page.tsx` (Server) + `pacientes/nuevo/page.tsx` (Client form)
- [ ] `components/domain/patient-form.tsx`
- [ ] `medicos/page.tsx` + `medicos/nuevo/page.tsx`
- [ ] `components/domain/doctor-form.tsx`
- [ ] `practicas/page.tsx` con búsqueda
- [ ] `obras-sociales/page.tsx` + `obras-sociales/nueva/page.tsx`
- [ ] `components/domain/insurer-row-actions.tsx`

**Salida:** CRUD básicos navegables.

## FASE 8 — Órdenes (1 día)

- [ ] `components/domain/patient-combobox.tsx` (search + select)
- [ ] `components/domain/doctor-combobox.tsx`
- [ ] `components/domain/nbu-grid.tsx` (multi-select de prácticas)
- [ ] `ordenes/nueva/new-order-form.tsx` con paciente + médico + obra + prácticas
- [ ] `ordenes/nueva/page.tsx`
- [ ] `ordenes/page.tsx` con tabla + filtros
- [ ] `ordenes/filters.tsx` (client)
- [ ] `ordenes/[id]/page.tsx` con tabs (Datos, Líneas, Totales)

**Salida:** flujo de creación de orden completo.

## FASE 9 — Resultados + Informe (medio día)

- [ ] `ordenes/[id]/resultados/page.tsx` (Server)
- [ ] `ordenes/[id]/resultados/results-form.tsx` (Client) con `<ResultInput>` por línea
- [ ] `ordenes/[id]/informe/page.tsx`
- [ ] `ordenes/[id]/informe/emit-panel.tsx` con botón emitir + descargar PDF
- [ ] `components/domain/download-pdf-button.tsx`

**Salida:** flujo completo end-to-end: crear orden → cargar resultados → emitir PDF.

## FASE 10 — Reportes + Admin (medio día)

- [ ] `reportes/page.tsx` con KPI cards + tabla por estado/obra
- [ ] `admin/page.tsx` (hub)
- [ ] `admin/config-lab/page.tsx` + form con ConfirmDialog (incluyendo checkbox de regenerar)
- [ ] `admin/usuarios/page.tsx` + `users-table.tsx` con invite/role/active
- [ ] `admin/valor-ub/page.tsx` + `ub-editor.tsx`

**Salida:** todo el sistema operable.

## FASE 11 — Deploy a Vercel (medio día)

Seguir **10-DEPLOY.md**.

- [ ] Crear proyecto Vercel apuntando al repo
- [ ] Setear env vars (production + preview + development)
- [ ] Deploy inicial
- [ ] Actualizar `CORS_ALLOWED_ORIGINS` del back con el dominio de Vercel
- [ ] Verificar flujo completo en producción

**Salida:** sistema en producción.

## FASE 12 — Pulido y handoff (medio día)

- [ ] Logo del lab subido (Supabase Storage o algún CDN gratis tipo Cloudinary)
- [ ] `lab_config` poblado con datos reales
- [ ] Algunos pacientes, médicos, obras sociales de ejemplo
- [ ] Probar el flujo completo con un usuario admin y uno bioquímico
- [ ] README con instrucciones de setup
- [ ] `.env.example` commiteado (sin valores)

## Checklist final pre-handoff

- [ ] Todos los pages renderizan sin error 500
- [ ] Auth flow OK (login + logout + protección de rutas)
- [ ] CRUD pacientes, médicos, obras sociales funciona
- [ ] Orden completa end-to-end con PDF
- [ ] Admin: cambiar lab_config + regenerar informes
- [ ] Admin: invitar usuario nuevo
- [ ] Sin warnings de TypeScript (`pnpm typecheck`)
- [ ] Lint OK (`pnpm lint`)
- [ ] Vercel deploy verde

## Errores comunes

| Error | Causa | Solución |
|---|---|---|
| 401 al cargar páginas | falta `Authorization` header | revisar interceptor de axios |
| CORS error | dominio del front no en `CORS_ALLOWED_ORIGINS` del back | agregar en Railway env vars |
| Pantalla blanca después de login | `NEXT_PUBLIC_API_URL` mal apuntado | verificar URL incluye `/api` |
| "Module not found" | falta `pnpm install` después de cambiar package.json | reinstalar |
| Sidebar en blanco | `lab_config` no tiene fila | insertar fila inicial en Supabase |
| PDF no abre | bucket `reports` no existe o no público | crear bucket en Supabase Storage |

## Cuando todo esté listo

→ Sistema completo en producción. Documentar en un `ONBOARDING.md` cómo hacer cambios típicos:
- Agregar campo a un formulario
- Crear un endpoint nuevo
- Actualizar un schema de DB
- Deployar un fix
