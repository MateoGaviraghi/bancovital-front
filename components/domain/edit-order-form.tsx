'use client';

import { CreateDoctorDialog } from '@/components/domain/create-doctor-dialog';
import { CreatePatientDialog } from '@/components/domain/create-patient-dialog';
import { DoctorCombobox } from '@/components/domain/doctor-combobox';
import { NbuGrid } from '@/components/domain/nbu-grid';
import { PatientCombobox } from '@/components/domain/patient-combobox';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import type {
  Doctor,
  Insurer,
  OrderDetail,
  OrderOrigin,
  Patient,
  PracticeWithChildren,
  UpdateOrderDto,
} from '@/lib/api/types';
import { useMutation, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { AlertCircle, Loader2, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

const ORIGINS: Array<{ value: OrderOrigin; label: string }> = [
  { value: 'ambulatorio', label: 'Ambulatorio' },
  { value: 'internacion', label: 'Internación' },
  { value: 'urgencia', label: 'Urgencia' },
];

function apiError(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const msg = err.response?.data?.message;
    if (Array.isArray(msg)) return msg.join('. ');
    if (typeof msg === 'string') return msg;
  }
  return fallback;
}

type Errors = Partial<Record<'patient' | 'insurer' | 'origin' | 'practices', string>>;

type Props = {
  order: OrderDetail;
  initialPatient: Patient;
  initialDoctor: Doctor | null;
  initialPractices: PracticeWithChildren[];
};

export function EditOrderForm({ order, initialPatient, initialDoctor, initialPractices }: Props) {
  const router = useRouter();

  const isExternalInit = order.referringDoctorId === null && order.referringDoctorName !== null;

  const [patient, setPatient] = useState<Patient | null>(initialPatient);
  const [insurerId, setInsurerId] = useState<string>(String(order.insurerId));
  const [affiliateNumber, setAffiliateNumber] = useState(order.insuranceAffiliateNumber ?? '');
  const [doctor, setDoctor] = useState<Doctor | null>(initialDoctor);
  const [externalDoctor, setExternalDoctor] = useState(isExternalInit);
  const [externalDoctorName, setExternalDoctorName] = useState(order.referringDoctorName ?? '');
  const [externalDoctorMp, setExternalDoctorMp] = useState(order.referringDoctorMp ?? '');
  const [diagnosis, setDiagnosis] = useState(order.diagnosis ?? '');
  const [origin, setOrigin] = useState<OrderOrigin | ''>(order.origin);
  const [isUrgent, setIsUrgent] = useState(order.isUrgent);
  const [notes, setNotes] = useState(order.notes ?? '');
  const [practices, setPractices] = useState<PracticeWithChildren[]>(initialPractices);
  const [errors, setErrors] = useState<Errors>({});
  const [patientDialogOpen, setPatientDialogOpen] = useState(false);
  const [doctorDialogOpen, setDoctorDialogOpen] = useState(false);

  const { data: insurers = [] } = useQuery({
    queryKey: ['insurers', { onlyActive: true }],
    queryFn: async () => {
      const { data } = await apiClient.get<Insurer[]>('/insurers', {
        params: { onlyActive: true },
      });
      return data;
    },
    staleTime: 5 * 60_000,
  });

  const mutation = useMutation({
    mutationFn: async (payload: UpdateOrderDto) => {
      await apiClient.patch(`/orders/${order.id}`, payload);
    },
    onSuccess: () => {
      toast.success('Orden actualizada');
      router.push(`/ordenes/${order.id}`);
      router.refresh();
    },
    onError: (err) => toast.error(apiError(err, 'Error al guardar cambios')),
  });

  function validate(): Errors {
    const e: Errors = {};
    if (!patient) e.patient = 'Seleccioná un paciente.';
    if (!insurerId) e.insurer = 'Seleccioná una obra social.';
    if (!origin) e.origin = 'Seleccioná un origen.';
    if (practices.length === 0) e.practices = 'Agregá al menos una práctica.';
    return e;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    if (!patient || !insurerId || !origin) return;

    const payload: UpdateOrderDto = {
      patientId: patient.id,
      insurerId: Number(insurerId),
      insuranceAffiliateNumber: affiliateNumber.trim() || null,
      referringDoctorId: externalDoctor ? null : (doctor?.id ?? null),
      referringDoctorName: externalDoctor ? externalDoctorName.trim() || null : null,
      referringDoctorMp: externalDoctor ? externalDoctorMp.trim() || null : null,
      diagnosis: diagnosis.trim() || null,
      origin,
      isUrgent,
      notes: notes.trim() || null,
      practices: practices.map((p, idx) => ({
        practiceId: p.id,
        sortOrder: idx,
      })),
    };
    mutation.mutate(payload);
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-8" noValidate>
        <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6 shadow-[var(--shadow-xs)]">
          <h2 className="mb-4 font-semibold text-[var(--color-fg)] text-base">
            Paciente y cobertura
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField label="Paciente" htmlFor="patient" required error={errors.patient}>
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <PatientCombobox
                    id="patient"
                    value={patient}
                    onChange={(p) => {
                      setPatient(p);
                      if (p) setErrors((e) => ({ ...e, patient: undefined }));
                    }}
                    invalid={!!errors.patient}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  title="Crear paciente"
                  onClick={() => setPatientDialogOpen(true)}
                >
                  <Plus strokeWidth={2} />
                </Button>
              </div>
            </FormField>

            <FormField label="Obra social" htmlFor="insurer" required error={errors.insurer}>
              <Select
                value={insurerId}
                onValueChange={(v) => {
                  setInsurerId(v);
                  setErrors((e) => ({ ...e, insurer: undefined }));
                }}
              >
                <SelectTrigger id="insurer">
                  <SelectValue placeholder="Seleccionar…" />
                </SelectTrigger>
                <SelectContent>
                  {insurers.map((i) => (
                    <SelectItem key={i.id} value={String(i.id)}>
                      {i.code} · {i.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Número de afiliado" htmlFor="affiliate">
              <Input
                id="affiliate"
                value={affiliateNumber}
                onChange={(e) => setAffiliateNumber(e.target.value)}
              />
            </FormField>

            <FormField label="Médico derivante" htmlFor="doctor">
              {externalDoctor ? (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_140px]">
                  <Input
                    id="doctor"
                    placeholder="Nombre del médico"
                    value={externalDoctorName}
                    onChange={(e) => setExternalDoctorName(e.target.value)}
                  />
                  <Input
                    placeholder="Matrícula"
                    value={externalDoctorMp}
                    onChange={(e) => setExternalDoctorMp(e.target.value)}
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <DoctorCombobox id="doctor" value={doctor} onChange={setDoctor} />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    title="Crear médico"
                    onClick={() => setDoctorDialogOpen(true)}
                  >
                    <Plus strokeWidth={2} />
                  </Button>
                </div>
              )}
            </FormField>

            <div className="flex items-end">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="externalDoctor"
                  checked={externalDoctor}
                  onCheckedChange={(v) => {
                    const on = v === true;
                    setExternalDoctor(on);
                    if (on) setDoctor(null);
                    else {
                      setExternalDoctorName('');
                      setExternalDoctorMp('');
                    }
                  }}
                  className="mt-1"
                />
                <label htmlFor="externalDoctor" className="cursor-pointer">
                  <div className="font-medium text-[var(--color-fg)] text-sm">
                    Médico fuera del padrón
                  </div>
                  <div className="text-[var(--color-fg-muted)] text-xs">
                    Cargar nombre y matrícula a mano en lugar de buscarlo.
                  </div>
                </label>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6 shadow-[var(--shadow-xs)]">
          <h2 className="mb-4 font-semibold text-[var(--color-fg)] text-base">Datos clínicos</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField label="Origen" htmlFor="origin" required error={errors.origin}>
              <Select
                value={origin}
                onValueChange={(v) => {
                  setOrigin(v as OrderOrigin);
                  setErrors((e) => ({ ...e, origin: undefined }));
                }}
              >
                <SelectTrigger id="origin">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ORIGINS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <div className="flex items-end">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="isUrgent"
                  checked={isUrgent}
                  onCheckedChange={(v) => setIsUrgent(v === true)}
                  className="mt-1"
                />
                <label htmlFor="isUrgent" className="cursor-pointer">
                  <div className="font-medium text-[var(--color-fg)] text-sm">Urgente</div>
                  <div className="text-[var(--color-fg-muted)] text-xs">
                    Marcar para priorizar la orden en el flujo de trabajo.
                  </div>
                </label>
              </div>
            </div>

            <FormField label="Diagnóstico" htmlFor="diagnosis" className="md:col-span-2">
              <Textarea
                id="diagnosis"
                rows={2}
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
              />
            </FormField>

            <FormField label="Notas internas" htmlFor="notes" className="md:col-span-2">
              <Textarea
                id="notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </FormField>
          </div>
        </section>

        <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6 shadow-[var(--shadow-xs)]">
          <div className="mb-4 flex items-baseline justify-between gap-2">
            <h2 className="font-semibold text-[var(--color-fg)] text-base">Prácticas</h2>
            {errors.practices && (
              <span className="flex items-center gap-1 text-[var(--color-danger)] text-xs">
                <AlertCircle className="h-3.5 w-3.5" strokeWidth={2} />
                {errors.practices}
              </span>
            )}
          </div>
          <NbuGrid
            selected={practices}
            onChange={(p) => {
              setPractices(p);
              if (p.length > 0) setErrors((e) => ({ ...e, practices: undefined }));
            }}
          />
        </section>

        <div className="flex items-center justify-end gap-2 border-[var(--color-border)] border-t pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/ordenes/${order.id}`)}
            disabled={mutation.isPending}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="animate-spin" strokeWidth={2} />}
            Guardar cambios
          </Button>
        </div>
      </form>

      <CreatePatientDialog
        open={patientDialogOpen}
        onOpenChange={setPatientDialogOpen}
        onCreated={(p) => {
          setPatient(p);
          setErrors((e) => ({ ...e, patient: undefined }));
        }}
      />

      <CreateDoctorDialog
        open={doctorDialogOpen}
        onOpenChange={setDoctorDialogOpen}
        onCreated={(d) => setDoctor(d)}
      />
    </>
  );
}
