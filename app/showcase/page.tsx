import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ShowcaseClient } from './showcase-client';

export const metadata: Metadata = {
  title: 'Design System — Banco Vital',
  robots: { index: false, follow: false },
};

export default function ShowcasePage() {
  // QA del design system (Fase 8). Visible en local y en el preview de `dev`;
  // 404 en producción (deploy de `main`), donde VERCEL_ENV === 'production'.
  if (process.env.VERCEL_ENV === 'production') {
    notFound();
  }
  return <ShowcaseClient />;
}
