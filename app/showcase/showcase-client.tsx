'use client';

import { StatusPill } from '@/components/domain/status-pill';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pagination } from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Check, ChevronDown, Download, Loader2, Plus, Search, Trash2 } from 'lucide-react';
import Image from 'next/image';
import * as React from 'react';
import { toast } from 'sonner';

/* ------------------------------------------------------------------ */
/* Helpers de layout (solo dentro del showcase)                        */
/* ------------------------------------------------------------------ */

function Section({
  id,
  title,
  hint,
  children,
}: {
  id: string;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-6">
      <div className="mb-4 flex items-baseline justify-between gap-4 border-[var(--color-border)] border-b pb-2">
        <h2 className="font-semibold text-[var(--color-fg)] text-lg tracking-tight">{title}</h2>
        {hint ? <p className="text-[var(--color-fg-subtle)] text-xs">{hint}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Swatch({ name, hex, cssVar }: { name: string; hex: string; cssVar: string }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="h-10 w-10 shrink-0 rounded-md border border-[var(--color-border)] shadow-[var(--shadow-xs)]"
        style={{ backgroundColor: `var(${cssVar})` }}
      />
      <div className="min-w-0">
        <p className="truncate font-medium text-[var(--color-fg)] text-xs">{name}</p>
        <p className="truncate font-mono text-[10px] text-[var(--color-fg-subtle)] tabular">
          {hex}
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Showcase                                                            */
/* ------------------------------------------------------------------ */

export function ShowcaseClient() {
  const [saving, setSaving] = React.useState(false);
  const [notif, setNotif] = React.useState(true);
  const [view, setView] = React.useState('tabla');
  const [replay, setReplay] = React.useState(0);

  function fakeSave() {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success('Cambios guardados');
    }, 1600);
  }

  function fakePromise() {
    toast.promise(new Promise((resolve) => setTimeout(resolve, 1600)), {
      loading: 'Emitiendo informe…',
      success: 'Informe emitido',
      error: 'No se pudo emitir',
    });
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-fg)]">
      <div className="mx-auto max-w-5xl px-6 py-12">
        {/* Header */}
        <header className="mb-12 flex items-center gap-4">
          <Image
            src="/brief-banco-vital/logo-banco-vital-sin-fondo.png"
            alt="Banco Vital"
            width={48}
            height={48}
            priority
          />
          <div className="flex-1">
            <h1 className="font-semibold text-[var(--color-fg)] text-2xl tracking-tight">
              Banco Vital — Design System
            </h1>
            <p className="text-[var(--color-fg-muted)] text-sm">
              Fase 0 · Fundación · tokens, tipografía y primitives
            </p>
          </div>
          <Badge variant="warning">solo dev</Badge>
        </header>

        <div className="flex flex-col gap-14">
          {/* COLORES */}
          <Section
            id="colores"
            title="Color"
            hint="Marca fija Banco Vital — azul dominante, rojo solo acento"
          >
            <div className="flex flex-col gap-6">
              <div>
                <p className="mb-3 font-medium text-[var(--color-fg-muted)] text-xs uppercase tracking-wide">
                  Marca
                </p>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <Swatch name="primary" hex="#1f2b5b" cssVar="--color-primary" />
                  <Swatch name="primary-soft" hex="#eaeef6" cssVar="--color-primary-soft" />
                  <Swatch name="accent" hex="#cd0f0f" cssVar="--color-accent" />
                  <Swatch name="accent-soft" hex="#fdeaea" cssVar="--color-accent-soft" />
                </div>
              </div>
              <div>
                <p className="mb-3 font-medium text-[var(--color-fg-muted)] text-xs uppercase tracking-wide">
                  Superficie y texto
                </p>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <Swatch name="bg" hex="#f6f7fb" cssVar="--color-bg" />
                  <Swatch name="bg-subtle" hex="#eef0f6" cssVar="--color-bg-subtle" />
                  <Swatch name="border-strong" hex="#c7ccdb" cssVar="--color-border-strong" />
                  <Swatch name="fg" hex="#1a2138" cssVar="--color-fg" />
                  <Swatch name="fg-muted" hex="#525a76" cssVar="--color-fg-muted" />
                  <Swatch name="fg-subtle" hex="#8a92ad" cssVar="--color-fg-subtle" />
                </div>
              </div>
              <div>
                <p className="mb-3 font-medium text-[var(--color-fg-muted)] text-xs uppercase tracking-wide">
                  Semánticos — feedback inequívoco (distintos del rojo de marca)
                </p>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <Swatch name="success" hex="#15803d" cssVar="--color-success" />
                  <Swatch name="warning" hex="#b45309" cssVar="--color-warning" />
                  <Swatch name="danger (error)" hex="#b91c1c" cssVar="--color-danger" />
                  <Swatch name="info" hex="#0369a1" cssVar="--color-info" />
                </div>
              </div>
            </div>
          </Section>

          {/* TIPOGRAFÍA */}
          <Section id="tipografia" title="Tipografía" hint="Geist Sans (UI) · Geist Mono (números)">
            <div className="flex flex-col gap-3">
              <p className="font-semibold text-4xl tracking-tight">Display · text-4xl</p>
              <p className="font-semibold text-3xl tracking-tight">Título de página · text-3xl</p>
              <p className="font-semibold text-2xl tracking-tight">Sección · text-2xl</p>
              <p className="font-semibold text-xl">Subsección · text-xl</p>
              <p className="text-sm">Cuerpo · text-sm — base de la app (14px), Geist Sans.</p>
              <p className="text-[var(--color-fg-muted)] text-xs">Auxiliar · text-xs · fg-muted</p>
              <div className="mt-2 flex items-baseline gap-4 border-[var(--color-border)] border-t pt-4">
                <span className="font-mono text-2xl tabular">$ 1.234.567,89</span>
                <span className="text-[var(--color-fg-subtle)] text-xs">
                  Geist Mono + .tabular — montos y tablas
                </span>
              </div>
            </div>
          </Section>

          {/* BOTONES */}
          <Section
            id="botones"
            title="Botones"
            hint="Azul = acción primaria · micro-interacción al click"
          >
            <div className="flex flex-col gap-5">
              <div className="flex flex-wrap items-center gap-3">
                <Button>Primario</Button>
                <Button variant="secondary">Secundario</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="link">Link</Button>
                <Button variant="destructive">
                  <Trash2 /> Eliminar
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm">Small</Button>
                <Button>
                  <Plus /> Nueva orden
                </Button>
                <Button size="lg">
                  <Download /> Descargar
                </Button>
                <Button size="icon" aria-label="Buscar">
                  <Search />
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button loading={saving} onClick={fakeSave}>
                  {saving ? 'Guardando…' : 'Guardar (loading demo)'}
                </Button>
                <Button disabled>Deshabilitado</Button>
                <Button variant="outline" disabled>
                  Deshabilitado
                </Button>
              </div>
            </div>
          </Section>

          {/* BADGES */}
          <Section id="badges" title="Badges" hint="Estados y etiquetas">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge variant="accent">Marca</Badge>
                <Badge variant="success">
                  <Check /> Emitida
                </Badge>
                <Badge variant="warning">Pendiente</Badge>
                <Badge variant="danger">Anulada</Badge>
                <Badge variant="info">Confirmada</Badge>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[var(--color-fg-subtle)] text-xs">StatusPill (dominio):</span>
                <StatusPill status="borrador" />
                <StatusPill status="en_proceso" />
                <StatusPill status="emitida" />
                <StatusPill status="anulada" />
              </div>
            </div>
          </Section>

          {/* FORMULARIOS */}
          <Section
            id="forms"
            title="Formularios"
            hint="Inputs, estados de error, select y checkbox"
          >
            <div className="grid gap-6 sm:grid-cols-2">
              <FormField label="Nombre" htmlFor="f-nombre" required>
                <Input id="f-nombre" placeholder="Juan Pérez" />
              </FormField>
              <FormField
                label="Email"
                htmlFor="f-email"
                description="Te enviamos el comprobante acá"
              >
                <Input id="f-email" type="email" placeholder="juan@correo.com" />
              </FormField>
              <FormField label="DNI" htmlFor="f-dni" error="El DNI ingresado no es válido">
                <Input
                  id="f-dni"
                  defaultValue="12.34"
                  aria-invalid
                  className="border-[var(--color-danger)] focus-visible:border-[var(--color-danger)] focus-visible:ring-[var(--color-danger-soft)]"
                />
              </FormField>
              <FormField label="Obra social" htmlFor="f-os">
                <Select defaultValue="particular">
                  <SelectTrigger id="f-os">
                    <SelectValue placeholder="Elegí una opción" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="particular">Particular</SelectItem>
                    <SelectItem value="osde">OSDE</SelectItem>
                    <SelectItem value="swiss">Swiss Medical</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
              <FormField
                label="Observaciones"
                htmlFor="f-obs"
                className="sm:col-span-2"
                description="Opcional"
              >
                <Textarea id="f-obs" placeholder="Notas de la orden…" rows={3} />
              </FormField>
              <div className="flex items-center gap-2">
                <Checkbox id="f-terms" defaultChecked />
                <Label htmlFor="f-terms">Acepto los términos del servicio</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="f-news" />
                <Label htmlFor="f-news">Recibir novedades</Label>
              </div>
            </div>
          </Section>

          {/* CARD + TABS */}
          <Section id="card" title="Card y Tabs">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Orden #A-1042</CardTitle>
                  <CardDescription>Creada el 14/06/2026 · 3 prácticas</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center gap-2">
                  <StatusPill status="en_proceso" />
                  <span className="font-mono text-sm tabular">$ 48.500,00</span>
                </CardContent>
                <CardFooter>
                  <Button size="sm">Ver detalle</Button>
                  <Button size="sm" variant="outline">
                    Imprimir
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Resumen</CardTitle>
                  <CardDescription>Vista por estado</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="hoy">
                    <TabsList>
                      <TabsTrigger value="hoy">Hoy</TabsTrigger>
                      <TabsTrigger value="semana">Semana</TabsTrigger>
                      <TabsTrigger value="mes">Mes</TabsTrigger>
                    </TabsList>
                    <TabsContent value="hoy" className="pt-3 text-[var(--color-fg-muted)] text-sm">
                      12 órdenes · 4 pendientes de emitir.
                    </TabsContent>
                    <TabsContent
                      value="semana"
                      className="pt-3 text-[var(--color-fg-muted)] text-sm"
                    >
                      68 órdenes esta semana.
                    </TabsContent>
                    <TabsContent value="mes" className="pt-3 text-[var(--color-fg-muted)] text-sm">
                      291 órdenes este mes.
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </Section>

          {/* OVERLAYS */}
          <Section
            id="overlays"
            title="Diálogos y menús"
            hint="Entrada animada · respeta reduced-motion"
          >
            <div className="flex flex-wrap items-center gap-3">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">Abrir diálogo</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nueva práctica</DialogTitle>
                    <DialogDescription>
                      Completá los datos para agregarla a la orden.
                    </DialogDescription>
                  </DialogHeader>
                  <FormField label="Código" htmlFor="d-cod">
                    <Input id="d-cod" placeholder="Ej. 660103" />
                  </FormField>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Cancelar</Button>
                    </DialogClose>
                    <DialogClose asChild>
                      <Button>Agregar</Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">Anular orden</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Anular la orden #A-1042?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. La orden quedará anulada.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction>Anular</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    Opciones <ChevronDown />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Vista</DropdownMenuLabel>
                  <DropdownMenuRadioGroup value={view} onValueChange={setView}>
                    <DropdownMenuRadioItem value="tabla">Tabla</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="tarjetas">Tarjetas</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem checked={notif} onCheckedChange={setNotif}>
                    Notificaciones
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Exportar CSV</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </Section>

          {/* FEEDBACK */}
          <Section id="feedback" title="Feedback" hint="Éxito · error · carga — siempre explícito">
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="outline" onClick={() => toast.success('Orden confirmada')}>
                Éxito
              </Button>
              <Button variant="outline" onClick={() => toast.error('No se pudo guardar')}>
                Error
              </Button>
              <Button variant="outline" onClick={() => toast.warning('Cupo casi agotado')}>
                Advertencia
              </Button>
              <Button variant="outline" onClick={() => toast.info('Sincronizando datos')}>
                Info
              </Button>
              <Button variant="outline" onClick={fakePromise}>
                Carga → resultado
              </Button>
              <span className="inline-flex items-center gap-2 text-[var(--color-fg-muted)] text-sm">
                <Loader2 className="size-4 animate-spin" aria-hidden /> Cargando…
              </span>
            </div>
          </Section>

          {/* PAGINACIÓN */}
          <Section id="paginacion" title="Paginación">
            <Pagination
              page={3}
              pageSize={10}
              total={100}
              buildHref={(p) => `/showcase?page=${p}`}
            />
          </Section>

          {/* MOTION */}
          <Section
            id="motion"
            title="Motion"
            hint="CSS-only · se neutraliza con prefers-reduced-motion"
          >
            <div className="flex flex-col gap-4">
              <div key={replay} className="grid gap-4 sm:grid-cols-3">
                <div className="motion-fade-in rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-4 shadow-[var(--shadow-xs)]">
                  <p className="font-medium text-sm">fade-in</p>
                  <p className="text-[var(--color-fg-subtle)] text-xs">.motion-fade-in</p>
                </div>
                <div className="motion-scale-in rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-4 shadow-[var(--shadow-xs)]">
                  <p className="font-medium text-sm">scale-in</p>
                  <p className="text-[var(--color-fg-subtle)] text-xs">.motion-scale-in</p>
                </div>
                <div className="motion-slide-up rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-4 shadow-[var(--shadow-xs)]">
                  <p className="font-medium text-sm">slide-up</p>
                  <p className="text-[var(--color-fg-subtle)] text-xs">.motion-slide-up</p>
                </div>
              </div>
              <div>
                <Button variant="outline" size="sm" onClick={() => setReplay((n) => n + 1)}>
                  Reproducir de nuevo
                </Button>
              </div>
            </div>
          </Section>
        </div>

        <footer className="mt-16 border-[var(--color-border)] border-t pt-6 text-[var(--color-fg-subtle)] text-xs">
          Banco Vital · creado por Nodo — superficie de QA del design system (Fase 8).
        </footer>
      </div>
    </div>
  );
}
