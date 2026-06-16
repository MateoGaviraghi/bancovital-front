'use client';

import { BvLogo } from '@/components/brand/bv-logo';
import { BookingFlow } from '@/components/domain/booking-flow';
import { cn } from '@/lib/cn';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  FileSignature,
  FileText,
  Layers,
  QrCode,
  Receipt,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

// ─── Datos ───────────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { href: '#caracteristicas', label: 'Características' },
  { href: '#como-funciona', label: 'Cómo funciona' },
  { href: '#agendar', label: 'Demo' },
];

const MARQUEE = [
  'Órdenes',
  'Pacientes',
  'Resultados',
  'Informes con firma',
  'Portal del paciente',
  'Facturación',
  'Obras sociales',
  'Contratación digital',
  'Multi-usuario',
];

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
    icon: FileSignature,
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
    descripcion:
      'Paciente, médico, obra social y prácticas en segundos. La recepción arranca el circuito sin fricción.',
    icon: FileText,
  },
  {
    n: '02',
    titulo: 'Cargás los resultados',
    descripcion:
      'Con rangos de referencia y validación del profesional. Cada práctica queda trazada de punta a punta.',
    icon: BadgeCheck,
  },
  {
    n: '03',
    titulo: 'Emitís el informe',
    descripcion:
      'PDF con membrete y firma del bioquímico, listo para entregar. Profesional y consistente, siempre.',
    icon: FileSignature,
  },
  {
    n: '04',
    titulo: 'El paciente lo recibe',
    descripcion:
      'Accede a su informe desde el portal con un QR. Sin llamados, sin idas y vueltas al laboratorio.',
    icon: QrCode,
  },
];

// ─── Root ──────────────────────────────────────────────────────────────────────

function useLandingQueryClient() {
  const ref = useRef<QueryClient | null>(null);
  if (!ref.current) {
    ref.current = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1 } } });
  }
  return ref.current;
}

export function LandingAnon() {
  const queryClient = useLandingQueryClient();
  const rootRef = useRef<HTMLDivElement>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    gsap.registerPlugin(ScrollTrigger);
    const cleanups: Array<() => void> = [];

    // Estado del header — scroll nativo (Lenis mueve el scroll real, así que
    // este listener responde tanto al smooth scroll como al scroll programático).
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    cleanups.push(() => window.removeEventListener('scroll', onScroll));

    if (!reduced) {
      const lenis = new Lenis({
        duration: 1.05,
        easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)),
      });
      lenisRef.current = lenis;
      lenis.on('scroll', ScrollTrigger.update);
      const raf = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);
      cleanups.push(() => {
        gsap.ticker.remove(raf);
        lenis.destroy();
        lenisRef.current = null;
      });
    }

    // Scroll suave a las anclas, con offset por el header fijo.
    const onClick = (ev: MouseEvent) => {
      const a = (ev.target as HTMLElement)?.closest?.('a[href^="#"]') as HTMLAnchorElement | null;
      if (!a) return;
      const href = a.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      ev.preventDefault();
      if (lenisRef.current) {
        lenisRef.current.scrollTo(target as HTMLElement, { offset: -76, duration: 1.1 });
      } else {
        (target as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };
    document.addEventListener('click', onClick);
    cleanups.push(() => document.removeEventListener('click', onClick));

    const ctx = gsap.context(() => {
      if (reduced) {
        gsap.set('[data-hero],[data-animate],[data-stagger-item]', {
          opacity: 1,
          y: 0,
          clearProps: 'transform,opacity',
        });
        gsap.set('[data-howbar]', { scaleY: 1 });
        return;
      }

      // Entrada del hero
      gsap.fromTo(
        '[data-hero]',
        { y: 32, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.95, ease: 'power3.out', stagger: 0.09, delay: 0.12 },
      );

      // Reveals simples
      for (const el of gsap.utils.toArray<HTMLElement>('[data-animate]')) {
        gsap.fromTo(
          el,
          { y: 36, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.85,
            ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 88%', once: true },
          },
        );
      }

      // Reveals con stagger
      for (const group of gsap.utils.toArray<HTMLElement>('[data-stagger]')) {
        gsap.fromTo(
          group.querySelectorAll('[data-stagger-item]'),
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: 'power3.out',
            stagger: 0.08,
            scrollTrigger: { trigger: group, start: 'top 82%', once: true },
          },
        );
      }

      // Parallax sutil
      for (const el of gsap.utils.toArray<HTMLElement>('[data-parallax]')) {
        const amt = Number(el.dataset.parallax || '40');
        gsap.fromTo(
          el,
          { y: amt },
          {
            y: -amt,
            ease: 'none',
            scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
          },
        );
      }

      // "Cómo funciona" — barra de progreso vertical scroll-linked (sin pin)
      gsap.fromTo(
        '[data-howbar]',
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: 'none',
          transformOrigin: 'top center',
          scrollTrigger: {
            trigger: '#como-funciona',
            start: 'top 60%',
            end: 'bottom 85%',
            scrub: true,
          },
        },
      );
    }, rootRef);
    cleanups.push(() => ctx.revert());

    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener('load', refresh);
    const tid = window.setTimeout(refresh, 450);
    document.fonts?.ready?.then(refresh);
    cleanups.push(() => {
      window.removeEventListener('load', refresh);
      window.clearTimeout(tid);
    });

    return () => {
      for (const c of cleanups) c();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <div ref={rootRef} className="bg-[var(--color-bg)] text-[var(--color-fg)]">
        <Header scrolled={scrolled} />
        <main>
          <Hero />
          <Marquee />
          <Features />
          <HowItWorks />
          <BookingSection />
        </main>
        <Footer />
      </div>
    </QueryClientProvider>
  );
}

// ─── Header ────────────────────────────────────────────────────────────────────

function Header({ scrolled }: { scrolled: boolean }) {
  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-colors duration-300',
        scrolled
          ? 'border-[var(--color-border)] border-b bg-[var(--color-bg-elevated)]/85 backdrop-blur-md'
          : 'border-transparent border-b bg-transparent',
      )}
    >
      <div className="mx-auto flex h-[68px] max-w-6xl items-center gap-8 px-6">
        <a href="#inicio" className="flex items-center gap-2.5" aria-label="Banco Vital — inicio">
          {scrolled && <BvLogo size={28} alt="" priority className="h-7 w-7" />}
          <span
            className={cn(
              'font-semibold text-lg tracking-tight transition-colors duration-300',
              scrolled ? 'text-[var(--color-fg)]' : 'text-white',
            )}
          >
            Banco Vital
          </span>
        </a>

        <nav className="hidden flex-1 items-center gap-8 md:flex" aria-label="Secciones">
          {NAV_LINKS.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className={cn(
                'text-sm transition-colors duration-300',
                scrolled
                  ? 'text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]'
                  : 'text-white/70 hover:text-white',
              )}
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <Link
            href="/login"
            className={cn(
              'inline-flex h-9 items-center px-3 font-medium text-sm transition-colors duration-300',
              scrolled
                ? 'text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]'
                : 'text-white/80 hover:text-white',
            )}
          >
            Iniciar sesión
          </Link>
          <a
            href="#agendar"
            className={cn(
              'group inline-flex h-9 items-center gap-1.5 px-4 font-medium text-sm transition-colors duration-300',
              scrolled
                ? 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]'
                : 'bg-white text-[var(--color-primary)] hover:bg-white/90',
            )}
          >
            Agendá una demo
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </a>
        </div>
      </div>
    </header>
  );
}

// ─── Hero ──────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section
      id="inicio"
      className="relative flex min-h-screen items-center overflow-hidden bg-[#10193a] text-white"
    >
      {/* Aurora */}
      <div className="absolute inset-0" aria-hidden="true">
        <div
          className="bv-blob bv-anim-a"
          style={{
            width: '44%',
            height: '70%',
            left: '-8%',
            top: '-6%',
            background: 'radial-gradient(circle, #32448d 0%, transparent 70%)',
          }}
        />
        <div
          className="bv-blob bv-anim-b"
          style={{
            width: '48%',
            height: '82%',
            right: '-10%',
            top: '-4%',
            background: 'radial-gradient(circle, #2a3d84 0%, transparent 70%)',
          }}
        />
        <div
          className="bv-blob bv-anim-c"
          style={{
            width: '30%',
            height: '56%',
            right: '14%',
            bottom: '-22%',
            background: 'radial-gradient(circle, rgba(205,15,15,0.30) 0%, transparent 70%)',
            filter: 'blur(110px)',
          }}
        />
      </div>
      <div
        className="absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 40%, black, transparent 75%)',
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-14 px-6 pt-28 pb-20 lg:grid-cols-[1.1fr_0.9fr] lg:pt-32">
        <div>
          <div
            data-hero
            className="flex items-center gap-3 text-white/60 text-xs uppercase tracking-[0.18em]"
          >
            <span className="h-px w-8 bg-[var(--color-accent)]" />
            Para laboratorios bioquímicos
          </div>
          <h1
            data-hero
            className="mt-6 text-balance font-semibold text-[2.7rem] leading-[1.04] tracking-[-0.02em] sm:text-6xl"
          >
            El sistema que ordena tu laboratorio,
            <span className="text-white/55"> de la orden al informe.</span>
          </h1>
          <p data-hero className="mt-7 max-w-xl text-[17px] text-white/65 leading-relaxed">
            Órdenes, pacientes, resultados, informes con firma y facturación en una sola plataforma.
            Con la marca de tu laboratorio y contratación 100% digital.
          </p>
          <div data-hero className="mt-9 flex flex-wrap items-center gap-3">
            <a
              href="#agendar"
              className="group inline-flex h-12 items-center gap-2 bg-white px-6 font-medium text-[var(--color-primary)] text-sm transition-transform active:scale-[0.98]"
            >
              Agendá una demo
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </a>
            <a
              href="#como-funciona"
              className="inline-flex h-12 items-center border border-white/25 px-6 font-medium text-sm text-white transition-colors hover:bg-white/10"
            >
              Cómo funciona
            </a>
          </div>
          <p data-hero className="mt-7 text-white/40 text-xs">
            Sin compromiso · Demo de 30 minutos
          </p>
        </div>

        <div data-hero className="hidden lg:block" data-parallax="26">
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
    { icon: BadgeCheck, label: 'Informes', active: false },
    { icon: Receipt, label: 'Facturación', active: false },
  ];
  return (
    <div className="border border-white/12 bg-white/[0.06] shadow-[0_40px_90px_-30px_rgba(0,0,0,0.7)] backdrop-blur-xl">
      <div className="flex items-center gap-2 border-white/10 border-b px-4 py-3">
        <span className="flex h-6 w-6 items-center justify-center bg-white p-1">
          <BvLogo size={16} alt="" className="h-full w-full" />
        </span>
        <span className="font-semibold text-sm text-white">Banco Vital</span>
        <span className="ml-auto h-2 w-2 bg-[var(--color-accent)]" />
      </div>
      <div className="flex">
        <div className="w-36 shrink-0 border-white/10 border-r p-2">
          {nav.map(({ icon: Icon, label, active }) => (
            <div
              key={label}
              className={cn(
                'flex items-center gap-2 px-2.5 py-2 text-xs',
                active ? 'bg-white/12 font-medium text-white' : 'text-white/50',
              )}
            >
              <Icon className="size-3.5" /> {label}
            </div>
          ))}
        </div>
        <div className="flex-1 p-4">
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm text-white">Órdenes</span>
            <span className="inline-flex items-center bg-white px-2.5 py-1 font-medium text-[11px] text-[var(--color-primary)]">
              Nueva orden
            </span>
          </div>
          <div className="mt-4 space-y-2.5">
            {['82%', '64%', '90%', '54%'].map((w, i) => (
              <div
                key={w}
                className="flex items-center gap-3 border border-white/10 bg-white/[0.04] px-3 py-2.5"
              >
                <span className="h-2 w-2 shrink-0 bg-white/25" />
                <span className="h-2 bg-white/15" style={{ width: w }} />
                <span
                  className={cn(
                    'ml-auto h-4 w-12',
                    i === 2 ? 'bg-[var(--color-success)]/45' : 'bg-white/10',
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

// ─── Marquee ────────────────────────────────────────────────────────────────────

function Marquee() {
  return (
    <div className="overflow-hidden border-[var(--color-border)] border-y bg-[var(--color-bg-elevated)] py-5">
      <div className="bv-marquee flex w-max whitespace-nowrap">
        {['a', 'b'].map((copy) => (
          <div key={copy} aria-hidden={copy === 'b'} className="flex shrink-0">
            {MARQUEE.map((label) => (
              <span
                key={label}
                className="mx-6 flex items-center gap-4 font-medium text-[var(--color-fg-subtle)] text-sm uppercase tracking-[0.14em]"
              >
                {label}
                <span className="h-1 w-1 bg-[var(--color-accent)]" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Características ──────────────────────────────────────────────────────────────

function Features() {
  return (
    <section id="caracteristicas" className="scroll-mt-20 border-[var(--color-border)] border-b">
      <div className="mx-auto max-w-6xl px-6 py-24 lg:py-32">
        <div data-animate className="max-w-2xl">
          <div className="mb-5 flex items-center gap-3 text-[var(--color-fg-subtle)] text-xs uppercase tracking-[0.18em]">
            <span className="h-px w-8 bg-[var(--color-accent)]" />
            Características
          </div>
          <h2 className="text-balance font-semibold text-[var(--color-fg)] text-4xl leading-[1.05] tracking-[-0.02em] sm:text-5xl">
            Todo lo que tu laboratorio necesita, en un solo lugar
          </h2>
        </div>

        <div
          data-stagger
          className="mt-14 grid grid-cols-1 border-[var(--color-border)] border-t border-l sm:grid-cols-2 lg:grid-cols-3"
        >
          {FEATURES.map((f, i) => (
            <div
              key={f.titulo}
              data-stagger-item
              className="group relative border-[var(--color-border)] border-r border-b bg-[var(--color-bg-elevated)] p-8 transition-colors hover:bg-[var(--color-bg-subtle)]"
            >
              <span className="font-mono text-[var(--color-fg-subtle)] text-xs tabular-nums">
                0{i + 1}
              </span>
              <div className="mt-5 flex h-11 w-11 items-center justify-center bg-[var(--color-primary)] text-white shadow-[var(--shadow-button)]">
                <f.icon className="size-5" strokeWidth={1.8} />
              </div>
              <h3 className="mt-5 font-semibold text-[var(--color-fg)] text-lg tracking-tight">
                {f.titulo}
              </h3>
              <p className="mt-2 text-[var(--color-fg-muted)] text-sm leading-relaxed">
                {f.descripcion}
              </p>
              <span className="absolute right-0 bottom-0 h-0 w-[2px] bg-[var(--color-accent)] transition-all duration-300 group-hover:h-full" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Cómo funciona (pinneada) ────────────────────────────────────────────────────

function HowItWorks() {
  return (
    <section
      id="como-funciona"
      className="scroll-mt-20 border-[var(--color-border)] border-b bg-[var(--color-bg-subtle)]"
    >
      <div className="mx-auto w-full max-w-6xl px-6 py-24 lg:py-32">
        <div data-animate className="max-w-2xl">
          <div className="mb-5 flex items-center gap-3 text-[var(--color-fg-subtle)] text-xs uppercase tracking-[0.18em]">
            <span className="h-px w-8 bg-[var(--color-accent)]" />
            Cómo funciona
          </div>
          <h2 className="text-balance font-semibold text-[var(--color-fg)] text-4xl leading-[1.05] tracking-[-0.02em] sm:text-5xl">
            De la orden al informe, en cuatro pasos
          </h2>
        </div>

        <div data-stagger className="relative mt-16">
          {/* Línea vertical + progreso scroll-linked */}
          <div className="absolute top-3 bottom-3 left-[15px] w-px bg-[var(--color-border-strong)]">
            <div
              data-howbar
              className="h-full w-px origin-top scale-y-0 bg-[var(--color-primary)]"
            />
          </div>

          <div className="space-y-14">
            {STEPS.map((s) => (
              <div
                key={s.n}
                data-stagger-item
                className="grid grid-cols-[32px_1fr] gap-6 sm:gap-10"
              >
                <div className="flex justify-center">
                  <span
                    className="mt-2 size-2 bg-[var(--color-primary)] ring-4 ring-[var(--color-bg-subtle)]"
                    aria-hidden="true"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-start sm:gap-9">
                  <div className="flex items-center gap-4">
                    <span className="font-mono font-semibold text-[var(--color-primary)] text-4xl tabular-nums sm:text-5xl">
                      {s.n}
                    </span>
                    <span className="flex h-12 w-12 items-center justify-center bg-[var(--color-primary)] text-white shadow-[var(--shadow-button)]">
                      <s.icon className="size-5" strokeWidth={1.8} />
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--color-fg)] text-xl tracking-tight sm:text-2xl">
                      {s.titulo}
                    </h3>
                    <p className="mt-2 max-w-xl text-[var(--color-fg-muted)] text-base leading-relaxed">
                      {s.descripcion}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Agendá ───────────────────────────────────────────────────────────────────

function BookingSection() {
  return (
    <section id="agendar" className="scroll-mt-20">
      <div className="mx-auto max-w-6xl px-6 py-24 lg:py-32">
        <div data-animate className="max-w-2xl">
          <div className="mb-5 flex items-center gap-3 text-[var(--color-fg-subtle)] text-xs uppercase tracking-[0.18em]">
            <span className="h-px w-8 bg-[var(--color-accent)]" />
            Reunión sin compromiso
          </div>
          <h2 className="text-balance font-semibold text-[var(--color-fg)] text-4xl leading-[1.05] tracking-[-0.02em] sm:text-5xl">
            Agendá una demo con nuestro equipo
          </h2>
          <p className="mt-4 max-w-xl text-[var(--color-fg-muted)] text-base leading-relaxed">
            Contanos tu caso en 30 minutos. Sin costo, sin compromiso. Te mostramos el sistema
            adaptado a tu laboratorio.
          </p>
        </div>

        <div
          data-animate
          className="mt-12 border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6 shadow-[var(--shadow-sm)] lg:p-10 [&_*]:rounded-none"
        >
          <BookingFlow />
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-[#10193a] text-white">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <span className="font-semibold text-3xl tracking-tight">Banco Vital</span>
            <p className="mt-4 max-w-xs text-sm text-white/55 leading-relaxed">
              El sistema de gestión para laboratorios bioquímicos. De la orden al informe.
            </p>
            <a
              href="#agendar"
              className="group mt-7 inline-flex items-center gap-2 border border-white/25 px-5 py-2.5 font-medium text-sm transition-colors hover:bg-white/10"
            >
              Agendá una demo
              <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          </div>

          <div>
            <p className="font-medium text-white/45 text-xs uppercase tracking-[0.14em]">
              Contacto
            </p>
            <div className="mt-4 space-y-2 text-sm text-white/70">
              <p>Mateo Gaviraghi</p>
              <p className="text-white/45">+54 9 3425 16-2081</p>
              <p className="pt-1">Justo González Viescas</p>
              <p className="text-white/45">+54 9 3425 26-7005</p>
            </div>
          </div>

          <div>
            <p className="font-medium text-white/45 text-xs uppercase tracking-[0.14em]">
              Plataforma
            </p>
            <div className="mt-4 flex flex-col gap-2.5 text-sm">
              <a
                href="#caracteristicas"
                className="text-white/70 transition-colors hover:text-white"
              >
                Características
              </a>
              <a href="#como-funciona" className="text-white/70 transition-colors hover:text-white">
                Cómo funciona
              </a>
              <Link href="/login" className="text-white/70 transition-colors hover:text-white">
                Acceso clientes
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-2 border-white/10 border-t pt-7 text-white/40 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} Banco Vital. Sistema de gestión para laboratorios bioquímicos.</p>
          <p>
            Creado por{' '}
            <a
              href="https://nodotech.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-white/70 transition-colors hover:text-white"
            >
              Nodo
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
