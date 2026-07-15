'use client';

import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/api/client';
import type { PracticeWithChildren } from '@/lib/api/types';
import { cn } from '@/lib/cn';
import { useQuery } from '@tanstack/react-query';
import { Check, GitBranch, Loader2, Plus, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

type Props = {
  selected: PracticeWithChildren[];
  onChange: (next: PracticeWithChildren[]) => void;
};

export function NbuGrid({ selected, onChange }: Props) {
  const [q, setQ] = useState('');
  const [addingByCode, setAddingByCode] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);

  const { data: results = [], isFetching } = useQuery({
    queryKey: ['practices', 'search', q],
    queryFn: async () => {
      const { data } = await apiClient.get<PracticeWithChildren[]>('/practices', {
        params: { q, limit: 80 },
      });
      return data;
    },
    staleTime: 60_000,
  });

  useEffect(() => {
    itemRefs.current[highlightIndex]?.scrollIntoView({ block: 'nearest' });
  }, [highlightIndex]);

  const selectedIds = new Set(selected.map((p) => p.id));

  function toggle(p: PracticeWithChildren) {
    if (selectedIds.has(p.id)) {
      onChange(selected.filter((s) => s.id !== p.id));
    } else {
      onChange([...selected, p]);
    }
  }

  function remove(id: number) {
    onChange(selected.filter((s) => s.id !== id));
  }

  function selectAndClear(p: PracticeWithChildren) {
    if (!selectedIds.has(p.id)) {
      onChange([...selected, p]);
    }
    setQ('');
    setHighlightIndex(0);
  }

  async function addByExactCode(code: string) {
    setAddingByCode(true);
    try {
      const { data } = await apiClient.get<PracticeWithChildren[]>('/practices', {
        params: { q: code, limit: 80 },
      });
      const match = data.find((p) => p.nbuCode.toLowerCase() === code.toLowerCase());
      if (!match) {
        toast.error(`No se encontró ninguna práctica con el código "${code}".`);
        return;
      }
      selectAndClear(match);
    } finally {
      setAddingByCode(false);
    }
  }

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      if (results.length === 0) return;
      e.preventDefault();
      setHighlightIndex((i) => Math.min(i + 1, results.length - 1));
      return;
    }
    if (e.key === 'ArrowUp') {
      if (results.length === 0) return;
      e.preventDefault();
      setHighlightIndex((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      const highlighted = results[highlightIndex];
      if (highlighted) {
        selectAndClear(highlighted);
        return;
      }
      const code = q.trim();
      if (code) void addByExactCode(code);
    }
  }

  return (
    <div className="space-y-3">
      {selected.length > 0 && (
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-medium text-[var(--color-fg)] text-xs">
              {selected.length} práctica{selected.length === 1 ? '' : 's'} seleccionada
              {selected.length === 1 ? '' : 's'}
            </p>
            <button
              type="button"
              onClick={() => onChange([])}
              className="text-[var(--color-fg-muted)] text-xs hover:text-[var(--color-fg)] hover:underline"
            >
              Limpiar
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {selected.map((p) => (
              <span
                key={p.id}
                className="inline-flex items-center gap-1.5 rounded-md border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] py-0.5 pr-1 pl-2.5 text-xs text-[var(--color-fg)]"
              >
                <span className="font-mono text-[10px] text-[var(--color-fg-muted)]">
                  {p.nbuCode}
                </span>
                <span>{p.shortName ?? p.name}</span>
                {p.children && p.children.length > 0 && (
                  <span
                    title={`Incluye: ${p.children.map((c) => c.name).join(', ')}`}
                    className="inline-flex items-center gap-0.5 rounded-sm bg-[var(--color-info-soft)] px-1 text-[9px] text-[var(--color-info)]"
                  >
                    <GitBranch className="h-2.5 w-2.5" strokeWidth={2} />
                    {p.children.length}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => remove(p.id)}
                  className="rounded p-0.5 text-[var(--color-fg-subtle)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-danger)]"
                  aria-label={`Quitar ${p.name}`}
                >
                  <X className="h-3 w-3" strokeWidth={2.5} />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)]">
        <div className="border-[var(--color-border)] border-b p-3">
          <div className="relative">
            <Input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setHighlightIndex(0);
              }}
              onKeyDown={handleSearchKeyDown}
              disabled={addingByCode}
              placeholder="Buscar por NBU o nombre… (↑↓ para navegar, Enter para agregar)"
            />
            {addingByCode && (
              <Loader2
                className="-translate-y-1/2 absolute top-1/2 right-3 h-3.5 w-3.5 animate-spin text-[var(--color-fg-muted)]"
                strokeWidth={2}
              />
            )}
          </div>
        </div>

        <div className="max-h-72 overflow-auto">
          {isFetching && results.length === 0 ? (
            <p className="flex items-center gap-2 px-4 py-3 text-[var(--color-fg-muted)] text-xs">
              <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
              Buscando…
            </p>
          ) : results.length === 0 ? (
            <p className="px-4 py-3 text-[var(--color-fg-subtle)] text-xs">
              {q ? `Sin resultados para "${q}".` : 'Sin prácticas en el catálogo.'}
            </p>
          ) : (
            <ul className="divide-y divide-[var(--color-border)]">
              {results.map((p, index) => {
                const isSel = selectedIds.has(p.id);
                const isHighlighted = index === highlightIndex;
                const hasChildren = p.children && p.children.length > 0;
                return (
                  <li
                    key={p.id}
                    ref={(el) => {
                      itemRefs.current[index] = el;
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => toggle(p)}
                      onMouseEnter={() => setHighlightIndex(index)}
                      className={cn(
                        'flex w-full cursor-pointer items-start gap-3 px-4 py-2.5 text-left outline-none transition-colors hover:bg-[var(--color-bg-subtle)] focus-visible:bg-[var(--color-bg-subtle)]',
                        isSel && 'bg-[var(--color-primary-soft)]/40',
                        isHighlighted && 'ring-1 ring-[var(--color-primary)] ring-inset',
                      )}
                      aria-pressed={isSel}
                    >
                      <span
                        aria-hidden
                        className={cn(
                          'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border transition-colors',
                          isSel
                            ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
                            : 'border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)]',
                        )}
                      >
                        {isSel && <Check className="h-3 w-3" strokeWidth={3} />}
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="flex items-center justify-between gap-3">
                          <span className="min-w-0">
                            <span className="block truncate text-[var(--color-fg)] text-sm">
                              {p.name}
                            </span>
                            <span className="flex gap-2 text-[var(--color-fg-muted)] text-xs">
                              <span className="font-mono">{p.nbuCode}</span>
                              {p.section && <span>· {p.section}</span>}
                            </span>
                          </span>
                          <span className="flex shrink-0 items-center gap-2">
                            <span className="tabular font-mono text-[var(--color-fg-muted)] text-xs">
                              UB {p.units}
                            </span>
                            {!isSel && (
                              <Plus
                                className="h-3.5 w-3.5 text-[var(--color-fg-subtle)]"
                                strokeWidth={2}
                              />
                            )}
                          </span>
                        </span>
                        {hasChildren && (
                          <span className="flex items-center gap-1 text-[var(--color-info)] text-[11px]">
                            <GitBranch className="h-3 w-3 shrink-0" strokeWidth={2} />
                            Se agregarán automáticamente: {p.children.map((c) => c.name).join(', ')}
                          </span>
                        )}
                        {!p.isElaborated && (
                          <span className="text-[var(--color-warning)] text-[11px]">
                            ↗ Se deriva a otro laboratorio
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
