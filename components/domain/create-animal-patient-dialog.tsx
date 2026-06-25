'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiClient } from '@/lib/api/client';
import { queries } from '@/lib/api/queries';
import type {
  CreatePacienteAnimalDto,
  Especie,
  PacienteAnimal,
  Propietario,
  Raza,
} from '@/lib/api/types';
import { useMutation, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

function apiError(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const msg = err.response?.data?.message;
    if (Array.isArray(msg)) return msg.join('. ');
    if (typeof msg === 'string') return msg;
  }
  return fallback;
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (animal: PacienteAnimal) => void;
};

export function CreateAnimalPatientDialog({ open, onOpenChange, onCreated }: Props) {
  const [nombre, setNombre] = useState('');
  const [especieId, setEspecieId] = useState('');
  const [razaId, setRazaId] = useState('');
  const [propSearch, setPropSearch] = useState('');
  const [propietario, setPropietario] = useState<Propietario | null>(null);
  const [showPropResults, setShowPropResults] = useState(false);

  const { data: especies = [] } = useQuery({
    queryKey: queries.especies.list(),
    queryFn: () => apiClient.get<Especie[]>('/especies').then((r) => r.data),
    enabled: open,
    staleTime: 5 * 60_000,
  });

  const numEspecieId = Number(especieId) || 0;
  const { data: razas = [] } = useQuery({
    queryKey: queries.especies.razas(numEspecieId),
    queryFn: () => apiClient.get<Raza[]>(`/especies/${numEspecieId}/razas`).then((r) => r.data),
    enabled: numEspecieId > 0,
  });

  const { data: propResults = [] } = useQuery({
    queryKey: ['propietarios-search', propSearch],
    queryFn: () =>
      apiClient
        .get<Propietario[]>('/propietarios', { params: { q: propSearch, limit: 8 } })
        .then((r) => r.data),
    enabled: propSearch.length >= 2 && open,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (!propietario || !especieId || !nombre.trim()) {
        throw new Error('Completá nombre, propietario y especie.');
      }
      const dto: CreatePacienteAnimalDto = {
        propietarioId: propietario.id,
        especieId: Number(especieId),
        razaId: razaId ? Number(razaId) : null,
        nombre: nombre.trim(),
      };
      const res = await apiClient.post<PacienteAnimal>('/pacientes-animales', dto);
      return res.data;
    },
    onSuccess: (animal) => {
      toast.success('Paciente animal creado');
      onCreated(animal);
      onOpenChange(false);
      resetForm();
    },
    onError: (err) => toast.error(apiError(err, 'Error al crear paciente animal')),
  });

  function resetForm() {
    setNombre('');
    setEspecieId('');
    setRazaId('');
    setPropSearch('');
    setPropietario(null);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) resetForm();
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo paciente animal</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Propietario search */}
          <FormField label="Propietario" htmlFor="ap-prop" required>
            {propietario ? (
              <div className="flex items-center justify-between rounded-md border border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-3 py-2 text-sm">
                <span>
                  {propietario.lastName}, {propietario.firstName}{' '}
                  <span className="text-[var(--color-fg-muted)]">DNI {propietario.dni}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setPropietario(null)}
                  className="text-xs text-[var(--color-primary)] hover:underline"
                >
                  Cambiar
                </button>
              </div>
            ) : (
              <div className="relative">
                <Input
                  id="ap-prop"
                  value={propSearch}
                  onChange={(e) => {
                    setPropSearch(e.target.value);
                    setShowPropResults(true);
                  }}
                  onFocus={() => setShowPropResults(true)}
                  placeholder="Buscar por DNI o nombre…"
                  autoComplete="off"
                />
                {showPropResults && propResults.length > 0 && (
                  <div className="absolute z-10 mt-1 max-h-40 w-full overflow-y-auto rounded-md border border-[var(--color-border)] bg-[var(--color-bg-elevated)] shadow-[var(--shadow-md)]">
                    {propResults.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setPropietario(p);
                          setPropSearch('');
                          setShowPropResults(false);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[var(--color-bg-subtle)]"
                      >
                        <span className="text-[var(--color-fg)]">
                          {p.lastName}, {p.firstName}
                        </span>
                        <span className="text-[var(--color-fg-muted)] text-xs">DNI {p.dni}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </FormField>

          <FormField label="Nombre del animal" htmlFor="ap-nombre" required>
            <Input
              id="ap-nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Luna"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Especie" htmlFor="ap-especie" required>
              <Select
                value={especieId}
                onValueChange={(v) => {
                  setEspecieId(v);
                  setRazaId('');
                }}
              >
                <SelectTrigger id="ap-especie">
                  <SelectValue placeholder="Seleccionar…" />
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

            <FormField label="Raza" htmlFor="ap-raza">
              <Select value={razaId} onValueChange={setRazaId} disabled={!especieId}>
                <SelectTrigger id="ap-raza">
                  <SelectValue placeholder={especieId ? 'Seleccionar…' : 'Elegí especie'} />
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
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={!nombre.trim() || !propietario || !especieId || mutation.isPending}
          >
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />}
            Crear paciente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
