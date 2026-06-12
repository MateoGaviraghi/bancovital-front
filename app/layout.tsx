import { QueryProvider } from '@/components/providers/query-provider';
import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Laboratorio',
  description: 'Sistema de gestión de laboratorio bioquímico',
  icons: { icon: '/labo.jpeg' },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-AR" className={`${inter.variable} ${mono.variable}`}>
      <body className="font-sans">
        <QueryProvider>{children}</QueryProvider>
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
