'use client';

import { Combobox } from '@/components/domain/combobox';
import { apiClient } from '@/lib/api/client';
import type { Doctor } from '@/lib/api/types';

async function searchDoctors(q: string): Promise<Doctor[]> {
  const { data } = await apiClient.get<Doctor[]>('/doctors', { params: { q, limit: 25 } });
  return data;
}

type Props = {
  value: Doctor | null;
  onChange: (next: Doctor | null) => void;
  id?: string;
  invalid?: boolean;
  disabled?: boolean;
};

export function DoctorCombobox({ value, onChange, id, invalid, disabled }: Props) {
  return (
    <Combobox<Doctor>
      id={id}
      value={value}
      onChange={onChange}
      placeholder="Sin médico derivante"
      searchPlaceholder="Buscar por matrícula o nombre…"
      searchFn={searchDoctors}
      getKey={(d) => d.id}
      getLabel={(d) => `${d.lastName}, ${d.firstName}`}
      getSubtitle={(d) => `Mat. ${d.matricula}${d.specialty ? ` · ${d.specialty}` : ''}`}
      invalid={invalid}
      disabled={disabled}
    />
  );
}
