'use client';

import { cn } from '@/lib/cn';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import * as React from 'react';

// Sheet = panel deslizante (Radix Dialog anclado a un borde). Usado para la
// navegación mobile: el contenido provee su propio fondo (ej. bg-rail).

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;
export const SheetPortal = DialogPrimitive.Portal;

export const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-[var(--color-scrim)] backdrop-blur-sm data-[state=open]:animate-[fade-in_var(--duration-base)_var(--ease-out-app)]',
      className,
    )}
    {...props}
  />
));
SheetOverlay.displayName = 'SheetOverlay';

export const SheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { title?: string }
>(({ className, children, title = 'Navegación', ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed inset-y-0 left-0 z-50 flex w-[17rem] max-w-[85vw] flex-col focus:outline-none data-[state=open]:animate-[sheet-in-left_var(--duration-base)_var(--ease-out-app)]',
        className,
      )}
      {...props}
    >
      <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
      {children}
    </DialogPrimitive.Content>
  </SheetPortal>
));
SheetContent.displayName = 'SheetContent';
