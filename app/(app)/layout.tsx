import { Sidebar, type SidebarBranding } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { getServerApi } from '@/lib/api/server';
import type { LabAssetSignedUrlResponse, LabConfig } from '@/lib/api/types';
import { getSessionUser } from '@/lib/auth/session';
import type { AxiosInstance } from 'axios';
import { redirect } from 'next/navigation';

const FALLBACK_BRANDING: SidebarBranding = {
  legalName: 'Laboratorio',
  shortName: null,
  city: 'Santa Fe',
  logoUrl: null,
};

// The backend stores the logo in a private bucket; data.logoUrl is an internal
// path, not a usable <img> src. Resolve a short-lived signed URL instead.
// Degrades to no logo if the endpoint is unavailable.
async function loadLogoSignedUrl(api: AxiosInstance): Promise<string | null> {
  try {
    const { data } = await api.get<LabAssetSignedUrlResponse>('/lab-config/logo/signed-url', {
      params: { ttlSeconds: 3600 },
    });
    return data.url ?? null;
  } catch {
    return null;
  }
}

async function loadBranding(): Promise<SidebarBranding> {
  try {
    const api = await getServerApi();
    const { data } = await api.get<LabConfig>('/lab-config');
    const logoUrl = await loadLogoSignedUrl(api);
    return {
      legalName: data.legalName,
      shortName: data.shortName,
      city: data.city,
      logoUrl,
    };
  } catch {
    return FALLBACK_BRANDING;
  }
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (user.role === 'super') redirect('/super/labs');

  const branding = await loadBranding();

  return (
    <div className="flex min-h-screen bg-[var(--color-bg)]">
      <Sidebar userRole={user.role} branding={branding} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar user={user} />
        <main className="flex-1 overflow-auto">
          <div className="mx-auto w-full max-w-[1440px] px-6 py-8 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
