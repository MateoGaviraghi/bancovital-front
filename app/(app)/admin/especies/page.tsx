import { PageHeader } from '@/components/layout/page-header';
import { getSessionUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { EspeciesClient } from './especies-client';

export const dynamic = 'force-dynamic';

export default async function EspeciesPage() {
  const user = await getSessionUser();
  if (!user || user.role !== 'admin') redirect('/inicio');

  return (
    <div>
      <PageHeader
        title="Especies y razas"
        description="Catálogo de especies animales y sus razas."
      />
      <EspeciesClient />
    </div>
  );
}
