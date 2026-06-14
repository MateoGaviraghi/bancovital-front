import { AnnouncementBanner } from '@/components/domain/announcement-banner';
import { ConsumoBanners } from '@/components/domain/consumo-banners';
import { ImpersonateBanner } from '@/components/domain/impersonate-banner';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { getServerApi } from '@/lib/api/server';
import type { MeResponse } from '@/lib/api/types';
import { getSessionUser } from '@/lib/auth/session';
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

export default async function TenantAppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [user, me] = await Promise.all([getSessionUser(), getMe()]);

  if (!user) redirect(`/${slug}/login`);

  // Guard: slug in URL must match the lab the session belongs to.
  // UX-only — real authorization is server-side in the API (labId from JWT).
  if (me) {
    if (me.labSlug === null && me.role === 'super') {
      redirect('/super');
    }
    if (typeof me.labSlug === 'string' && me.labSlug !== slug) {
      redirect(`/${me.labSlug}`);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-bg)]">
      <ImpersonateBanner />
      <div className="flex min-h-0 flex-1">
        {/* Effective role: under impersonation /me returns 'admin' so the super
            gets the full lab sidebar; otherwise it's the lab user's real role. */}
        <Sidebar userRole={me?.role ?? user.role} slug={slug} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar user={user} slug={slug} />
          <AnnouncementBanner />
          <ConsumoBanners />
          <main className="flex-1 overflow-auto">
            <div className="mx-auto w-full max-w-[1440px] px-6 py-8 lg:px-8">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
