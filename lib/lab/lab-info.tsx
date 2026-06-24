'use client';

import { createContext, useContext } from 'react';

export interface LabInfo {
  labName: string | null;
  logoUrl: string | null;
  primaryColor: string | null;
  accentColor: string | null;
  veterinariaHabilitada: boolean;
}

const LabContext = createContext<LabInfo | null>(null);

export function LabProvider({ lab, children }: { lab: LabInfo; children: React.ReactNode }) {
  return <LabContext.Provider value={lab}>{children}</LabContext.Provider>;
}

export function useLab(): LabInfo {
  const ctx = useContext(LabContext);
  if (!ctx) throw new Error('useLab() must be used inside <LabProvider>');
  return ctx;
}
