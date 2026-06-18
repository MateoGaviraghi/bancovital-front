import { AnnouncementBanner } from '@/components/domain/announcement-banner';
import { ConsumoBanners } from '@/components/domain/consumo-banners';
import { ImpersonateBanner } from '@/components/domain/impersonate-banner';
import { Sidebar, SidebarNavBody } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { getServerApi } from '@/lib/api/server';
import type { MeResponse } from '@/lib/api/types';
import { getSessionUser } from '@/lib/auth/session';
import { LabProvider } from '@/lib/lab/lab-info';
import { labThemeVars } from '@/lib/lab/theme';
import { redirect } from 'next/navigation';
import { cache } from 'react';

const getMe = cache(async (): Promise<MeResponse | null> => {
  try {
    const api = await getServerApi();
    const { data } = await api.get<MeResponse>('/me');
    return data;
  } catch {
    return null;
  }
});

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [user, me] = await Promise.all([getSessionUser(), getMe()]);

  if (!user) redirect('/login');
  // Un super SIN impersonar no pertenece a ningún lab → panel super.
  // Bajo impersonation /me devuelve role 'admin' + labId → ve la app del lab.
  if (me?.role === 'super') redirect('/super');

  return (
    // Theming por lab: las CSS-vars de marca se setean acá y cascadean a todo el
    // subtree (sidebar/topbar/contenido). Sin colores propios → defaults Banco Vital.
    <div
      className="flex h-screen flex-col overflow-hidden bg-[var(--color-bg)]"
      style={labThemeVars({ primaryColor: me?.primaryColor, accentColor: me?.accentColor })}
    >
      <ImpersonateBanner />
      <div className="flex min-h-0 flex-1">
        <LabProvider lab={{ labName: me?.labName ?? null, logoUrl: me?.logoUrl ?? null }}>
          {/* Rol efectivo: bajo impersonation /me devuelve 'admin' → sidebar de lab. */}
          <Sidebar userRole={me?.role ?? user.role} />
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <Topbar user={user} mobileNav={<SidebarNavBody userRole={me?.role ?? user.role} />} />
            <AnnouncementBanner />
            <ConsumoBanners />
            <main className="flex-1 overflow-auto">
              <div className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
                {children}
              </div>
            </main>
          </div>
        </LabProvider>
      </div>
    </div>
  );
}
