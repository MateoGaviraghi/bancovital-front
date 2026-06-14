import { getServerApi } from '@/lib/api/server';
import type { Anuncio, Laboratorio } from '@/lib/api/types';
import { AnnouncementsClient } from './announcements-client';

export const dynamic = 'force-dynamic';

async function fetchAnnouncements(): Promise<Anuncio[]> {
  try {
    const api = await getServerApi();
    const { data } = await api.get<Anuncio[]>('/super/announcements');
    return data;
  } catch {
    return [];
  }
}

async function fetchLabs(): Promise<Laboratorio[]> {
  try {
    const api = await getServerApi();
    const { data } = await api.get<Laboratorio[]>('/super/labs');
    return data;
  } catch {
    return [];
  }
}

export default async function SuperAnnouncementsPage() {
  const [initialAnnouncements, labs] = await Promise.all([fetchAnnouncements(), fetchLabs()]);
  return <AnnouncementsClient initialAnnouncements={initialAnnouncements} labs={labs} />;
}
