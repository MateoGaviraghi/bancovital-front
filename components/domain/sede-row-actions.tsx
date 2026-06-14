'use client';

import { ConfirmDialog } from '@/components/domain/confirm-dialog';
import { SedeForm } from '@/components/domain/sede-form';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { apiClient } from '@/lib/api/client';
import type { Sede } from '@/lib/api/types';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { ChevronDown, Loader2, MapPin, Pencil, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
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

type Props = {
  sede: Sede;
};

export function SedeRowActions({ sede }: Props) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const principalMut = useMutation({
    mutationFn: async () => {
      await apiClient.patch<Sede>(`/sedes/${sede.id}`, { principal: true });
    },
    onSuccess: () => {
      toast.success('Sede marcada como principal');
      router.refresh();
    },
    onError: (err) => toast.error(apiError(err, 'Error al actualizar sede')),
  });

  const deleteMut = useMutation({
    mutationFn: async () => {
      await apiClient.delete(`/sedes/${sede.id}`);
    },
    onSuccess: () => {
      toast.success('Sede eliminada');
      setDeleteOpen(false);
      router.refresh();
    },
    onError: (err) => toast.error(apiError(err, 'Error al eliminar sede')),
  });

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            Acciones
            <ChevronDown className="h-3.5 w-3.5" strokeWidth={2} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              setEditOpen(true);
            }}
          >
            <Pencil className="h-4 w-4" strokeWidth={2} />
            Editar
          </DropdownMenuItem>

          {!sede.principal && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  principalMut.mutate();
                }}
                disabled={principalMut.isPending}
              >
                <MapPin className="h-4 w-4" strokeWidth={2} />
                Marcar como principal
                {principalMut.isPending && <Loader2 className="ml-auto h-3.5 w-3.5 animate-spin" />}
              </DropdownMenuItem>
            </>
          )}

          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              setDeleteOpen(true);
            }}
            disabled={deleteMut.isPending}
            className="text-[var(--color-danger)] focus:text-[var(--color-danger)]"
          >
            <Trash2 className="h-4 w-4" strokeWidth={2} />
            Eliminar sede
            {deleteMut.isPending && <Loader2 className="ml-auto h-3.5 w-3.5 animate-spin" />}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar sede</DialogTitle>
          </DialogHeader>
          <SedeForm sede={sede} onSuccess={() => setEditOpen(false)} />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="¿Eliminar sede?"
        description={`"${sede.nombre}" será eliminada. Esta acción no se puede deshacer.`}
        tone="danger"
        confirmLabel="Eliminar"
        loading={deleteMut.isPending}
        onConfirm={async () => {
          await deleteMut.mutateAsync();
        }}
      />
    </>
  );
}
