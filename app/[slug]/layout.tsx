import { TenantProvider } from '@/lib/tenant/tenant-context';
import { type TenantBranding, buildThemeStyle } from '@/lib/tenant/theme';
import { notFound } from 'next/navigation';

const DEFAULT_BRANDING: TenantBranding = {
  slug: '',
  name: 'Laboratorio',
  shortName: null,
  logoUrl: null,
  primaryColor: null,
  tagline: null,
};

async function fetchBranding(slug: string): Promise<TenantBranding | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  // Missing config is an ops problem, not a missing lab — degrade, don't 404
  if (!apiUrl) return { ...DEFAULT_BRANDING, slug };

  try {
    const res = await fetch(`${apiUrl}/public/labs/${slug}/branding`, {
      next: { revalidate: 300 },
    });
    if (res.status === 404) return null;
    if (!res.ok) {
      // Network/server error — degrade gracefully (don't break login)
      return { ...DEFAULT_BRANDING, slug };
    }
    const data = await res.json();
    return {
      slug: data.slug ?? slug,
      name: data.name ?? 'Laboratorio',
      shortName: data.shortName ?? null,
      logoUrl: data.logoUrl ?? null,
      primaryColor: data.primaryColor ?? null,
      tagline: data.tagline ?? null,
    };
  } catch {
    // Fetch failed (API down) — continue with default branding, don't crash
    return { ...DEFAULT_BRANDING, slug };
  }
}

export default async function SlugLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const branding = await fetchBranding(slug);

  // 404 only when the API explicitly says this slug doesn't exist
  if (branding === null) notFound();

  const themeCss = buildThemeStyle(branding.primaryColor);

  return (
    <>
      {/* Scoped theme override: only validated values, injected server-side */}
      {/* Portalled components (Dialog, Dropdown) target :root — this covers them too */}
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: CSS values are validated in buildThemeStyle */}
      <style dangerouslySetInnerHTML={{ __html: themeCss }} />
      <TenantProvider slug={slug} branding={branding}>
        {children}
      </TenantProvider>
    </>
  );
}
