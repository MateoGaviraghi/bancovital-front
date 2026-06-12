'use client';

import { ConfirmDialog } from '@/components/domain/confirm-dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { apiClient } from '@/lib/api/client';
import type { OrderDetail, OrderStatus } from '@/lib/api/types';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { Ban, CheckCircle2, Loader2, Pencil, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

function apiError(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const msg = err.response?.data?.message;
    if (Array.isArray(msg)) return msg.join('. ');
    if (typeof msg === 'string') return msg;
  }
  return fallback;
}

type Props = { order: OrderDetail; userRole?: string | null };

// borrador: editable + can be explicitly accepted (→ confirmada)
// confirmada / en_proceso: can be finalized in one step (→ resultados_cargados)
const EDITABLE: OrderStatus[] = ['borrador'];
const FINALIZABLE: OrderStatus[] = ['confirmada', 'en_proceso'];
const CANCELABLE: OrderStatus[] = ['borrador', 'confirmada', 'en_proceso', 'resultados_cargados'];
const REVERTIBLE: OrderStatus[] = ['confirmada', 'en_proceso', 'resultados_cargados', 'emitida'];

export function OrderActions({ order, userRole }: Props) {
  const router = useRouter();
  const { slug } = useParams<{ slug: string }>();
  const [finalizeOpen, setFinalizeOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [revertOpen, setRevertOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const isReadOnly = userRole === 'recepcion';
  const isAdmin = userRole === 'admin';

  function endpoint(action: 'confirm' | 'start' | 'finalize' | 'cancel') {
    return `/orders/${order.id}/${action}`;
  }

  const finalizeMut = useMutation({
    mutationFn: async () => {
      // confirmada needs /start first; en_proceso goes straight to /finalize
      if (order.status === 'confirmada') {
        await apiClient.patch(endpoint('start'));
      }
      await apiClient.patch(endpoint('finalize'));
    },
    onSuccess: () => {
      toast.success('Orden confirmada');
      setFinalizeOpen(false);
      router.refresh();
    },
    onError: (err) => toast.error(apiError(err, 'Error al confirmar')),
  });

  const cancelMut = useMutation({
    mutationFn: () => apiClient.patch(endpoint('cancel'), { reason: cancelReason.trim() }),
    onSuccess: () => {
      toast.success('Orden anulada');
      setCancelOpen(false);
      setCancelReason('');
      router.refresh();
    },
    onError: (err) => toast.error(apiError(err, 'Error al anular')),
  });

  const revertMut = useMutation({
    mutationFn: () => apiClient.patch(`/orders/${order.id}/revert`),
    onSuccess: () => {
      toast.success('Orden revertida a borrador');
      setRevertOpen(false);
      router.refresh();
    },
    onError: (err) => toast.error(apiError(err, 'Error al revertir')),
  });

  const canEdit = EDITABLE.includes(order.status) && !isReadOnly;
  const canFinalize = FINALIZABLE.includes(order.status) && !isReadOnly;
  const canCancel = CANCELABLE.includes(order.status) && !isReadOnly;
  const canRevert = REVERTIBLE.includes(order.status) && isAdmin;

  if (!canEdit && !canFinalize && !canCancel && !canRevert) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {canEdit && (
        <Button asChild variant="outline">
          <Link href={`/${slug}/ordenes/${order.id}/editar`}>
            <Pencil className="h-4 w-4" strokeWidth={2} />
            Editar
          </Link>
        </Button>
      )}
      {canFinalize && (
        <Button onClick={() => setFinalizeOpen(true)} disabled={finalizeMut.isPending}>
          <CheckCircle2 className="h-4 w-4" strokeWidth={2} />
          Confirmar
        </Button>
      )}
      {canRevert && (
        <Button
          variant="outline"
          onClick={() => setRevertOpen(true)}
          disabled={revertMut.isPending}
        >
          <RotateCcw className="h-4 w-4" strokeWidth={2} />
          Volver a borrador
        </Button>
      )}
      {canCancel && (
        <Button
          variant="outline"
          onClick={() => setCancelOpen(true)}
          disabled={cancelMut.isPending}
        >
          <Ban className="h-4 w-4" strokeWidth={2} />
          Anular
        </Button>
      )}

      <ConfirmDialog
        open={revertOpen}
        onOpenChange={setRevertOpen}
        title="¿Volver la orden a borrador?"
        description="La orden quedará editable nuevamente. Si tenía un informe emitido, se eliminará el PDF asociado."
        tone="warning"
        confirmLabel="Volver a borrador"
        loading={revertMut.isPending}
        onConfirm={async () => {
          await revertMut.mutateAsync();
        }}
      />

      <ConfirmDialog
        open={finalizeOpen}
        onOpenChange={setFinalizeOpen}
        title="¿Confirmar orden?"
        description="Verificá que todos los resultados estén cargados. La orden quedará lista para emitir el informe."
        tone="info"
        confirmLabel="Confirmar"
        loading={finalizeMut.isPending}
        onConfirm={async () => {
          await finalizeMut.mutateAsync();
        }}
      />

      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Anular orden</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Indicá el motivo:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            rows={3}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Motivo de anulación…"
            disabled={cancelMut.isPending}
          />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelMut.isPending}>Volver</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (cancelReason.trim().length < 3) {
                  toast.error('Indicá un motivo (mínimo 3 caracteres)');
                  return;
                }
                cancelMut.mutate();
              }}
              disabled={cancelMut.isPending}
              className="bg-[var(--color-danger)] text-[var(--color-danger-foreground)] hover:opacity-90 focus-visible:ring-[var(--color-danger)]"
            >
              {cancelMut.isPending && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />}
              Anular orden
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
