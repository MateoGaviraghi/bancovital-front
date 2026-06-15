'use client';

import type {
  ContratoPublicDetail,
  ContratoPublicPlan,
  DatosFacturacion,
  SignContratoResponse,
} from '@/lib/api/types';
import { cn } from '@/lib/cn';
import axios from 'axios';
import { CheckCircle2, ChevronRight, ExternalLink, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import SignaturePad from 'signature_pad';

// ─── Helpers ───────────────────────────────────────────────────────────────

function apiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? '';
}

function apiError(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const msg = err.response?.data?.message;
    if (Array.isArray(msg)) return msg.join('. ');
    if (typeof msg === 'string') return msg;
    if (err.response?.status === 429) return 'Demasiados intentos. Esperá unos minutos.';
    if (err.response?.status === 400) return 'Código incorrecto.';
  }
  return fallback;
}

function fmtARS(value: string): string {
  const n = Number.parseFloat(value);
  if (Number.isNaN(n)) return value;
  return n.toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  });
}

function fmtCuit(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 10) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  return `${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits.slice(10)}`;
}

// ─── Step indicator ────────────────────────────────────────────────────────

const STEPS = ['Propuesta', 'Plan', 'Facturación', 'Firma'];

function StepIndicator({ current }: { current: number }) {
  return (
    <nav aria-label="Pasos del proceso" className="mb-8">
      <ol className="flex items-center gap-0">
        {STEPS.map((label, idx) => {
          const done = idx < current;
          const active = idx === current;
          return (
            <li key={label} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors duration-200',
                    done
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white'
                      : active
                        ? 'border-[var(--color-primary)] bg-white text-[var(--color-primary)]'
                        : 'border-[var(--color-border)] bg-white text-[var(--color-fg-subtle)]',
                  )}
                  aria-current={active ? 'step' : undefined}
                >
                  {done ? (
                    <CheckCircle2 className="h-4 w-4" strokeWidth={2.5} />
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>
                <span
                  className={cn(
                    'hidden text-center text-[11px] font-medium sm:block',
                    active
                      ? 'text-[var(--color-primary)]'
                      : done
                        ? 'text-[var(--color-fg-muted)]'
                        : 'text-[var(--color-fg-subtle)]',
                  )}
                >
                  {label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={cn(
                    'mx-1 h-0.5 flex-1 transition-colors duration-300',
                    idx < current ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]',
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// ─── Step 1: Propuesta ─────────────────────────────────────────────────────

function StepPropuesta({
  contrato,
  diasRestantes,
  fechaExpira,
  onNext,
}: {
  contrato: ContratoPublicDetail;
  diasRestantes: number;
  fechaExpira: string;
  onNext: () => void;
}) {
  const urgente = diasRestantes <= 3;
  return (
    <section>
      <h2 className="mb-1 font-semibold text-[var(--color-fg)] text-lg">Propuesta comercial</h2>
      <p className="mb-6 text-[var(--color-fg-muted)] text-sm">
        Revisá los detalles antes de seleccionar un plan.
      </p>

      <div className="rounded-lg border border-[var(--color-border)] bg-white divide-y divide-[var(--color-border)]">
        <div className="px-5 py-4">
          <p className="text-[var(--color-fg-subtle)] text-xs uppercase tracking-wide font-medium mb-0.5">
            Cliente
          </p>
          <p className="font-semibold text-[var(--color-fg)]">{contrato.razonSocial}</p>
          <p className="text-[var(--color-fg-muted)] text-sm">{contrato.nombreContacto}</p>
        </div>

        <div className="px-5 py-4">
          <p className="text-[var(--color-fg-subtle)] text-xs uppercase tracking-wide font-medium mb-1.5">
            Descripción de la propuesta
          </p>
          <p className="text-[var(--color-fg)] text-sm leading-relaxed whitespace-pre-wrap">
            {contrato.propuesta.descripcion}
          </p>
          {contrato.propuesta.notas && (
            <p className="mt-2 text-[var(--color-fg-muted)] text-sm italic leading-relaxed">
              {contrato.propuesta.notas}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between px-5 py-3">
          <div>
            <p className="text-[var(--color-fg-subtle)] text-xs font-medium">Validez</p>
            <p
              className={cn(
                'text-sm font-medium',
                urgente ? 'text-[var(--color-danger)]' : 'text-[var(--color-fg-muted)]',
              )}
            >
              Vence el {fechaExpira}
              {diasRestantes > 0 && (
                <span className="ml-1.5 text-xs">
                  ({diasRestantes === 1 ? 'queda 1 día' : `quedan ${diasRestantes} días`})
                </span>
              )}
            </p>
          </div>
          <a
            href={contrato.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-3 py-1.5 text-[var(--color-fg-muted)] text-xs font-medium hover:bg-[var(--color-border)] transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} />
            Ver contrato (PDF)
          </a>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center gap-2 rounded-md bg-[var(--color-primary)] px-5 py-2.5 font-semibold text-[var(--color-primary-foreground)] text-sm shadow-[var(--shadow-xs)] transition-colors hover:bg-[var(--color-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
        >
          Seleccionar plan
          <ChevronRight className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>
    </section>
  );
}

// ─── Step 2: Plan ──────────────────────────────────────────────────────────

function PlanCard({
  plan,
  selected,
  sugerido,
  onSelect,
}: {
  plan: ContratoPublicPlan;
  selected: boolean;
  sugerido: boolean;
  onSelect: () => void;
}) {
  return (
    <label
      className={cn(
        'relative flex cursor-pointer flex-col rounded-lg border-2 bg-white p-5 transition-all duration-150',
        selected
          ? 'border-[var(--color-primary)] shadow-[0_0_0_3px_var(--color-primary-soft)]'
          : 'border-[var(--color-border)] hover:border-[var(--color-border-strong)]',
      )}
    >
      <input
        type="radio"
        name="plan"
        value={plan.id}
        checked={selected}
        onChange={onSelect}
        className="sr-only"
      />
      {sugerido && (
        <span className="absolute right-4 top-4 inline-flex rounded-full bg-[var(--color-primary-soft)] px-2 py-0.5 text-[10px] font-semibold text-[var(--color-primary)] uppercase tracking-wide">
          Sugerido
        </span>
      )}
      <p className="font-semibold text-[var(--color-fg)] text-base pr-20">{plan.nombre}</p>
      <p className="mt-3 tabular font-bold text-[var(--color-fg)] text-2xl">
        {fmtARS(plan.precioMensual)}
        <span className="ml-1 text-[var(--color-fg-muted)] text-sm font-normal">/mes</span>
      </p>
      <div className="mt-3 space-y-1 text-sm text-[var(--color-fg-muted)]">
        <p>
          Cupo:{' '}
          <span className="font-medium text-[var(--color-fg)]">
            {plan.cupoOrdenesMes.toLocaleString('es-AR')} órdenes/mes
          </span>
        </p>
        <p>
          Excedente:{' '}
          <span className="font-medium text-[var(--color-fg)]">
            {fmtARS(plan.precioOrdenExcedente)}/orden
          </span>
        </p>
      </div>
      <div
        className={cn(
          'mt-3 flex items-center gap-1.5 rounded-md px-3 py-2 text-[11px] text-[var(--color-fg-muted)] bg-[var(--color-bg-subtle)]',
        )}
      >
        Las órdenes no usadas pasan al mes siguiente (vigencia 1 mes). Superado el cupo, el sistema
        no se bloquea: los excedentes se facturan aparte.
      </div>
    </label>
  );
}

function StepPlan({
  planes,
  planSugeridoId,
  selectedPlanId,
  onSelect,
  onNext,
  onBack,
}: {
  planes: ContratoPublicPlan[];
  planSugeridoId: number | null;
  selectedPlanId: number | null;
  onSelect: (id: number) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <section>
      <h2 className="mb-1 font-semibold text-[var(--color-fg)] text-lg">Seleccioná tu plan</h2>
      <p className="mb-6 text-[var(--color-fg-muted)] text-sm">
        Elegí el plan que mejor se adapta a tu volumen de trabajo.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {planes.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            selected={selectedPlanId === plan.id}
            sugerido={plan.id === planSugeridoId}
            onSelect={() => onSelect(plan.id)}
          />
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-[var(--color-fg-muted)] text-sm border border-[var(--color-border)] bg-white hover:bg-[var(--color-bg-subtle)] transition-colors"
        >
          Volver
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={selectedPlanId === null}
          className="inline-flex items-center gap-2 rounded-md bg-[var(--color-primary)] px-5 py-2.5 font-semibold text-[var(--color-primary-foreground)] text-sm shadow-[var(--shadow-xs)] transition-colors hover:bg-[var(--color-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Continuar
          <ChevronRight className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>
    </section>
  );
}

// ─── Step 3: Facturación ───────────────────────────────────────────────────

const CONDICIONES_IVA = [
  { value: 'Responsable Inscripto', label: 'Responsable Inscripto' },
  { value: 'Monotributo', label: 'Monotributo' },
  { value: 'Exento', label: 'Exento' },
  { value: 'Consumidor Final', label: 'Consumidor Final' },
];

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="mt-1 text-[var(--color-danger)] text-xs" role="alert">
      {msg}
    </p>
  );
}

function StepFacturacion({
  datos,
  onUpdate,
  onNext,
  onBack,
}: {
  datos: DatosFacturacion;
  onUpdate: (d: DatosFacturacion) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!datos.domicilioFiscal.trim()) errs.domicilioFiscal = 'Requerido';
    if (datos.cuit) {
      const digits = datos.cuit.replace(/\D/g, '');
      if (digits.length !== 11) errs.cuit = 'El CUIT debe tener 11 dígitos (formato XX-XXXXXXXX-X)';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleNext() {
    if (validate()) onNext();
  }

  return (
    <section>
      <h2 className="mb-1 font-semibold text-[var(--color-fg)] text-lg">Datos de facturación</h2>
      <p className="mb-6 text-[var(--color-fg-muted)] text-sm">
        Esta información se usará para generar la factura mensual.
      </p>

      <div className="space-y-4 rounded-lg border border-[var(--color-border)] bg-white p-5">
        <div>
          <label
            htmlFor="domicilioFiscal"
            className="mb-1.5 block text-sm font-medium text-[var(--color-fg)]"
          >
            Domicilio fiscal <span className="text-[var(--color-danger)]">*</span>
          </label>
          <input
            id="domicilioFiscal"
            type="text"
            value={datos.domicilioFiscal}
            onChange={(e) => onUpdate({ ...datos, domicilioFiscal: e.target.value })}
            placeholder="Av. Ejemplo 1234, Ciudad, Provincia"
            className={cn(
              'w-full rounded-md border px-3 py-2.5 text-sm text-[var(--color-fg)] placeholder:text-[var(--color-fg-subtle)] focus:outline-2 focus:outline-[var(--color-primary)] focus:outline-offset-0',
              errors.domicilioFiscal
                ? 'border-[var(--color-danger)]'
                : 'border-[var(--color-border)]',
            )}
            aria-describedby={errors.domicilioFiscal ? 'domicilio-error' : undefined}
          />
          {errors.domicilioFiscal && (
            <p
              id="domicilio-error"
              className="mt-1 text-[var(--color-danger)] text-xs"
              role="alert"
            >
              {errors.domicilioFiscal}
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="cuit"
              className="mb-1.5 block text-sm font-medium text-[var(--color-fg)]"
            >
              CUIT{' '}
              <span className="text-[var(--color-fg-subtle)] font-normal text-xs">(opcional)</span>
            </label>
            <input
              id="cuit"
              type="text"
              inputMode="numeric"
              value={datos.cuit ?? ''}
              onChange={(e) => onUpdate({ ...datos, cuit: fmtCuit(e.target.value) })}
              placeholder="20-12345678-9"
              maxLength={13}
              className={cn(
                'w-full rounded-md border px-3 py-2.5 text-sm font-mono text-[var(--color-fg)] placeholder:text-[var(--color-fg-subtle)] focus:outline-2 focus:outline-[var(--color-primary)] focus:outline-offset-0',
                errors.cuit ? 'border-[var(--color-danger)]' : 'border-[var(--color-border)]',
              )}
              aria-describedby={errors.cuit ? 'cuit-error' : undefined}
            />
            <FieldError msg={errors.cuit} />
          </div>

          <div>
            <label
              htmlFor="condicionIva"
              className="mb-1.5 block text-sm font-medium text-[var(--color-fg)]"
            >
              Condición IVA{' '}
              <span className="text-[var(--color-fg-subtle)] font-normal text-xs">(opcional)</span>
            </label>
            <select
              id="condicionIva"
              value={datos.condicionIva ?? ''}
              onChange={(e) => onUpdate({ ...datos, condicionIva: e.target.value || undefined })}
              className="w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2.5 text-sm text-[var(--color-fg)] focus:outline-2 focus:outline-[var(--color-primary)] focus:outline-offset-0"
            >
              <option value="">Seleccionar</option>
              {CONDICIONES_IVA.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-[var(--color-fg-muted)] text-sm border border-[var(--color-border)] bg-white hover:bg-[var(--color-bg-subtle)] transition-colors"
        >
          Volver
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="inline-flex items-center gap-2 rounded-md bg-[var(--color-primary)] px-5 py-2.5 font-semibold text-[var(--color-primary-foreground)] text-sm shadow-[var(--shadow-xs)] transition-colors hover:bg-[var(--color-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
        >
          Continuar
          <ChevronRight className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>
    </section>
  );
}

// ─── Step 4: OTP + Firma ──────────────────────────────────────────────────

type OtpState = 'idle' | 'requested' | 'verified';

function OtpSection({
  token,
  emailOfuscado,
  otpState,
  onStateChange,
}: {
  token: string;
  emailOfuscado: string;
  otpState: OtpState;
  onStateChange: (s: OtpState) => void;
}) {
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  async function sendOtp() {
    setSending(true);
    setOtpError('');
    try {
      await axios.post(`${apiUrl()}/public/contracts/${token}/otp/request`);
      onStateChange('requested');
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 429) {
        setOtpError('Demasiados pedidos. Esperá unos minutos antes de volver a intentar.');
      } else {
        setOtpError('No se pudo enviar el código. Intentá de nuevo.');
      }
    } finally {
      setSending(false);
    }
  }

  async function verifyOtp(code: string) {
    setVerifying(true);
    setOtpError('');
    try {
      await axios.post(`${apiUrl()}/public/contracts/${token}/otp/verify`, { codigo: code });
      onStateChange('verified');
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 429) {
        setOtpError('Demasiados intentos. Esperá unos minutos.');
      } else {
        setOtpError('Código incorrecto. Verificá e intentá de nuevo.');
      }
      setOtp('');
      inputsRef.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  }

  function handleInput(idx: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = otp.split('');
    next[idx] = digit;
    const code = next.join('').slice(0, 6);
    setOtp(code);
    if (digit && idx < 5) {
      inputsRef.current[idx + 1]?.focus();
    }
    if (code.length === 6 && digit) {
      verifyOtp(code);
    }
  }

  function handleKeyDown(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      const next = otp.split('');
      if (!next[idx] && idx > 0) {
        next[idx - 1] = '';
        setOtp(next.join(''));
        inputsRef.current[idx - 1]?.focus();
      } else {
        next[idx] = '';
        setOtp(next.join(''));
      }
    }
  }

  if (otpState === 'verified') {
    return (
      <div className="flex items-center gap-2 rounded-md bg-[var(--color-success-soft)] border border-[var(--color-success)]/20 px-4 py-3 text-[var(--color-success)] text-sm font-medium">
        <CheckCircle2 className="h-4 w-4 shrink-0" strokeWidth={2.5} />
        Email verificado correctamente
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-white p-5 space-y-4">
      <div>
        <p className="font-medium text-[var(--color-fg)] text-sm">Verificación por email</p>
        <p className="text-[var(--color-fg-muted)] text-sm mt-0.5">
          Te enviaremos un código de 6 dígitos a{' '}
          <span className="font-medium text-[var(--color-fg)]">{emailOfuscado}</span>.
        </p>
      </div>

      {otpState === 'idle' && (
        <button
          type="button"
          onClick={sendOtp}
          disabled={sending}
          className="inline-flex items-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-4 py-2 text-sm font-medium text-[var(--color-fg)] hover:bg-[var(--color-border)] transition-colors disabled:opacity-50"
        >
          {sending && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />}
          {sending ? 'Enviando...' : `Enviar código a ${emailOfuscado}`}
        </button>
      )}

      {otpState === 'requested' && (
        <div className="space-y-3">
          <fieldset className="flex gap-2">
            <legend className="sr-only">Código de verificación</legend>
            {Array.from({ length: 6 }).map((_, idx) => (
              <input
                key={`otp-${
                  // biome-ignore lint/suspicious/noArrayIndexKey: static ordered inputs
                  idx
                }`}
                ref={(el) => {
                  inputsRef.current[idx] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={otp[idx] ?? ''}
                onChange={(e) => handleInput(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                disabled={verifying}
                aria-label={`Dígito ${idx + 1}`}
                className={cn(
                  'h-12 w-10 rounded-md border text-center font-mono text-lg font-semibold text-[var(--color-fg)] focus:outline-2 focus:outline-[var(--color-primary)] focus:outline-offset-0 disabled:opacity-50',
                  otpError ? 'border-[var(--color-danger)]' : 'border-[var(--color-border)]',
                )}
              />
            ))}
            {verifying && (
              <Loader2
                className="h-5 w-5 animate-spin self-center text-[var(--color-fg-subtle)]"
                strokeWidth={2}
              />
            )}
          </fieldset>
          <button
            type="button"
            onClick={sendOtp}
            disabled={sending}
            className="text-[var(--color-primary)] text-xs hover:underline underline-offset-2 disabled:opacity-50"
          >
            {sending ? 'Reenviando...' : 'Reenviar código'}
          </button>
        </div>
      )}

      {otpError && (
        <p className="text-[var(--color-danger)] text-xs" role="alert">
          {otpError}
        </p>
      )}
    </div>
  );
}

function SignatureCanvas({
  onChangeEmpty,
}: {
  onChangeEmpty: (empty: boolean) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<SignaturePad | null>(null);

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !padRef.current) return;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    canvas.getContext('2d')?.scale(ratio, ratio);
    padRef.current.clear();
    onChangeEmpty(true);
  }, [onChangeEmpty]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pad = new SignaturePad(canvas, {
      penColor: '#1a2b3c',
      backgroundColor: 'rgba(255,255,255,0)',
      minWidth: 0.5,
      maxWidth: 2.5,
    });
    padRef.current = pad;

    pad.addEventListener('endStroke', () => {
      onChangeEmpty(pad.isEmpty());
    });

    resize();
    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
      pad.off();
    };
  }, [resize, onChangeEmpty]);

  function clear() {
    padRef.current?.clear();
    onChangeEmpty(true);
  }

  function undo() {
    const pad = padRef.current;
    if (!pad) return;
    const data = pad.toData();
    if (data.length > 0) {
      data.pop();
      pad.fromData(data);
      onChangeEmpty(pad.isEmpty());
    }
  }

  return (
    <div className="space-y-2">
      <div
        className="relative rounded-md border-2 border-[var(--color-border)] bg-white overflow-hidden"
        style={{ height: 180 }}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full cursor-crosshair touch-none"
          aria-label="Área de firma"
          role="img"
        />
        <span
          className="pointer-events-none absolute inset-0 flex items-center justify-center text-[var(--color-fg-subtle)] text-sm select-none"
          id="firma-placeholder"
        >
          Firmá acá con el mouse o el dedo
        </span>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={undo}
          className="text-[var(--color-fg-muted)] text-xs hover:text-[var(--color-fg)] hover:underline underline-offset-2"
        >
          Deshacer
        </button>
        <button
          type="button"
          onClick={clear}
          className="text-[var(--color-fg-muted)] text-xs hover:text-[var(--color-fg)] hover:underline underline-offset-2"
        >
          Borrar
        </button>
      </div>
    </div>
  );

  // expose dataUrl to parent via imperative handle would be cleaner but adding forwardRef here
  // instead we keep the canvas ref accessible by placing getDataUrl at module scope
  // Actually — we need the parent to call toDataURL. We'll use a different approach below.
}

// We need the canvas data in the parent, so let's wire it differently:
function SignatureSection({
  onReady,
}: {
  onReady: (dataUrl: string | null) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<SignaturePad | null>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !padRef.current) return;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    canvas.getContext('2d')?.scale(ratio, ratio);
    padRef.current.clear();
    setIsEmpty(true);
    onReady(null);
  }, [onReady]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pad = new SignaturePad(canvas, {
      penColor: '#1a2b3c',
      backgroundColor: 'rgba(255,255,255,0)',
      minWidth: 0.5,
      maxWidth: 2.5,
    });
    padRef.current = pad;

    pad.addEventListener('endStroke', () => {
      const empty = pad.isEmpty();
      setIsEmpty(empty);
      onReady(empty ? null : pad.toDataURL('image/png'));
    });

    resize();
    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
      pad.off();
    };
  }, [resize, onReady]);

  function clear() {
    padRef.current?.clear();
    setIsEmpty(true);
    onReady(null);
  }

  function undo() {
    const pad = padRef.current;
    if (!pad) return;
    const data = pad.toData();
    if (data.length > 0) {
      data.pop();
      pad.fromData(data);
      const empty = pad.isEmpty();
      setIsEmpty(empty);
      onReady(empty ? null : pad.toDataURL('image/png'));
    }
  }

  return (
    <div className="space-y-2">
      <div
        className="relative rounded-md border-2 border-[var(--color-border)] bg-white overflow-hidden"
        style={{ height: 180 }}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full cursor-crosshair touch-none"
          aria-label="Área de firma"
          role="img"
        />
        {isEmpty && (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[var(--color-fg-subtle)] text-sm select-none">
            Firmá acá con el mouse o el dedo
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={undo}
          className="text-[var(--color-fg-muted)] text-xs hover:text-[var(--color-fg)] underline-offset-2 hover:underline"
        >
          Deshacer
        </button>
        <button
          type="button"
          onClick={clear}
          className="text-[var(--color-fg-muted)] text-xs hover:text-[var(--color-fg)] underline-offset-2 hover:underline"
        >
          Borrar
        </button>
      </div>
    </div>
  );
}

function StepFirma({
  token,
  emailOfuscado,
  planId,
  datosFacturacion,
  onBack,
  onSuccess,
}: {
  token: string;
  emailOfuscado: string;
  planId: number;
  datosFacturacion: DatosFacturacion;
  onBack: () => void;
  onSuccess: (result: SignContratoResponse) => void;
}) {
  const [otpState, setOtpState] = useState<OtpState>('idle');
  const [firmaDataUrl, setFirmaDataUrl] = useState<string | null>(null);
  const [acepta, setAcepta] = useState(false);
  const [signing, setSigning] = useState(false);
  const [signError, setSignError] = useState('');

  const canSubmit = otpState === 'verified' && firmaDataUrl !== null && acepta && !signing;

  async function handleSign() {
    if (!firmaDataUrl) return;
    setSigning(true);
    setSignError('');
    try {
      const { data } = await axios.post<SignContratoResponse>(
        `${apiUrl()}/public/contracts/${token}/sign`,
        {
          planId,
          firmaDataUrl,
          datosFacturacion,
          aceptaTerminos: true,
        },
      );
      onSuccess(data);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        if (status === 410) {
          setSignError('El contrato venció o fue anulado. Solicitá uno nuevo.');
        } else if (status === 409) {
          setSignError('Este contrato ya fue firmado.');
        } else if (status === 400) {
          setSignError(apiError(err, 'Datos inválidos. Revisá el formulario.'));
        } else {
          setSignError('Error al procesar la firma. Intentá de nuevo.');
        }
      } else {
        setSignError('Error inesperado. Intentá de nuevo.');
      }
    } finally {
      setSigning(false);
    }
  }

  return (
    <section>
      <h2 className="mb-1 font-semibold text-[var(--color-fg)] text-lg">Verificación y firma</h2>
      <p className="mb-6 text-[var(--color-fg-muted)] text-sm">
        Verificá tu email y firmá el contrato para completar el proceso.
      </p>

      <div className="space-y-5">
        <OtpSection
          token={token}
          emailOfuscado={emailOfuscado}
          otpState={otpState}
          onStateChange={setOtpState}
        />

        <div className="rounded-lg border border-[var(--color-border)] bg-white p-5 space-y-3">
          <p className="font-medium text-[var(--color-fg)] text-sm">Firma manuscrita</p>
          <SignatureSection onReady={setFirmaDataUrl} />
        </div>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={acepta}
            onChange={(e) => setAcepta(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-[var(--color-border)] accent-[var(--color-primary)]"
          />
          <span className="text-[var(--color-fg-muted)] text-sm leading-relaxed">
            Leí y acepto los términos del contrato y la política de tratamiento de datos personales
            (Ley 25.326).
          </span>
        </label>

        {signError && (
          <p
            className="rounded-md bg-[var(--color-danger-soft)] border border-[var(--color-danger)]/20 px-4 py-3 text-[var(--color-danger)] text-sm"
            role="alert"
          >
            {signError}
          </p>
        )}

        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={onBack}
            disabled={signing}
            className="inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-[var(--color-fg-muted)] text-sm border border-[var(--color-border)] bg-white hover:bg-[var(--color-bg-subtle)] transition-colors disabled:opacity-50"
          >
            Volver
          </button>
          <button
            type="button"
            onClick={handleSign}
            disabled={!canSubmit}
            className="inline-flex items-center gap-2 rounded-md bg-[var(--color-primary)] px-6 py-2.5 font-semibold text-[var(--color-primary-foreground)] text-sm shadow-[var(--shadow-xs)] transition-colors hover:bg-[var(--color-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-40"
            aria-busy={signing}
          >
            {signing && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />}
            {signing ? 'Firmando...' : 'Firmar contrato'}
          </button>
        </div>
      </div>
    </section>
  );
}

// ─── Success ──────────────────────────────────────────────────────────────

function ContratoExito({ emailOfuscado }: { emailOfuscado: string }) {
  return (
    <div
      className="flex flex-col items-center gap-6 rounded-lg border border-[var(--color-border)] bg-white px-8 py-12 text-center shadow-[var(--shadow-sm)]"
      style={{
        animation: 'fadeUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) both',
      }}
    >
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .fade-up { animation: none; }
        }
      `}</style>
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-success-soft)]">
        <CheckCircle2 className="h-8 w-8 text-[var(--color-success)]" strokeWidth={2} />
      </div>
      <div>
        <h2 className="font-bold text-[var(--color-fg)] text-2xl">Contrato firmado</h2>
        <p className="mt-2 text-[var(--color-fg-muted)] text-sm leading-relaxed max-w-sm mx-auto">
          Creamos tu laboratorio. Vas a recibir un email en{' '}
          <span className="font-medium text-[var(--color-fg)]">{emailOfuscado}</span> para
          configurar tu acceso.
        </p>
      </div>
      <a
        href="/login"
        className="inline-flex h-10 items-center justify-center rounded-md bg-[var(--color-primary)] px-5 font-semibold text-[var(--color-primary-foreground)] text-sm transition-opacity hover:opacity-90"
      >
        Acceder a bancovital
      </a>
    </div>
  );
}

// ─── Main orchestrator ────────────────────────────────────────────────────

export function ContratoFlujo({
  token,
  contrato,
  diasRestantes,
  fechaExpira,
}: {
  token: string;
  contrato: ContratoPublicDetail;
  diasRestantes: number;
  fechaExpira: string;
}) {
  const [step, setStep] = useState(0);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(
    contrato.planSugeridoId ?? contrato.planes[0]?.id ?? null,
  );
  const [datosFacturacion, setDatosFacturacion] = useState<DatosFacturacion>({
    domicilioFiscal: '',
  });
  const [exito, setExito] = useState<SignContratoResponse | null>(null);

  if (exito) {
    return <ContratoExito emailOfuscado={contrato.emailFirmanteOfuscado} />;
  }

  return (
    <div>
      <StepIndicator current={step} />

      <div className="rounded-lg border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-xs)]">
        {step === 0 && (
          <StepPropuesta
            contrato={contrato}
            diasRestantes={diasRestantes}
            fechaExpira={fechaExpira}
            onNext={() => setStep(1)}
          />
        )}
        {step === 1 && (
          <StepPlan
            planes={contrato.planes}
            planSugeridoId={contrato.planSugeridoId}
            selectedPlanId={selectedPlanId}
            onSelect={setSelectedPlanId}
            onNext={() => setStep(2)}
            onBack={() => setStep(0)}
          />
        )}
        {step === 2 && (
          <StepFacturacion
            datos={datosFacturacion}
            onUpdate={setDatosFacturacion}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && selectedPlanId !== null && (
          <StepFirma
            token={token}
            emailOfuscado={contrato.emailFirmanteOfuscado}
            planId={selectedPlanId}
            datosFacturacion={datosFacturacion}
            onBack={() => setStep(2)}
            onSuccess={setExito}
          />
        )}
      </div>
    </div>
  );
}
