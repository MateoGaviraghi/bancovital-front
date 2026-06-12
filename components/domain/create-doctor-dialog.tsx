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
import { Textarea } from '@/components/ui/textarea';
import { apiClient } from '@/lib/api/client';
import type { CreateDoctorDto, Doctor } from '@/lib/api/types';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { Loader2 } from 'lucide-react';
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

const DEFAULTS: FormValues = {
  firstName: '',
  lastName: '',
  matricula: '',
  specialty: '',
  phone: '',
  email: '',
  notes: '',
};

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

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (doctor: Doctor) => void;
};

export function CreateDoctorDialog({ open, onOpenChange, onCreated }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: DEFAULTS });

  const mutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const res = await apiClient.post<Doctor>('/doctors', toPayload(data));
      return res.data;
    },
    onSuccess: (doctor) => {
      toast.success('Médico creado');
      onCreated(doctor);
      onOpenChange(false);
      reset();
    },
    onError: (err) => toast.error(apiError(err, 'Error al crear médico')),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) reset();
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nuevo médico</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              label="Apellido"
              htmlFor="d-lastName"
              required
              error={errors.lastName?.message}
            >
              <Input id="d-lastName" {...register('lastName', { required: 'Requerido' })} />
            </FormField>

            <FormField
              label="Nombre"
              htmlFor="d-firstName"
              required
              error={errors.firstName?.message}
            >
              <Input id="d-firstName" {...register('firstName', { required: 'Requerido' })} />
            </FormField>

            <FormField
              label="Matrícula"
              htmlFor="d-matricula"
              required
              error={errors.matricula?.message}
            >
              <Input id="d-matricula" {...register('matricula', { required: 'Requerida' })} />
            </FormField>

            <FormField label="Especialidad" htmlFor="d-specialty">
              <Input id="d-specialty" {...register('specialty')} />
            </FormField>

            <FormField label="Teléfono" htmlFor="d-phone">
              <Input id="d-phone" {...register('phone')} />
            </FormField>

            <FormField label="Email" htmlFor="d-email" error={errors.email?.message}>
              <Input
                id="d-email"
                type="email"
                {...register('email', {
                  pattern: { value: /.+@.+\..+/, message: 'Email inválido' },
                })}
              />
            </FormField>

            <FormField label="Notas" htmlFor="d-notes" className="md:col-span-2">
              <Textarea id="d-notes" rows={2} {...register('notes')} />
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
              Crear médico
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
