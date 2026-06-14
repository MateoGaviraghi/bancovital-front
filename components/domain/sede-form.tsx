'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { apiClient } from '@/lib/api/client';
import type { CreateSedeDto, Sede } from '@/lib/api/types';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

type FormValues = {
  nombre: string;
  direccion: string;
  localidad: string;
  telefono: string;
  email: string;
  horarios: string;
  principal: boolean;
  orden: string;
};

function toFormValues(s?: Partial<Sede>): FormValues {
  return {
    nombre: s?.nombre ?? '',
    direccion: s?.direccion ?? '',
    localidad: s?.localidad ?? '',
    telefono: s?.telefono ?? '',
    email: s?.email ?? '',
    horarios: s?.horarios ?? '',
    principal: s?.principal ?? false,
    orden: s?.orden != null ? String(s.orden) : '',
  };
}

function toPayload(v: FormValues): CreateSedeDto {
  const nullify = (s: string) => (s.trim() === '' ? null : s.trim());
  return {
    nombre: v.nombre.trim(),
    direccion: v.direccion.trim(),
    localidad: nullify(v.localidad),
    telefono: nullify(v.telefono),
    email: nullify(v.email),
    horarios: nullify(v.horarios),
    principal: v.principal,
    orden: v.orden.trim() !== '' ? Number(v.orden) : undefined,
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

type Props = {
  sede?: Sede;
  onSuccess?: () => void;
};

export function SedeForm({ sede, onSuccess }: Props) {
  const router = useRouter();
  const isEdit = sede != null;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: toFormValues(sede) });

  const principal = watch('principal');

  const mutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const payload = toPayload(data);
      if (isEdit) {
        const res = await apiClient.patch<Sede>(`/sedes/${sede.id}`, payload);
        return res.data;
      }
      const res = await apiClient.post<Sede>('/sedes', payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Sede actualizada' : 'Sede creada');
      router.refresh();
      onSuccess?.();
    },
    onError: (err) => toast.error(apiError(err, 'Error al guardar sede')),
  });

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-5" noValidate>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField label="Nombre" htmlFor="s-nombre" required error={errors.nombre?.message}>
          <Input id="s-nombre" {...register('nombre', { required: 'Requerido' })} />
        </FormField>

        <FormField
          label="Dirección"
          htmlFor="s-direccion"
          required
          error={errors.direccion?.message}
        >
          <Input id="s-direccion" {...register('direccion', { required: 'Requerida' })} />
        </FormField>

        <FormField label="Localidad" htmlFor="s-localidad">
          <Input id="s-localidad" {...register('localidad')} />
        </FormField>

        <FormField label="Teléfono" htmlFor="s-telefono">
          <Input id="s-telefono" autoComplete="tel" {...register('telefono')} />
        </FormField>

        <FormField label="Email" htmlFor="s-email" error={errors.email?.message}>
          <Input
            id="s-email"
            type="email"
            autoComplete="email"
            {...register('email', {
              pattern: { value: /.+@.+\..+/, message: 'Email inválido' },
            })}
          />
        </FormField>

        <FormField label="Orden" htmlFor="s-orden">
          <Input id="s-orden" type="number" min={0} placeholder="0" {...register('orden')} />
        </FormField>

        <FormField label="Horarios" htmlFor="s-horarios" className="md:col-span-2">
          <Textarea
            id="s-horarios"
            rows={3}
            placeholder="Lun–Vie 7:00–19:00, Sáb 7:00–12:00"
            {...register('horarios')}
          />
        </FormField>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="s-principal"
          checked={principal}
          onCheckedChange={(checked) => setValue('principal', checked === true)}
        />
        <Label htmlFor="s-principal" className="cursor-pointer text-sm">
          Sede principal
        </Label>
      </div>

      <div className="flex items-center justify-end gap-2 border-[var(--color-border)] border-t pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => onSuccess?.()}
          disabled={mutation.isPending}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />}
          {isEdit ? 'Guardar cambios' : 'Crear sede'}
        </Button>
      </div>
    </form>
  );
}
