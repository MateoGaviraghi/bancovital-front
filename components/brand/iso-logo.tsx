import { cn } from '@/lib/cn';

// Isotipo Banco Vital vectorizado: gota (de muestra/sangre) con cruz médica.
// `gradient` => relleno azul→rojo (marca, sobre superficies claras).
// sin gradient => `currentColor` (mono): la cruz es un calado, así funciona en
// cualquier fondo (blanco sobre navy, navy sobre blanco, etc.).
export function IsoLogo({
  className,
  gradient = false,
}: {
  className?: string;
  gradient?: boolean;
}) {
  return (
    <svg viewBox="0 0 24 24" className={cn('h-auto', className)} role="img" aria-hidden="true">
      {gradient && (
        <defs>
          <linearGradient id="bv-iso" x1="17" y1="3" x2="6" y2="22" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#1f2b5b" />
            <stop offset="1" stopColor="#cd0f0f" />
          </linearGradient>
        </defs>
      )}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        fill={gradient ? 'url(#bv-iso)' : 'currentColor'}
        d="M12 2C12 2 5 10.5 5 15.5a7 7 0 1 0 14 0C19 10.5 12 2 12 2Z M10.7 11.8h2.6v2.9h2.9v2.6h-2.9v2.9h-2.6v-2.9H7.8v-2.6h2.9z"
      />
    </svg>
  );
}
