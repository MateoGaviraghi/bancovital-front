'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import type { AdminUser, InviteUserDto, UserRole } from '@/lib/api/types';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { Loader2, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

type FormValues = {
  email: string;
  role: UserRole;
  displayName: string;
  matricula: string;
};

function apiError(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const msg = err.response?.data?.message;
    if (Array.isArray(msg)) return msg.join('. ');
    if (typeof msg === 'string') return msg;
  }
  return fallback;
}

export function InviteUserDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: { email: '', role: 'recepcion', displayName: '', matricula: '' },
  });

  const role = watch('role');

  const mutation = useMutation({
    mutationFn: async (v: FormValues) => {
      const payload: InviteUserDto = {
        email: v.email.trim(),
        role: v.role,
        displayName: v.displayName.trim() || null,
        matricula: v.role === 'bioquimico' ? v.matricula.trim() || null : null,
      };
      const res = await apiClient.post<AdminUser>('/users/invite', payload);
      return res.data;
    },
    onSuccess: (user) => {
      toast.success(`Invitación enviada a ${user.email}`);
      setOpen(false);
      reset();
      router.refresh();
    },
    onError: (err) => toast.error(apiError(err, 'Error al invitar')),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="h-4 w-4" strokeWidth={2} />
          Invitar usuario
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invitar usuario</DialogTitle>
          <DialogDescription>
            Supabase envía un correo con un magic link para que active la cuenta.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4" noValidate>
          <FormField label="Email" htmlFor="invite-email" required error={errors.email?.message}>
            <Input
              id="invite-email"
              type="email"
              autoComplete="email"
              {...register('email', {
                required: 'Requerido',
                pattern: { value: /.+@.+\..+/, message: 'Email inválido' },
              })}
            />
          </FormField>

          <FormField label="Rol" htmlFor="invite-role" required>
            <Select value={role} onValueChange={(v) => setValue('role', v as UserRole)}>
              <SelectTrigger id="invite-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="recepcion">Recepción</SelectItem>
                <SelectItem value="bioquimico">Bioquímico</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="Nombre visible" htmlFor="invite-name">
            <Input id="invite-name" {...register('displayName')} />
          </FormField>

          {role === 'bioquimico' && (
            <FormField label="Matrícula profesional" htmlFor="invite-mp">
              <Input id="invite-mp" {...register('matricula')} />
            </FormField>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={mutation.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />}
              Enviar invitación
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
