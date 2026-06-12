'use client';

import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api/client';
import { queries } from '@/lib/api/queries';
import type { Practice, PracticeWithChildren } from '@/lib/api/types';
import { cn } from '@/lib/cn';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { GitBranch, Loader2, Search, Unlink, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

function apiError(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const msg = err.response?.data?.message;
    if (Array.isArray(msg)) return msg.join('. ');
    if (typeof msg === 'string') return msg;
  }
  return fallback;
}

type Child = { id: number; nbuCode: string; name: string };

// ─── Parent indicator (shown when this practice is a child) ────────────────

function ParentIndicator({ practice }: { practice: Practice }) {
  const qc = useQueryClient();

  const parentQuery = useQuery({
    queryKey: queries.practices.detail(practice.parentId!),
    queryFn: async () => {
      const { data } = await apiClient.get<Practice>(`/practices/${practice.parentId}`);
      return data;
    },
  });

  const removeMutation = useMutation({
    mutationFn: async () => {
      await apiClient.patch(`/practices/${practice.id}`, { parentId: null });
    },
    onSuccess: () => {
      toast.success('Quitado del padre');
      qc.invalidateQueries({ queryKey: queries.practices.detail(practice.id) });
      if (practice.parentId) {
        qc.invalidateQueries({ queryKey: queries.practices.detail(practice.parentId) });
      }
    },
    onError: (err) => toast.error(apiError(err, 'No se pudo quitar el padre')),
  });

  const parent = parentQuery.data;

  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-4 py-3">
      <div className="flex items-center gap-3 min-w-0">
        <GitBranch className="h-4 w-4 shrink-0 text-[var(--color-info)]" strokeWidth={2} />
        <div className="min-w-0">
          <p className="text-[var(--color-fg-muted)] text-xs">Es subpráctica de</p>
          {parentQuery.isLoading ? (
            <p className="text-[var(--color-fg)] text-sm">Cargando…</p>
          ) : parent ? (
            <p className="truncate font-medium text-[var(--color-fg)] text-sm">
              {parent.name}
              <span className="ml-2 font-mono font-normal text-[var(--color-fg-muted)] text-xs">
                {parent.nbuCode}
              </span>
            </p>
          ) : (
            <p className="text-[var(--color-fg)] text-sm">#{practice.parentId}</p>
          )}
        </div>
      </div>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={() => removeMutation.mutate()}
        disabled={removeMutation.isPending}
        title="Quitar del padre"
      >
        {removeMutation.isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
        ) : (
          <Unlink className="h-3.5 w-3.5" strokeWidth={2} />
        )}
        <span className="hidden sm:inline">Quitar</span>
      </Button>
    </div>
  );
}

// ─── Children manager (shown when this practice is a root) ────────────────

function ChildrenManager({ practice }: { practice: Practice }) {
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch this practice from search to get its children list
  const childrenQuery = useQuery({
    queryKey: ['practices', 'own-children', practice.id, practice.nbuCode],
    queryFn: async () => {
      const { data } = await apiClient.get<PracticeWithChildren[]>('/practices', {
        params: { q: practice.nbuCode, limit: 5 },
      });
      const match = data.find((p) => p.id === practice.id);
      return match?.children ?? [];
    },
    staleTime: 30_000,
  });

  const searchQuery = useQuery({
    queryKey: ['practices', 'search', q],
    queryFn: async () => {
      const { data } = await apiClient.get<PracticeWithChildren[]>('/practices', {
        params: { q, limit: 20 },
      });
      // Exclude self and already-added children
      const childIds = new Set((childrenQuery.data ?? []).map((c) => c.id));
      return data.filter((p) => p.id !== practice.id && !childIds.has(p.id));
    },
    enabled: searchOpen,
    staleTime: 30_000,
  });

  function invalidateChildren() {
    qc.invalidateQueries({
      queryKey: ['practices', 'own-children', practice.id, practice.nbuCode],
    });
  }

  const addMutation = useMutation({
    mutationFn: async (childId: number) => {
      await apiClient.patch(`/practices/${childId}`, { parentId: practice.id });
    },
    onSuccess: () => {
      toast.success('Subpráctica agregada');
      setQ('');
      setSearchOpen(false);
      invalidateChildren();
    },
    onError: (err) => toast.error(apiError(err, 'No se pudo agregar la subpráctica')),
  });

  const removeMutation = useMutation({
    mutationFn: async (childId: number) => {
      await apiClient.patch(`/practices/${childId}`, { parentId: null });
    },
    onSuccess: () => {
      toast.success('Subpráctica quitada');
      invalidateChildren();
    },
    onError: (err) => toast.error(apiError(err, 'No se pudo quitar la subpráctica')),
  });

  const children: Child[] = childrenQuery.data ?? [];
  const searchResults = searchQuery.data ?? [];
  const isPending = addMutation.isPending || removeMutation.isPending;

  return (
    <div className="space-y-2">
      {childrenQuery.isLoading ? (
        <div className="flex items-center gap-2 py-2 text-[var(--color-fg-muted)] text-sm">
          <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
          Cargando subprácticas…
        </div>
      ) : children.length === 0 ? (
        <p className="rounded-md border border-[var(--color-border)] border-dashed px-3 py-3 text-[var(--color-fg-subtle)] text-sm">
          Sin subprácticas. Usá el buscador de abajo para agregar la primera.
        </p>
      ) : (
        <ul className="divide-y divide-[var(--color-border)] rounded-md border border-[var(--color-border)]">
          {children.map((child) => (
            <li key={child.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
              <div className="flex min-w-0 items-center gap-2">
                <span className="text-[var(--color-fg-subtle)]">↳</span>
                <span className="truncate text-[var(--color-fg)] text-sm">{child.name}</span>
                <span className="shrink-0 font-mono text-[var(--color-fg-muted)] text-xs">
                  {child.nbuCode}
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeMutation.mutate(child.id)}
                disabled={isPending}
                title={`Quitar "${child.name}" de este padre`}
                className="shrink-0 rounded p-1 text-[var(--color-fg-subtle)] transition-colors hover:bg-[var(--color-danger-soft)] hover:text-[var(--color-danger)] disabled:opacity-40"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2.5} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Inline search-to-add */}
      <div ref={dropdownRef} className="relative">
        <div
          className={cn(
            'flex items-center gap-2 rounded-md border px-3 py-2 transition-colors',
            searchOpen
              ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary-soft)]'
              : 'border-[var(--color-border)] hover:border-[var(--color-border-strong)]',
          )}
        >
          <Search className="h-3.5 w-3.5 shrink-0 text-[var(--color-fg-subtle)]" strokeWidth={2} />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => setSearchOpen(true)}
            onBlur={(e) => {
              // Keep open if clicking inside dropdown
              if (!dropdownRef.current?.contains(e.relatedTarget as Node)) {
                setTimeout(() => setSearchOpen(false), 150);
              }
            }}
            placeholder="Buscar práctica para agregar como subpráctica…"
            className="min-w-0 flex-1 bg-transparent text-[var(--color-fg)] text-sm outline-none placeholder:text-[var(--color-fg-subtle)]"
            disabled={isPending}
          />
          {q && (
            <button
              type="button"
              onClick={() => {
                setQ('');
                inputRef.current?.focus();
              }}
              className="shrink-0 text-[var(--color-fg-subtle)] hover:text-[var(--color-fg)]"
            >
              <X className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
          )}
        </div>

        {searchOpen && (
          <div className="absolute top-full z-20 mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] shadow-[var(--shadow-md)]">
            {searchQuery.isFetching && searchResults.length === 0 ? (
              <p className="flex items-center gap-2 px-3 py-2.5 text-[var(--color-fg-muted)] text-xs">
                <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
                Buscando…
              </p>
            ) : searchResults.length === 0 ? (
              <p className="px-3 py-2.5 text-[var(--color-fg-subtle)] text-xs">
                {q ? 'Sin resultados.' : 'Escribí para buscar prácticas.'}
              </p>
            ) : (
              <ul className="max-h-48 overflow-auto py-1">
                {searchResults.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()} // prevent blur
                      onClick={() => addMutation.mutate(p.id)}
                      disabled={addMutation.isPending}
                      className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left transition-colors hover:bg-[var(--color-bg-subtle)] disabled:opacity-60"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-[var(--color-fg)] text-sm">
                          {p.name}
                        </span>
                        <span className="font-mono text-[var(--color-fg-muted)] text-xs">
                          {p.nbuCode}
                          {p.section && ` · ${p.section}`}
                        </span>
                      </span>
                      {addMutation.isPending && addMutation.variables === p.id ? (
                        <Loader2
                          className="h-3.5 w-3.5 shrink-0 animate-spin text-[var(--color-fg-subtle)]"
                          strokeWidth={2}
                        />
                      ) : (
                        <span className="shrink-0 text-[var(--color-primary)] text-xs font-medium">
                          Agregar
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Public export ────────────────────────────────────────────────────────

export function PracticeHierarchySection({ practice }: { practice: Practice }) {
  const isChild = practice.parentId !== null;

  return (
    <section className="space-y-3">
      <div>
        <h3 className="font-semibold text-[var(--color-fg)] text-sm">
          {isChild ? 'Jerarquía' : 'Subprácticas'}
        </h3>
        <p className="text-[var(--color-fg-muted)] text-xs">
          {isChild
            ? 'Esta práctica se incluye automáticamente al agregar su padre a una orden.'
            : 'Al agregar esta práctica a una orden se incluyen también todas sus subprácticas.'}
        </p>
      </div>

      {isChild ? <ParentIndicator practice={practice} /> : <ChildrenManager practice={practice} />}
    </section>
  );
}
