'use client';

import { Combobox } from '@/components/domain/combobox';
import { apiClient } from '@/lib/api/client';
import type { Veterinario } from '@/lib/api/types';

async function searchVeterinarios(q: string): Promise<Veterinario[]> {
  const { data } = await apiClient.get<Veterinario[]>('/veterinarios', {
    params: { q, limit: 25 },
  });
  return data;
}

type Props = {
  value: Veterinario | null;
  onChange: (next: Veterinario | null) => void;
  id?: string;
  invalid?: boolean;
  disabled?: boolean;
};

export function VeterinarioCombobox({ value, onChange, id, invalid, disabled }: Props) {
  return (
    <Combobox<Veterinario>
      id={id}
      value={value}
      onChange={onChange}
      placeholder="Sin veterinario"
      searchPlaceholder="Buscar por matrícula o nombre…"
      searchFn={searchVeterinarios}
      getKey={(v) => v.id}
      getLabel={(v) => `${v.lastName}, ${v.firstName}`}
      getSubtitle={(v) => `Mat. ${v.matricula}${v.clinica ? ` · ${v.clinica}` : ''}`}
      invalid={invalid}
      disabled={disabled}
    />
  );
}
