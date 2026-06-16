import { cn } from '@/lib/cn';
import Image from 'next/image';

// Logo oficial Banco Vital (isotipo gota+cruz, fondo transparente).
// El archivo es un PNG embebido en SVG → se sirve con `unoptimized`.
// `mono` lo pinta blanco (para fondos oscuros / watermark) vía filtro.
const SRC = '/brief-banco-vital/logo-sin-fondo-banco-vital.svg';

export function BvLogo({
  size = 32,
  className,
  mono = false,
  priority = false,
  alt = 'Banco Vital',
}: {
  size?: number;
  className?: string;
  mono?: boolean;
  priority?: boolean;
  alt?: string;
}) {
  return (
    <Image
      src={SRC}
      alt={alt}
      width={size}
      height={size}
      unoptimized
      priority={priority}
      className={cn('object-contain', className)}
      style={mono ? { filter: 'brightness(0) invert(1)' } : undefined}
    />
  );
}
