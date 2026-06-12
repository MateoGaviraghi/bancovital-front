export default function RootPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-bg)] px-6 text-center">
      <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] shadow-[var(--shadow-sm)]">
        <span className="text-2xl font-bold text-[var(--color-fg)]">L</span>
      </div>
      <h1 className="font-bold text-[var(--color-fg)] text-2xl tracking-tight">
        Sistema de gestión de laboratorios
      </h1>
      <p className="mt-3 max-w-sm text-[var(--color-fg-muted)] text-sm leading-relaxed">
        Accedé desde la URL de tu laboratorio para ingresar al sistema.
      </p>
      <p className="mt-6 text-[var(--color-fg-subtle)] text-xs">
        ¿Sos un laboratorio?{' '}
        <span className="text-[var(--color-fg-muted)]">
          Ingresá desde tu URL personalizada (p. ej.,{' '}
          <code className="font-mono">/mi-lab/login</code>)
        </span>
      </p>
    </div>
  );
}
