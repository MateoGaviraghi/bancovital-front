'use client';

import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api/client';
import type { Practice, PracticeWithChildren } from '@/lib/api/types';
import { cn } from '@/lib/cn';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { GitBranch, Loader2, Search, X } from 'lucide-react';
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

type PracticeRef = { id: number; nbuCode: string; name: string };

// ─── Components manager (subprácticas que esta práctica contiene) ────────────

function ComponentsManager({ practice }: { practice: Practice }) {
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const componentsKey = ['practices', 'components', practice.id];

  const componentsQuery = useQuery({
    queryKey: componentsKey,
    queryFn: async () => {
      const { data } = await apiClient.get<PracticeRef[]>(`/practices/${practice.id}/components`);
      return data;
    },
    staleTime: 30_000,
  });

  const searchQuery = useQuery({
    queryKey: ['practices', 'search', q],
    queryFn: async () => {
      const { data } = await apiClient.get<PracticeWithChildren[]>('/practices', {
        params: { q, limit: 20 },
      });
      const componentIds = new Set((componentsQuery.data ?? []).map((c) => c.id));
      return data.filter((p) => p.id !== practice.id && !componentIds.has(p.id));
    },
    enabled: searchOpen,
    staleTime: 30_000,
  });

  const addMutation = useMutation({
    mutationFn: async (componentId: number) => {
      await apiClient.post(`/practices/${practice.id}/components`, { componentId });
    },
    onSuccess: () => {
      toast.success('Subpráctica agregada');
      setQ('');
      setSearchOpen(false);
      qc.invalidateQueries({ queryKey: componentsKey });
    },
    onError: (err) => toast.error(apiError(err, 'No se pudo agregar la subpráctica')),
  });

  const removeMutation = useMutation({
    mutationFn: async (componentId: number) => {
      await apiClient.delete(`/practices/${practice.id}/components/${componentId}`);
    },
    onSuccess: () => {
      toast.success('Subpráctica quitada');
      qc.invalidateQueries({ queryKey: componentsKey });
    },
    onError: (err) => toast.error(apiError(err, 'No se pudo quitar la subpráctica')),
  });

  const components: PracticeRef[] = componentsQuery.data ?? [];
  const searchResults = searchQuery.data ?? [];
  const isPending = addMutation.isPending || removeMutation.isPending;

  return (
    <div className="space-y-3">
      <div>
        <h3 className="font-semibold text-[var(--color-fg)] text-sm">Subprácticas</h3>
        <p className="text-[var(--color-fg-muted)] text-xs">
          Al agregar esta práctica a una orden se incluyen también todas sus subprácticas.
        </p>
      </div>

      <div className="space-y-2">
        {componentsQuery.isLoading ? (
          <div className="flex items-center gap-2 py-2 text-[var(--color-fg-muted)] text-sm">
            <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
            Cargando subprácticas…
          </div>
        ) : components.length === 0 ? (
          <p className="rounded-md border border-[var(--color-border)] border-dashed px-3 py-3 text-[var(--color-fg-subtle)] text-sm">
            Sin subprácticas. Usá el buscador de abajo para agregar la primera.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--color-border)] rounded-md border border-[var(--color-border)]">
            {components.map((comp) => (
              <li key={comp.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="text-[var(--color-fg-subtle)]">↳</span>
                  <span className="truncate text-[var(--color-fg)] text-sm">{comp.name}</span>
                  <span className="shrink-0 font-mono text-[var(--color-fg-muted)] text-xs">
                    {comp.nbuCode}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeMutation.mutate(comp.id)}
                  disabled={isPending}
                  title={`Quitar "${comp.name}" de esta práctica`}
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
                onClick={() => { setQ(''); inputRef.current?.focus(); }}
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
                        onMouseDown={(e) => e.preventDefault()}
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
    </div>
  );
}

// ─── Parents list (práticas padre de las que esta práctica es componente) ─────

function ParentsList({ practice }: { practice: Practice }) {
  const parentsQuery = useQuery({
    queryKey: ['practices', 'parents', practice.id],
    queryFn: async () => {
      const { data } = await apiClient.get<PracticeRef[]>(`/practices/${practice.id}/parents`);
      return data;
    },
    staleTime: 30_000,
  });

  const parents = parentsQuery.data ?? [];

  return (
    <div className="space-y-2">
      <div>
        <h3 className="font-semibold text-[var(--color-fg)] text-sm">Pertenece a</h3>
        <p className="text-[var(--color-fg-muted)] text-xs">
          Prácticas compuestas que incluyen esta práctica automáticamente.
        </p>
      </div>

      {parentsQuery.isLoading ? (
        <div className="flex items-center gap-2 py-2 text-[var(--color-fg-muted)] text-sm">
          <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
          Cargando…
        </div>
      ) : parents.length === 0 ? (
        <p className="rounded-md border border-[var(--color-border)] border-dashed px-3 py-2.5 text-[var(--color-fg-subtle)] text-sm">
          No pertenece a ninguna práctica compuesta.
        </p>
      ) : (
        <ul className="divide-y divide-[var(--color-border)] rounded-md border border-[var(--color-border)]">
          {parents.map((parent) => (
            <li key={parent.id} className="flex items-center gap-3 px-3 py-2.5">
              <GitBranch className="h-3.5 w-3.5 shrink-0 text-[var(--color-info)]" strokeWidth={2} />
              <span className="truncate text-[var(--color-fg)] text-sm">{parent.name}</span>
              <span className="shrink-0 font-mono text-[var(--color-fg-muted)] text-xs">
                {parent.nbuCode}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Standalone toggle ────────────────────────────────────────────────────────

function StandaloneToggle({ practice }: { practice: Practice }) {
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (standalone: boolean) => {
      await apiClient.patch(`/practices/${practice.id}`, { standalone });
    },
    onSuccess: (_, standalone) => {
      toast.success(standalone ? 'Práctica visible en búsqueda' : 'Práctica oculta en búsqueda');
      qc.invalidateQueries({ queryKey: ['practices', practice.id] });
      qc.invalidateQueries({ queryKey: ['practices', 'catalog'] });
    },
    onError: (err) => toast.error(apiError(err, 'No se pudo cambiar la visibilidad')),
  });

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-4 py-3">
      <div className="min-w-0">
        <p className="text-[var(--color-fg)] text-sm font-medium">Visible en búsqueda de órdenes</p>
        <p className="text-[var(--color-fg-muted)] text-xs">
          {practice.standalone
            ? 'Aparece en el buscador al crear órdenes.'
            : 'Solo se incluye automáticamente como parte de una práctica compuesta.'}
        </p>
      </div>
      <Button
        type="button"
        size="sm"
        variant={practice.standalone ? 'outline' : 'default'}
        onClick={() => mutation.mutate(!practice.standalone)}
        disabled={mutation.isPending}
      >
        {mutation.isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
        ) : practice.standalone ? (
          'Ocultar'
        ) : (
          'Mostrar'
        )}
      </Button>
    </div>
  );
}

// ─── Public export ────────────────────────────────────────────────────────────

export function PracticeHierarchySection({ practice }: { practice: Practice }) {
  return (
    <section className="space-y-6">
      <StandaloneToggle practice={practice} />
      <ComponentsManager practice={practice} />
      <ParentsList practice={practice} />
    </section>
  );
}
