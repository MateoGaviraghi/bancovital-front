'use client';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/cn';
import { ChevronDown, Loader2, Plus, X } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';

type Props<T> = {
  value: T | null;
  onChange: (next: T | null) => void;
  placeholder: string;
  searchPlaceholder?: string;
  searchFn: (q: string) => Promise<T[]>;
  getKey: (item: T) => string | number;
  getLabel: (item: T) => string;
  getSubtitle?: (item: T) => string | null;
  minChars?: number;
  disabled?: boolean;
  id?: string;
  invalid?: boolean;
  /**
   * Si se pasa, habilita la opcion "Crear <query>" en el dropdown cuando el query
   * tiene al menos minChars caracteres y NO hay match case-insensitive exacto en
   * los items actuales. El item devuelto se selecciona automaticamente.
   */
  onCreateNew?: (query: string) => Promise<T>;
  /** Label custom para el boton de crear. Default: `Crear "<query>"`. */
  createLabel?: (query: string) => string;
};

export function Combobox<T>({
  value,
  onChange,
  placeholder,
  searchPlaceholder = 'Buscar…',
  searchFn,
  getKey,
  getLabel,
  getSubtitle,
  minChars = 2,
  disabled,
  id,
  invalid,
  onCreateNew,
  createLabel,
}: Props<T>) {
  const autoId = useId();
  const triggerId = id ?? autoId;
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const latestQueryRef = useRef<string>('');
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const trimmedQ = q.trim();
  const hasExactMatch = items.some(
    (it) => getLabel(it).trim().toLowerCase() === trimmedQ.toLowerCase(),
  );
  const showCreate = !!onCreateNew && !loading && trimmedQ.length >= minChars && !hasExactMatch;

  useEffect(() => {
    if (!open) return;
    if (q.length < minChars) {
      setItems([]);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      latestQueryRef.current = q;
      try {
        const rows = await searchFn(q);
        // Descarta respuestas obsoletas: si el usuario siguió tipeando, "q" ya
        // no es la query vigente y no debemos pisar los resultados más recientes.
        if (latestQueryRef.current !== q) return;
        setItems(rows);
      } catch {
        if (latestQueryRef.current !== q) return;
        setItems([]);
      } finally {
        if (latestQueryRef.current === q) setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q, open, minChars, searchFn]);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
  }, [open]);

  function pick(item: T) {
    onChange(item);
    setOpen(false);
    setQ('');
  }

  async function handleCreate() {
    if (!onCreateNew || creating) return;
    setCreating(true);
    try {
      const created = await onCreateNew(trimmedQ);
      pick(created);
    } catch {
      // El consumer (onCreateNew) decide si mostrar toast; aca solo cancelamos.
    } finally {
      setCreating(false);
    }
  }

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        <button
          id={triggerId}
          type="button"
          onClick={() => !disabled && setOpen((o) => !o)}
          disabled={disabled}
          className={cn(
            'flex h-9 w-full items-center justify-between gap-2 rounded-md border bg-[var(--color-bg-elevated)] px-3 py-1 pr-9 text-left text-sm shadow-[var(--shadow-xs)] outline-none transition-colors focus-visible:border-[var(--color-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary-soft)] disabled:cursor-not-allowed disabled:opacity-50',
            value && !disabled && 'pr-14',
            invalid ? 'border-[var(--color-danger)]' : 'border-[var(--color-border-strong)]',
          )}
        >
          <span
            className={cn(
              'truncate',
              value ? 'text-[var(--color-fg)]' : 'text-[var(--color-fg-subtle)]',
            )}
          >
            {value ? getLabel(value) : placeholder}
          </span>
          <ChevronDown
            className="-translate-y-1/2 absolute top-1/2 right-3 h-4 w-4 opacity-60"
            strokeWidth={2}
          />
        </button>
        {value && !disabled && (
          <button
            type="button"
            tabIndex={-1}
            aria-label="Quitar selección"
            onClick={(e) => {
              e.stopPropagation();
              onChange(null);
            }}
            className="-translate-y-1/2 absolute top-1/2 right-8 rounded p-0.5 text-[var(--color-fg-subtle)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
          >
            <X className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border border-[var(--color-border)] bg-[var(--color-bg-elevated)] shadow-[var(--shadow-md)]">
          <div className="border-[var(--color-border)] border-b p-2">
            <Input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-8 text-sm"
            />
          </div>
          <div className="max-h-72 overflow-auto p-1">
            {q.length < minChars ? (
              <p className="px-3 py-2 text-xs text-[var(--color-fg-subtle)]">
                Escribí al menos {minChars} caracteres para buscar.
              </p>
            ) : loading ? (
              <p className="flex items-center gap-2 px-3 py-2 text-xs text-[var(--color-fg-muted)]">
                <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
                Buscando…
              </p>
            ) : (
              <>
                {items.length === 0 && !showCreate && (
                  <p className="px-3 py-2 text-xs text-[var(--color-fg-subtle)]">Sin resultados.</p>
                )}
                {items.map((item) => {
                  const subtitle = getSubtitle?.(item) ?? null;
                  return (
                    <button
                      key={getKey(item)}
                      type="button"
                      onClick={() => pick(item)}
                      className="flex w-full flex-col gap-0.5 rounded-sm px-3 py-2 text-left text-sm outline-none transition-colors hover:bg-[var(--color-bg-subtle)] focus-visible:bg-[var(--color-bg-subtle)]"
                    >
                      <span className="text-[var(--color-fg)]">{getLabel(item)}</span>
                      {subtitle && (
                        <span className="font-mono text-[var(--color-fg-muted)] text-xs">
                          {subtitle}
                        </span>
                      )}
                    </button>
                  );
                })}
                {showCreate && (
                  <button
                    type="button"
                    onClick={handleCreate}
                    disabled={creating}
                    className="flex w-full items-center gap-2 rounded-sm border-[var(--color-border)] border-t px-3 py-2 text-left text-sm outline-none transition-colors hover:bg-[var(--color-bg-subtle)] focus-visible:bg-[var(--color-bg-subtle)] disabled:opacity-60"
                  >
                    {creating ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
                    ) : (
                      <Plus className="h-3.5 w-3.5" strokeWidth={2} />
                    )}
                    <span className="text-[var(--color-fg)]">
                      {createLabel ? createLabel(trimmedQ) : `Crear "${trimmedQ}"`}
                    </span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
