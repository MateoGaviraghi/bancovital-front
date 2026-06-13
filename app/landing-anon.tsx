'use client';

import { BookingFlow } from '@/components/domain/booking-flow';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BarChart3, CheckCircle2, FileText, Layers, Shield, Users } from 'lucide-react';
import Link from 'next/link';
import { useRef } from 'react';

// ─── Datos editables ─────────────────────────────────────────────────────────

// TODO: reemplazar por clientes reales cuando el equipo los confirme
const CLIENTES = [
  { id: 1, nombre: 'Laboratorio Belgrano' },
  { id: 2, nombre: 'BioAnálisis Central' },
  { id: 3, nombre: 'Lab. Santa Rosa' },
  { id: 4, nombre: 'Diagnóstico Norte' },
  { id: 5, nombre: 'Bioquímica del Sur' },
];

// TODO: reemplazar por testimonios reales
const TESTIMONIOS = [
  {
    id: 1,
    texto:
      'Desde que implementamos Nodo, el tiempo que pasamos en administración bajó a la mitad. La generación de informes PDF y la gestión de órdenes son muy sólidas.',
    nombre: 'Dra. M. González',
    cargo: 'Directora técnica, BioAnálisis Central',
  },
  {
    id: 2,
    texto:
      'El onboarding fue rápido y el sistema quedó con nuestra marca desde el primer día. El soporte es ágil y transparente.',
    nombre: 'Lic. R. Pereyra',
    cargo: 'Jefe de sistemas, Laboratorio Belgrano',
  },
  {
    id: 3,
    texto:
      'La contratación 100% digital nos ahorró semanas de ida y vuelta. La firma electrónica funciona perfecto.',
    nombre: 'Dr. F. Sosa',
    cargo: 'Propietario, Lab. Santa Rosa',
  },
];

const FEATURES = [
  {
    icon: Shield,
    titulo: 'Sistema white-label por laboratorio',
    descripcion:
      'Cada laboratorio opera con su propia URL, logo, colores y configuración. Sin confusiones, sin datos cruzados.',
  },
  {
    icon: FileText,
    titulo: 'Gestión de órdenes y resultados',
    descripcion:
      'Circuito completo desde la recepción hasta la entrega: órdenes, prácticas, carga de resultados con rangos de referencia.',
  },
  {
    icon: BarChart3,
    titulo: 'Informes PDF profesionales',
    descripcion:
      'Generación automática de informes con membrete del laboratorio, firma del profesional y entrega vía QR al paciente.',
  },
  {
    icon: Layers,
    titulo: 'Planes por consumo mensual',
    descripcion:
      'Pagás por lo que usás. Cupo de órdenes mensual con rollover de 30 días y excedentes blandos sin cortes de servicio.',
  },
  {
    icon: CheckCircle2,
    titulo: 'Contratación con firma digital',
    descripcion:
      'Propuesta, selección de plan, datos de facturación y firma electrónica con OTP y evidencia legal — sin papel.',
  },
  {
    icon: Users,
    titulo: 'Multi-usuario con roles',
    descripcion:
      'Roles diferenciados: admin, recepción y bioquímico. Cada rol accede solo a lo que necesita.',
  },
];

// ─── QueryClient singleton para la landing ───────────────────────────────────

function useLandingQueryClient() {
  const ref = useRef<QueryClient | null>(null);
  if (!ref.current) {
    ref.current = new QueryClient({
      defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
    });
  }
  return ref.current;
}

// ─── Componente principal ────────────────────────────────────────────────────

export function LandingAnon() {
  const queryClient = useLandingQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <div
        className="min-h-screen bg-[var(--color-bg)]"
        style={{ scrollBehavior: 'smooth' } as React.CSSProperties}
      >
        {/* ── HEADER ── */}
        <Header />

        <main>
          {/* ── HERO ── */}
          <section
            id="inicio"
            className="border-b border-[var(--color-border)] bg-[var(--color-bg-elevated)]"
          >
            <div className="mx-auto max-w-5xl px-6 py-20 lg:px-8 lg:py-28">
              <h1 className="max-w-3xl font-bold text-[var(--color-fg)] text-3xl leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                El sistema de gestión que los laboratorios bioquímicos necesitaban
              </h1>
              <p className="mt-5 max-w-xl text-[var(--color-fg-muted)] text-base leading-relaxed sm:text-lg">
                Nodo es una plataforma white-label: cada laboratorio opera con su propia marca, URL
                y configuración, sin complejidad técnica. Órdenes, resultados, informes PDF y
                facturación en un solo lugar.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#agendar"
                  className="inline-flex items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)] px-5 py-2.5 font-medium text-[var(--color-primary-foreground)] text-sm transition-colors hover:bg-[var(--color-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                >
                  Agendá una reunión
                </a>
                <a
                  href="#servicios"
                  className="inline-flex items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] px-5 py-2.5 font-medium text-[var(--color-fg)] text-sm transition-colors hover:bg-[var(--color-bg-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                >
                  Cómo funciona
                </a>
              </div>
            </div>
          </section>

          {/* ── SERVICIOS ── */}
          <section id="servicios" className="scroll-mt-14 border-b border-[var(--color-border)]">
            <div className="mx-auto max-w-5xl px-6 py-16 lg:px-8 lg:py-20">
              <SectionLabel>Qué hace Nodo</SectionLabel>
              <h2 className="mt-2 font-bold text-[var(--color-fg)] text-2xl tracking-tight sm:text-3xl">
                Un sistema completo, adaptado a tu laboratorio
              </h2>
              <p className="mt-3 max-w-2xl text-[var(--color-fg-muted)] text-sm leading-relaxed sm:text-base">
                Diseñado específicamente para laboratorios bioquímicos. Sin módulos irrelevantes,
                sin configuración compleja.
              </p>

              <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {FEATURES.map((f) => (
                  <FeatureCard
                    key={f.titulo}
                    icon={f.icon}
                    titulo={f.titulo}
                    descripcion={f.descripcion}
                  />
                ))}
              </div>
            </div>
          </section>

          {/* ── CLIENTES ── */}
          <section
            id="clientes"
            className="scroll-mt-14 border-b border-[var(--color-border)] bg-[var(--color-bg-elevated)]"
          >
            <div className="mx-auto max-w-5xl px-6 py-14 lg:px-8 lg:py-16">
              <SectionLabel>Laboratorios que confían en Nodo</SectionLabel>
              <h2 className="mt-2 font-bold text-[var(--color-fg)] text-2xl tracking-tight sm:text-3xl">
                Confían en nosotros
              </h2>

              <div className="mt-8 flex flex-wrap gap-3">
                {CLIENTES.map((c) => (
                  <span
                    key={c.id}
                    className="inline-flex items-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2 text-sm font-medium text-[var(--color-fg-muted)]"
                  >
                    {c.nombre}
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* ── RESEÑAS ── */}
          <section id="resenas" className="scroll-mt-14 border-b border-[var(--color-border)]">
            <div className="mx-auto max-w-5xl px-6 py-16 lg:px-8 lg:py-20">
              <SectionLabel>Lo que dicen</SectionLabel>
              <h2 className="mt-2 font-bold text-[var(--color-fg)] text-2xl tracking-tight sm:text-3xl">
                La experiencia de quienes ya lo usan
              </h2>

              <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {TESTIMONIOS.map((t) => (
                  <TestimonioCard key={t.id} texto={t.texto} nombre={t.nombre} cargo={t.cargo} />
                ))}
              </div>
            </div>
          </section>

          {/* ── AGENDAR ── */}
          <section
            id="agendar"
            className="scroll-mt-14 border-b border-[var(--color-border)] bg-[var(--color-bg-elevated)]"
          >
            <div className="mx-auto max-w-5xl px-6 py-16 lg:px-8 lg:py-20">
              <SectionLabel>Reunión sin compromiso</SectionLabel>
              <h2 className="mt-2 font-bold text-[var(--color-fg)] text-2xl tracking-tight sm:text-3xl">
                Agendá una reunión con el equipo de Nodo
              </h2>
              <p className="mt-3 max-w-xl text-[var(--color-fg-muted)] text-sm leading-relaxed sm:text-base">
                Contanos tu caso en 30 minutos. Sin compromiso, sin costo. Te mostramos el sistema
                adaptado a tu laboratorio.
              </p>

              <div className="mt-8">
                <BookingFlow />
              </div>
            </div>
          </section>
        </main>

        {/* ── FOOTER ── */}
        <Footer />
      </div>
    </QueryClientProvider>
  );
}

// ─── Sub-componentes ─────────────────────────────────────────────────────────

function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-bg-elevated)] backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-6 px-6 lg:px-8">
        {/* Logo/wordmark */}
        <a
          href="#inicio"
          className="font-bold text-[var(--color-fg)] text-lg tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
          aria-label="Nodo — inicio"
        >
          Nodo
        </a>

        {/* Nav anclas — oculta en móvil pequeño */}
        <nav
          className="hidden flex-1 items-center gap-5 sm:flex"
          aria-label="Secciones de la página"
        >
          {[
            { href: '#servicios', label: 'Servicios' },
            { href: '#clientes', label: 'Clientes' },
            { href: '#resenas', label: 'Reseñas' },
            { href: '#agendar', label: 'Agendar' },
          ].map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className="text-[var(--color-fg-muted)] text-sm transition-colors hover:text-[var(--color-fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="ml-auto">
          <Link
            href="/login"
            className="inline-flex items-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5 text-sm font-medium text-[var(--color-fg-muted)] transition-colors hover:border-[var(--color-border-strong)] hover:text-[var(--color-fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
          >
            Ingresar
          </Link>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-bg-elevated)]">
      <div className="mx-auto max-w-5xl px-6 py-10 lg:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-bold text-[var(--color-fg)] text-base">Nodo</p>
            <a
              href="https://nodotech.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 text-sm text-[var(--color-primary)] hover:underline"
            >
              nodotech.dev
            </a>
          </div>

          <div className="flex flex-col gap-1 text-sm text-[var(--color-fg-muted)]">
            <p className="font-medium text-[var(--color-fg)] text-xs uppercase tracking-wide">
              Contacto comercial
            </p>
            <p>Mateo Gaviraghi — +54 9 3425 16-2081</p>
            <p>Justo González Viescas — +54 9 3425 26-7005</p>
          </div>

          <div className="flex flex-col gap-2">
            <Link
              href="/login"
              className="text-sm text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
            >
              Acceso clientes
            </Link>
          </div>
        </div>

        <p className="mt-8 border-t border-[var(--color-border)] pt-6 text-xs text-[var(--color-fg-subtle)]">
          © {year} Nodo. Sistema de gestión para laboratorios bioquímicos.
        </p>
      </div>
    </footer>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-medium text-[10px] text-[var(--color-primary)] uppercase tracking-widest">
      {children}
    </p>
  );
}

function FeatureCard({
  icon: Icon,
  titulo,
  descripcion,
}: {
  icon: React.ElementType;
  titulo: string;
  descripcion: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-5 shadow-[var(--shadow-xs)]">
      <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
        <Icon className="h-4 w-4" strokeWidth={2} />
      </div>
      <div>
        <p className="font-semibold text-[var(--color-fg)] text-sm leading-snug">{titulo}</p>
        <p className="mt-1 text-[var(--color-fg-muted)] text-sm leading-relaxed">{descripcion}</p>
      </div>
    </div>
  );
}

function TestimonioCard({
  texto,
  nombre,
  cargo,
}: {
  texto: string;
  nombre: string;
  cargo: string;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-5 shadow-[var(--shadow-xs)]">
      <p className="flex-1 text-[var(--color-fg-muted)] text-sm leading-relaxed">
        &ldquo;{texto}&rdquo;
      </p>
      <div className="border-t border-[var(--color-border)] pt-3">
        <p className="font-medium text-[var(--color-fg)] text-sm">{nombre}</p>
        <p className="text-[var(--color-fg-subtle)] text-xs">{cargo}</p>
      </div>
    </div>
  );
}
