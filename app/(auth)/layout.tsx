// Layout de las pantallas de auth (login único + set-password) — app única bancovital.

export default function GlobalAuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)]">
      {children}
    </div>
  );
}
