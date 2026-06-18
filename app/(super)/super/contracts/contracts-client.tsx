'use client';

import { ConfirmDialog } from '@/components/domain/confirm-dialog';
import { EmptyState } from '@/components/layout/empty-state';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Textarea } from '@/components/ui/textarea';
import { apiClient } from '@/lib/api/client';
import { queries } from '@/lib/api/queries';
import type {
  ContratoEstado,
  ContratoSuperDetail,
  ContratoSuperListItem,
  CreateContratoDto,
  CreateContratoResponse,
  Plan,
} from '@/lib/api/types';
import { cn } from '@/lib/cn';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  FileSignature,
  Loader2,
  Plus,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

// ─── Helpers ──────────────────────────────────────────────────────────────

function apiError(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const msg = err.response?.data?.message;
    if (Array.isArray(msg)) return msg.join('. ');
    if (typeof msg === 'string') return msg;
  }
  return fallback;
}

function fmtFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success('Link copiado al portapapeles');
  } catch {
    toast.error('No se pudo copiar el link');
  }
}

// ─── Estado pills ─────────────────────────────────────────────────────────

const ESTADO_CONFIG: Record<ContratoEstado, { label: string; cls: string; icon: React.ReactNode }> =
  {
    enviado: {
      label: 'Enviado',
      cls: 'bg-[var(--color-info-soft)] text-[var(--color-info)] border-[var(--color-info)]/20',
      icon: <Clock className="h-3 w-3" strokeWidth={2.5} />,
    },
    firmado: {
      label: 'Firmado',
      cls: 'bg-[var(--color-success-soft)] text-[var(--color-success)] border-[var(--color-success)]/20',
      icon: <CheckCircle2 className="h-3 w-3" strokeWidth={2.5} />,
    },
    vencido: {
      label: 'Vencido',
      cls: 'bg-[var(--color-warning-soft)] text-[var(--color-warning)] border-[var(--color-warning)]/20',
      icon: <Clock className="h-3 w-3" strokeWidth={2.5} />,
    },
    anulado: {
      label: 'Anulado',
      cls: 'bg-[var(--color-bg-subtle)] text-[var(--color-fg-muted)] border-[var(--color-border)]',
      icon: <XCircle className="h-3 w-3" strokeWidth={2.5} />,
    },
  };

function EstadoPill({ estado }: { estado: ContratoEstado }) {
  const cfg = ESTADO_CONFIG[estado];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium',
        cfg.cls,
      )}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

// ─── New contract dialog ───────────────────────────────────────────────────

type NewContratoForm = {
  razonSocial: string;
  nombreContacto: string;
  emailFirmante: string;
  cuit: string;
  telefono: string;
  descripcion: string;
  notas: string;
  planSugeridoId: string;
};

const EMPTY_FORM: NewContratoForm = {
  razonSocial: '',
  nombreContacto: '',
  emailFirmante: '',
  cuit: '',
  telefono: '',
  descripcion: '',
  notas: '',
  planSugeridoId: '',
};

function validate(f: NewContratoForm): Record<string, string> {
  const errs: Record<string, string> = {};
  if (!f.razonSocial.trim()) errs.razonSocial = 'Requerido';
  if (!f.nombreContacto.trim()) errs.nombreContacto = 'Requerido';
  if (!f.emailFirmante.trim()) errs.emailFirmante = 'Requerido';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.emailFirmante))
    errs.emailFirmante = 'Email inválido';
  return errs;
}

function formToDto(f: NewContratoForm): CreateContratoDto {
  return {
    razonSocial: f.razonSocial.trim(),
    nombreContacto: f.nombreContacto.trim(),
    emailFirmante: f.emailFirmante.trim(),
    ...(f.cuit.trim() ? { cuit: f.cuit.trim() } : {}),
    ...(f.telefono.trim() ? { telefono: f.telefono.trim() } : {}),
    propuesta: {
      descripcion: f.descripcion.trim(),
      ...(f.notas.trim() ? { notas: f.notas.trim() } : {}),
    },
    ...(f.planSugeridoId ? { planSugeridoId: Number.parseInt(f.planSugeridoId, 10) } : {}),
  };
}

function NewContratoDialog({
  open,
  onOpenChange,
  plans,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  plans: Plan[];
  onCreated: (url: string) => void;
}) {
  const [form, setForm] = useState<NewContratoForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setForm(EMPTY_FORM);
      setErrors({});
    }
  }, [open]);

  const set =
    (key: keyof NewContratoForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [key]: e.target.value }));

  const createMut = useMutation({
    mutationFn: (dto: CreateContratoDto) =>
      apiClient.post<CreateContratoResponse>('/super/contracts', dto).then((r) => r.data),
    onSuccess: (data) => {
      onOpenChange(false);
      onCreated(data.contractUrl);
    },
    onError: (err) => toast.error(apiError(err, 'Error al crear el contrato')),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    createMut.mutate(formToDto(form));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo contrato</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2 max-h-[70vh] overflow-y-auto pr-1">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Razón social" htmlFor="c-razon" required error={errors.razonSocial}>
              <Input
                id="c-razon"
                value={form.razonSocial}
                onChange={set('razonSocial')}
                placeholder="Laboratorio SA"
                disabled={createMut.isPending}
                autoFocus
              />
            </FormField>
            <FormField
              label="Nombre del contacto"
              htmlFor="c-contacto"
              required
              error={errors.nombreContacto}
            >
              <Input
                id="c-contacto"
                value={form.nombreContacto}
                onChange={set('nombreContacto')}
                placeholder="María García"
                disabled={createMut.isPending}
              />
            </FormField>
          </div>

          <FormField label="Email firmante" htmlFor="c-email" required error={errors.emailFirmante}>
            <Input
              id="c-email"
              type="email"
              value={form.emailFirmante}
              onChange={set('emailFirmante')}
              placeholder="contacto@laboratorio.com"
              disabled={createMut.isPending}
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="CUIT" htmlFor="c-cuit" error={errors.cuit}>
              <Input
                id="c-cuit"
                value={form.cuit}
                onChange={set('cuit')}
                placeholder="20-12345678-9"
                disabled={createMut.isPending}
              />
            </FormField>
            <FormField label="Teléfono" htmlFor="c-tel" error={errors.telefono}>
              <Input
                id="c-tel"
                type="tel"
                value={form.telefono}
                onChange={set('telefono')}
                placeholder="+54 11 4567-8901"
                disabled={createMut.isPending}
              />
            </FormField>
          </div>

          <FormField
            label="Descripción de la propuesta"
            htmlFor="c-desc"
            error={errors.descripcion}
          >
            <Textarea
              id="c-desc"
              value={form.descripcion}
              onChange={set('descripcion')}
              placeholder="Describe los servicios y condiciones acordadas..."
              rows={4}
              disabled={createMut.isPending}
            />
          </FormField>

          <FormField label="Notas internas" htmlFor="c-notas">
            <Textarea
              id="c-notas"
              value={form.notas}
              onChange={set('notas')}
              placeholder="Notas adicionales (visibles en el PDF del contrato)"
              rows={2}
              disabled={createMut.isPending}
            />
          </FormField>

          {plans.length > 0 && (
            <FormField label="Plan sugerido" htmlFor="c-plan">
              <Select
                value={form.planSugeridoId}
                onValueChange={(v) => setForm((p) => ({ ...p, planSugeridoId: v }))}
                disabled={createMut.isPending}
              >
                <SelectTrigger id="c-plan">
                  <SelectValue placeholder="Sin sugerencia" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createMut.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={createMut.isPending}>
              {createMut.isPending && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />}
              Crear contrato
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Contract URL success dialog ──────────────────────────────────────────

function ContratoUrlDialog({
  url,
  onClose,
}: {
  url: string | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={url !== null} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Contrato creado</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <p className="text-[var(--color-fg-muted)] text-sm">
            Compartí este link con el cliente para que pueda revisar y firmar el contrato.
          </p>
          <div className="flex items-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-3 py-2">
            <span className="flex-1 break-all font-mono text-[var(--color-fg)] text-xs">{url}</span>
            <button
              type="button"
              onClick={() => url && copyToClipboard(url)}
              className="shrink-0 rounded p-1 text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:bg-[var(--color-border)] transition-colors"
              title="Copiar link"
            >
              <Copy className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Row actions ──────────────────────────────────────────────────────────

function ContractRowActions({
  contract,
  onAnular,
}: {
  contract: ContratoSuperListItem;
  onAnular: () => void;
}) {
  const qc = useQueryClient();

  const resendMut = useMutation({
    mutationFn: () =>
      apiClient
        .post<{ contractUrl: string }>(`/super/contracts/${contract.id}/resend`)
        .then((r) => r.data),
    onSuccess: (data) => {
      toast.success('Contrato reenviado', {
        action: {
          label: 'Copiar link',
          onClick: () => copyToClipboard(data.contractUrl),
        },
      });
      qc.invalidateQueries({ queryKey: queries.contracts.superList() });
    },
    onError: (err) => toast.error(apiError(err, 'Error al reenviar')),
  });

  return (
    <div className="flex items-center justify-end gap-3 flex-wrap">
      <button
        type="button"
        onClick={() => copyToClipboard(contract.contractUrl)}
        className="flex items-center gap-1 text-[var(--color-fg-muted)] text-xs hover:text-[var(--color-fg)] hover:underline underline-offset-2"
        title="Copiar link de contrato"
      >
        <Copy className="h-3.5 w-3.5" strokeWidth={2} />
        Copiar link
      </button>

      {contract.estado === 'enviado' && (
        <button
          type="button"
          onClick={() => resendMut.mutate()}
          disabled={resendMut.isPending}
          className="flex items-center gap-1 text-[var(--color-info)] text-xs hover:underline underline-offset-2 disabled:opacity-50"
        >
          {resendMut.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" strokeWidth={2} />
          )}
          Reenviar
        </button>
      )}

      {contract.estado !== 'anulado' && contract.estado !== 'firmado' && (
        <button
          type="button"
          onClick={onAnular}
          className="flex items-center gap-1 text-[var(--color-danger)] text-xs hover:underline underline-offset-2"
        >
          <XCircle className="h-3.5 w-3.5" strokeWidth={2} />
          Anular
        </button>
      )}

      {contract.estado === 'firmado' && (
        <button
          type="button"
          onClick={async () => {
            try {
              const { data } = await apiClient.get<ContratoSuperDetail>(
                `/super/contracts/${contract.id}`,
              );
              if (data.pdfFirmadoUrl) {
                window.open(data.pdfFirmadoUrl, '_blank');
              } else {
                toast.info('El PDF firmado todavía no está disponible');
              }
            } catch {
              toast.error('Error al obtener el PDF');
            }
          }}
          className="flex items-center gap-1 text-[var(--color-primary)] text-xs hover:underline underline-offset-2"
        >
          <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} />
          PDF firmado
        </button>
      )}
    </div>
  );
}

// ─── Main client ──────────────────────────────────────────────────────────

export function ContractsClient({
  initialContracts,
  plans,
}: {
  initialContracts: ContratoSuperListItem[];
  plans: Plan[];
}) {
  const qc = useQueryClient();

  const { data: contracts = initialContracts } = useQuery({
    queryKey: queries.contracts.superList(),
    queryFn: () => apiClient.get<ContratoSuperListItem[]>('/super/contracts').then((r) => r.data),
    initialData: initialContracts,
  });

  const [newOpen, setNewOpen] = useState(false);
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);
  const [anulando, setAnulando] = useState<ContratoSuperListItem | null>(null);

  const anularMut = useMutation({
    mutationFn: (id: number) => apiClient.post(`/super/contracts/${id}/anular`),
    onSuccess: () => {
      toast.success('Contrato anulado');
      setAnulando(null);
      qc.invalidateQueries({ queryKey: queries.contracts.superList() });
    },
    onError: (err) => toast.error(apiError(err, 'Error al anular el contrato')),
  });

  return (
    <div>
      <PageHeader
        title="Contratos"
        description={`${contracts.length} ${contracts.length === 1 ? 'contrato' : 'contratos'}`}
        actions={
          <Button onClick={() => setNewOpen(true)}>
            <Plus className="h-4 w-4" strokeWidth={2} />
            Nuevo contrato
          </Button>
        }
      />

      {contracts.length === 0 ? (
        <EmptyState
          icon={FileSignature}
          title="Sin contratos"
          description="Creá el primer contrato para comenzar el proceso de onboarding de un cliente."
          action={
            <Button size="sm" onClick={() => setNewOpen(true)}>
              <Plus className="h-4 w-4" strokeWidth={2} />
              Crear contrato
            </Button>
          }
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] shadow-[var(--shadow-xs)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-[var(--color-border)] border-b bg-[var(--color-bg-subtle)] text-[10px] text-[var(--color-fg-muted)] uppercase tracking-wide">
                <th className="px-5 py-2.5 text-left font-medium">Cliente</th>
                <th className="px-5 py-2.5 text-left font-medium">Estado</th>
                <th className="px-5 py-2.5 text-left font-medium">Plan</th>
                <th className="px-5 py-2.5 text-left font-medium">Vence / Firmado</th>
                <th className="px-5 py-2.5 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((c) => (
                <tr
                  key={c.id}
                  className="border-[var(--color-border)] border-b last:border-b-0 hover:bg-[var(--color-bg-subtle)]"
                >
                  <td className="px-5 py-3">
                    <p className="font-medium text-[var(--color-fg)]">{c.razonSocial}</p>
                    <p className="text-[var(--color-fg-muted)] text-xs">{c.nombreContacto}</p>
                  </td>
                  <td className="px-5 py-3">
                    <EstadoPill estado={c.estado} />
                  </td>
                  <td className="px-5 py-3 text-[var(--color-fg-muted)] text-xs">
                    {c.planElegidoNombre ??
                      (c.planSugeridoId ? `Sugerido: #${c.planSugeridoId}` : '—')}
                  </td>
                  <td className="tabular px-5 py-3 font-mono text-[var(--color-fg-muted)] text-xs">
                    {c.firmadoAt ? fmtFecha(c.firmadoAt) : fmtFecha(c.expiraAt)}
                  </td>
                  <td className="px-5 py-3">
                    <ContractRowActions contract={c} onAnular={() => setAnulando(c)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <NewContratoDialog
        open={newOpen}
        onOpenChange={setNewOpen}
        plans={plans}
        onCreated={(url) => {
          setCreatedUrl(url);
          qc.invalidateQueries({ queryKey: queries.contracts.superList() });
        }}
      />

      <ContratoUrlDialog url={createdUrl} onClose={() => setCreatedUrl(null)} />

      <ConfirmDialog
        open={anulando !== null}
        onOpenChange={(v) => {
          if (!v) setAnulando(null);
        }}
        title={`¿Anular contrato de "${anulando?.razonSocial}"?`}
        description="El link de contrato dejará de ser accesible. Esta acción no se puede deshacer."
        tone="danger"
        confirmLabel="Anular contrato"
        loading={anularMut.isPending}
        onConfirm={() => {
          if (anulando) anularMut.mutate(anulando.id);
        }}
      />
    </div>
  );
}
