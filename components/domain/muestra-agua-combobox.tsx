'use client';

import { Combobox } from '@/components/domain/combobox';
import { apiClient } from '@/lib/api/client';
import type { MuestraAgua } from '@/lib/api/types';

const DATE_FMT = new Intl.DateTimeFormat('es-AR', {
  dateStyle: 'short',
  timeZone: 'America/Argentina/Buenos_Aires',
});

async function searchMuestras(_q: string): Promise<MuestraAgua[]> {
  const { data } = await apiClient.get<MuestraAgua[]>('/muestras-agua');
  return data;
}

type Props = {
  value: MuestraAgua | null;
  onChange: (next: MuestraAgua | null) => void;
  id?: string;
  invalid?: boolean;
};

export function MuestraAguaCombobox({ value, onChange, id, invalid }: Props) {
  return (
    <Combobox<MuestraAgua>
      id={id}
      value={value}
      onChange={onChange}
      placeholder="Seleccionar muestra…"
      searchPlaceholder="Buscar muestra…"
      searchFn={searchMuestras}
      getKey={(m) => m.id}
      getLabel={(m) => `#${m.id} · ${m.tipoMuestra}`}
      getSubtitle={(m) => `${DATE_FMT.format(new Date(m.fechaToma))} · ${m.motivoAnalisis}`}
      invalid={invalid}
    />
  );
}
