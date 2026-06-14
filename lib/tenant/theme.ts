/**
 * Builds an inline CSS string that overrides the primary colour tokens
 * for the tenant layout. Only validated hex values are interpolated —
 * never raw user-supplied strings — so CSS-injection is not possible.
 */

const DEFAULT_PRIMARY = '#0db5b0';
const HEX_RE = /^#[0-9a-f]{6}$/i;

/** WCAG relative luminance of a single 8-bit channel (0-255). */
function channelLuminance(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

/** WCAG relative luminance of a hex colour (returns 0-1). */
function relativeLuminance(hex: string): number {
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  return 0.2126 * channelLuminance(r) + 0.7152 * channelLuminance(g) + 0.0722 * channelLuminance(b);
}

export interface TenantBranding {
  slug: string;
  name: string;
  shortName: string | null;
  logoUrl: string | null;
  primaryColor: string | null;
  tagline: string | null;
}

/**
 * Same primary-token derivation as {@link buildThemeStyle}, but as a CSS-var map
 * usable as an inline `style` on ANY container. Setting these vars on a wrapper
 * scopes the theme to that subtree only (it overrides `:root` for descendants),
 * so a live preview can repaint without touching the real app chrome.
 * Only validated hex is interpolated — never raw user input.
 */
export function themePreviewVars(primaryColor: string | null | undefined): Record<string, string> {
  const raw = primaryColor ?? DEFAULT_PRIMARY;
  const hex = HEX_RE.test(raw) ? raw : DEFAULT_PRIMARY;
  const foreground = relativeLuminance(hex) < 0.179 ? '#ffffff' : '#1a2b3c';
  return {
    '--color-primary': hex,
    '--color-primary-hover': `color-mix(in oklab, ${hex} 85%, black)`,
    '--color-primary-soft': `color-mix(in oklab, ${hex} 12%, white)`,
    '--color-primary-foreground': foreground,
  };
}

export function buildThemeStyle(primaryColor: string | null | undefined): string {
  const raw = primaryColor ?? DEFAULT_PRIMARY;
  // Security: only use validated hex; fall back to default otherwise
  const hex = HEX_RE.test(raw) ? raw : DEFAULT_PRIMARY;

  const lum = relativeLuminance(hex);
  // WCAG contrast ratio against white: (lum + 0.05) / (1 + 0.05). If >= 4.5 : 1 → text is dark, use white. Threshold lum < 0.179.
  const foreground = lum < 0.179 ? '#ffffff' : '#1a2b3c';

  // All values here are either validated hex or literal color-mix() expressions
  return [
    ':root {',
    `  --color-primary: ${hex};`,
    `  --color-primary-hover: color-mix(in oklab, ${hex} 85%, black);`,
    `  --color-primary-soft: color-mix(in oklab, ${hex} 12%, white);`,
    `  --color-primary-foreground: ${foreground};`,
    '}',
  ].join('\n');
}
