import { ImpersonateBanner } from '@/components/domain/impersonate-banner';
import { SuperSidebar, SuperSidebarNavBody } from '@/components/layout/super-sidebar';
import { Topbar } from '@/components/layout/topbar';
import { getSessionUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';

export default async function SuperLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (user.role !== 'super') {
    // Non-super user tried to access /super — send them to root (no slug known here)
    redirect('/');
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[var(--color-bg)]">
      <ImpersonateBanner />
      <div className="flex min-h-0 flex-1">
        <SuperSidebar />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <Topbar user={user} mobileNav={<SuperSidebarNavBody />} />
          <main className="flex-1 overflow-auto">
            <div className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
