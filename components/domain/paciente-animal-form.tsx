'use client';

import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { apiClient } from '@/lib/api/client';
import { queries } from '@/lib/api/queries';
import type {
  AnimalSex,
  CreatePacienteAnimalDto,
  Especie,
  PacienteAnimal,
  Propietario,
  Raza,
  ReproductiveStatus,
} from '@/lib/api/types';
import { useMutation, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

type FormValues = {
  nombre: string;
  sexo: '' | AnimalSex;
  birthDate: string;
  peso: string;
  color: string;
  tamanio: string;
  estadoReproductivo: '' | ReproductiveStatus;
  microchip: string;
  notes: string;
};

function toFormValues(p?: Partial<PacienteAnimal>): FormValues {
  return {
    nombre: p?.nombre ?? '',
    sexo: (p?.sexo ?? '') as '' | AnimalSex,
    birthDate: p?.birthDate ?? '',
    peso: p?.peso ?? '',
    color: p?.color ?? '',
    tamanio: p?.tamanio ?? '',
    estadoReproductivo: (p?.estadoReproductivo ?? '') as '' | ReproductiveStatus,
    microchip: p?.microchip ?? '',
    notes: p?.notes ?? '',
  };
}

function toPayload(
  v: FormValues,
  propietarioId: number,
  especieId: number,
  razaId: number | null,
): CreatePacienteAnimalDto {
  const nullify = (s: string) => (s.trim() === '' ? null : s.trim());
  return {
    propietarioId,
    especieId,
    razaId: razaId ?? null,
    nombre: v.nombre.trim(),
    sexo: v.sexo === '' ? null : v.sexo,
    birthDate: v.birthDate.trim() === '' ? null : v.birthDate,
    peso: nullify(v.peso),
    color: nullify(v.color),
    tamanio: nullify(v.tamanio),
    estadoReproductivo: v.estadoReproductivo === '' ? null : v.estadoReproductivo,
    microchip: nullify(v.microchip),
    notes: nullify(v.notes),
  };
}

function apiError(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const msg = err.response?.data?.message;
    if (Array.isArray(msg)) return msg.join('. ');
    if (typeof msg === 'string') return msg;
  }
  return fallback;
}

export function PacienteAnimalForm({
  animal,
  initialPropietario,
}: {
  animal?: PacienteAnimal;
  initialPropietario?: Propietario;
}) {
  const router = useRouter();
  const isEdit = animal != null;

  // ── Propietario search ──
  const [propSearch, setPropSearch] = useState('');
  const [propietario, setPropietario] = useState<Propietario | null>(initialPropietario ?? null);
  const [showPropResults, setShowPropResults] = useState(false);
  const propRef = useRef<HTMLDivElement>(null);

  const { data: propResults = [] } = useQuery({
    queryKey: queries.propietarios.list({ q: propSearch, limit: 8 }),
    queryFn: () =>
      apiClient
        .get<Propietario[]>('/propietarios', { params: { q: propSearch, limit: 8 } })
        .then((r) => r.data),
    enabled: propSearch.length >= 2,
  });

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (propRef.current && !propRef.current.contains(e.target as Node)) {
        setShowPropResults(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // ── Especie / Raza ──
  const [selectedEspecieId, setSelectedEspecieId] = useState<number | null>(
    animal?.especieId ?? null,
  );
  const [selectedRazaId, setSelectedRazaId] = useState<number | null>(animal?.razaId ?? null);

  const { data: especies = [] } = useQuery({
    queryKey: queries.especies.list(),
    queryFn: () => apiClient.get<Especie[]>('/especies').then((r) => r.data),
  });

  const { data: razas = [] } = useQuery({
    queryKey: queries.especies.razas(selectedEspecieId!),
    queryFn: () =>
      apiClient.get<Raza[]>(`/especies/${selectedEspecieId}/razas`).then((r) => r.data),
    enabled: !!selectedEspecieId,
  });

  // Reset raza when especie changes
  function handleEspecieChange(val: string) {
    const newId = Number(val);
    setSelectedEspecieId(newId);
    setSelectedRazaId(null);
  }

  // ── Form ──
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: toFormValues(animal) });

  const sexoValue = watch('sexo');
  const estadoRepValue = watch('estadoReproductivo');

  const mutation = useMutation({
    mutationFn: async (data: FormValues) => {
      if (!propietario) throw new Error('Seleccioná un propietario');
      if (!selectedEspecieId) throw new Error('Seleccioná una especie');

      const payload = toPayload(data, propietario.id, selectedEspecieId, selectedRazaId);
      if (isEdit) {
        const res = await apiClient.patch<PacienteAnimal>(
          `/pacientes-animales/${animal.id}`,
          payload,
        );
        return res.data;
      }
      const res = await apiClient.post<PacienteAnimal>('/pacientes-animales', payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Paciente animal actualizado' : 'Paciente animal creado');
      router.push('/pacientes-animales');
      router.refresh();
    },
    onError: (err) => toast.error(apiError(err, 'Error al guardar paciente animal')),
  });

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-6" noValidate>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* ── Propietario ── */}
        <FormField label="Propietario" htmlFor="propietario" required className="md:col-span-2">
          <div ref={propRef} className="relative">
            {propietario ? (
              <div className="flex items-center gap-2">
                <Input
                  id="propietario"
                  readOnly
                  value={`${propietario.lastName}, ${propietario.firstName} — DNI ${propietario.dni}`}
                  className="cursor-default"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPropietario(null);
                    setPropSearch('');
                  }}
                >
                  Cambiar
                </Button>
              </div>
            ) : (
              <>
                <Input
                  id="propietario"
                  placeholder="Buscá por nombre o DNI del propietario…"
                  autoComplete="off"
                  value={propSearch}
                  onChange={(e) => {
                    setPropSearch(e.target.value);
                    setShowPropResults(true);
                  }}
                  onFocus={() => propSearch.length >= 2 && setShowPropResults(true)}
                />
                {showPropResults && propResults.length > 0 && (
                  <ul className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-md border border-[var(--color-border)] bg-[var(--color-bg-elevated)] py-1 shadow-[var(--shadow-lg)]">
                    {propResults.map((p) => (
                      <li key={p.id}>
                        <button
                          type="button"
                          className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--color-bg-hover)]"
                          onClick={() => {
                            setPropietario(p);
                            setShowPropResults(false);
                            setPropSearch('');
                          }}
                        >
                          <span className="font-medium text-[var(--color-fg)]">
                            {p.lastName}, {p.firstName}
                          </span>
                          <span className="ml-2 text-[var(--color-fg-muted)]">DNI {p.dni}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        </FormField>

        {/* ── Nombre ── */}
        <FormField label="Nombre" htmlFor="nombre" required error={errors.nombre?.message}>
          <Input
            id="nombre"
            autoComplete="off"
            {...register('nombre', { required: 'Requerido' })}
          />
        </FormField>

        {/* ── Especie ── */}
        <FormField label="Especie" htmlFor="especie" required>
          <Select
            value={selectedEspecieId != null ? String(selectedEspecieId) : ''}
            onValueChange={handleEspecieChange}
          >
            <SelectTrigger id="especie">
              <SelectValue placeholder="Seleccionar especie" />
            </SelectTrigger>
            <SelectContent>
              {especies.map((e) => (
                <SelectItem key={e.id} value={String(e.id)}>
                  {e.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        {/* ── Raza ── */}
        <FormField label="Raza" htmlFor="raza">
          <Select
            value={selectedRazaId != null ? String(selectedRazaId) : ''}
            onValueChange={(v) => setSelectedRazaId(Number(v))}
            disabled={!selectedEspecieId || razas.length === 0}
          >
            <SelectTrigger id="raza">
              <SelectValue
                placeholder={selectedEspecieId ? 'Seleccionar raza' : 'Elegí especie primero'}
              />
            </SelectTrigger>
            <SelectContent>
              {razas.map((r) => (
                <SelectItem key={r.id} value={String(r.id)}>
                  {r.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        {/* ── Sexo ── */}
        <FormField label="Sexo" htmlFor="sexo">
          <Select
            value={sexoValue}
            onValueChange={(v) => setValue('sexo', v as FormValues['sexo'])}
          >
            <SelectTrigger id="sexo">
              <SelectValue placeholder="Sin especificar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="macho">Macho</SelectItem>
              <SelectItem value="hembra">Hembra</SelectItem>
              <SelectItem value="indeterminado">Indeterminado</SelectItem>
            </SelectContent>
          </Select>
        </FormField>

        {/* ── Fecha de nacimiento ── */}
        <FormField
          label="Fecha de nacimiento"
          htmlFor="birthDate"
          error={errors.birthDate?.message}
        >
          <Input id="birthDate" type="date" {...register('birthDate')} />
        </FormField>

        {/* ── Peso ── */}
        <FormField label="Peso (kg)" htmlFor="peso">
          <Input id="peso" inputMode="decimal" autoComplete="off" {...register('peso')} />
        </FormField>

        {/* ── Color ── */}
        <FormField label="Color" htmlFor="color">
          <Input id="color" autoComplete="off" {...register('color')} />
        </FormField>

        {/* ── Tamanio ── */}
        <FormField label="Tamaño" htmlFor="tamanio">
          <Input id="tamanio" autoComplete="off" {...register('tamanio')} />
        </FormField>

        {/* ── Estado reproductivo ── */}
        <FormField label="Estado reproductivo" htmlFor="estadoReproductivo">
          <Select
            value={estadoRepValue}
            onValueChange={(v) =>
              setValue('estadoReproductivo', v as FormValues['estadoReproductivo'])
            }
          >
            <SelectTrigger id="estadoReproductivo">
              <SelectValue placeholder="Sin especificar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="entero">Entero/a</SelectItem>
              <SelectItem value="castrado">Castrado/a</SelectItem>
              <SelectItem value="esterilizado">Esterilizado/a</SelectItem>
              <SelectItem value="gestante">Gestante</SelectItem>
              <SelectItem value="lactante">Lactante</SelectItem>
              <SelectItem value="desconocido">Desconocido</SelectItem>
            </SelectContent>
          </Select>
        </FormField>

        {/* ── Microchip ── */}
        <FormField label="Microchip" htmlFor="microchip">
          <Input id="microchip" autoComplete="off" {...register('microchip')} />
        </FormField>

        {/* ── Notas ── */}
        <FormField label="Notas" htmlFor="notes" className="md:col-span-2">
          <Textarea id="notes" rows={3} {...register('notes')} />
        </FormField>
      </div>

      <div className="flex items-center justify-end gap-2 border-[var(--color-border)] border-t pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={mutation.isPending}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="animate-spin" strokeWidth={2} />}
          {isEdit ? 'Guardar cambios' : 'Crear paciente'}
        </Button>
      </div>
    </form>
  );
}
