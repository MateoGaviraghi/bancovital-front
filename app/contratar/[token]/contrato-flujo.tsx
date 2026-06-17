'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type {
  ContratoPublicDetail,
  ContratoPublicPlan,
  DatosFacturacion,
  SignContratoResponse,
} from '@/lib/api/types';
import { cn } from '@/lib/cn';
import axios from 'axios';
import { Check, CheckCircle2, ChevronRight, ExternalLink, Loader2 } from 'lucide-react';
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

// ─── Shared building blocks ──────────────────────────────────────────────────

/** Editorial section header — red eyebrow rule + uppercase tag, then title/body.
 *  Mirrors the approved landing language. */
function StepHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <header className="mb-6">
      <div className="mb-3 flex items-center gap-3">
        <span className="h-px w-8 bg-[var(--color-accent)]" />
        <span className="font-medium text-[10px] text-[var(--color-accent)] uppercase tracking-[0.18em]">
          {eyebrow}
        </span>
      </div>
      <h2 className="font-semibold text-[var(--color-fg)] text-xl tracking-tight">{title}</h2>
      <p className="mt-1.5 text-[var(--color-fg-muted)] text-sm">{description}</p>
    </header>
  );
}

/** Bordered panel matching the landing's sharp surface aesthetic. */
function Panel({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn('border border-[var(--color-border)] bg-[var(--color-bg-elevated)]', className)}
    >
      {children}
    </div>
  );
}

// ─── Step indicator ────────────────────────────────────────────────────────

const STEPS = ['Propuesta', 'Plan', 'Facturación', 'Firma'];

function StepIndicator({ current }: { current: number }) {
  return (
    <nav aria-label="Pasos del proceso" className="mb-8">
      <ol className="flex items-stretch gap-2.5">
        {STEPS.map((label, idx) => {
          const done = idx < current;
          const active = idx === current;
          return (
            <li key={label} className="flex flex-1 flex-col gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center border font-mono font-semibold text-xs tabular-nums transition-colors duration-200',
                    done
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white'
                      : active
                        ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                        : 'border-[var(--color-border)] text-[var(--color-fg-subtle)]',
                  )}
                  aria-current={active ? 'step' : undefined}
                >
                  {done ? (
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  ) : (
                    String(idx + 1).padStart(2, '0')
                  )}
                </span>
                <span
                  className={cn(
                    'hidden truncate font-medium text-xs sm:block',
                    active ? 'text-[var(--color-fg)]' : 'text-[var(--color-fg-subtle)]',
                  )}
                >
                  {label}
                </span>
              </div>
              <span
                className={cn(
                  'h-0.5 w-full transition-colors duration-300',
                  idx <= current ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]',
                )}
              />
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
      <StepHeader
        eyebrow="Paso 1 · Propuesta"
        title="Propuesta comercial"
        description="Revisá los detalles antes de seleccionar un plan."
      />

      <Panel className="divide-y divide-[var(--color-border)]">
        <div className="px-5 py-4">
          <p className="mb-0.5 font-medium text-[10px] text-[var(--color-fg-subtle)] uppercase tracking-[0.14em]">
            Cliente
          </p>
          <p className="font-semibold text-[var(--color-fg)]">{contrato.razonSocial}</p>
          <p className="text-[var(--color-fg-muted)] text-sm">{contrato.nombreContacto}</p>
        </div>

        <div className="px-5 py-4">
          <p className="mb-1.5 font-medium text-[10px] text-[var(--color-fg-subtle)] uppercase tracking-[0.14em]">
            Descripción de la propuesta
          </p>
          <p className="whitespace-pre-wrap text-[var(--color-fg)] text-sm leading-relaxed">
            {contrato.propuesta.descripcion}
          </p>
          {contrato.propuesta.notas && (
            <p className="mt-2 text-[var(--color-fg-muted)] text-sm italic leading-relaxed">
              {contrato.propuesta.notas}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between gap-4 px-5 py-3.5">
          <div>
            <p className="font-medium text-[10px] text-[var(--color-fg-subtle)] uppercase tracking-[0.14em]">
              Validez
            </p>
            <p
              className={cn(
                'font-medium text-sm',
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
          <Button asChild variant="outline" size="sm">
            <a href={contrato.pdfUrl ?? undefined} target="_blank" rel="noopener noreferrer">
              <ExternalLink strokeWidth={2} />
              Ver contrato (PDF)
            </a>
          </Button>
        </div>
      </Panel>

      <div className="mt-6 flex justify-end">
        <Button onClick={onNext}>
          Seleccionar plan
          <ChevronRight strokeWidth={2} />
        </Button>
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
        'group relative flex cursor-pointer flex-col border bg-[var(--color-bg-elevated)] p-5 transition-colors duration-150',
        'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[var(--color-primary)] has-[:focus-visible]:ring-offset-2',
        selected
          ? 'border-[var(--color-primary)]'
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
      {selected && (
        <span aria-hidden className="absolute inset-y-0 left-0 w-[3px] bg-[var(--color-primary)]" />
      )}
      {sugerido && (
        <span className="absolute top-0 right-0 bg-[var(--color-accent)] px-2 py-0.5 font-semibold text-[10px] text-white uppercase tracking-[0.1em]">
          Sugerido
        </span>
      )}
      <p className="pr-20 font-semibold text-[var(--color-fg)] text-base">{plan.nombre}</p>
      <p className="mt-3 font-bold font-mono text-[var(--color-fg)] text-2xl tabular-nums">
        {fmtARS(plan.precioMensual)}
        <span className="ml-1 font-normal font-sans text-[var(--color-fg-muted)] text-sm">
          /mes
        </span>
      </p>
      <div className="mt-3 space-y-1 text-[var(--color-fg-muted)] text-sm">
        <p>
          Cupo:{' '}
          <span className="font-medium text-[var(--color-fg)] tabular-nums">
            {plan.cupoOrdenesMes.toLocaleString('es-AR')} órdenes/mes
          </span>
        </p>
        <p>
          Excedente:{' '}
          <span className="font-medium text-[var(--color-fg)] tabular-nums">
            {fmtARS(plan.precioOrdenExcedente)}/orden
          </span>
        </p>
      </div>
      <div className="mt-4 bg-[var(--color-bg-subtle)] px-3 py-2 text-[11px] text-[var(--color-fg-muted)] leading-relaxed">
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
      <StepHeader
        eyebrow="Paso 2 · Plan"
        title="Seleccioná tu plan"
        description="Elegí el plan que mejor se adapta a tu volumen de trabajo."
      />

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
        <Button variant="outline" onClick={onBack}>
          Volver
        </Button>
        <Button onClick={onNext} disabled={selectedPlanId === null}>
          Continuar
          <ChevronRight strokeWidth={2} />
        </Button>
      </div>
    </section>
  );
}

// ─── Step 3: Facturación ───────────────────────────────────────────────────

const CONDICIONES_IVA = ['Responsable Inscripto', 'Monotributo', 'Exento', 'Consumidor Final'];

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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (validate()) onNext();
  }

  return (
    <section>
      <StepHeader
        eyebrow="Paso 3 · Facturación"
        title="Datos de facturación"
        description="Esta información se usará para generar la factura mensual."
      />

      <form onSubmit={handleSubmit}>
        <Panel className="space-y-4 p-5">
          <FormField
            label="Domicilio fiscal"
            htmlFor="domicilioFiscal"
            required
            error={errors.domicilioFiscal}
          >
            <Input
              id="domicilioFiscal"
              value={datos.domicilioFiscal}
              onChange={(e) => onUpdate({ ...datos, domicilioFiscal: e.target.value })}
              placeholder="Av. Ejemplo 1234, Ciudad, Provincia"
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label={
                <>
                  CUIT{' '}
                  <span className="font-normal text-[var(--color-fg-subtle)] text-xs">
                    (opcional)
                  </span>
                </>
              }
              htmlFor="cuit"
              error={errors.cuit}
            >
              <Input
                id="cuit"
                inputMode="numeric"
                maxLength={13}
                className="font-mono"
                value={datos.cuit ?? ''}
                onChange={(e) => onUpdate({ ...datos, cuit: fmtCuit(e.target.value) })}
                placeholder="20-12345678-9"
              />
            </FormField>

            <div className="space-y-1.5">
              <Label htmlFor="condicionIva">
                Condición IVA{' '}
                <span className="font-normal text-[var(--color-fg-subtle)] text-xs">
                  (opcional)
                </span>
              </Label>
              <Select
                value={datos.condicionIva ?? ''}
                onValueChange={(v) => onUpdate({ ...datos, condicionIva: v || undefined })}
              >
                <SelectTrigger id="condicionIva" className="w-full">
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {CONDICIONES_IVA.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Panel>

        <div className="mt-6 flex items-center justify-between">
          <Button type="button" variant="outline" onClick={onBack}>
            Volver
          </Button>
          <Button type="submit">
            Continuar
            <ChevronRight strokeWidth={2} />
          </Button>
        </div>
      </form>
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
      <div className="flex items-center gap-2 border border-[var(--color-success)]/25 bg-[var(--color-success-soft)] px-4 py-3 font-medium text-[var(--color-success)] text-sm">
        <CheckCircle2 className="h-4 w-4 shrink-0" strokeWidth={2.5} />
        Email verificado correctamente
      </div>
    );
  }

  return (
    <Panel className="space-y-4 p-5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-medium text-[10px] text-[var(--color-fg-subtle)] uppercase tracking-[0.14em]">
          Verificación por email
        </p>
        <span className="font-mono text-[var(--color-fg-subtle)] text-xs">1 / 2</span>
      </div>
      <p className="text-[var(--color-fg-muted)] text-sm">
        Te enviaremos un código de 6 dígitos a{' '}
        <span className="font-medium text-[var(--color-fg)]">{emailOfuscado}</span>.
      </p>

      {otpState === 'idle' && (
        <Button variant="secondary" onClick={sendOtp} loading={sending}>
          {sending ? 'Enviando…' : 'Enviar código'}
        </Button>
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
                  'h-12 w-10 border bg-[var(--color-bg-elevated)] text-center font-mono font-semibold text-[var(--color-fg)] text-lg shadow-[var(--shadow-inset)] outline-none transition-colors',
                  'focus-visible:border-[var(--color-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary-soft)] disabled:opacity-50',
                  otpError ? 'border-[var(--color-danger)]' : 'border-[var(--color-border-strong)]',
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
          <Button variant="link" size="sm" onClick={sendOtp} disabled={sending}>
            {sending ? 'Reenviando…' : 'Reenviar código'}
          </Button>
        </div>
      )}

      {otpError && (
        <p className="text-[var(--color-danger)] text-xs" role="alert">
          {otpError}
        </p>
      )}
    </Panel>
  );
}

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
      penColor: '#1f2b5b',
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
        className={cn(
          'relative h-[180px] overflow-hidden border bg-[var(--color-bg-elevated)] transition-colors',
          isEmpty ? 'border-[var(--color-border-strong)]' : 'border-[var(--color-primary)]',
        )}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full cursor-crosshair touch-none"
          aria-label="Área de firma"
          role="img"
        />
        {isEmpty && (
          <span className="pointer-events-none absolute inset-0 flex select-none items-center justify-center text-[var(--color-fg-subtle)] text-sm">
            Firmá acá con el mouse o el dedo
          </span>
        )}
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={undo}>
          Deshacer
        </Button>
        <Button variant="ghost" size="sm" onClick={clear}>
          Borrar
        </Button>
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
      <StepHeader
        eyebrow="Paso 4 · Firma"
        title="Verificación y firma"
        description="Verificá tu email y firmá el contrato para completar el proceso."
      />

      <div className="space-y-5">
        <OtpSection
          token={token}
          emailOfuscado={emailOfuscado}
          otpState={otpState}
          onStateChange={setOtpState}
        />

        <Panel className="space-y-3 p-5">
          <div className="flex items-baseline justify-between gap-3">
            <p className="font-medium text-[10px] text-[var(--color-fg-subtle)] uppercase tracking-[0.14em]">
              Firma manuscrita
            </p>
            <span className="font-mono text-[var(--color-fg-subtle)] text-xs">2 / 2</span>
          </div>
          <SignatureSection onReady={setFirmaDataUrl} />
        </Panel>

        <div className="flex items-start gap-3">
          <Checkbox
            id="acepta-terminos"
            checked={acepta}
            onCheckedChange={(v) => setAcepta(v === true)}
            className="mt-0.5"
          />
          <Label
            htmlFor="acepta-terminos"
            className="text-[var(--color-fg-muted)] text-sm leading-relaxed"
          >
            Leí y acepto los términos del contrato y la política de tratamiento de datos personales
            (Ley 25.326).
          </Label>
        </div>

        {signError && (
          <p
            className="border border-[var(--color-danger)]/25 bg-[var(--color-danger-soft)] px-4 py-3 text-[var(--color-danger)] text-sm"
            role="alert"
          >
            {signError}
          </p>
        )}

        <div className="flex items-center justify-between pt-1">
          <Button variant="outline" onClick={onBack} disabled={signing}>
            Volver
          </Button>
          <Button onClick={handleSign} disabled={!canSubmit} loading={signing}>
            {signing ? 'Firmando…' : 'Firmar contrato'}
          </Button>
        </div>
      </div>
    </section>
  );
}

// ─── Success ──────────────────────────────────────────────────────────────

function ContratoExito({ emailOfuscado }: { emailOfuscado: string }) {
  return (
    <div className="[&_*]:rounded-none">
      <div className="motion-scale-in flex flex-col items-center gap-6 border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-8 py-12 text-center shadow-[var(--shadow-sm)]">
        <div className="flex h-16 w-16 items-center justify-center bg-[var(--color-success-soft)]">
          <CheckCircle2 className="h-8 w-8 text-[var(--color-success)]" strokeWidth={2} />
        </div>
        <div>
          <h2 className="font-semibold text-[var(--color-fg)] text-2xl tracking-tight">
            Contrato firmado
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-[var(--color-fg-muted)] text-sm leading-relaxed">
            Creamos tu laboratorio. Vas a recibir un email en{' '}
            <span className="font-medium text-[var(--color-fg)]">{emailOfuscado}</span> para
            configurar tu acceso.
          </p>
        </div>
        <Button asChild size="lg">
          <a href="/login">Acceder a Banco Vital</a>
        </Button>
      </div>
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
    <div className="[&_*]:rounded-none">
      <StepIndicator current={step} />

      <div className="border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6 shadow-[var(--shadow-sm)] sm:p-8">
        <div key={step} className="motion-fade-in">
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
    </div>
  );
}
