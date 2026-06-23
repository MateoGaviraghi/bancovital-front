'use client';

import type { PdfLayoutCampo } from '@/lib/api/types';
import { cn } from '@/lib/cn';
import { useCallback, useEffect, useRef, useState } from 'react';

// A4 in PDF points
const A4_W = 595;
const A4_H = 842;
const A4_RATIO = A4_W / A4_H;

const TABLE_H = 300;

const DEFAULT_GRID = 10; // pt

type FieldDef = { key: string; label: string };

function isTableField(key: string) {
  return key.startsWith('tabla.');
}

function snap(value: number, grid: number): number {
  if (grid <= 0) return Math.round(value);
  return Math.round(value / grid) * grid;
}

export function PdfCanvas({
  campos,
  availableFields,
  fondoUrl,
  selectedField,
  gridSize = DEFAULT_GRID,
  onSelectField,
  onFieldDrop,
  onFieldMove,
}: {
  campos: Record<string, PdfLayoutCampo>;
  availableFields: readonly FieldDef[];
  fondoUrl: string | null;
  selectedField: string | null;
  gridSize?: number;
  onSelectField: (key: string | null) => void;
  onFieldDrop: (key: string, x: number, y: number) => void;
  onFieldMove: (key: string, x: number, y: number) => void;
}) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasW, setCanvasW] = useState(0);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setCanvasW(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const scale = canvasW / A4_W;
  const gridPx = gridSize * scale;

  // ── Drag state ──
  const DRAG_THRESHOLD = 3;
  const [pending, setPending] = useState<{
    key: string;
    startMouseX: number;
    startMouseY: number;
    startFieldX: number;
    startFieldY: number;
  } | null>(null);
  const [dragging, setDragging] = useState(false);

  const handleFieldClick = useCallback(
    (key: string, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const campo = campos[key];
      if (!campo) return;
      onSelectField(key);
      setPending({
        key,
        startMouseX: e.clientX,
        startMouseY: e.clientY,
        startFieldX: campo.x,
        startFieldY: campo.y,
      });
      setDragging(false);
    },
    [campos, onSelectField],
  );

  useEffect(() => {
    if (!pending) return;
    function handleMouseMove(e: MouseEvent) {
      if (!pending || !scale) return;
      const dx = e.clientX - pending.startMouseX;
      const dy = e.clientY - pending.startMouseY;
      if (!dragging && Math.abs(dx) + Math.abs(dy) < DRAG_THRESHOLD) return;
      setDragging(true);
      const rawX = pending.startFieldX + dx / scale;
      const rawY = pending.startFieldY + dy / scale;
      const newX = snap(Math.max(0, Math.min(A4_W, rawX)), gridSize);
      const newY = snap(Math.max(0, Math.min(A4_H, rawY)), gridSize);
      onFieldMove(pending.key, newX, newY);
    }
    function handleMouseUp() {
      setPending(null);
      setDragging(false);
    }
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [pending, dragging, scale, gridSize, onFieldMove]);

  // ── Drop from panel ──
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const key = e.dataTransfer.getData('text/plain');
      if (!key || !canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const rawX = (e.clientX - rect.left) / scale;
      const rawY = (e.clientY - rect.top) / scale;
      const x = snap(Math.max(0, Math.min(A4_W, rawX)), gridSize);
      const y = snap(Math.max(0, Math.min(A4_H, rawY)), gridSize);
      onFieldDrop(key, x, y);
      onSelectField(key);
    },
    [scale, gridSize, onFieldDrop, onSelectField],
  );

  const fieldLabel = useCallback(
    (key: string) => availableFields.find((f) => f.key === key)?.label ?? key,
    [availableFields],
  );

  return (
    <div
      ref={canvasRef}
      className={cn(
        'relative w-full overflow-hidden rounded-md border-2 bg-white shadow-[var(--shadow-sm)]',
        dragging ? 'border-[var(--color-primary)]' : 'border-[var(--color-border-strong)]',
      )}
      style={{ aspectRatio: `${A4_RATIO}` }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onSelectField(null);
      }}
    >
      {/* Fondo / membrete */}
      {fondoUrl && (
        <img
          src={fondoUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-contain pointer-events-none"
          aria-hidden="true"
        />
      )}
      {!fondoUrl && (
        <div className="absolute inset-0 bg-[var(--color-bg-subtle)]" aria-hidden="true" />
      )}

      {/* Grilla cuadriculada */}
      {canvasW > 0 && gridPx > 2 && (
        <svg className="absolute inset-0 h-full w-full pointer-events-none" aria-hidden="true">
          <defs>
            <pattern id="pdf-grid" width={gridPx} height={gridPx} patternUnits="userSpaceOnUse">
              <path
                d={`M ${gridPx} 0 L 0 0 0 ${gridPx}`}
                fill="none"
                stroke="rgba(0,0,0,0.08)"
                strokeWidth={0.5}
              />
            </pattern>
            <pattern
              id="pdf-grid-major"
              width={gridPx * 5}
              height={gridPx * 5}
              patternUnits="userSpaceOnUse"
            >
              <rect width={gridPx * 5} height={gridPx * 5} fill="url(#pdf-grid)" />
              <path
                d={`M ${gridPx * 5} 0 L 0 0 0 ${gridPx * 5}`}
                fill="none"
                stroke="rgba(0,0,0,0.15)"
                strokeWidth={0.75}
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#pdf-grid-major)" />
        </svg>
      )}

      {/* Campos posicionados */}
      {canvasW > 0 &&
        Object.entries(campos).map(([key, campo]) => {
          const isTable = isTableField(key);
          const isSelected = selectedField === key;
          const left = campo.x * scale;
          const top = campo.y * scale;
          const fontSize = (campo.fontSize ?? 10) * scale;

          if (isTable) {
            const tableW = Math.max(200, A4_W - campo.x - 30);
            const w = tableW * scale;
            const h = TABLE_H * scale;
            const headerH = Math.max(14, 22 * scale);
            const borderCol = campo.borderColor ?? '#d4c9b0';
            return (
              <div
                key={key}
                className={cn(
                  'absolute cursor-move select-none rounded overflow-hidden',
                  isSelected && 'ring-2 ring-[var(--color-primary)]',
                )}
                style={{ left, top, width: w, height: h, border: `1.5px solid ${borderCol}` }}
                onMouseDown={(e) => handleFieldClick(key, e)}
              >
                <div
                  className="flex items-center justify-center pointer-events-none"
                  style={{
                    height: headerH,
                    backgroundColor: campo.headerBg ?? '#f5f0e8',
                    color: campo.headerColor ?? '#5a4a2f',
                    fontSize: Math.max(7, scale * 8),
                    fontWeight: 600,
                    borderBottom: `1px solid ${borderCol}`,
                  }}
                >
                  {fieldLabel(key)}
                </div>
                <div
                  className="flex flex-1 items-center justify-center pointer-events-none"
                  style={{
                    color: campo.rowColor ?? '#000',
                    fontSize: Math.max(6, scale * 7),
                    height: `calc(100% - ${headerH}px)`,
                  }}
                >
                  filas de datos...
                </div>
              </div>
            );
          }

          return (
            <div
              key={key}
              className={cn(
                'absolute cursor-move select-none whitespace-nowrap rounded px-0.5',
                isSelected
                  ? 'ring-2 ring-[var(--color-primary)] bg-[var(--color-primary)]/10'
                  : 'hover:ring-1 hover:ring-[var(--color-primary)]/50',
              )}
              style={{
                left,
                top,
                fontSize,
                color: campo.color ?? '#000',
              }}
              onMouseDown={(e) => handleFieldClick(key, e)}
            >
              {campo.prefix && (
                <span style={{ fontWeight: campo.bold ? 700 : 400 }}>{campo.prefix}</span>
              )}
              {fieldLabel(key)}
            </div>
          );
        })}

      {!fondoUrl && Object.keys(campos).length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span
            className="rounded bg-[var(--color-bg-elevated)] px-3 py-1.5 text-center font-mono text-[var(--color-fg-subtle)]"
            style={{ fontSize: Math.max(10, canvasW * 0.025) }}
          >
            Arrastrá campos desde el panel izquierdo
          </span>
        </div>
      )}
    </div>
  );
}
