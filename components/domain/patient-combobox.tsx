'use client';

import { Combobox } from '@/components/domain/combobox';
import { apiClient } from '@/lib/api/client';
import type { Patient } from '@/lib/api/types';

async function searchPatients(q: string): Promise<Patient[]> {
  const { data } = await apiClient.get<Patient[]>('/patients', { params: { q, limit: 25 } });
  return data;
}

type Props = {
  value: Patient | null;
  onChange: (next: Patient | null) => void;
  id?: string;
  invalid?: boolean;
  disabled?: boolean;
};

export function PatientCombobox({ value, onChange, id, invalid, disabled }: Props) {
  return (
    <Combobox<Patient>
      id={id}
      value={value}
      onChange={onChange}
      placeholder="Seleccionar paciente…"
      searchPlaceholder="Buscar por DNI, nombre o apellido…"
      searchFn={searchPatients}
      getKey={(p) => p.id}
      getLabel={(p) => `${p.lastName}, ${p.firstName}`}
      getSubtitle={(p) => `DNI ${p.dni}`}
      invalid={invalid}
      disabled={disabled}
    />
  );
}
