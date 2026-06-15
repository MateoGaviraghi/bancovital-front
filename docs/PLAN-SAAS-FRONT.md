# PLAN SAAS — FRONT (bancovital-front)

> Qué le toca al FRONT en cada fase del plan maestro multi-tenant. El contrato API de cada fase se cierra ANTES de tocar código (lo define el líder técnico en este repo) y el espejo vive en `lib/api/types.ts`. Contraparte backend: `bancovital-back/12-PLAN-SAAS.md`.
> Aprobado por Mateo el 2026-06-12. Decisiones cerradas: tenancy path-based, firma propia con evidencia, rollover 1 mes, soft-block de cupo, booking propio con Google Calendar, portal paciente confirmado.
>
> ⚠️ **CAMBIO DE MODELO (2026-06-15) — app ÚNICA bancovital, SIN slug.** Se abandonó el white-label per-lab: rutas sin `/{slug}` (`app/[slug]` eliminado), login único `/login` (ruteo post-login por rol: super→`/super`, lab→`/inicio`), tema FIJO bancovital (sin theming OKLCH por lab; `lib/tenant/` borrado), branding del lab SOLO en header + membrete del PDF (sin colores por lab). El header arma logo+nombre desde `/me` (`LabProvider`/`useLab`). **Esto SUPERSEDE la tenancy/theming por slug de F1** (login brandeado, CSS vars por lab) **y el color self-service de F6** (queda solo subir logo + eslogan). F1–F7 EN PRODUCCIÓN. Detalle: memoria `arquitectura-tenancy-seguridad.md`. (front commit `65aeb26`, en prod 2026-06-15.)

## Estado

| Fase | Estado |
|---|---|
| F1 Tenancy + theming | ✅ COMPLETA — en producción 2026-06-12 (`bancovital-front.vercel.app/{slug}/login` verificado con theming dinámico). Ambiente dev: Vercel Preview (branch dev) → back-dev Railway |
| F2 Planes y cuotas (UI) | Pendiente |
| F3 Contratación (`/contratar/{token}`) | Implementada 2026-06-13 (commit `3db0247` en dev) — página pública con stepper 4 pasos (propuesta/plan/facturación/OTP+firma signature_pad), tema Nodo scoped, `/super/contracts` completo. QA e2e del flujo 9/9. Pendiente: QA visual Mateo + Resend key para OTP real + merge main |
| F4 Landing + booking | Implementada en dev 2026-06-13 (front eaad3ef, back 40006e0). Landing en `/` (anon) + flujo de reserva + super/reuniones. Google Calendar ENCHUFABLE (falta OAuth creds para activar disponibilidad real + Meet; sin creds funciona con horarios config + emails Resend). Visual distintivo → F8. Pendiente: QA + merge main |
| F5 Super power-ups (UI) | Pendiente |
| F6 Personalización admin | Pendiente |
| F7 Portal paciente | Pendiente |
| F8 /mejorar-web + polish | Pendiente |

## F1 — Tenancy + theming dinámico

- Reestructurar rutas: mover `(app)` y `(auth)` bajo segmento dinámico `app/[slug]/` → `/{slug}/login`, `/{slug}/ordenes`, etc. `(super)` y `(print)` se adaptan (print queda bajo tenant).
- Layout del tenant: resuelve branding por slug (endpoint público nuevo `GET /api/public/labs/{slug}/branding`), inyecta CSS variables (`--color-primary`, `--color-primary-hover`, `--color-primary-soft`, focos) derivadas vía OKLCH desde el color primario del lab. La UI entera ya consume tokens — no se toca componente por componente.
- Login brandeado por tenant: logo + nombre + paleta del lab ANTES de autenticar (datos del endpoint público, nada sensible).
- **Seguridad slug (regla de oro: slug = ruteo/branding, JAMÁS autorización):** guard en el layout que compara slug de URL vs `labId` de la sesión → mismatch = redirect al slug propio, sin flash de datos. La protección real es server-side en el back (labId del JWT).
- Eliminar el teal hardcodeado de `app/(auth)/login/page.tsx`, `app/(auth)/layout.tsx` y `globals.css` (pasa a ser default/fallback).
- Redirects de compatibilidad desde las rutas viejas sin slug.

## F2 — Planes y cuotas (UI)

- Super: CRUD de planes (cupo órdenes/mes, precio, precio por excedente), asignación de plan a lab.
- Lab: indicador de consumo del ciclo (usadas / cupo + rollover vigente) en dashboard/sidebar; banners al 80% y 100% (al 100% se sigue operando — soft-block — con aviso "órdenes excedentes se facturan aparte").
- Tipos nuevos en `types.ts`: `Plan`, `Suscripcion`, `ConsumoCiclo`.

## F3 — Contratación (`/contratar/{token}`)

- Página PÚBLICA fuera del tenant: resumen de propuesta → selección de plan (cards) → datos de facturación → firma.
- Firma propia: canvas de firma dibujada + OTP por email (request/verify) + checkbox de aceptación expresa de cláusulas. La evidencia (hash, IP, UA, timestamp) la arma el back.
- Token expirado/inválido → pantalla clara con contacto.
- Panel super: crear propuesta (form → genera PDF contrato), listar contratos con estado (enviado/firmado/vencido), descargar PDF firmado + evidencia.

## F4 — Landing + booking (solo front)

- `/` landing: header con anclas y scroll suave, hero profesional NO genérico, secciones servicios → clientes ("Confían en nosotros") → reseñas → agendar reunión.
- Booking propio: route handlers Next server-side contra Google Calendar API (OAuth refresh token de la cuenta Nodo) — disponibilidad real, crea evento con Meet, invitación al cliente.
- Emails con diseño: Resend + React Email (confirmación de reunión, contacto).
- Env vars nuevas: credenciales Google OAuth + `RESEND_API_KEY` (server-only, sin `NEXT_PUBLIC_`).
- Skills al ejecutar: `impeccable`, `web-distintiva`, `scroll-animations`, `ui-animation`.

## F5 — Super power-ups (UI)

- Impersonation: "entrar como lab X" con banner permanente visible + salir; todo auditado (audit log lo provee el back).
- Métricas: labs activos, órdenes/mes por lab, % de uso de plan, MRR estimado.
- Estado de cuenta por lab: registrar pagos manuales, marcar moroso, suspender/reactivar.
- Export/backup de datos de un lab (botón → descarga generada por el back).
- Anuncios/mantenimiento: banner global o por lab. Onboarding checklist por lab.

## F6 — Personalización total del admin

- Branding self-service: color primario + logo con **preview en vivo** (se ve el repintado antes de guardar).
- Editor visual de PDF de informes (evoluciona la config existente de `preferencia_pdf`: fondo, posiciones, márgenes, firmas).
- Sedes/ubicaciones: CRUD (dirección, teléfono, horarios) — aparecen en PDF y portal.

## F7 — Portal del paciente

- `/r/{token}` público brandeado por lab: valida DNI → descarga su informe (signed URL). Sin cuenta, sin app. El QR viene impreso en el PDF del informe (lo genera el back).

## F8 — REDISEÑO TOTAL (decisión Mateo 2026-06-13: TODO el diseño se hace acá, en una pasada)

Hasta F8 todo sale funcional/plano A PROPÓSITO (no retrabajar antes de tener la estructura). Mateo marcó lo actual como "genérico/vergüenza" → F8 NO puede salir genérico. Skills obligatorias: web-distintiva, impeccable, gsap-scrolltrigger, ui-animation, ui-ux-pro-max.

Alcance (cada superficie sale de "corporativo plantilla" a distintivo):
1. **`/contratar/[token]`** — página de firma con identidad Nodo real (logo image, no texto "NODO"). Es lo que ve un cliente que va a pagar: máxima prioridad.
2. **PDF del contrato** (back: `src/pdf/templates/contrato.tsx`) — rediseño premium: tipografía, layout, logo real, bloque de firma con jerarquía.
3. **Logo real** — logoUrl ya está cableado (sidebar/login/PDF lo muestran si existe); asegurar flujo fácil de subir logo del lab + meter logo Nodo en superficies de contratación.
4. **App interna** — super (labs/plans/contracts), dashboard lab, forms, tablas, login tenant.
5. **Landing (F4)** entra en la pasada de coherencia final.

Anti-genérico = requisito duro: nada de Inter/slate/rounded-2xl/hero centrado/3-col grid por defecto. Mantener: jerarquía clara, estados explícitos, confirmación solo en destructivo, alertas accionables.
