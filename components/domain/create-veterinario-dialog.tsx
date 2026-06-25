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
import { apiClient } from '@/lib/api/client';
import type { CreateVeterinarioDto, Veterinario } from '@/lib/api/types';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

type FormValues = {
  firstName: string;
  lastName: string;
  matricula: string;
  clinica: string;
  phone: string;
  email: string;
};

const DEFAULTS: FormValues = {
  firstName: '',
  lastName: '',
  matricula: '',
  clinica: '',
  phone: '',
  email: '',
};

function toPayload(v: FormValues): CreateVeterinarioDto {
  const nullify = (s: string) => (s.trim() === '' ? null : s.trim());
  return {
    firstName: v.firstName.trim(),
    lastName: v.lastName.trim(),
    matricula: v.matricula.trim(),
    clinica: nullify(v.clinica),
    phone: nullify(v.phone),
    email: nullify(v.email),
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
  onCreated: (vet: Veterinario) => void;
};

export function CreateVeterinarioDialog({ open, onOpenChange, onCreated }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: DEFAULTS });

  const mutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const res = await apiClient.post<Veterinario>('/veterinarios', toPayload(data));
      return res.data;
    },
    onSuccess: (vet) => {
      toast.success('Veterinario creado');
      onCreated(vet);
      onOpenChange(false);
      reset();
    },
    onError: (err) => toast.error(apiError(err, 'Error al crear veterinario')),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) reset();
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo veterinario</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              label="Apellido"
              htmlFor="v-lastName"
              required
              error={errors.lastName?.message}
            >
              <Input id="v-lastName" {...register('lastName', { required: 'Requerido' })} />
            </FormField>
            <FormField
              label="Nombre"
              htmlFor="v-firstName"
              required
              error={errors.firstName?.message}
            >
              <Input id="v-firstName" {...register('firstName', { required: 'Requerido' })} />
            </FormField>
            <FormField
              label="Matrícula"
              htmlFor="v-matricula"
              required
              error={errors.matricula?.message}
            >
              <Input id="v-matricula" {...register('matricula', { required: 'Requerida' })} />
            </FormField>
            <FormField label="Clínica" htmlFor="v-clinica">
              <Input id="v-clinica" {...register('clinica')} />
            </FormField>
            <FormField label="Teléfono" htmlFor="v-phone">
              <Input id="v-phone" {...register('phone')} />
            </FormField>
            <FormField label="Email" htmlFor="v-email">
              <Input id="v-email" type="email" {...register('email')} />
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
              Crear veterinario
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
