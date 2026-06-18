'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  Loader2,
  RefreshCw,
  VideoIcon,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

// ─── Helpers de fecha ─────────────────────────────────────────────────────────

const DIAS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];
const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MES_LARGO = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];
const MES_CORTO = [
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

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

/** 42 días (6 semanas) empezando el lunes de la semana del día 1. */
function buildCalendar(view: Date): Date[] {
  const first = startOfMonth(view);
  const offset = (first.getDay() + 6) % 7; // lunes = 0
  const start = new Date(first);
  start.setDate(first.getDate() - offset);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function formatSlotTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function formatDateShort(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return `${DAY_LABELS[d.getDay()]} ${d.getDate()} de ${MES_CORTO[d.getMonth()]}`;
}

function formatDateLong(slotIso: string): string {
  const d = new Date(slotIso);
  return `${DAY_LABELS[d.getDay()]} ${d.getDate()} de ${MES_CORTO[d.getMonth()]} de ${d.getFullYear()} · ${formatSlotTime(slotIso)} hs`;
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

// ─── Componente ────────────────────────────────────────────────────────────────

export function BookingFlow() {
  const today = useRef(startOfToday()).current;
  const maxMonth = useRef(addMonths(today, 3)).current; // hasta 3 meses adelante

  const [viewMonth, setViewMonth] = useState(() => startOfMonth(today));
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
        queryClient.invalidateQueries({
          queryKey: queries.bookings.availability(selectedDate ?? ''),
        });
        setSelectedSlot(null);
        setStep('date');
      } else {
        toast.error('Ocurrió un error. Intentá de nuevo en unos momentos.');
      }
    },
  });

  const canPrev = startOfMonth(viewMonth) > startOfMonth(today);
  const canNext = startOfMonth(viewMonth) < startOfMonth(maxMonth);

  function handleSelectDate(dateStr: string) {
    setSelectedDate(dateStr);
    setSelectedSlot(null);
    setStep('date');
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
    const next: FormErrors = {};
    if (!form.nombre.trim()) next.nombre = 'El nombre es requerido.';
    if (!form.email.trim()) next.email = 'El email es requerido.';
    else if (!validateEmail(form.email)) next.email = 'Ingresá un email válido.';
    setErrors(next);
    return Object.keys(next).length === 0;
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

  if (step === 'success' && confirmation) {
    return <SuccessScreen confirmation={confirmation} email={form.email} onReset={handleReset} />;
  }

  const days = buildCalendar(viewMonth);

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      {/* Calendario */}
      <div>
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-semibold text-[var(--color-fg)] text-base">Elegí una fecha</h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => canPrev && setViewMonth((m) => addMonths(m, -1))}
              disabled={!canPrev}
              aria-label="Mes anterior"
              className="flex size-8 items-center justify-center border border-[var(--color-border)] text-[var(--color-fg-muted)] transition-colors hover:bg-[var(--color-bg-subtle)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="min-w-[130px] text-center font-medium text-[var(--color-fg)] text-sm capitalize">
              {MES_LARGO[viewMonth.getMonth()]} {viewMonth.getFullYear()}
            </span>
            <button
              type="button"
              onClick={() => canNext && setViewMonth((m) => addMonths(m, 1))}
              disabled={!canNext}
              aria-label="Mes siguiente"
              className="flex size-8 items-center justify-center border border-[var(--color-border)] text-[var(--color-fg-muted)] transition-colors hover:bg-[var(--color-bg-subtle)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 border-[var(--color-border)] border-t border-l">
          {DIAS.map((d) => (
            <div
              key={d}
              className="border-[var(--color-border)] border-r border-b bg-[var(--color-bg-subtle)] py-2 text-center font-medium text-[10px] text-[var(--color-fg-subtle)] uppercase tracking-wide"
            >
              {d}
            </div>
          ))}
          {days.map((d) => {
            const inMonth = d.getMonth() === viewMonth.getMonth();
            const dateStr = toDateString(d);
            const past = d < today;
            const weekend = d.getDay() === 0 || d.getDay() === 6;
            const selectable = inMonth && !past && !weekend;
            const isSelected = selectedDate === dateStr;
            const isToday = d.getTime() === today.getTime();
            return (
              <button
                key={dateStr}
                type="button"
                disabled={!selectable}
                onClick={() => selectable && handleSelectDate(dateStr)}
                aria-pressed={isSelected}
                className={cn(
                  'relative flex h-12 items-center justify-center border-[var(--color-border)] border-r border-b text-sm transition-colors',
                  !inMonth && 'bg-[var(--color-bg)] text-transparent',
                  inMonth && !selectable && 'cursor-not-allowed text-[var(--color-fg-subtle)]/45',
                  selectable &&
                    !isSelected &&
                    'font-medium text-[var(--color-fg)] hover:bg-[var(--color-primary-soft)]',
                  isSelected && 'bg-[var(--color-primary)] font-semibold text-white',
                )}
              >
                {d.getDate()}
                {isToday && !isSelected && (
                  <span className="absolute bottom-1.5 size-1 bg-[var(--color-accent)]" />
                )}
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-[var(--color-fg-subtle)] text-xs">
          Reuniones de lunes a viernes. El punto rojo marca hoy.
        </p>
      </div>

      {/* Panel derecho: prompt / slots / formulario */}
      <div className="lg:border-[var(--color-border)] lg:border-l lg:pl-10">
        {step === 'form' && selectedSlot ? (
          <form key="form" onSubmit={handleSubmit} noValidate className="motion-fade-in">
            <button
              type="button"
              onClick={() => {
                setStep('date');
                setSelectedSlot(null);
              }}
              className="mb-4 inline-flex items-center gap-1.5 text-[var(--color-fg-muted)] text-sm transition-colors hover:text-[var(--color-fg)]"
            >
              <ArrowLeft className="size-4" /> Cambiar horario
            </button>

            <div className="mb-6 flex items-center gap-3 border border-[var(--color-primary)]/15 bg-[var(--color-primary-soft)] px-4 py-3">
              <CalendarDays className="size-4 shrink-0 text-[var(--color-primary)]" />
              <p className="font-medium text-[var(--color-primary-hover)] text-sm">
                {formatDateLong(selectedSlot.inicio)}
              </p>
            </div>

            <h3 className="mb-4 font-semibold text-[var(--color-fg)] text-base">Tus datos</h3>
            <div className="flex flex-col gap-4">
              <Field
                label="Nombre y apellido"
                htmlFor="booking-nombre"
                required
                error={errors.nombre}
              >
                <Input
                  id="booking-nombre"
                  autoComplete="name"
                  value={form.nombre}
                  onChange={(e) => handleFormChange('nombre', e.target.value)}
                  aria-invalid={!!errors.nombre}
                  placeholder="Ej. Juan Pérez"
                />
              </Field>
              <Field label="Email" htmlFor="booking-email" required error={errors.email}>
                <Input
                  id="booking-email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => handleFormChange('email', e.target.value)}
                  aria-invalid={!!errors.email}
                  placeholder="juan@laboratorio.com"
                />
              </Field>
              <Field label="Laboratorio / empresa" htmlFor="booking-empresa">
                <Input
                  id="booking-empresa"
                  autoComplete="organization"
                  value={form.empresa}
                  onChange={(e) => handleFormChange('empresa', e.target.value)}
                  placeholder="Nombre del laboratorio (opcional)"
                />
              </Field>
              <Field label="Teléfono" htmlFor="booking-telefono">
                <Input
                  id="booking-telefono"
                  type="tel"
                  autoComplete="tel"
                  value={form.telefono}
                  onChange={(e) => handleFormChange('telefono', e.target.value)}
                  placeholder="+54 9 341 000-0000 (opcional)"
                />
              </Field>
              <Field label="¿Sobre qué querés conversar?" htmlFor="booking-mensaje">
                <Textarea
                  id="booking-mensaje"
                  rows={3}
                  value={form.mensaje}
                  onChange={(e) => handleFormChange('mensaje', e.target.value)}
                  placeholder="Contanos brevemente qué buscás (opcional)"
                />
              </Field>

              <Button
                type="submit"
                size="lg"
                loading={createMutation.isPending}
                className="mt-1 h-11"
              >
                {createMutation.isPending ? 'Confirmando…' : 'Confirmar reunión'}
              </Button>
            </div>
          </form>
        ) : selectedDate ? (
          <div key={selectedDate} className="motion-fade-in">
            <div className="mb-5 flex items-center gap-2 text-[var(--color-fg)]">
              <Clock className="size-4 text-[var(--color-primary)]" />
              <h3 className="font-semibold text-base capitalize">
                {formatDateShort(selectedDate)}
              </h3>
            </div>

            {availabilityQuery.isPending && (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {['s1', 's2', 's3', 's4', 's5', 's6', 's7', 's8'].map((k) => (
                  <div key={k} className="h-10 animate-pulse bg-[var(--color-bg-subtle)]" />
                ))}
              </div>
            )}

            {availabilityQuery.isError && (
              <div className="flex items-center gap-2 border border-[var(--color-border)] px-4 py-3 text-[var(--color-fg-muted)] text-sm">
                <span>No se pudo cargar la disponibilidad.</span>
                <button
                  type="button"
                  onClick={() => availabilityQuery.refetch()}
                  className="ml-auto flex items-center gap-1 text-[var(--color-primary)] hover:underline"
                >
                  <RefreshCw className="size-3.5" /> Reintentar
                </button>
              </div>
            )}

            {availabilityQuery.isSuccess && availabilityQuery.data.slots.length === 0 && (
              <div className="border border-[var(--color-border)] border-dashed px-4 py-8 text-center">
                <p className="text-[var(--color-fg-muted)] text-sm">
                  No hay horarios disponibles ese día. Probá con otra fecha.
                </p>
              </div>
            )}

            {availabilityQuery.isSuccess && availabilityQuery.data.slots.length > 0 && (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {availabilityQuery.data.slots.map((slot, i) => (
                  <button
                    key={slot.inicio}
                    type="button"
                    onClick={() => handleSelectSlot(slot)}
                    style={{ animationDelay: `${i * 22}ms` }}
                    className="motion-slide-up flex h-10 items-center justify-center border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] font-medium text-[var(--color-fg)] text-sm transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary-hover)]"
                  >
                    {formatSlotTime(slot.inicio)}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex h-full min-h-[260px] flex-col items-center justify-center border border-[var(--color-border)] border-dashed px-8 text-center">
            <CalendarDays className="mb-3 size-8 text-[var(--color-fg-subtle)]" />
            <p className="text-[var(--color-fg-muted)] text-sm">
              Elegí una fecha en el calendario para ver los horarios disponibles.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Campo de formulario ─────────────────────────────────────────────────────

function Field({
  label,
  htmlFor,
  required,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor}>
        {label}
        {required && (
          <span aria-hidden="true" className="ml-0.5 text-[var(--color-danger)]">
            *
          </span>
        )}
      </Label>
      {children}
      {error && (
        <p id={`${htmlFor}-error`} role="alert" className="text-[var(--color-danger)] text-xs">
          {error}
        </p>
      )}
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
    <div className="motion-scale-in flex flex-col items-center gap-4 border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-6 py-12 text-center">
      <div className="flex size-14 items-center justify-center bg-[var(--color-success-soft)]">
        <CheckCircle2 className="size-7 text-[var(--color-success)]" />
      </div>
      <div>
        <h3 className="font-semibold text-[var(--color-fg)] text-lg">¡Reunión agendada!</h3>
        <p className="mt-1 text-[var(--color-fg-muted)] text-sm capitalize">
          {formatDateLong(confirmation.slotInicio)}
        </p>
      </div>
      <p className="max-w-sm text-[var(--color-fg-muted)] text-sm">
        Te enviamos la confirmación a{' '}
        <span className="font-medium text-[var(--color-fg)]">{email}</span>.
      </p>

      {confirmation.meetLink ? (
        <a
          href={confirmation.meetLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-[var(--color-primary)] px-4 py-2.5 font-medium text-sm text-white transition-colors hover:bg-[var(--color-primary-hover)]"
        >
          <VideoIcon className="size-4" /> Unirse a la reunión
          <ExternalLink className="size-3.5" />
        </a>
      ) : (
        <p className="text-[var(--color-fg-subtle)] text-sm">
          Te enviaremos el enlace de la reunión por correo.
        </p>
      )}

      <button
        type="button"
        onClick={onReset}
        className="mt-1 text-[var(--color-fg-subtle)] text-sm underline-offset-4 hover:text-[var(--color-fg-muted)] hover:underline"
      >
        Agendar otra reunión
      </button>
    </div>
  );
}
