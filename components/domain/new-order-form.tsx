'use client';

import { AnimalPatientCombobox } from '@/components/domain/animal-patient-combobox';
import { CreateAnimalPatientDialog } from '@/components/domain/create-animal-patient-dialog';
import { CreateDoctorDialog } from '@/components/domain/create-doctor-dialog';
import { CreatePatientDialog } from '@/components/domain/create-patient-dialog';
import { CreateVeterinarioDialog } from '@/components/domain/create-veterinario-dialog';
import { DoctorCombobox } from '@/components/domain/doctor-combobox';
import { NbuGrid } from '@/components/domain/nbu-grid';
import { PatientCombobox } from '@/components/domain/patient-combobox';
import { VeterinarioCombobox } from '@/components/domain/veterinario-combobox';
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
  CreateOrderDto,
  Doctor,
  Insurer,
  OrderDetail,
  OrderOrigin,
  OrderType,
  PacienteAnimal,
  Patient,
  PracticeWithChildren,
  Veterinario,
} from '@/lib/api/types';
import { cn } from '@/lib/cn';

import { useMutation, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { AlertCircle, Loader2, PawPrint, Plus, Stethoscope } from 'lucide-react';
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

type Errors = Partial<
  Record<'patient' | 'animalPatient' | 'insurer' | 'origin' | 'practices', string>
>;

export function NewOrderForm() {
  const router = useRouter();
  const [orderType, setOrderType] = useState<OrderType>('humana');
  const isVet = orderType === 'veterinaria';

  // Human patient state
  const [patient, setPatient] = useState<Patient | null>(null);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [externalDoctor, setExternalDoctor] = useState(false);
  const [externalDoctorName, setExternalDoctorName] = useState('');
  const [externalDoctorMp, setExternalDoctorMp] = useState('');
  const [patientDialogOpen, setPatientDialogOpen] = useState(false);
  const [doctorDialogOpen, setDoctorDialogOpen] = useState(false);

  // Vet patient state
  const [animalPatient, setAnimalPatient] = useState<PacienteAnimal | null>(null);
  const [veterinario, setVeterinario] = useState<Veterinario | null>(null);
  const [animalDialogOpen, setAnimalDialogOpen] = useState(false);
  const [vetDialogOpen, setVetDialogOpen] = useState(false);

  // Shared state
  const [insurerId, setInsurerId] = useState<string>('');
  const [affiliateNumber, setAffiliateNumber] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [origin, setOrigin] = useState<OrderOrigin | ''>('ambulatorio');
  const [isUrgent, setIsUrgent] = useState(false);
  const [notes, setNotes] = useState('');
  const [practices, setPractices] = useState<PracticeWithChildren[]>([]);
  const [errors, setErrors] = useState<Errors>({});

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
    mutationFn: async (payload: CreateOrderDto) => {
      const res = await apiClient.post<{ order: OrderDetail; lines: unknown[] }>(
        '/orders',
        payload,
      );
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(`Orden ${data.order.protocolNumber} creada`);
      router.push(`/ordenes/${data.order.id}`);
      router.refresh();
    },
    onError: (err) => toast.error(apiError(err, 'Error al crear orden')),
  });

  function validate(): Errors {
    const e: Errors = {};
    if (isVet) {
      if (!animalPatient) e.animalPatient = 'Seleccioná un paciente animal.';
    } else {
      if (!patient) e.patient = 'Seleccioná un paciente.';
    }
    if (!isVet && !insurerId) e.insurer = 'Seleccioná una obra social.';
    if (!origin) e.origin = 'Seleccioná un origen.';
    if (practices.length === 0) e.practices = 'Agregá al menos una práctica.';
    return e;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    if ((!isVet && !insurerId) || !origin) return;

    if (isVet) {
      if (!animalPatient) return;
      const payload: CreateOrderDto = {
        orderType: 'veterinaria',
        animalPatientId: animalPatient.id,
        veterinarioId: veterinario?.id ?? null,
        patientId: undefined as unknown as number,
        insurerId: Number(insurerId),
        insuranceAffiliateNumber: affiliateNumber.trim() || null,
        diagnosis: diagnosis.trim() || null,
        origin,
        isUrgent,
        notes: notes.trim() || null,
        practices: practices.map((p, idx) => ({ practiceId: p.id, sortOrder: idx })),
      };
      mutation.mutate(payload);
    } else {
      if (!patient) return;
      const payload: CreateOrderDto = {
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
        practices: practices.map((p, idx) => ({ practiceId: p.id, sortOrder: idx })),
      };
      mutation.mutate(payload);
    }
  }

  function switchType(type: OrderType) {
    setOrderType(type);
    setErrors({});
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-8" noValidate>
        {/* Tipo de servicio */}
        <div className="flex rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-1">
          <button
            type="button"
            onClick={() => switchType('humana')}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors',
              !isVet
                ? 'bg-[var(--color-bg-elevated)] text-[var(--color-fg)] shadow-[var(--shadow-xs)]'
                : 'text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]',
            )}
          >
            <Stethoscope className="h-4 w-4" strokeWidth={2} />
            Humana
          </button>
          <button
            type="button"
            onClick={() => switchType('veterinaria')}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors',
              isVet
                ? 'bg-[var(--color-bg-elevated)] text-[var(--color-fg)] shadow-[var(--shadow-xs)]'
                : 'text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]',
            )}
          >
            <PawPrint className="h-4 w-4" strokeWidth={2} />
            Veterinaria
          </button>
        </div>

        {/* Patient & coverage */}
        <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6 shadow-[var(--shadow-xs)]">
          <h2 className="mb-4 font-semibold text-[var(--color-fg)] text-base">
            {isVet ? 'Paciente animal y cobertura' : 'Paciente y cobertura'}
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {isVet ? (
              <>
                <FormField
                  label="Paciente animal"
                  htmlFor="animalPatient"
                  required
                  error={errors.animalPatient}
                >
                  <div className="flex items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <AnimalPatientCombobox
                        id="animalPatient"
                        value={animalPatient}
                        onChange={(a) => {
                          setAnimalPatient(a);
                          if (a) setErrors((prev) => ({ ...prev, animalPatient: undefined }));
                        }}
                        invalid={!!errors.animalPatient}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      title="Crear paciente animal"
                      onClick={() => setAnimalDialogOpen(true)}
                    >
                      <Plus strokeWidth={2} />
                    </Button>
                  </div>
                </FormField>
                <FormField label="Veterinario" htmlFor="veterinario">
                  <div className="flex items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <VeterinarioCombobox
                        id="veterinario"
                        value={veterinario}
                        onChange={setVeterinario}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      title="Crear veterinario"
                      onClick={() => setVetDialogOpen(true)}
                    >
                      <Plus strokeWidth={2} />
                    </Button>
                  </div>
                </FormField>
              </>
            ) : (
              <>
                <FormField label="Paciente" htmlFor="patient" required error={errors.patient}>
                  <div className="flex items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <PatientCombobox
                        id="patient"
                        value={patient}
                        onChange={(p) => {
                          setPatient(p);
                          if (p) setErrors((prev) => ({ ...prev, patient: undefined }));
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
              </>
            )}

            {!isVet && (
              <>
                <FormField label="Obra social" htmlFor="insurer" required error={errors.insurer}>
                  <Select
                    value={insurerId}
                    onValueChange={(v) => {
                      setInsurerId(v);
                      setErrors((prev) => ({ ...prev, insurer: undefined }));
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
              </>
            )}

            {!isVet && (
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
            )}
          </div>
        </section>

        {/* Clinical data */}
        <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6 shadow-[var(--shadow-xs)]">
          <h2 className="mb-4 font-semibold text-[var(--color-fg)] text-base">Datos clínicos</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField label="Origen" htmlFor="origin" required error={errors.origin}>
              <Select
                value={origin}
                onValueChange={(v) => {
                  setOrigin(v as OrderOrigin);
                  setErrors((prev) => ({ ...prev, origin: undefined }));
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

        {/* Practices */}
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
              if (p.length > 0) setErrors((prev) => ({ ...prev, practices: undefined }));
            }}
          />
        </section>

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
            Crear orden
          </Button>
        </div>
      </form>

      {!isVet ? (
        <>
          <CreatePatientDialog
            open={patientDialogOpen}
            onOpenChange={setPatientDialogOpen}
            onCreated={(p) => {
              setPatient(p);
              setErrors((prev) => ({ ...prev, patient: undefined }));
            }}
          />
          <CreateDoctorDialog
            open={doctorDialogOpen}
            onOpenChange={setDoctorDialogOpen}
            onCreated={(d) => setDoctor(d)}
          />
        </>
      ) : (
        <>
          <CreateAnimalPatientDialog
            open={animalDialogOpen}
            onOpenChange={setAnimalDialogOpen}
            onCreated={(a) => {
              setAnimalPatient(a);
              setErrors((prev) => ({ ...prev, animalPatient: undefined }));
            }}
          />
          <CreateVeterinarioDialog
            open={vetDialogOpen}
            onOpenChange={setVetDialogOpen}
            onCreated={(v) => setVeterinario(v)}
          />
        </>
      )}
    </>
  );
}
