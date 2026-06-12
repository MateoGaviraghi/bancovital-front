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
import type { CreatePatientDto, Patient, Sex } from '@/lib/api/types';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { Loader2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

type FormValues = {
  dni: string;
  firstName: string;
  lastName: string;
  sex: '' | Sex;
  birthDate: string;
  phone: string;
  email: string;
  streetAddress: string;
  city: string;
  notes: string;
};

function toFormValues(p?: Partial<Patient>): FormValues {
  return {
    dni: p?.dni ?? '',
    firstName: p?.firstName ?? '',
    lastName: p?.lastName ?? '',
    sex: (p?.sex ?? '') as '' | Sex,
    birthDate: p?.birthDate ?? '',
    phone: p?.phone ?? '',
    email: p?.email ?? '',
    streetAddress: p?.streetAddress ?? '',
    city: p?.city ?? '',
    notes: p?.notes ?? '',
  };
}

function toPayload(v: FormValues): CreatePatientDto {
  const nullify = (s: string) => (s.trim() === '' ? null : s.trim());
  return {
    dni: v.dni.trim(),
    firstName: v.firstName.trim(),
    lastName: v.lastName.trim(),
    sex: v.sex === '' ? null : v.sex,
    birthDate: v.birthDate.trim() === '' ? null : v.birthDate,
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

export function PatientForm({ patient }: { patient?: Patient }) {
  const router = useRouter();
  const { slug } = useParams<{ slug: string }>();
  const isEdit = patient != null;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: toFormValues(patient) });

  const sexValue = watch('sex');

  const mutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const payload = toPayload(data);
      if (isEdit) {
        const res = await apiClient.patch<Patient>(`/patients/${patient.id}`, payload);
        return res.data;
      }
      const res = await apiClient.post<Patient>('/patients', payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Paciente actualizado' : 'Paciente creado');
      router.push(`/${slug}/pacientes`);
      router.refresh();
    },
    onError: (err) => toast.error(apiError(err, 'Error al guardar paciente')),
  });

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-6" noValidate>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField label="DNI" htmlFor="dni" required error={errors.dni?.message}>
          <Input
            id="dni"
            inputMode="numeric"
            autoComplete="off"
            {...register('dni', {
              required: 'Requerido',
              pattern: { value: /^\d{6,12}$/, message: '6 a 12 dígitos' },
            })}
          />
        </FormField>

        <FormField
          label="Fecha de nacimiento"
          htmlFor="birthDate"
          error={errors.birthDate?.message}
        >
          <Input id="birthDate" type="date" {...register('birthDate')} />
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

        <FormField label="Sexo" htmlFor="sex">
          <Select value={sexValue} onValueChange={(v) => setValue('sex', v as FormValues['sex'])}>
            <SelectTrigger id="sex">
              <SelectValue placeholder="Sin especificar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="F">Femenino</SelectItem>
              <SelectItem value="M">Masculino</SelectItem>
              <SelectItem value="X">Otro</SelectItem>
            </SelectContent>
          </Select>
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

        <FormField label="Domicilio" htmlFor="streetAddress" className="md:col-span-2">
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
          {isEdit ? 'Guardar cambios' : 'Crear paciente'}
        </Button>
      </div>
    </form>
  );
}
