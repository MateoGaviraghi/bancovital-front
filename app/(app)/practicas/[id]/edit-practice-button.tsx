'use client';

import { PracticeFormDialog } from '@/components/domain/practice-form-dialog';
import { Button } from '@/components/ui/button';
import type { Practice } from '@/lib/api/types';
import { Pencil } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function EditPracticeButton({ practice }: { practice: Practice }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Pencil className="h-3.5 w-3.5" strokeWidth={2} />
        Editar
      </Button>
      <PracticeFormDialog
        open={open}
        onOpenChange={setOpen}
        mode={{ type: 'edit', practice }}
        onSuccess={() => router.refresh()}
      />
    </>
  );
}
