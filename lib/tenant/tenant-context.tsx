'use client';

import { createContext, useContext } from 'react';
import type { TenantBranding } from './theme';

interface TenantContextValue {
  slug: string;
  branding: TenantBranding;
}

const TenantContext = createContext<TenantContextValue | null>(null);

export function TenantProvider({
  slug,
  branding,
  children,
}: {
  slug: string;
  branding: TenantBranding;
  children: React.ReactNode;
}) {
  return <TenantContext.Provider value={{ slug, branding }}>{children}</TenantContext.Provider>;
}

export function useTenant(): TenantContextValue {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error('useTenant() must be used inside <TenantProvider>');
  return ctx;
}
