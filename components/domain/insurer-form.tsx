'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/api/client';
import type { CreateInsurerDto, Insurer } from '@/lib/api/types';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { Loader2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

type FormValues = {
  code: string;
  name: string;
  requiresAuthorization: boolean;
  active: boolean;
};

function toFormValues(i?: Partial<Insurer>): FormValues {
  return {
    code: i?.code ?? '',
    name: i?.name ?? '',
    requiresAuthorization: i?.requiresAuthorization ?? true,
    active: i?.active ?? true,
  };
}

function toPayload(v: FormValues): CreateInsurerDto {
  return {
    code: v.code.trim().toUpperCase(),
    name: v.name.trim(),
    requiresAuthorization: v.requiresAuthorization,
    active: v.active,
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

export function InsurerForm({ insurer }: { insurer?: Insurer }) {
  const router = useRouter();
  const { slug } = useParams<{ slug: string }>();
  const isEdit = insurer != null;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: toFormValues(insurer) });

  const requiresAuthorization = watch('requiresAuthorization');
  const active = watch('active');

  const mutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const payload = toPayload(data);
      if (isEdit) {
        const res = await apiClient.patch<Insurer>(`/insurers/${insurer.id}`, payload);
        return res.data;
      }
      const res = await apiClient.post<Insurer>('/insurers', payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Obra social actualizada' : 'Obra social creada');
      router.push(`/${slug}/obras-sociales`);
      router.refresh();
    },
    onError: (err) => toast.error(apiError(err, 'Error al guardar')),
  });

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-6" noValidate>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField label="Código" htmlFor="code" required error={errors.code?.message}>
          <Input
            id="code"
            placeholder="IAPOS"
            className="uppercase"
            {...register('code', {
              required: 'Requerido',
              minLength: { value: 2, message: 'Mínimo 2 caracteres' },
            })}
          />
        </FormField>

        <FormField label="Nombre" htmlFor="name" required error={errors.name?.message}>
          <Input
            id="name"
            {...register('name', {
              required: 'Requerido',
              minLength: { value: 2, message: 'Mínimo 2 caracteres' },
            })}
          />
        </FormField>
      </div>

      <div className="space-y-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-4">
        <div className="flex items-start gap-3">
          <Checkbox
            id="requiresAuthorization"
            checked={requiresAuthorization}
            onCheckedChange={(v) => setValue('requiresAuthorization', v === true)}
            className="mt-0.5"
          />
          <label htmlFor="requiresAuthorization" className="cursor-pointer">
            <div className="font-medium text-sm text-[var(--color-fg)]">Requiere autorización</div>
            <div className="text-[var(--color-fg-muted)] text-xs">
              Las prácticas solicitadas para esta obra social piden código de autorización.
            </div>
          </label>
        </div>

        <div className="flex items-start gap-3">
          <Checkbox
            id="active"
            checked={active}
            onCheckedChange={(v) => setValue('active', v === true)}
            className="mt-0.5"
          />
          <label htmlFor="active" className="cursor-pointer">
            <div className="font-medium text-sm text-[var(--color-fg)]">Activa</div>
            <div className="text-[var(--color-fg-muted)] text-xs">
              Si está inactiva, no aparecerá al cargar nuevas órdenes.
            </div>
          </label>
        </div>
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
          {isEdit ? 'Guardar cambios' : 'Crear obra social'}
        </Button>
      </div>
    </form>
  );
}
