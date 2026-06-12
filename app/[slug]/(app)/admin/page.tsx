import { EmptyState } from '@/components/layout/empty-state';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { getSessionUser } from '@/lib/auth/session';
import { Building2, DollarSign, Lock, UsersRound } from 'lucide-react';
import Link from 'next/link';

export default async function AdminPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await getSessionUser();
  if (user?.role !== 'admin') {
    return (
      <div>
        <PageHeader title="Acceso restringido" />
        <EmptyState
          icon={Lock}
          title="Solo administradores"
          description="Esta sección requiere rol admin."
        />
      </div>
    );
  }

  const TILES = [
    {
      href: `/${slug}/admin/config-lab`,
      label: 'Configuración del laboratorio',
      description: 'Datos legales, firma profesional, logo y branding.',
      icon: Building2,
    },
    {
      href: `/${slug}/admin/usuarios`,
      label: 'Usuarios',
      description: 'Invitar miembros del equipo, asignar roles y activar/desactivar accesos.',
      icon: UsersRound,
    },
    {
      href: `/${slug}/admin/valor-ub`,
      label: 'Valor UB',
      description: 'Actualizar el valor de la unidad bioquímica por obra social.',
      icon: DollarSign,
    },
  ];

  return (
    <div>
      <PageHeader title="Administración" description="Configuración general del laboratorio." />

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {TILES.map((t) => {
          const Icon = t.icon;
          return (
            <Link key={t.href} href={t.href} className="group">
              <Card className="h-full transition-colors group-hover:border-[var(--color-primary)] group-hover:shadow-[var(--shadow-sm)]">
                <div className="flex h-full flex-col gap-2 p-5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                    <Icon className="h-4 w-4" strokeWidth={2} />
                  </div>
                  <CardTitle className="text-sm">{t.label}</CardTitle>
                  <CardDescription className="text-xs">{t.description}</CardDescription>
                </div>
              </Card>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
