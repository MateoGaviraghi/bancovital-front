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
import { Textarea } from '@/components/ui/textarea';
import { apiClient } from '@/lib/api/client';
import type { CreatePatientDto, Patient, Sex } from '@/lib/api/types';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { Loader2 } from 'lucide-react';
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

const DEFAULTS: FormValues = {
  dni: '',
  firstName: '',
  lastName: '',
  sex: '',
  birthDate: '',
  phone: '',
  email: '',
  streetAddress: '',
  city: '',
  notes: '',
};

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

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (patient: Patient) => void;
};

export function CreatePatientDialog({ open, onOpenChange, onCreated }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: DEFAULTS });

  const sexValue = watch('sex');

  const mutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const res = await apiClient.post<Patient>('/patients', toPayload(data));
      return res.data;
    },
    onSuccess: (patient) => {
      toast.success('Paciente creado');
      onCreated(patient);
      onOpenChange(false);
      reset();
    },
    onError: (err) => toast.error(apiError(err, 'Error al crear paciente')),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) reset();
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo paciente</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField label="DNI" htmlFor="p-dni" required error={errors.dni?.message}>
              <Input
                id="p-dni"
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
              htmlFor="p-birthDate"
              error={errors.birthDate?.message}
            >
              <Input id="p-birthDate" type="date" {...register('birthDate')} />
            </FormField>

            <FormField
              label="Apellido"
              htmlFor="p-lastName"
              required
              error={errors.lastName?.message}
            >
              <Input
                id="p-lastName"
                autoComplete="family-name"
                {...register('lastName', { required: 'Requerido' })}
              />
            </FormField>

            <FormField
              label="Nombre"
              htmlFor="p-firstName"
              required
              error={errors.firstName?.message}
            >
              <Input
                id="p-firstName"
                autoComplete="given-name"
                {...register('firstName', { required: 'Requerido' })}
              />
            </FormField>

            <FormField label="Sexo" htmlFor="p-sex">
              <Select
                value={sexValue}
                onValueChange={(v) => setValue('sex', v as FormValues['sex'])}
              >
                <SelectTrigger id="p-sex">
                  <SelectValue placeholder="Sin especificar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="F">Femenino</SelectItem>
                  <SelectItem value="M">Masculino</SelectItem>
                  <SelectItem value="X">Otro</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Teléfono" htmlFor="p-phone">
              <Input id="p-phone" autoComplete="tel" {...register('phone')} />
            </FormField>

            <FormField label="Email" htmlFor="p-email" error={errors.email?.message}>
              <Input
                id="p-email"
                type="email"
                autoComplete="email"
                {...register('email', {
                  pattern: { value: /.+@.+\..+/, message: 'Email inválido' },
                })}
              />
            </FormField>

            <FormField label="Ciudad" htmlFor="p-city">
              <Input id="p-city" {...register('city')} />
            </FormField>

            <FormField label="Domicilio" htmlFor="p-streetAddress" className="md:col-span-2">
              <Input id="p-streetAddress" {...register('streetAddress')} />
            </FormField>

            <FormField label="Notas" htmlFor="p-notes" className="md:col-span-2">
              <Textarea id="p-notes" rows={2} {...register('notes')} />
            </FormField>
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
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />}
              Crear paciente
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
