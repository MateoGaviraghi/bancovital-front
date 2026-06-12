// Superseded by app/[slug]/(auth)/layout.tsx.
// The set-password route (/auth/set-password) is still global under this group.

export default function GlobalAuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)]">
      {children}
    </div>
  );
}
