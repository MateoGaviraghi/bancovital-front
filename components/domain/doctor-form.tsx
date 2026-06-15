'use client';

import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { apiClient } from '@/lib/api/client';
import type { CreateDoctorDto, Doctor } from '@/lib/api/types';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

type FormValues = {
  firstName: string;
  lastName: string;
  matricula: string;
  specialty: string;
  phone: string;
  email: string;
  notes: string;
};

function toFormValues(d?: Partial<Doctor>): FormValues {
  return {
    firstName: d?.firstName ?? '',
    lastName: d?.lastName ?? '',
    matricula: d?.matricula ?? '',
    specialty: d?.specialty ?? '',
    phone: d?.phone ?? '',
    email: d?.email ?? '',
    notes: d?.notes ?? '',
  };
}

function toPayload(v: FormValues): CreateDoctorDto {
  const nullify = (s: string) => (s.trim() === '' ? null : s.trim());
  return {
    firstName: v.firstName.trim(),
    lastName: v.lastName.trim(),
    matricula: v.matricula.trim(),
    specialty: nullify(v.specialty),
    phone: nullify(v.phone),
    email: nullify(v.email),
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

export function DoctorForm({ doctor }: { doctor?: Doctor }) {
  const router = useRouter();
  const isEdit = doctor != null;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: toFormValues(doctor) });

  const mutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const payload = toPayload(data);
      if (isEdit) {
        const res = await apiClient.patch<Doctor>(`/doctors/${doctor.id}`, payload);
        return res.data;
      }
      const res = await apiClient.post<Doctor>('/doctors', payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Médico actualizado' : 'Médico creado');
      router.push('/medicos');
      router.refresh();
    },
    onError: (err) => toast.error(apiError(err, 'Error al guardar médico')),
  });

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-6" noValidate>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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

        <FormField label="Matrícula" htmlFor="matricula" required error={errors.matricula?.message}>
          <Input id="matricula" {...register('matricula', { required: 'Requerida' })} />
        </FormField>

        <FormField label="Especialidad" htmlFor="specialty">
          <Input id="specialty" {...register('specialty')} />
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
          {isEdit ? 'Guardar cambios' : 'Crear médico'}
        </Button>
      </div>
    </form>
  );
}
