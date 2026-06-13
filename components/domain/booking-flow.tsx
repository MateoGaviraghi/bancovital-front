'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { apiClient } from '@/lib/api/client';
import { queries } from '@/lib/api/queries';
import type {
  BookingAvailabilityResponse,
  BookingSlot,
  CreateBookingDto,
  CreateBookingResponse,
} from '@/lib/api/types';
import { cn } from '@/lib/cn';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  Loader2,
  RefreshCw,
  VideoIcon,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Próximos N días hábiles (lun-vie), empezando mañana. */
function getBusinessDays(count: number): Date[] {
  const days: Date[] = [];
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  cursor.setDate(cursor.getDate() + 1); // empezar mañana

  while (days.length < count) {
    const dow = cursor.getDay();
    if (dow !== 0 && dow !== 6) days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTH_LABELS = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
];

function formatSlotTime(iso: string): string {
  const d = new Date(iso);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

function formatDateLong(dateStr: string, slotIso: string): string {
  const d = new Date(slotIso);
  const dow = DAY_LABELS[d.getDay()];
  const day = d.getDate();
  const month = MONTH_LABELS[d.getMonth()];
  const year = d.getFullYear();
  const time = formatSlotTime(slotIso);
  return `${dow} ${day} de ${month} de ${year} a las ${time} hs`;
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ─── Types ───────────────────────────────────────────────────────────────────

type Step = 'date' | 'form' | 'success';

interface FormValues {
  nombre: string;
  email: string;
  empresa: string;
  telefono: string;
  mensaje: string;
}

interface FormErrors {
  nombre?: string;
  email?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function BookingFlow() {
  const days = useRef(getBusinessDays(21));

  const [step, setStep] = useState<Step>('date');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<BookingSlot | null>(null);
  const [confirmation, setConfirmation] = useState<CreateBookingResponse | null>(null);
  const [form, setForm] = useState<FormValues>({
    nombre: '',
    email: '',
    empresa: '',
    telefono: '',
    mensaje: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const queryClient = useQueryClient();

  // ── Disponibilidad ─────────────────────────────────────────────────────────

  const availabilityQuery = useQuery<BookingAvailabilityResponse>({
    queryKey: queries.bookings.availability(selectedDate ?? ''),
    queryFn: async () => {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/public/bookings/availability?date=${selectedDate}`;
      const { data } = await axios.get<BookingAvailabilityResponse>(url);
      return data;
    },
    enabled: !!selectedDate,
    staleTime: 30_000,
  });

  // ── Mutación crear reserva ─────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: async (dto: CreateBookingDto) => {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/public/bookings`;
      const { data } = await axios.post<CreateBookingResponse>(url, dto);
      return data;
    },
    onSuccess: (data) => {
      setConfirmation(data);
      setStep('success');
      queryClient.invalidateQueries({ queryKey: queries.bookings.superList() });
    },
    onError: (err: unknown) => {
      if (axios.isAxiosError(err) && err.response?.status === 409) {
        toast.error('Ese horario se acaba de ocupar. Elegí otro.');
        // Recargamos disponibilidad y volvemos a selección de slot
        queryClient.invalidateQueries({
          queryKey: queries.bookings.availability(selectedDate ?? ''),
        });
        setSelectedSlot(null);
      } else {
        toast.error('Ocurrió un error. Intentá de nuevo en unos momentos.');
      }
    },
  });

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleSelectDate(dateStr: string) {
    setSelectedDate(dateStr);
    setSelectedSlot(null);
  }

  function handleSelectSlot(slot: BookingSlot) {
    setSelectedSlot(slot);
    setStep('form');
  }

  function handleFormChange(field: keyof FormValues, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  function validateForm(): boolean {
    const newErrors: FormErrors = {};
    if (!form.nombre.trim()) newErrors.nombre = 'El nombre es requerido.';
    if (!form.email.trim()) {
      newErrors.email = 'El email es requerido.';
    } else if (!validateEmail(form.email)) {
      newErrors.email = 'Ingresá un email válido.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm() || !selectedSlot) return;

    const dto: CreateBookingDto = {
      nombre: form.nombre.trim(),
      email: form.email.trim(),
      slotInicio: selectedSlot.inicio,
      ...(form.empresa.trim() && { empresa: form.empresa.trim() }),
      ...(form.telefono.trim() && { telefono: form.telefono.trim() }),
      ...(form.mensaje.trim() && { mensaje: form.mensaje.trim() }),
    };

    createMutation.mutate(dto);
  }

  function handleReset() {
    setStep('date');
    setSelectedDate(null);
    setSelectedSlot(null);
    setConfirmation(null);
    setForm({ nombre: '', email: '', empresa: '', telefono: '', mensaje: '' });
    setErrors({});
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (step === 'success' && confirmation) {
    return <SuccessScreen confirmation={confirmation} email={form.email} onReset={handleReset} />;
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* Columna izquierda: selección de fecha y slot */}
      <div>
        <h3 className="mb-4 font-semibold text-[var(--color-fg)] text-base">Elegí una fecha</h3>

        {/* Grilla de días */}
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-3 xl:grid-cols-4">
          {days.current.map((d) => {
            const dateStr = toDateString(d);
            const isSelected = selectedDate === dateStr;
            return (
              <button
                key={dateStr}
                type="button"
                onClick={() => handleSelectDate(dateStr)}
                aria-pressed={isSelected}
                className={cn(
                  'flex flex-col items-center rounded-[var(--radius-md)] border px-2 py-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]',
                  isSelected
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary-hover)] font-medium'
                    : 'border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-fg-muted)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-fg)]',
                )}
              >
                <span className="text-[10px] uppercase tracking-wide text-[var(--color-fg-subtle)]">
                  {DAY_LABELS[d.getDay()]}
                </span>
                <span className="mt-0.5 font-semibold text-base leading-none">{d.getDate()}</span>
                <span className="mt-0.5 text-[10px] text-[var(--color-fg-subtle)]">
                  {MONTH_LABELS[d.getMonth()]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Slots disponibles */}
        {selectedDate && (
          <div className="mt-6">
            <h3 className="mb-3 font-semibold text-[var(--color-fg)] text-base">
              Horarios disponibles
            </h3>

            {availabilityQuery.isPending && (
              <div className="flex flex-wrap gap-2">
                {['s1', 's2', 's3', 's4', 's5', 's6'].map((k) => (
                  <div
                    key={k}
                    className="h-9 w-16 animate-pulse rounded-[var(--radius-md)] bg-[var(--color-bg-subtle)]"
                  />
                ))}
              </div>
            )}

            {availabilityQuery.isError && (
              <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-4 py-3 text-sm text-[var(--color-fg-muted)]">
                <span>No se pudo cargar la disponibilidad.</span>
                <button
                  type="button"
                  onClick={() =>
                    queryClient.invalidateQueries({
                      queryKey: queries.bookings.availability(selectedDate),
                    })
                  }
                  className="ml-auto flex items-center gap-1 text-[var(--color-primary)] hover:underline"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Reintentar
                </button>
              </div>
            )}

            {availabilityQuery.isSuccess && availabilityQuery.data.slots.length === 0 && (
              <p className="text-sm text-[var(--color-fg-muted)]">
                No hay horarios disponibles para ese día. Probá con otra fecha.
              </p>
            )}

            {availabilityQuery.isSuccess && availabilityQuery.data.slots.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {availabilityQuery.data.slots.map((slot) => {
                  const isSelected = selectedSlot?.inicio === slot.inicio;
                  return (
                    <button
                      key={slot.inicio}
                      type="button"
                      onClick={() => handleSelectSlot(slot)}
                      aria-pressed={isSelected}
                      className={cn(
                        'rounded-[var(--radius-md)] border px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]',
                        isSelected
                          ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
                          : 'border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-fg)] hover:border-[var(--color-border-strong)]',
                      )}
                    >
                      {formatSlotTime(slot.inicio)}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Columna derecha: formulario de datos */}
      <div>
        {step === 'form' && selectedSlot ? (
          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-5 flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-primary-soft)] bg-[var(--color-primary-soft)] px-4 py-3">
              <CalendarDays className="h-4 w-4 shrink-0 text-[var(--color-primary)]" />
              <p className="text-sm font-medium text-[var(--color-primary-hover)]">
                {formatDateLong(selectedDate!, selectedSlot.inicio)}
              </p>
            </div>

            <h3 className="mb-4 font-semibold text-[var(--color-fg)] text-base">Tus datos</h3>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="booking-nombre">
                  Nombre y apellido{' '}
                  <span aria-hidden="true" className="text-[var(--color-danger)]">
                    *
                  </span>
                </Label>
                <Input
                  id="booking-nombre"
                  autoComplete="name"
                  value={form.nombre}
                  onChange={(e) => handleFormChange('nombre', e.target.value)}
                  aria-invalid={!!errors.nombre}
                  aria-describedby={errors.nombre ? 'booking-nombre-error' : undefined}
                  placeholder="Ej. Juan Pérez"
                />
                {errors.nombre && (
                  <p
                    id="booking-nombre-error"
                    role="alert"
                    className="text-xs text-[var(--color-danger)]"
                  >
                    {errors.nombre}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="booking-email">
                  Email{' '}
                  <span aria-hidden="true" className="text-[var(--color-danger)]">
                    *
                  </span>
                </Label>
                <Input
                  id="booking-email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => handleFormChange('email', e.target.value)}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'booking-email-error' : undefined}
                  placeholder="juan@laboratorio.com"
                />
                {errors.email && (
                  <p
                    id="booking-email-error"
                    role="alert"
                    className="text-xs text-[var(--color-danger)]"
                  >
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="booking-empresa">Laboratorio / empresa</Label>
                <Input
                  id="booking-empresa"
                  autoComplete="organization"
                  value={form.empresa}
                  onChange={(e) => handleFormChange('empresa', e.target.value)}
                  placeholder="Nombre del laboratorio (opcional)"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="booking-telefono">Teléfono</Label>
                <Input
                  id="booking-telefono"
                  type="tel"
                  autoComplete="tel"
                  value={form.telefono}
                  onChange={(e) => handleFormChange('telefono', e.target.value)}
                  placeholder="+54 9 341 000-0000 (opcional)"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="booking-mensaje">¿Sobre qué querés conversar?</Label>
                <Textarea
                  id="booking-mensaje"
                  rows={3}
                  value={form.mensaje}
                  onChange={(e) => handleFormChange('mensaje', e.target.value)}
                  placeholder="Contanos brevemente qué buscás o qué preguntas tenés (opcional)"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setStep('date');
                    setSelectedSlot(null);
                  }}
                >
                  Volver
                </Button>
                <Button type="submit" disabled={createMutation.isPending} className="flex-1">
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Confirmando…
                    </>
                  ) : (
                    'Confirmar reunión'
                  )}
                </Button>
              </div>
            </div>
          </form>
        ) : (
          <div className="flex h-full min-h-[200px] items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-8 text-center">
            <div>
              <CalendarDays className="mx-auto mb-3 h-8 w-8 text-[var(--color-fg-subtle)]" />
              <p className="text-sm text-[var(--color-fg-muted)]">
                Elegí una fecha y un horario para continuar.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Pantalla de éxito ───────────────────────────────────────────────────────

function SuccessScreen({
  confirmation,
  email,
  onReset,
}: {
  confirmation: CreateBookingResponse;
  email: string;
  onReset: () => void;
}) {
  return (
    <div
      className="flex flex-col items-center gap-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-6 py-10 text-center shadow-[var(--shadow-xs)]"
      style={{
        animation: 'fadeInUp 220ms var(--ease-out-app) both',
      }}
    >
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="fadeInUp"] { animation: none !important; }
        }
      `}</style>

      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-success-soft)]">
        <CheckCircle2 className="h-7 w-7 text-[var(--color-success)]" />
      </div>

      <div>
        <h3 className="font-semibold text-[var(--color-fg)] text-lg">¡Reunión agendada!</h3>
        <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
          {formatDateLong('', confirmation.slotInicio)}
        </p>
      </div>

      <p className="max-w-sm text-sm text-[var(--color-fg-muted)]">
        Te enviamos la confirmación a{' '}
        <span className="font-medium text-[var(--color-fg)]">{email}</span>.
      </p>

      {confirmation.meetLink ? (
        <a
          href={confirmation.meetLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[var(--color-primary-foreground)] transition-colors hover:bg-[var(--color-primary-hover)]"
        >
          <VideoIcon className="h-4 w-4" />
          Unirse a la reunión
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      ) : (
        <p className="text-sm text-[var(--color-fg-subtle)]">
          Te enviaremos el enlace de la reunión por correo.
        </p>
      )}

      <button
        type="button"
        onClick={onReset}
        className="mt-2 text-sm text-[var(--color-fg-subtle)] underline-offset-4 hover:text-[var(--color-fg-muted)] hover:underline"
      >
        Agendar otra reunión
      </button>
    </div>
  );
}
