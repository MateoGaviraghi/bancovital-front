'use client';

import { ConfirmDialog } from '@/components/domain/confirm-dialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { apiClient } from '@/lib/api/client';
import type { AdminUser, UserRole } from '@/lib/api/types';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { ChevronDown, Loader2, ShieldCheck, Trash2, UserCheck, UserX } from 'lucide-react';
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

const ROLE_LABEL: Record<UserRole, string> = {
  admin: 'Administrador',
  recepcion: 'Recepción',
  bioquimico: 'Bioquímico',
  super: 'Super Admin',
};

type Props = {
  user: AdminUser;
  isSelf: boolean;
};

export function UserRowActions({ user, isSelf }: Props) {
  const router = useRouter();
  const [toggleOpen, setToggleOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const deleteMut = useMutation({
    mutationFn: async () => {
      await apiClient.delete(`/users/${user.id}`);
    },
    onSuccess: () => {
      toast.success('Usuario eliminado');
      setDeleteOpen(false);
      router.refresh();
    },
    onError: (err) => toast.error(apiError(err, 'Error al eliminar usuario')),
  });

  const roleMut = useMutation({
    mutationFn: async (role: UserRole) => {
      await apiClient.patch(`/users/${user.id}/role`, { role });
      return role;
    },
    onSuccess: (role) => {
      toast.success(`Rol cambiado a ${ROLE_LABEL[role]}`);
      router.refresh();
    },
    onError: (err) => toast.error(apiError(err, 'Error al cambiar rol')),
  });

  const activeMut = useMutation({
    mutationFn: async () => {
      await apiClient.patch(`/users/${user.id}/active`, { active: !user.active });
    },
    onSuccess: () => {
      toast.success(user.active ? 'Usuario desactivado' : 'Usuario activado');
      setToggleOpen(false);
      router.refresh();
    },
    onError: (err) => toast.error(apiError(err, 'Error al cambiar estado')),
  });

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={isSelf}>
            Acciones
            <ChevronDown className="h-3.5 w-3.5" strokeWidth={2} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Cambiar rol</DropdownMenuLabel>
          {(['admin', 'recepcion', 'bioquimico'] as UserRole[]).map((r) => (
            <DropdownMenuItem
              key={r}
              onSelect={(e) => {
                e.preventDefault();
                if (r === user.role) return;
                roleMut.mutate(r);
              }}
              disabled={roleMut.isPending || r === user.role}
            >
              <ShieldCheck className="h-4 w-4" strokeWidth={2} />
              {ROLE_LABEL[r]}
              {r === user.role && (
                <span className="ml-auto text-[var(--color-fg-subtle)] text-xs">actual</span>
              )}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              setToggleOpen(true);
            }}
            disabled={activeMut.isPending}
          >
            {user.active ? (
              <>
                <UserX className="h-4 w-4" strokeWidth={2} />
                Desactivar usuario
              </>
            ) : (
              <>
                <UserCheck className="h-4 w-4" strokeWidth={2} />
                Reactivar usuario
              </>
            )}
            {activeMut.isPending && <Loader2 className="ml-auto h-3.5 w-3.5 animate-spin" />}
          </DropdownMenuItem>
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
            Eliminar usuario
            {deleteMut.isPending && <Loader2 className="ml-auto h-3.5 w-3.5 animate-spin" />}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={toggleOpen}
        onOpenChange={setToggleOpen}
        title={user.active ? '¿Desactivar usuario?' : '¿Reactivar usuario?'}
        description={
          user.active
            ? `${user.email} dejará de poder acceder al sistema. Podés reactivarlo después.`
            : `${user.email} volverá a tener acceso al sistema.`
        }
        tone={user.active ? 'warning' : 'info'}
        confirmLabel={user.active ? 'Desactivar' : 'Reactivar'}
        loading={activeMut.isPending}
        onConfirm={async () => {
          await activeMut.mutateAsync();
        }}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="¿Eliminar usuario?"
        description={`Esta acción es permanente e irreversible. ${user.email} será eliminado de Supabase y no podrá volver a acceder.`}
        tone="danger"
        confirmLabel="Eliminar permanentemente"
        loading={deleteMut.isPending}
        onConfirm={async () => {
          await deleteMut.mutateAsync();
        }}
      />
    </>
  );
}
