'use client';

import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/api/client';
import type { LabConfig, UpdateLabConfigDto } from '@/lib/api/types';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

type FormValues = {
  legalName: string;
  shortName: string;
  cuit: string;
  streetAddress: string;
  city: string;
  province: string;
  phone: string;
  email: string;
  signingProfessionalName: string;
  signingProfessionalMp: string;
  logoPath: string;
  signingSignaturePath: string;
};

function toFormValues(c: LabConfig): FormValues {
  return {
    legalName: c.legalName,
    shortName: c.shortName ?? '',
    cuit: c.cuit,
    streetAddress: c.streetAddress,
    city: c.city,
    province: c.province,
    phone: c.phone ?? '',
    email: c.email ?? '',
    signingProfessionalName: c.signingProfessionalName,
    signingProfessionalMp: c.signingProfessionalMp,
    logoPath: c.logoPath ?? '',
    signingSignaturePath: c.signingSignaturePath ?? '',
  };
}

function toPayload(v: FormValues): UpdateLabConfigDto {
  const nullable = (s: string) => (s.trim() === '' ? null : s.trim());
  return {
    legalName: v.legalName.trim(),
    shortName: nullable(v.shortName),
    cuit: v.cuit.trim(),
    streetAddress: v.streetAddress.trim(),
    city: v.city.trim(),
    province: v.province.trim(),
    phone: nullable(v.phone),
    email: nullable(v.email),
    signingProfessionalName: v.signingProfessionalName.trim(),
    signingProfessionalMp: v.signingProfessionalMp.trim(),
    logoPath: nullable(v.logoPath),
    signingSignaturePath: nullable(v.signingSignaturePath),
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

export function LabConfigForm({ config }: { config: LabConfig }) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: toFormValues(config) });

  const mutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const res = await apiClient.patch<LabConfig>('/lab-config', toPayload(data));
      return res.data;
    },
    onSuccess: () => {
      toast.success('Configuración actualizada');
      router.refresh();
    },
    onError: (err) => toast.error(apiError(err, 'Error al actualizar')),
  });

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-6" noValidate>
      <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6 shadow-[var(--shadow-xs)]">
        <h2 className="mb-4 font-semibold text-[var(--color-fg)] text-base">Datos legales</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            label="Razón social"
            htmlFor="legalName"
            required
            error={errors.legalName?.message}
            className="md:col-span-2"
          >
            <Input id="legalName" {...register('legalName', { required: 'Requerido' })} />
          </FormField>

          <FormField label="Nombre corto" htmlFor="shortName">
            <Input id="shortName" {...register('shortName')} />
          </FormField>

          <FormField label="CUIT" htmlFor="cuit" required error={errors.cuit?.message}>
            <Input
              id="cuit"
              placeholder="30-12345678-9"
              {...register('cuit', { required: 'Requerido' })}
            />
          </FormField>

          <FormField
            label="Domicilio"
            htmlFor="streetAddress"
            required
            error={errors.streetAddress?.message}
            className="md:col-span-2"
          >
            <Input id="streetAddress" {...register('streetAddress', { required: 'Requerido' })} />
          </FormField>

          <FormField label="Ciudad" htmlFor="city" required error={errors.city?.message}>
            <Input id="city" {...register('city', { required: 'Requerida' })} />
          </FormField>

          <FormField label="Provincia" htmlFor="province" required error={errors.province?.message}>
            <Input id="province" {...register('province', { required: 'Requerida' })} />
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
        </div>
      </section>

      <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6 shadow-[var(--shadow-xs)]">
        <h2 className="mb-4 font-semibold text-[var(--color-fg)] text-base">Firma profesional</h2>
        <p className="mb-4 text-[var(--color-fg-muted)] text-xs">
          Datos que aparecen al pie de los informes emitidos.
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            label="Nombre del profesional"
            htmlFor="signingProfessionalName"
            required
            error={errors.signingProfessionalName?.message}
          >
            <Input
              id="signingProfessionalName"
              {...register('signingProfessionalName', { required: 'Requerido' })}
            />
          </FormField>

          <FormField
            label="Matrícula"
            htmlFor="signingProfessionalMp"
            required
            error={errors.signingProfessionalMp?.message}
          >
            <Input
              id="signingProfessionalMp"
              {...register('signingProfessionalMp', { required: 'Requerida' })}
            />
          </FormField>

          <FormField
            label="Ruta de imagen de firma"
            htmlFor="signingSignaturePath"
            className="md:col-span-2"
          >
            <Input
              id="signingSignaturePath"
              placeholder="signatures/firma.png"
              {...register('signingSignaturePath')}
            />
          </FormField>
        </div>
      </section>

      <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6 shadow-[var(--shadow-xs)]">
        <h2 className="mb-4 font-semibold text-[var(--color-fg)] text-base">Branding</h2>
        <div className="grid grid-cols-1 gap-4">
          <FormField label="URL del logo" htmlFor="logoPath">
            <Input id="logoPath" placeholder="https://…" {...register('logoPath')} />
          </FormField>
        </div>
      </section>

      <div className="flex items-center justify-end gap-2 border-[var(--color-border)] border-t pt-4">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="animate-spin" strokeWidth={2} />}
          Guardar cambios
        </Button>
      </div>
    </form>
  );
}
