'use client';

import { Combobox } from '@/components/domain/combobox';
import { apiClient } from '@/lib/api/client';
import type { CreateUnidadMedidaDto, UnidadMedida } from '@/lib/api/types';
import axios from 'axios';
import { toast } from 'sonner';

async function searchUnidades(q: string): Promise<UnidadMedida[]> {
  const { data } = await apiClient.get<UnidadMedida[]>('/unidades-medida', {
    params: { q, limit: 50 },
  });
  return data;
}

async function createUnidad(nombre: string): Promise<UnidadMedida> {
  const payload: CreateUnidadMedidaDto = { nombre };
  try {
    const { data } = await apiClient.post<UnidadMedida>('/unidades-medida', payload);
    toast.success(`Unidad "${data.nombre}" creada`);
    return data;
  } catch (err) {
    let msg = 'No se pudo crear la unidad';
    if (axios.isAxiosError(err)) {
      const raw = err.response?.data?.message;
      if (Array.isArray(raw)) msg = raw.join('. ');
      else if (typeof raw === 'string') msg = raw;
    }
    toast.error(msg);
    throw err;
  }
}

type Props = {
  value: UnidadMedida | null;
  onChange: (next: UnidadMedida | null) => void;
  id?: string;
  invalid?: boolean;
  disabled?: boolean;
  /** Si true, permite crear una unidad nueva inline. Default: true. */
  canCreate?: boolean;
};

export function UnidadCombobox({
  value,
  onChange,
  id,
  invalid,
  disabled,
  canCreate = true,
}: Props) {
  return (
    <Combobox<UnidadMedida>
      id={id}
      value={value}
      onChange={onChange}
      placeholder="Elegí una unidad"
      searchPlaceholder="Buscar por nombre… (ej: pH, mg/dL, Color)"
      searchFn={searchUnidades}
      getKey={(u) => u.id}
      getLabel={(u) => (u.simbolo ? `${u.nombre} (${u.simbolo})` : u.nombre)}
      getSubtitle={() => null}
      minChars={1}
      invalid={invalid}
      disabled={disabled}
      onCreateNew={canCreate ? createUnidad : undefined}
      createLabel={(q) => `Crear unidad "${q}"`}
    />
  );
}
