'use client';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { apiClient } from '@/lib/api/client';
import type { Practice, UpdatePracticeDto } from '@/lib/api/types';
import axios from 'axios';
import { Check, Pencil, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

type EditableField = 'notes' | 'referenceValue' | 'methodology';

type Props = {
  practiceId: number;
  field: EditableField;
  value: string | null;
  label: string;
  placeholder: string;
  rows?: number;
};

export function PracticeInlineField({
  practiceId,
  field,
  value,
  label,
  placeholder,
  rows = 3,
}: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? '');
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function startEdit() {
    setDraft(value ?? '');
    setEditing(true);
    setTimeout(() => textareaRef.current?.focus(), 0);
  }

  function cancel() {
    setEditing(false);
    setDraft(value ?? '');
  }

  async function save() {
    const trimmed = draft.trim();
    const newValue = trimmed || null;
    if (newValue === (value?.trim() || null)) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      const dto: UpdatePracticeDto = { [field]: newValue };
      await apiClient.patch<Practice>(`/practices/${practiceId}`, dto);
      toast.success('Guardado');
      setEditing(false);
      router.refresh();
    } catch (err) {
      let msg = 'No se pudo guardar';
      if (axios.isAxiosError(err)) {
        const m = err.response?.data?.message;
        msg = Array.isArray(m) ? m.join('. ') : (typeof m === 'string' ? m : msg);
      }
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Escape') cancel();
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) save();
  }

  return (
    <div className="md:col-span-2">
      <div className="flex items-start justify-between gap-3">
        <dt className="shrink-0 text-[var(--color-fg-muted)] text-sm">{label}</dt>
        {!editing && (
          <button
            type="button"
            onClick={startEdit}
            className="group flex items-start gap-2 text-right"
          >
            {value ? (
              <dd className="whitespace-pre-line text-[var(--color-fg)] text-sm leading-snug">
                {value}
              </dd>
            ) : (
              <dd className="text-[var(--color-fg-subtle)] text-sm italic">{placeholder}</dd>
            )}
            <Pencil className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-fg-subtle)] opacity-0 transition-opacity group-hover:opacity-100" strokeWidth={2} />
          </button>
        )}
      </div>

      {editing && (
        <div className="mt-2 space-y-2">
          <Textarea
            ref={textareaRef}
            rows={rows}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={saving}
            className="text-sm"
          />
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={save} disabled={saving}>
              <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
              Guardar
            </Button>
            <Button size="sm" variant="ghost" onClick={cancel} disabled={saving}>
              <X className="h-3.5 w-3.5" strokeWidth={2.5} />
              Cancelar
            </Button>
            <span className="text-[var(--color-fg-subtle)] text-xs">⌘Enter para guardar · Esc para cancelar</span>
          </div>
        </div>
      )}
    </div>
  );
}
