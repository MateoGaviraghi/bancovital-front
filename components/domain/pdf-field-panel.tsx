'use client';

import { Button } from '@/components/ui/button';
import type { PdfLayoutCampo } from '@/lib/api/types';
import { cn } from '@/lib/cn';
import { GripVertical, Trash2 } from 'lucide-react';

type FieldDef = { key: string; label: string };

export function PdfFieldPanel({
  availableFields,
  placedFields,
  selectedField,
  onSelectField,
  onRemoveField,
  onUpdateProp,
}: {
  availableFields: readonly FieldDef[];
  placedFields: Record<string, PdfLayoutCampo>;
  selectedField: string | null;
  onSelectField: (key: string | null) => void;
  onRemoveField: (key: string) => void;
  onUpdateProp: (
    key: string,
    prop: 'fontSize' | 'color' | 'prefix',
    value: number | string,
  ) => void;
}) {
  const placed = new Set(Object.keys(placedFields));
  const unplaced = availableFields.filter((f) => !placed.has(f.key));
  const selectedCampo = selectedField ? placedFields[selectedField] : null;

  return (
    <div className="space-y-4">
      {/* Available fields */}
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-4 shadow-[var(--shadow-xs)]">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-fg-muted)]">
          Campos disponibles
        </h3>
        {unplaced.length === 0 ? (
          <p className="mt-2 text-xs text-[var(--color-fg-subtle)]">
            Todos los campos están colocados.
          </p>
        ) : (
          <div className="mt-2 space-y-1">
            {unplaced.map((f) => (
              <div
                key={f.key}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', f.key);
                  e.dataTransfer.effectAllowed = 'copy';
                }}
                className="flex cursor-grab items-center gap-2 rounded-md px-2 py-1.5 text-sm text-[var(--color-fg)] transition-colors hover:bg-[var(--color-bg-subtle)] active:cursor-grabbing"
              >
                <GripVertical
                  className="h-3.5 w-3.5 shrink-0 text-[var(--color-fg-subtle)]"
                  strokeWidth={2}
                />
                {f.label}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Placed fields */}
      {placed.size > 0 && (
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-4 shadow-[var(--shadow-xs)]">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-fg-muted)]">
            Campos colocados
          </h3>
          <div className="mt-2 space-y-1">
            {Object.entries(placedFields).map(([key, campo]) => {
              const label = availableFields.find((f) => f.key === key)?.label ?? key;
              const isSelected = selectedField === key;
              return (
                <div
                  key={key}
                  className={cn(
                    'flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm transition-colors cursor-pointer',
                    isSelected
                      ? 'bg-[var(--color-primary-soft)] text-[var(--color-primary)]'
                      : 'text-[var(--color-fg)] hover:bg-[var(--color-bg-subtle)]',
                  )}
                  onClick={() => onSelectField(isSelected ? null : key)}
                >
                  <span className="truncate">{label}</span>
                  <span className="shrink-0 text-xs text-[var(--color-fg-muted)]">
                    ({campo.x}, {campo.y})
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Properties of selected */}
      {selectedField && selectedCampo && (
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-4 shadow-[var(--shadow-xs)]">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-fg-muted)]">
            Propiedades
          </h3>
          <div className="mt-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <span className="block text-xs text-[var(--color-fg-muted)]">X (pt)</span>
                <span className="block text-sm text-[var(--color-fg)]">{selectedCampo.x}</span>
              </div>
              <div className="space-y-1">
                <span className="block text-xs text-[var(--color-fg-muted)]">Y (pt)</span>
                <span className="block text-sm text-[var(--color-fg)]">{selectedCampo.y}</span>
              </div>
            </div>

            {!selectedField.startsWith('tabla.') && (
              <>
                <div className="space-y-1">
                  <label
                    htmlFor="prop-prefix"
                    className="block text-xs text-[var(--color-fg-muted)]"
                  >
                    Prefijo
                  </label>
                  <input
                    id="prop-prefix"
                    type="text"
                    value={selectedCampo.prefix ?? ''}
                    onChange={(e) => onUpdateProp(selectedField, 'prefix', e.target.value)}
                    placeholder="Ej: Nombre: "
                    maxLength={50}
                    className="w-full rounded-md border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] px-2 py-1 text-sm text-[var(--color-fg)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
                  />
                </div>
                <div className="space-y-1">
                  <label
                    htmlFor="prop-fontsize"
                    className="block text-xs text-[var(--color-fg-muted)]"
                  >
                    Tamaño de fuente
                  </label>
                  <input
                    id="prop-fontsize"
                    type="number"
                    min={4}
                    max={72}
                    value={selectedCampo.fontSize ?? 10}
                    onChange={(e) => {
                      const v = Number.parseInt(e.target.value, 10);
                      if (!Number.isNaN(v))
                        onUpdateProp(selectedField, 'fontSize', Math.max(4, Math.min(72, v)));
                    }}
                    className="w-20 rounded-md border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] px-2 py-1 text-right text-sm text-[var(--color-fg)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
                  />
                </div>
                <div className="space-y-1">
                  <label
                    htmlFor="prop-color"
                    className="block text-xs text-[var(--color-fg-muted)]"
                  >
                    Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="prop-color"
                      type="color"
                      value={selectedCampo.color ?? '#000000'}
                      onChange={(e) => onUpdateProp(selectedField, 'color', e.target.value)}
                      className="h-7 w-7 cursor-pointer rounded border border-[var(--color-border-strong)]"
                    />
                    <span className="text-xs text-[var(--color-fg-muted)]">
                      {selectedCampo.color ?? '#000000'}
                    </span>
                  </div>
                </div>
              </>
            )}

            <Button
              variant="outline"
              size="sm"
              className="w-full text-[var(--color-danger)] hover:text-[var(--color-danger)] border-[var(--color-danger)]/30 hover:bg-[var(--color-danger)]/5"
              onClick={() => onRemoveField(selectedField)}
            >
              <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
              Quitar del canvas
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
