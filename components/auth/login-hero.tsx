import { BvLogo } from '@/components/brand/bv-logo';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

// Hero animado del login: aurora navy en movimiento + acento rojo de marca,
// watermark del logo real y una tarjeta-CTA hacia la landing. Solo desktop.
export function LoginHero() {
  return (
    <div className="relative hidden h-full overflow-hidden bg-[#131c3b] lg:block">
      {/* Aurora */}
      <div className="absolute inset-0">
        <div
          className="bv-blob bv-anim-a"
          style={{
            width: '48%',
            height: '48%',
            left: '-8%',
            top: '-8%',
            background: 'radial-gradient(circle, #34468f 0%, transparent 70%)',
          }}
        />
        <div
          className="bv-blob bv-anim-b"
          style={{
            width: '54%',
            height: '54%',
            right: '-10%',
            top: '16%',
            background: 'radial-gradient(circle, #2c3f86 0%, transparent 70%)',
          }}
        />
        <div
          className="bv-blob bv-anim-c"
          style={{
            width: '42%',
            height: '42%',
            left: '8%',
            bottom: '-12%',
            background: 'radial-gradient(circle, #1f2b5b 0%, transparent 70%)',
          }}
        />
        <div
          className="bv-blob bv-anim-b"
          style={{
            width: '34%',
            height: '34%',
            right: '2%',
            bottom: '-10%',
            background: 'radial-gradient(circle, rgba(205,15,15,0.42) 0%, transparent 70%)',
            filter: 'blur(96px)',
          }}
        />
      </div>

      {/* Vignette para legibilidad */}
      <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(15,20,40,0.6),transparent_52%)]" />

      {/* Watermark del logo */}
      <BvLogo
        mono
        alt=""
        size={460}
        className="pointer-events-none absolute -right-28 -bottom-32 w-[460px] opacity-[0.05]"
      />

      {/* Contenido */}
      <div className="relative flex h-full flex-col justify-between p-12 text-white">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white p-1.5 shadow-sm">
            <BvLogo size={24} alt="" priority className="h-full w-full" />
          </span>
          <span className="font-semibold tracking-tight">Banco Vital</span>
        </div>

        <div className="max-w-md">
          <div className="mb-6 h-[3px] w-12 rounded-full bg-[var(--color-accent)]" />
          <h2 className="text-[2.6rem] leading-[1.08] tracking-tight">
            <span className="block font-light text-white/85">Todo tu laboratorio,</span>
            <span className="block font-semibold">en un solo lugar.</span>
          </h2>
          <p className="mt-5 max-w-sm text-[15px] text-white/65 leading-relaxed">
            Órdenes, pacientes, resultados, informes y facturación en una sola plataforma.
          </p>
        </div>

        <div className="max-w-sm">
          <Link
            href="/"
            className="group block rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-xl transition-colors hover:bg-white/[0.14]"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="font-medium">Conocé Banco Vital</span>
              <ArrowRight className="size-4 text-white/70 transition-transform group-hover:translate-x-0.5" />
            </div>
            <p className="mt-1.5 text-sm text-white/60 leading-relaxed">
              La plataforma para digitalizar la gestión de tu laboratorio bioquímico.
            </p>
          </Link>
          <p className="mt-4 text-white/50 text-xs">
            ¿Necesitás ayuda? Contactá al administrador de tu laboratorio.
          </p>
          <p className="mt-1 text-white/35 text-xs">Creado por Nodo</p>
        </div>
      </div>
    </div>
  );
}
