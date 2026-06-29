'use client';

import { Combobox } from '@/components/domain/combobox';
import { apiClient } from '@/lib/api/client';
import type { SolicitanteAgua } from '@/lib/api/types';

async function searchSolicitantes(q: string): Promise<SolicitanteAgua[]> {
  const { data } = await apiClient.get<SolicitanteAgua[]>('/solicitantes-agua', {
    params: { search: q },
  });
  return data;
}

type Props = {
  value: SolicitanteAgua | null;
  onChange: (next: SolicitanteAgua | null) => void;
  id?: string;
  invalid?: boolean;
};

export function SolicitanteAguaCombobox({ value, onChange, id, invalid }: Props) {
  return (
    <Combobox<SolicitanteAgua>
      id={id}
      value={value}
      onChange={onChange}
      placeholder="Seleccionar solicitante…"
      searchPlaceholder="Buscar por nombre, razón social o CUIT…"
      searchFn={searchSolicitantes}
      getKey={(s) => s.id}
      getLabel={(s) => s.nombreApellido}
      getSubtitle={(s) => s.razonSocial || s.cuit || null}
      invalid={invalid}
    />
  );
}
