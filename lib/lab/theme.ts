import type { CSSProperties } from 'react';

/**
 * Theming por laboratorio (white-label).
 *
 * Deriva los overrides de marca a partir del color PRINCIPAL + ACENTO del lab.
 * Solo se interpola hex validado (nunca input crudo del usuario) → no hay
 * inyección de CSS posible. Devuelve un mapa de CSS-vars para usar como `style`
 * inline en un contenedor: sobrescribe `:root` solo para ese subtree.
 *
 * Los neutrales (bg/fg/border) y el feedback semántico (danger/warning/success)
 * quedan FIJOS para garantizar legibilidad. Sin colores (null) → Banco Vital
 * (navy/rojo) desde globals.css.
 */

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

/** Luminancia relativa WCAG de un canal de 8 bits (0-255). */
function channelLuminance(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

/** Luminancia relativa WCAG de un color hex (0-1). */
function relativeLuminance(hex: string): number {
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  return 0.2126 * channelLuminance(r) + 0.7152 * channelLuminance(g) + 0.0722 * channelLuminance(b);
}

/**
 * Texto legible sobre un fondo de color: blanco o casi-negro según luminancia.
 * Umbral 0.179 = punto donde el contraste contra blanco iguala al contraste
 * contra negro (maximiza el contraste mínimo).
 */
function readableForeground(hex: string): string {
  return relativeLuminance(hex) < 0.179 ? '#ffffff' : '#13182a';
}

/** Devuelve el hex si es válido `#rrggbb`, si no `null`. */
export function cleanHex(hex: string | null | undefined): string | null {
  return hex && HEX_RE.test(hex) ? hex : null;
}

export interface LabPalette {
  primaryColor?: string | null;
  accentColor?: string | null;
}

/**
 * Overrides de CSS-vars para la paleta del lab, para spreadear en el `style`
 * inline de un contenedor. Objeto vacío si el lab no tiene colores propios
 * (→ defaults Banco Vital de globals.css). Cubre la familia `primary`, la
 * familia `accent`, y tiñe el `--color-rail` (sidebar) con una versión oscura
 * del color principal.
 */
export function labThemeVars({ primaryColor, accentColor }: LabPalette): CSSProperties {
  const primary = cleanHex(primaryColor);
  const accent = cleanHex(accentColor);
  const vars: Record<string, string> = {};

  if (primary) {
    const lum = relativeLuminance(primary);
    const isLight = lum > 0.15;
    vars['--color-primary'] = primary;
    vars['--color-primary-hover'] = `color-mix(in oklab, ${primary} 85%, black)`;
    vars['--color-primary-soft'] = `color-mix(in oklab, ${primary} 12%, white)`;
    vars['--color-primary-foreground'] = readableForeground(primary);
    const railMix = isLight ? 45 : 38;
    vars['--color-rail'] = `color-mix(in oklab, ${primary} ${railMix}%, #0a0e1a)`;
  }

  if (accent) {
    vars['--color-accent'] = accent;
    vars['--color-accent-hover'] = `color-mix(in oklab, ${accent} 85%, black)`;
    vars['--color-accent-soft'] = `color-mix(in oklab, ${accent} 12%, white)`;
    vars['--color-accent-foreground'] = readableForeground(accent);
  }

  return vars as CSSProperties;
}
