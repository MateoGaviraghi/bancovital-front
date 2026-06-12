'use client';

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2 } from 'lucide-react';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Regeneración en curso: bloquea el cierre y deshabilita acciones. */
  loading: boolean;
  onUseOld: () => void;
  onUpdate: () => void;
};

export function StalePdfDialog({ open, onOpenChange, loading, onUseOld, onUpdate }: Props) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(o) => {
        if (loading) return;
        onOpenChange(o);
      }}
    >
      <AlertDialogContent>
        <div className="flex gap-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-warning-soft)] text-[var(--color-warning)]">
            <AlertTriangle className="h-4 w-4" strokeWidth={2} />
          </div>
          <AlertDialogHeader className="flex-1">
            <AlertDialogTitle>Informe desactualizado</AlertDialogTitle>
            <AlertDialogDescription>
              Este informe se generó con datos del laboratorio anteriores a los actuales. ¿Querés
              imprimirlo con los datos viejos o actualizarlo con los datos nuevos?
            </AlertDialogDescription>
          </AlertDialogHeader>
        </div>
        <AlertDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="secondary" onClick={onUseOld} disabled={loading}>
            Imprimir con datos viejos
          </Button>
          <Button onClick={onUpdate} disabled={loading} className="inline-flex items-center gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />}
            Actualizar y abrir
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
