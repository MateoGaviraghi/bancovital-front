'use client';

import { Button } from '@/components/ui/button';
import type { PdfLayoutCampo } from '@/lib/api/types';
import { cn } from '@/lib/cn';
import { GripVertical, Trash2 } from 'lucide-react';

type FieldDef = { key: string; label: string };

type CampoProp =
  | 'fontSize'
  | 'color'
  | 'prefix'
  | 'bold'
  | 'headerBg'
  | 'headerColor'
  | 'borderColor'
  | 'rowColor';

type UpdateProp = (key: string, prop: CampoProp, value: number | string | boolean) => void;

function ColorPicker({
  id,
  label,
  value,
  onChange,
}: { id: string; label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-xs text-[var(--color-fg-muted)]">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-6 w-6 cursor-pointer rounded border border-[var(--color-border-strong)]"
        />
        <span className="text-[10px] text-[var(--color-fg-muted)]">{value}</span>
      </div>
    </div>
  );
}

export function PdfFieldList({
  availableFields,
  placedFields,
  selectedField,
  onSelectField,
}: {
  availableFields: readonly FieldDef[];
  placedFields: Record<string, PdfLayoutCampo>;
  selectedField: string | null;
  onSelectField: (key: string | null) => void;
}) {
  const placed = new Set(Object.keys(placedFields));
  const unplaced = availableFields.filter((f) => !placed.has(f.key));

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-3 shadow-[var(--shadow-xs)]">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-fg-muted)]">
          Campos disponibles
        </h3>
        {unplaced.length === 0 ? (
          <p className="mt-2 text-xs text-[var(--color-fg-subtle)]">
            Todos los campos están colocados.
          </p>
        ) : (
          <div className="mt-2 space-y-0.5">
            {unplaced.map((f) => (
              <div
                key={f.key}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', f.key);
                  e.dataTransfer.effectAllowed = 'copy';
                }}
                className="flex cursor-grab items-center gap-1.5 rounded-md px-1.5 py-1 text-xs text-[var(--color-fg)] transition-colors hover:bg-[var(--color-bg-subtle)] active:cursor-grabbing"
              >
                <GripVertical
                  className="h-3 w-3 shrink-0 text-[var(--color-fg-subtle)]"
                  strokeWidth={2}
                />
                {f.label}
              </div>
            ))}
          </div>
        )}
      </div>

      {placed.size > 0 && (
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-3 shadow-[var(--shadow-xs)]">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-fg-muted)]">
            Campos colocados
          </h3>
          <div className="mt-2 space-y-0.5">
            {Object.entries(placedFields).map(([key, campo]) => {
              const label = availableFields.find((f) => f.key === key)?.label ?? key;
              const isSelected = selectedField === key;
              return (
                <div
                  key={key}
                  className={cn(
                    'flex items-center justify-between gap-1 rounded-md px-1.5 py-1 text-xs transition-colors cursor-pointer',
                    isSelected
                      ? 'bg-[var(--color-primary-soft)] text-[var(--color-primary)]'
                      : 'text-[var(--color-fg)] hover:bg-[var(--color-bg-subtle)]',
                  )}
                  onClick={() => onSelectField(isSelected ? null : key)}
                >
                  <span className="truncate">{label}</span>
                  <span className="shrink-0 text-[10px] text-[var(--color-fg-muted)]">
                    ({campo.x}, {campo.y})
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function PdfFieldProps({
  availableFields,
  placedFields,
  selectedField,
  onRemoveField,
  onUpdateProp,
}: {
  availableFields: readonly FieldDef[];
  placedFields: Record<string, PdfLayoutCampo>;
  selectedField: string | null;
  onRemoveField: (key: string) => void;
  onUpdateProp: UpdateProp;
}) {
  const selectedCampo = selectedField ? placedFields[selectedField] : null;

  if (!selectedField || !selectedCampo) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-4 text-center">
        <p className="text-xs text-[var(--color-fg-subtle)]">
          Seleccioná un campo para ver sus propiedades.
        </p>
      </div>
    );
  }

  const label = availableFields.find((f) => f.key === selectedField)?.label ?? selectedField;

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-3 shadow-[var(--shadow-xs)]">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-fg-muted)]">
        {label}
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

        {!selectedField.startsWith('tabla.') ? (
          <>
            <div className="space-y-1">
              <label htmlFor="prop-prefix" className="block text-xs text-[var(--color-fg-muted)]">
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
            <div className="flex items-center gap-3">
              <div className="space-y-1 flex-1">
                <label
                  htmlFor="prop-fontsize"
                  className="block text-xs text-[var(--color-fg-muted)]"
                >
                  Tamaño
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
                  className="w-16 rounded-md border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] px-2 py-1 text-right text-sm text-[var(--color-fg)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
                />
              </div>
              <div className="space-y-1">
                <span className="block text-xs text-[var(--color-fg-muted)]">Prefijo bold</span>
                <button
                  type="button"
                  onClick={() => onUpdateProp(selectedField, 'bold', !selectedCampo.bold)}
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-md border text-sm font-bold transition-colors',
                    selectedCampo.bold
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]'
                      : 'border-[var(--color-border-strong)] text-[var(--color-fg-muted)] hover:bg-[var(--color-bg-subtle)]',
                  )}
                >
                  B
                </button>
              </div>
            </div>
            <ColorPicker
              id="prop-color"
              label="Color"
              value={selectedCampo.color ?? '#000000'}
              onChange={(v) => onUpdateProp(selectedField, 'color', v)}
            />
          </>
        ) : (
          <>
            <ColorPicker
              id="prop-header-bg"
              label="Fondo encabezado"
              value={selectedCampo.headerBg ?? '#f5f0e8'}
              onChange={(v) => onUpdateProp(selectedField, 'headerBg', v)}
            />
            <ColorPicker
              id="prop-header-color"
              label="Texto encabezado"
              value={selectedCampo.headerColor ?? '#5a4a2f'}
              onChange={(v) => onUpdateProp(selectedField, 'headerColor', v)}
            />
            <ColorPicker
              id="prop-border-color"
              label="Bordes"
              value={selectedCampo.borderColor ?? '#d4c9b0'}
              onChange={(v) => onUpdateProp(selectedField, 'borderColor', v)}
            />
            <ColorPicker
              id="prop-row-color"
              label="Texto filas"
              value={selectedCampo.rowColor ?? '#000000'}
              onChange={(v) => onUpdateProp(selectedField, 'rowColor', v)}
            />
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
  );
}
