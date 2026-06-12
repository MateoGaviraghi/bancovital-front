'use client';

import { PracticeFormDialog } from '@/components/domain/practice-form-dialog';
import { Button } from '@/components/ui/button';
import type { Practice } from '@/lib/api/types';
import { Plus } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

export function NuevaPracticaButton() {
  const router = useRouter();
  const { slug } = useParams<{ slug: string }>();
  const [open, setOpen] = useState(false);

  function handleSuccess(practice: Practice) {
    router.push(`/${slug}/practicas/${practice.id}`);
    router.refresh();
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" strokeWidth={2} />
        Nueva práctica
      </Button>
      <PracticeFormDialog
        open={open}
        onOpenChange={setOpen}
        mode={{ type: 'create' }}
        onSuccess={handleSuccess}
      />
    </>
  );
}
