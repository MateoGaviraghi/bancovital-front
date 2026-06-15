import { InsurerForm } from '@/components/domain/insurer-form';
import { PageHeader } from '@/components/layout/page-header';
import { getServerApi } from '@/lib/api/server';
import type { Insurer } from '@/lib/api/types';
import axios from 'axios';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

async function fetchInsurer(id: number): Promise<Insurer> {
  const api = await getServerApi();
  try {
    const { data } = await api.get<Insurer>(`/insurers/${id}`);
    return data;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) notFound();
    throw err;
  }
}

export default async function EditObraSocialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numId = Number(id);
  if (!Number.isInteger(numId)) notFound();

  const insurer = await fetchInsurer(numId);

  return (
    <div>
      <PageHeader title={insurer.name} description={`Código ${insurer.code}`} />
      <InsurerForm insurer={insurer} />
    </div>
  );
}
