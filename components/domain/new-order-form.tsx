'use client';

import { AnimalPatientCombobox } from '@/components/domain/animal-patient-combobox';
import { CreateAnimalPatientDialog } from '@/components/domain/create-animal-patient-dialog';
import { CreateDoctorDialog } from '@/components/domain/create-doctor-dialog';
import { CreateMuestraAguaDialog } from '@/components/domain/create-muestra-agua-dialog';
import { CreatePatientDialog } from '@/components/domain/create-patient-dialog';
import { CreateSolicitanteAguaDialog } from '@/components/domain/create-solicitante-agua-dialog';
import { CreateVeterinarioDialog } from '@/components/domain/create-veterinario-dialog';
import { DoctorCombobox } from '@/components/domain/doctor-combobox';
import { MuestraAguaCombobox } from '@/components/domain/muestra-agua-combobox';
import { NbuGrid } from '@/components/domain/nbu-grid';
import { PatientCombobox } from '@/components/domain/patient-combobox';
import { SolicitanteAguaCombobox } from '@/components/domain/solicitante-agua-combobox';
import { VeterinarioCombobox } from '@/components/domain/veterinario-combobox';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DynamicLucideIcon } from '@/components/ui/dynamic-lucide-icon';
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
import { queries } from '@/lib/api/queries';
import type {
  CreateOrderDto,
  Doctor,
  Insurer,
  MuestraAgua,
  OrderDetail,
  OrderOrigin,
  PacienteAnimal,
  Patient,
  PracticeWithChildren,
  Servicio,
  SolicitanteAgua,
  Veterinario,
} from '@/lib/api/types';
import { cn } from '@/lib/cn';

import { useMutation, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { AlertCircle, Loader2, Plus } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
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
  Record<
    | 'patient'
    | 'animalPatient'
    | 'insurer'
    | 'origin'
    | 'practices'
    | 'solicitanteAgua'
    | 'muestraAgua',
    string
  >
>;

export function NewOrderForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [servicio, setServicio] = useState<Servicio | null>(null);

  const { data: servicios = [] } = useQuery({
    queryKey: queries.servicios.list(),
    queryFn: () => apiClient.get<Servicio[]>('/servicios').then((r) => r.data),
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    if (servicios.length > 0 && !servicio) {
      const slugParam = searchParams.get('servicio');
      const match = slugParam ? servicios.find((s) => s.slug === slugParam) : null;
      setServicio(match ?? servicios[0]);
    }
  }, [servicios, servicio, searchParams]);

  const showHumanPatient = servicio?.usaPacienteHumano ?? false;
  const showAnimalPatient = servicio?.usaPacienteAnimal ?? false;
  const showDoctor = servicio?.usaMedico ?? false;
  const showVeterinario = servicio?.usaVeterinario ?? false;
  const showSolicitanteAgua = servicio?.usaSolicitanteAgua ?? false;
  const showMuestraAgua = servicio?.usaMuestraAgua ?? false;
  const showDatosClinicos = showHumanPatient || showAnimalPatient;

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

  // Agua state
  const [solicitanteAgua, setSolicitanteAgua] = useState<SolicitanteAgua | null>(null);
  const [muestraAgua, setMuestraAgua] = useState<MuestraAgua | null>(null);
  const [solicitanteAguaDialogOpen, setSolicitanteAguaDialogOpen] = useState(false);
  const [muestraAguaDialogOpen, setMuestraAguaDialogOpen] = useState(false);

  // Shared state
  const [insurerId, setInsurerId] = useState<string>('');
  const [affiliateNumber, setAffiliateNumber] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [origin, setOrigin] = useState<OrderOrigin | ''>('ambulatorio');
  const [isUrgent, setIsUrgent] = useState(false);
  const [notes, setNotes] = useState('');
  const [practices, setPractices] = useState<PracticeWithChildren[]>([]);
  const [errors, setErrors] = useState<Errors>({});
  const [customData, setCustomData] = useState<Record<string, unknown>>({});
  const [customErrors, setCustomErrors] = useState<Record<string, string>>({});

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
    if (showAnimalPatient && !animalPatient) e.animalPatient = 'Seleccioná un paciente animal.';
    if (showHumanPatient && !patient) e.patient = 'Seleccioná un paciente.';
    if (showHumanPatient && !insurerId) e.insurer = 'Seleccioná una obra social.';
    if (showSolicitanteAgua && !solicitanteAgua) e.solicitanteAgua = 'Seleccioná un solicitante.';
    if (showMuestraAgua && !muestraAgua) e.muestraAgua = 'Seleccioná una muestra.';
    if (showDatosClinicos && !origin) e.origin = 'Seleccioná un origen.';
    if (practices.length === 0) e.practices = 'Agregá al menos una práctica.';
    return e;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!servicio) return;
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    if (showDatosClinicos && !origin) return;

    const payload: CreateOrderDto = {
      servicioId: servicio.id,
      patientId: showHumanPatient ? (patient?.id ?? undefined) : undefined,
      animalPatientId: showAnimalPatient ? (animalPatient?.id ?? undefined) : undefined,
      veterinarioId: showVeterinario ? (veterinario?.id ?? null) : null,
      solicitanteAguaId: showSolicitanteAgua ? (solicitanteAgua?.id ?? undefined) : undefined,
      muestraAguaId: showMuestraAgua ? (muestraAgua?.id ?? undefined) : undefined,
      insurerId: insurerId ? Number(insurerId) : 0,
      insuranceAffiliateNumber: affiliateNumber.trim() || null,
      referringDoctorId: showDoctor && !externalDoctor ? (doctor?.id ?? null) : null,
      referringDoctorName: showDoctor && externalDoctor ? externalDoctorName.trim() || null : null,
      referringDoctorMp: showDoctor && externalDoctor ? externalDoctorMp.trim() || null : null,
      diagnosis: diagnosis.trim() || null,
      origin: origin || 'ambulatorio',
      isUrgent,
      notes: notes.trim() || null,
      practices: practices.map((p, idx) => ({ practiceId: p.id, sortOrder: idx })),
    };
    mutation.mutate(payload);
  }

  function switchServicio(s: Servicio) {
    setServicio(s);
    setErrors({});
    setCustomData({});
    setCustomErrors({});
    setPractices([]);

    // Limpiá los campos que no correspondan al servicio nuevo (evita arrastrar
    // selecciones de un flujo — paciente humano/animal/agua — a otro).
    if (!s.usaPacienteHumano) {
      setPatient(null);
      setDoctor(null);
      setExternalDoctor(false);
      setExternalDoctorName('');
      setExternalDoctorMp('');
      setInsurerId('');
      setAffiliateNumber('');
    }
    if (!s.usaMedico) {
      setDoctor(null);
      setExternalDoctor(false);
      setExternalDoctorName('');
      setExternalDoctorMp('');
    }
    if (!s.usaPacienteAnimal) {
      setAnimalPatient(null);
      setVeterinario(null);
    }
    if (!s.usaVeterinario) {
      setVeterinario(null);
    }
    if (!s.usaSolicitanteAgua) {
      setSolicitanteAgua(null);
    }
    if (!s.usaMuestraAgua) {
      setMuestraAgua(null);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-8" noValidate>
        {/* Selector de servicio */}
        {servicios.length > 1 && (
          <div className="flex rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-1">
            {servicios.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => switchServicio(s)}
                className={cn(
                  'flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors',
                  servicio?.id === s.id
                    ? 'bg-[var(--color-bg-elevated)] text-[var(--color-fg)] shadow-[var(--shadow-xs)]'
                    : 'text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]',
                )}
              >
                <DynamicLucideIcon name={s.icono} className="h-4 w-4" strokeWidth={2} />
                {s.nombre}
              </button>
            ))}
          </div>
        )}

        {/* Agua y efluentes: solicitante + muestra */}
        {showSolicitanteAgua && (
          <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6 shadow-[var(--shadow-xs)]">
            <h2 className="mb-4 font-semibold text-[var(--color-fg)] text-base">
              Solicitante y muestra
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                label="Solicitante"
                htmlFor="solicitanteAgua"
                required
                error={errors.solicitanteAgua}
              >
                <div className="flex items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <SolicitanteAguaCombobox
                      id="solicitanteAgua"
                      value={solicitanteAgua}
                      onChange={(s) => {
                        setSolicitanteAgua(s);
                        if (s) setErrors((prev) => ({ ...prev, solicitanteAgua: undefined }));
                      }}
                      invalid={!!errors.solicitanteAgua}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    title="Crear solicitante"
                    onClick={() => setSolicitanteAguaDialogOpen(true)}
                  >
                    <Plus strokeWidth={2} />
                  </Button>
                </div>
              </FormField>
              {showMuestraAgua && (
                <FormField
                  label="Muestra"
                  htmlFor="muestraAgua"
                  required
                  error={errors.muestraAgua}
                >
                  <div className="flex items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <MuestraAguaCombobox
                        id="muestraAgua"
                        value={muestraAgua}
                        onChange={(m) => {
                          setMuestraAgua(m);
                          if (m) setErrors((prev) => ({ ...prev, muestraAgua: undefined }));
                        }}
                        invalid={!!errors.muestraAgua}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      title="Crear muestra"
                      onClick={() => setMuestraAguaDialogOpen(true)}
                    >
                      <Plus strokeWidth={2} />
                    </Button>
                  </div>
                </FormField>
              )}
            </div>
          </section>
        )}

        {/* Patient & coverage */}
        {(showHumanPatient || showAnimalPatient) && (
          <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6 shadow-[var(--shadow-xs)]">
            <h2 className="mb-4 font-semibold text-[var(--color-fg)] text-base">
              {showAnimalPatient ? 'Paciente animal y cobertura' : 'Paciente y cobertura'}
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {showAnimalPatient && (
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
                  {showVeterinario && (
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
                  )}
                </>
              )}

              {showHumanPatient && (
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
                  {showDoctor && (
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
                  )}
                </>
              )}

              {showHumanPatient && (
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

              {showDoctor && (
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
        )}

        {/* Clinical data */}
        {showDatosClinicos && (
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
        )}

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
          <Button type="submit" disabled={mutation.isPending || !servicio}>
            {mutation.isPending && <Loader2 className="animate-spin" strokeWidth={2} />}
            Crear orden
          </Button>
        </div>
      </form>

      {showHumanPatient && (
        <>
          <CreatePatientDialog
            open={patientDialogOpen}
            onOpenChange={setPatientDialogOpen}
            onCreated={(p) => {
              setPatient(p);
              setErrors((prev) => ({ ...prev, patient: undefined }));
            }}
          />
          {showDoctor && (
            <CreateDoctorDialog
              open={doctorDialogOpen}
              onOpenChange={setDoctorDialogOpen}
              onCreated={(d) => setDoctor(d)}
            />
          )}
        </>
      )}
      {showAnimalPatient && (
        <>
          <CreateAnimalPatientDialog
            open={animalDialogOpen}
            onOpenChange={setAnimalDialogOpen}
            onCreated={(a) => {
              setAnimalPatient(a);
              setErrors((prev) => ({ ...prev, animalPatient: undefined }));
            }}
          />
          {showVeterinario && (
            <CreateVeterinarioDialog
              open={vetDialogOpen}
              onOpenChange={setVetDialogOpen}
              onCreated={(v) => setVeterinario(v)}
            />
          )}
        </>
      )}
      {showSolicitanteAgua && (
        <CreateSolicitanteAguaDialog
          open={solicitanteAguaDialogOpen}
          onOpenChange={setSolicitanteAguaDialogOpen}
          onCreated={(s) => {
            setSolicitanteAgua(s);
            setErrors((prev) => ({ ...prev, solicitanteAgua: undefined }));
          }}
        />
      )}
      {showMuestraAgua && (
        <CreateMuestraAguaDialog
          open={muestraAguaDialogOpen}
          onOpenChange={setMuestraAguaDialogOpen}
          onCreated={(m) => {
            setMuestraAgua(m);
            setErrors((prev) => ({ ...prev, muestraAgua: undefined }));
          }}
        />
      )}
    </>
  );
}
