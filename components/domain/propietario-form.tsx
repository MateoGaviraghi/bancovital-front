'use client';

import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { apiClient } from '@/lib/api/client';
import type { CreatePropietarioDto, Propietario } from '@/lib/api/types';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

type FormValues = {
  dni: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  streetAddress: string;
  city: string;
  notes: string;
};

function toFormValues(p?: Partial<Propietario>): FormValues {
  return {
    dni: p?.dni ?? '',
    firstName: p?.firstName ?? '',
    lastName: p?.lastName ?? '',
    phone: p?.phone ?? '',
    email: p?.email ?? '',
    streetAddress: p?.streetAddress ?? '',
    city: p?.city ?? '',
    notes: p?.notes ?? '',
  };
}

function toPayload(v: FormValues): CreatePropietarioDto {
  const nullify = (s: string) => (s.trim() === '' ? null : s.trim());
  return {
    dni: nullify(v.dni) ?? undefined,
    firstName: v.firstName.trim(),
    lastName: v.lastName.trim(),
    phone: nullify(v.phone),
    email: nullify(v.email),
    streetAddress: nullify(v.streetAddress),
    city: nullify(v.city),
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

export function PropietarioForm({ propietario }: { propietario?: Propietario }) {
  const router = useRouter();
  const isEdit = propietario != null;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: toFormValues(propietario) });

  const mutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const payload = toPayload(data);
      if (isEdit) {
        const res = await apiClient.patch<Propietario>(`/propietarios/${propietario.id}`, payload);
        return res.data;
      }
      const res = await apiClient.post<Propietario>('/propietarios', payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Propietario actualizado' : 'Propietario creado');
      router.push('/propietarios');
      router.refresh();
    },
    onError: (err) => toast.error(apiError(err, 'Error al guardar propietario')),
  });

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-6" noValidate>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField label="DNI" htmlFor="dni" error={errors.dni?.message}>
          <Input
            id="dni"
            inputMode="numeric"
            autoComplete="off"
            {...register('dni', {
              pattern: { value: /^\d{6,12}$/, message: '6 a 12 dígitos' },
            })}
          />
        </FormField>

        <FormField label="Apellido" htmlFor="lastName" required error={errors.lastName?.message}>
          <Input
            id="lastName"
            autoComplete="family-name"
            {...register('lastName', { required: 'Requerido' })}
          />
        </FormField>

        <FormField label="Nombre" htmlFor="firstName" required error={errors.firstName?.message}>
          <Input
            id="firstName"
            autoComplete="given-name"
            {...register('firstName', { required: 'Requerido' })}
          />
        </FormField>

        <FormField label="Teléfono" htmlFor="phone">
          <Input id="phone" autoComplete="tel" {...register('phone')} />
        </FormField>

        <FormField label="Email" htmlFor="email" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            {...register('email', {
              pattern: { value: /.+@.+\..+/, message: 'Email inválido' },
            })}
          />
        </FormField>

        <FormField label="Ciudad" htmlFor="city">
          <Input id="city" {...register('city')} />
        </FormField>

        <FormField label="Dirección" htmlFor="streetAddress" className="md:col-span-2">
          <Input id="streetAddress" {...register('streetAddress')} />
        </FormField>

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
          {isEdit ? 'Guardar cambios' : 'Crear propietario'}
        </Button>
      </div>
    </form>
  );
}
