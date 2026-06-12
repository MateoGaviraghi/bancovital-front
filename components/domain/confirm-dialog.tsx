'use client';

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
import { cn } from '@/lib/cn';
import { AlertTriangle, Info, Loader2, ShieldAlert } from 'lucide-react';

export type ConfirmTone = 'info' | 'warning' | 'danger';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
};

const TONE_ICON = {
  info: Info,
  warning: AlertTriangle,
  danger: ShieldAlert,
} as const;

const TONE_ICON_BG: Record<ConfirmTone, string> = {
  info: 'bg-[var(--color-info-soft)] text-[var(--color-info)]',
  warning: 'bg-[var(--color-warning-soft)] text-[var(--color-warning)]',
  danger: 'bg-[var(--color-danger-soft)] text-[var(--color-danger)]',
};

const TONE_ACTION: Record<ConfirmTone, string> = {
  info: '',
  warning:
    'bg-[var(--color-warning)] text-white hover:opacity-90 focus-visible:ring-[var(--color-warning)]',
  danger:
    'bg-[var(--color-danger)] text-[var(--color-danger-foreground)] hover:opacity-90 focus-visible:ring-[var(--color-danger)]',
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  tone = 'info',
  loading = false,
  onConfirm,
}: Props) {
  const Icon = TONE_ICON[tone];

  async function handleConfirm(e: React.MouseEvent) {
    e.preventDefault();
    await onConfirm();
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <div className="flex gap-4">
          <div
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
              TONE_ICON_BG[tone],
            )}
          >
            <Icon className="h-4 w-4" strokeWidth={2} />
          </div>
          <AlertDialogHeader className="flex-1">
            <AlertDialogTitle>{title}</AlertDialogTitle>
            {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
          </AlertDialogHeader>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={loading}
            className={cn('inline-flex items-center gap-2', TONE_ACTION[tone])}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
