'use client';

import { cn } from '@/lib/cn';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import * as React from 'react';

export const Tabs = TabsPrimitive.Root;

export const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      'inline-flex h-9 items-center justify-center gap-1 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-1 text-[var(--color-fg-muted)]',
      className,
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

export const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'inline-flex h-7 items-center justify-center whitespace-nowrap rounded-[5px] px-3 text-xs font-medium outline-none transition-[background-color,color,box-shadow] duration-[var(--duration-fast)] ease-[var(--ease-out-app)] hover:text-[var(--color-fg)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary-soft)] disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-[var(--color-bg-elevated)] data-[state=active]:text-[var(--color-fg)] data-[state=active]:shadow-[var(--shadow-xs)]',
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

export const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'mt-4 outline-none data-[state=active]:animate-[fade-in_var(--duration-base)_var(--ease-out-app)]',
      className,
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;
