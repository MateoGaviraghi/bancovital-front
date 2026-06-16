'use client';

import { BvLogo } from '@/components/brand/bv-logo';
import { BookingFlow } from '@/components/domain/booking-flow';
import { cn } from '@/lib/cn';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  FileText,
  FlaskConical,
  Layers,
  PenLine,
  QrCode,
  Stethoscope,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { type ReactNode, useEffect, useRef, useState } from 'react';

// ─── Datos ───────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: BadgeCheck,
    titulo: 'La marca de tu laboratorio',
    descripcion:
      'Tu logo y tu nombre en la app y en cada informe que emitís. La plataforma se siente tuya, sin desarrollo a medida.',
  },
  {
    icon: FileText,
    titulo: 'Órdenes y resultados',
    descripcion:
      'Circuito completo: recepción, prácticas y carga de resultados con rangos de referencia. De la orden a la entrega.',
  },
  {
    icon: QrCode,
    titulo: 'Informes y portal del paciente',
    descripcion:
      'Informes con membrete y firma del profesional. El paciente accede al suyo desde un portal con QR.',
  },
  {
    icon: Layers,
    titulo: 'Planes por consumo',
    descripcion:
      'Pagás por lo que usás: cupo mensual de órdenes con rollover de 30 días y excedentes sin cortes de servicio.',
  },
  {
    icon: PenLine,
    titulo: 'Contratación 100% digital',
    descripcion:
      'Propuesta, plan, datos de facturación y firma electrónica con OTP y evidencia legal. Sin papel, sin demoras.',
  },
  {
    icon: Users,
    titulo: 'Multi-usuario con roles',
    descripcion:
      'Admin, recepción y bioquímico. Cada rol accede solo a lo que necesita, con tu equipo trabajando en paralelo.',
  },
];

const STEPS = [
  {
    n: '01',
    titulo: 'Cargás la orden',
    descripcion: 'Paciente, médico, obra social y prácticas en segundos.',
  },
  {
    n: '02',
    titulo: 'Cargás los resultados',
    descripcion: 'Con rangos de referencia y validación del profesional.',
  },
  {
    n: '03',
    titulo: 'Emitís el informe',
    descripcion: 'PDF con membrete y firma, listo para entregar.',
  },
  {
    n: '04',
    titulo: 'El paciente lo recibe',
    descripcion: 'Accede a su informe desde el portal con un QR.',
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

// ─── Reveal on scroll (seguro: si no hay IO o reduced-motion, muestra) ────────

function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setShown(true);
            io.disconnect();
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        'transition-all duration-[600ms] ease-[var(--ease-out-soft)]',
        shown ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
        className,
      )}
      style={{ transitionDelay: shown ? `${delay}ms` : '0ms' }}
    >
      {children}
    </div>
  );
}

// ─── Componente principal ────────────────────────────────────────────────────

export function LandingAnon() {
  const queryClient = useLandingQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <div className="scroll-smooth bg-[var(--color-bg)] text-[var(--color-fg)]">
        <LandingNav />
        <main>
          <Hero />
          <Features />
          <HowItWorks />
          <BookingSection />
        </main>
        <LandingFooter />
      </div>
    </QueryClientProvider>
  );
}

// ─── Nav ──────────────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { href: '#caracteristicas', label: 'Características' },
  { href: '#como-funciona', label: 'Cómo funciona' },
  { href: '#agendar', label: 'Agendá una demo' },
];

function LandingNav() {
  return (
    <header className="sticky top-0 z-50 border-[var(--color-border)] border-b bg-[var(--color-bg-elevated)]/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-8 px-6">
        <a href="#inicio" className="flex items-center gap-2.5" aria-label="Banco Vital — inicio">
          <BvLogo size={32} alt="" priority className="h-8 w-8" />
          <span className="font-semibold text-[var(--color-fg)] text-lg tracking-tight">
            Banco Vital
          </span>
        </a>

        <nav className="hidden flex-1 items-center gap-7 md:flex" aria-label="Secciones">
          {NAV_LINKS.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className="text-[var(--color-fg-muted)] text-sm transition-colors hover:text-[var(--color-fg)]"
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/login"
            className="inline-flex h-9 items-center rounded-md px-3 font-medium text-[var(--color-fg-muted)] text-sm transition-colors hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-fg)]"
          >
            Iniciar sesión
          </Link>
          <a
            href="#agendar"
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-[var(--color-primary)] px-3.5 font-medium text-[var(--color-primary-foreground)] text-sm shadow-[var(--shadow-button)] transition-[background-color,box-shadow] hover:bg-[var(--color-primary-hover)]"
          >
            Agendá una demo
          </a>
        </div>
      </div>
    </header>
  );
}

// ─── Hero ──────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section id="inicio" className="relative overflow-hidden bg-[#131c3b] text-white">
      {/* Aurora */}
      <div className="absolute inset-0" aria-hidden="true">
        <div
          className="bv-blob bv-anim-a"
          style={{
            width: '42%',
            height: '70%',
            left: '-6%',
            top: '-10%',
            background: 'radial-gradient(circle, #34468f 0%, transparent 70%)',
          }}
        />
        <div
          className="bv-blob bv-anim-b"
          style={{
            width: '46%',
            height: '80%',
            right: '-8%',
            top: '-6%',
            background: 'radial-gradient(circle, #2c3f86 0%, transparent 70%)',
          }}
        />
        <div
          className="bv-blob bv-anim-c"
          style={{
            width: '30%',
            height: '55%',
            right: '8%',
            bottom: '-20%',
            background: 'radial-gradient(circle, rgba(205,15,15,0.34) 0%, transparent 70%)',
            filter: 'blur(100px)',
          }}
        />
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_60%,rgba(15,20,40,0.5))]" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:py-28">
        {/* Texto */}
        <div className="motion-slide-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 font-medium text-white/80 text-xs backdrop-blur-sm">
            <FlaskConical className="size-3.5" /> Para laboratorios bioquímicos
          </span>
          <h1 className="mt-5 text-balance font-semibold text-4xl leading-[1.07] tracking-tight sm:text-5xl">
            El sistema que ordena tu laboratorio, de la orden al informe.
          </h1>
          <p className="mt-5 max-w-xl text-[17px] text-white/70 leading-relaxed">
            Órdenes, pacientes, resultados, informes con firma y facturación en una sola plataforma.
            Con la marca de tu laboratorio y contratación 100% digital.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="#agendar"
              className="inline-flex h-11 items-center gap-2 rounded-md bg-white px-5 font-medium text-[var(--color-primary)] text-sm shadow-[var(--shadow-button-hover)] transition-transform active:scale-[0.98]"
            >
              Agendá una demo <ArrowRight className="size-4" />
            </a>
            <a
              href="#como-funciona"
              className="inline-flex h-11 items-center rounded-md border border-white/20 px-5 font-medium text-sm text-white/90 transition-colors hover:bg-white/10"
            >
              Cómo funciona
            </a>
          </div>
          <p className="mt-6 text-white/45 text-xs">Sin compromiso. Demo de 30 minutos.</p>
        </div>

        {/* Preview del producto (abstracto, sin datos inventados) */}
        <div className="motion-fade-in hidden lg:block">
          <AppPreview />
        </div>
      </div>
    </section>
  );
}

function AppPreview() {
  const nav = [
    { icon: Layers, label: 'Inicio', active: false },
    { icon: FileText, label: 'Órdenes', active: true },
    { icon: Users, label: 'Pacientes', active: false },
    { icon: Stethoscope, label: 'Médicos', active: false },
    { icon: BadgeCheck, label: 'Informes', active: false },
  ];
  return (
    <div className="bv-float overflow-hidden rounded-2xl border border-white/15 bg-white/[0.07] shadow-[0_30px_80px_-24px_rgba(0,0,0,0.6)] backdrop-blur-xl">
      {/* topbar */}
      <div className="flex items-center gap-2 border-white/10 border-b px-4 py-3">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white p-1">
          <BvLogo size={16} alt="" className="h-full w-full" />
        </span>
        <span className="font-semibold text-sm text-white">Banco Vital</span>
        <span className="ml-auto h-2 w-2 rounded-full bg-[var(--color-accent)]" />
      </div>
      <div className="flex">
        {/* sidebar */}
        <div className="w-36 shrink-0 border-white/10 border-r p-2">
          {nav.map(({ icon: Icon, label, active }) => (
            <div
              key={label}
              className={cn(
                'flex items-center gap-2 rounded-md px-2.5 py-2 text-xs',
                active ? 'bg-white/15 font-medium text-white' : 'text-white/55',
              )}
            >
              <Icon className="size-3.5" /> {label}
            </div>
          ))}
        </div>
        {/* content */}
        <div className="flex-1 p-4">
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm text-white">Órdenes</span>
            <span className="inline-flex items-center rounded-md bg-white px-2.5 py-1 font-medium text-[11px] text-[var(--color-primary)]">
              Nueva orden
            </span>
          </div>
          <div className="mt-4 space-y-2.5">
            {['78%', '64%', '88%', '52%'].map((w, i) => (
              <div
                key={w}
                className="flex items-center gap-3 rounded-md border border-white/10 bg-white/[0.04] px-3 py-2.5"
              >
                <span className="h-2 w-2 shrink-0 rounded-full bg-white/25" />
                <span className="h-2 rounded-full bg-white/15" style={{ width: w }} />
                <span
                  className={cn(
                    'ml-auto h-4 rounded-full',
                    i === 2 ? 'w-12 bg-[var(--color-success)]/40' : 'w-12 bg-white/10',
                  )}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Características ────────────────────────────────────────────────────────────

function Features() {
  return (
    <section id="caracteristicas" className="scroll-mt-20 border-[var(--color-border)] border-b">
      <div className="mx-auto max-w-6xl px-6 py-20 lg:py-24">
        <Reveal>
          <h2 className="max-w-2xl text-balance font-semibold text-[var(--color-fg)] text-3xl tracking-tight sm:text-4xl">
            Todo lo que tu laboratorio necesita, en un solo lugar
          </h2>
          <p className="mt-4 max-w-2xl text-[var(--color-fg-muted)] text-base leading-relaxed">
            Pensado específicamente para laboratorios bioquímicos. Sin módulos irrelevantes ni
            configuración compleja.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-border)] sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.titulo} delay={(i % 3) * 60} className="bg-[var(--color-bg-elevated)]">
              <div className="group h-full p-6 transition-colors hover:bg-[var(--color-bg-subtle)]">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-primary)] text-white shadow-[var(--shadow-button)]">
                  <f.icon className="size-5" strokeWidth={1.8} />
                </div>
                <h3 className="mt-4 font-semibold text-[15px] text-[var(--color-fg)] tracking-tight">
                  {f.titulo}
                </h3>
                <p className="mt-1.5 text-[var(--color-fg-muted)] text-sm leading-relaxed">
                  {f.descripcion}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Cómo funciona ─────────────────────────────────────────────────────────────

function HowItWorks() {
  return (
    <section
      id="como-funciona"
      className="scroll-mt-20 border-[var(--color-border)] border-b bg-[var(--color-bg-subtle)]"
    >
      <div className="mx-auto max-w-6xl px-6 py-20 lg:py-24">
        <Reveal>
          <div className="mb-3 h-[3px] w-10 rounded-full bg-[var(--color-accent)]" />
          <h2 className="max-w-2xl text-balance font-semibold text-[var(--color-fg)] text-3xl tracking-tight sm:text-4xl">
            De la orden al informe, en cuatro pasos
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 70}>
              <div className="relative">
                <span className="font-mono font-semibold text-[var(--color-primary)] text-sm tabular-nums">
                  {s.n}
                </span>
                <div className="mt-3 mb-4 h-px w-full bg-[var(--color-border-strong)]" />
                <h3 className="font-semibold text-[var(--color-fg)] text-base tracking-tight">
                  {s.titulo}
                </h3>
                <p className="mt-1.5 text-[var(--color-fg-muted)] text-sm leading-relaxed">
                  {s.descripcion}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Agendá ────────────────────────────────────────────────────────────────────

function BookingSection() {
  return (
    <section id="agendar" className="scroll-mt-20">
      <div className="mx-auto max-w-6xl px-6 py-20 lg:py-24">
        <Reveal>
          <div className="flex items-center gap-2 text-[var(--color-primary)]">
            <CalendarCheck className="size-5" />
            <span className="font-medium text-sm">Reunión sin compromiso</span>
          </div>
          <h2 className="mt-3 max-w-2xl text-balance font-semibold text-[var(--color-fg)] text-3xl tracking-tight sm:text-4xl">
            Agendá una demo con nuestro equipo
          </h2>
          <p className="mt-4 max-w-xl text-[var(--color-fg-muted)] text-base leading-relaxed">
            Contanos tu caso en 30 minutos. Sin costo, sin compromiso. Te mostramos el sistema
            adaptado a tu laboratorio.
          </p>
        </Reveal>

        <div className="mt-10 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6 shadow-[var(--shadow-sm)] lg:p-8">
          <BookingFlow />
        </div>
      </div>
    </section>
  );
}

// ─── Footer ────────────────────────────────────────────────────────────────────

function LandingFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-[var(--color-border)] border-t bg-[var(--color-bg-elevated)]">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5">
              <BvLogo size={28} alt="" className="h-7 w-7" />
              <span className="font-semibold text-[var(--color-fg)] text-lg tracking-tight">
                Banco Vital
              </span>
            </div>
            <p className="mt-3 max-w-xs text-[var(--color-fg-muted)] text-sm leading-relaxed">
              El sistema de gestión para laboratorios bioquímicos. De la orden al informe.
            </p>
          </div>

          <div>
            <p className="font-medium text-[var(--color-fg)] text-xs uppercase tracking-wide">
              Contacto comercial
            </p>
            <div className="mt-3 space-y-1.5 text-[var(--color-fg-muted)] text-sm">
              <p>Mateo Gaviraghi — +54 9 3425 16-2081</p>
              <p>Justo González Viescas — +54 9 3425 26-7005</p>
            </div>
          </div>

          <div>
            <p className="font-medium text-[var(--color-fg)] text-xs uppercase tracking-wide">
              Plataforma
            </p>
            <div className="mt-3 flex flex-col gap-1.5 text-sm">
              <a
                href="#caracteristicas"
                className="text-[var(--color-fg-muted)] transition-colors hover:text-[var(--color-fg)]"
              >
                Características
              </a>
              <a
                href="#agendar"
                className="text-[var(--color-fg-muted)] transition-colors hover:text-[var(--color-fg)]"
              >
                Agendá una demo
              </a>
              <Link
                href="/login"
                className="text-[var(--color-fg-muted)] transition-colors hover:text-[var(--color-fg)]"
              >
                Acceso clientes
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-[var(--color-border)] border-t pt-6 text-[var(--color-fg-subtle)] text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} Banco Vital. Sistema de gestión para laboratorios bioquímicos.</p>
          <p>
            Creado por{' '}
            <a
              href="https://nodotech.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[var(--color-fg-muted)] transition-colors hover:text-[var(--color-fg)]"
            >
              Nodo
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
