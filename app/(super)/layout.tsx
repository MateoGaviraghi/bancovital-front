import { SuperSidebar } from '@/components/layout/super-sidebar';
import { Topbar } from '@/components/layout/topbar';
import { getSessionUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';

export default async function SuperLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect('/auth/set-password'); // fallback — set-password global covers this
  if (user.role !== 'super') {
    // Non-super user tried to access /super — send them to root (no slug known here)
    redirect('/');
  }

  return (
    <div className="flex min-h-screen bg-[var(--color-bg)]">
      <SuperSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar user={user} />
        <main className="flex-1 overflow-auto">
          <div className="mx-auto w-full max-w-[1440px] px-6 py-8 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
