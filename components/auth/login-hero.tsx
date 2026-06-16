import { IsoLogo } from '@/components/brand/iso-logo';

// Hero animado del login: aurora navy en movimiento + acento rojo de marca,
// watermark del isotipo y una tarjeta de informe de laboratorio flotando (glass).
// Identidad Banco Vital (navy/rojo, gota, dominio lab). Solo desktop.
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
      <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(15,20,40,0.55),transparent_45%)]" />

      {/* Watermark isotipo */}
      <IsoLogo className="pointer-events-none absolute -right-24 -bottom-28 w-[460px] text-white/[0.04]" />

      {/* Contenido */}
      <div className="relative flex h-full flex-col justify-between p-12 text-white">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15 backdrop-blur-sm">
            <IsoLogo className="w-5 text-white" />
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

        {/* Tarjeta de informe (glass) */}
        <div className="bv-float w-[320px] self-end rounded-2xl border border-white/15 bg-white/10 p-5 shadow-[0_24px_60px_-18px_rgba(0,0,0,0.55)] backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-white/75 text-xs">
              <IsoLogo className="w-4 text-white" /> Informe de laboratorio
            </span>
            <span className="rounded-md bg-[var(--color-success)]/25 px-2 py-0.5 font-medium text-[11px] text-[var(--color-success-soft)] ring-1 ring-[var(--color-success-soft)]/25">
              Emitida
            </span>
          </div>
          <div className="mt-4">
            <p className="font-medium font-mono text-3xl tabular-nums tracking-tight">
              14.2 <span className="text-lg text-white/60">g/dL</span>
            </p>
            <p className="mt-1 text-white/55 text-xs">Hemoglobina · ref. 13–17</p>
          </div>
          <div className="mt-4 space-y-1.5 border-white/10 border-t pt-3 text-xs">
            <div className="flex justify-between">
              <span className="text-white/55">Glucosa</span>
              <span className="font-mono text-white/90 tabular-nums">92 mg/dL</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/55">Colesterol</span>
              <span className="font-mono text-white/90 tabular-nums">180 mg/dL</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
