'use client';

import { Combobox } from '@/components/domain/combobox';
import { apiClient } from '@/lib/api/client';
import type { PacienteAnimal } from '@/lib/api/types';

async function searchAnimals(q: string): Promise<PacienteAnimal[]> {
  const { data } = await apiClient.get<PacienteAnimal[]>('/pacientes-animales', {
    params: { q, limit: 25 },
  });
  return data;
}

type Props = {
  value: PacienteAnimal | null;
  onChange: (next: PacienteAnimal | null) => void;
  id?: string;
  invalid?: boolean;
  disabled?: boolean;
};

export function AnimalPatientCombobox({ value, onChange, id, invalid, disabled }: Props) {
  return (
    <Combobox<PacienteAnimal>
      id={id}
      value={value}
      onChange={onChange}
      placeholder="Seleccionar paciente animal…"
      searchPlaceholder="Buscar por nombre…"
      searchFn={searchAnimals}
      getKey={(a) => a.id}
      getLabel={(a) => a.nombre}
      getSubtitle={(a) =>
        `${a.especie?.nombre ?? ''}${a.propietario ? ` · ${a.propietario.lastName}, ${a.propietario.firstName}` : ''}`
      }
      invalid={invalid}
      disabled={disabled}
    />
  );
}
