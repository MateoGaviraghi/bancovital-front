import { InviteUserDialog } from '@/components/domain/invite-user-dialog';
import { UserRowActions } from '@/components/domain/user-row-actions';
import { EmptyState } from '@/components/layout/empty-state';
import { PageHeader } from '@/components/layout/page-header';
import { getServerApi } from '@/lib/api/server';
import type { AdminUser, UserRole } from '@/lib/api/types';
import { getSessionUser } from '@/lib/auth/session';
import { cn } from '@/lib/cn';
import { Lock, UsersRound } from 'lucide-react';

export const dynamic = 'force-dynamic';

const ROLE_LABEL: Record<UserRole, string> = {
  admin: 'Administrador',
  recepcion: 'Recepción',
  bioquimico: 'Bioquímico',
  super: 'Super Admin',
};

const DATE_FMT = new Intl.DateTimeFormat('es-AR', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'America/Argentina/Buenos_Aires',
});

async function fetchUsers(): Promise<AdminUser[]> {
  try {
    const api = await getServerApi();
    const { data } = await api.get<AdminUser[]>('/users');
    return data;
  } catch {
    return [];
  }
}

export default async function UsuariosPage() {
  const me = await getSessionUser();
  if (me?.role !== 'admin') {
    return (
      <div>
        <PageHeader title="Usuarios" />
        <EmptyState icon={Lock} title="Solo administradores" />
      </div>
    );
  }

  const users = await fetchUsers();

  return (
    <div>
      <PageHeader
        title="Usuarios"
        description="Invitar miembros del equipo y administrar roles."
        actions={<InviteUserDialog />}
      />

      {users.length === 0 ? (
        <EmptyState
          icon={UsersRound}
          title="Sin usuarios"
          description="Invitá al primer miembro del equipo."
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] shadow-[var(--shadow-xs)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-[var(--color-border)] border-b bg-[var(--color-bg-subtle)] text-[10px] text-[var(--color-fg-muted)] uppercase tracking-wide">
                <th className="px-5 py-2.5 text-left font-medium">Email</th>
                <th className="px-5 py-2.5 text-left font-medium">Nombre</th>
                <th className="px-5 py-2.5 text-left font-medium">Rol</th>
                <th className="px-5 py-2.5 text-left font-medium">Matrícula</th>
                <th className="px-5 py-2.5 text-left font-medium">Estado</th>
                <th className="px-5 py-2.5 text-left font-medium">Último acceso</th>
                <th className="px-5 py-2.5 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isSelf = u.id === me.id;
                return (
                  <tr
                    key={u.id}
                    className="border-[var(--color-border)] border-b last:border-b-0 hover:bg-[var(--color-bg-subtle)]"
                  >
                    <td className="px-5 py-3 text-[var(--color-fg)]">
                      {u.email}
                      {isSelf && (
                        <span className="ml-2 inline-flex items-center rounded-md border border-[var(--color-info)]/15 bg-[var(--color-info-soft)] px-1.5 py-0.5 font-medium text-[9px] text-[var(--color-info)] uppercase tracking-wide">
                          Vos
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-[var(--color-fg-muted)]">
                      {u.displayName ?? '—'}
                    </td>
                    <td className="px-5 py-3 text-[var(--color-fg)]">
                      {u.role ? ROLE_LABEL[u.role] : '—'}
                    </td>
                    <td className="px-5 py-3 text-[var(--color-fg-muted)]">{u.matricula ?? '—'}</td>
                    <td className="px-5 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-md border px-2 py-0.5 font-medium text-[10px] uppercase tracking-wide',
                          u.active
                            ? 'border-[var(--color-success)]/15 bg-[var(--color-success-soft)] text-[var(--color-success)]'
                            : 'border-[var(--color-fg-subtle)]/15 bg-[var(--color-bg-subtle)] text-[var(--color-fg-muted)]',
                        )}
                      >
                        {u.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="tabular px-5 py-3 text-[var(--color-fg-muted)] text-xs">
                      {u.lastSignInAt ? DATE_FMT.format(new Date(u.lastSignInAt)) : '—'}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <UserRowActions user={u} isSelf={isSelf} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
