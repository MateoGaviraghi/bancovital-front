export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Brand panel — visible md+ */}
      <div
        className="hidden md:flex md:w-1/2 lg:w-2/5 flex-col items-center justify-center px-12 py-16"
        style={{ background: 'linear-gradient(145deg, #0db5b0 0%, #0a9490 60%, #087a76 100%)' }}
      >
        {/* Monogram */}
        <div
          className="flex h-20 w-20 items-center justify-center rounded-2xl text-3xl font-bold text-white mb-6"
          style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.2)' }}
        >
          AV
        </div>

        <h1 className="text-white font-bold text-3xl tracking-tight leading-tight text-center">
          Laboratorio AV Diagnóstico
        </h1>
        <p
          className="mt-2 text-sm tracking-widest uppercase font-medium text-center"
          style={{ color: 'rgba(255,255,255,0.7)', letterSpacing: '0.18em' }}
        >
          Laboratorio de Análisis Clínicos
        </p>

        {/* Decorative rings */}
        <div className="absolute pointer-events-none overflow-hidden inset-0 hidden md:block" style={{ zIndex: 0 }}>
          <div
            className="absolute rounded-full"
            style={{
              width: 420, height: 420,
              top: '-80px', left: '-120px',
              background: 'rgba(255,255,255,0.05)',
            }}
          />
          <div
            className="absolute rounded-full"
            style={{
              width: 260, height: 260,
              bottom: '-60px', left: '60px',
              background: 'rgba(255,255,255,0.06)',
            }}
          />
        </div>

        <p className="absolute bottom-6 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Sistema de gestión de laboratorio
        </p>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 items-center justify-center bg-[var(--color-bg)] px-6 py-12">
        {children}
      </div>
    </div>
  );
}
