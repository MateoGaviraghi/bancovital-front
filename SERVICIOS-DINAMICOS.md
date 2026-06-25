# Prompt: Implementar Servicios Dinámicos

## Contexto

El sistema actualmente tiene 2 tipos de orden hardcodeados: `humana` y `veterinaria`.
Queremos que los servicios sean **dinámicos**: se crean desde el backend y automáticamente
aparecen en la creación de órdenes, en la config de formatos PDF, y en el sidebar.

## Stack

- Backend: NestJS + Drizzle ORM + PostgreSQL (bancovital-back)
- Frontend: Next.js 16 App Router + TanStack Query + Tailwind (bancovital-front)
- Patrones existentes: ver CLAUDE.md y PROJECT-BRAIN.md del repo

## Lo que hay que implementar

### 1. Backend: tabla `servicio`

Crear tabla `servicio` en `src/db/schema/servicio.ts`:
```sql
servicio (
  id BIGINT PK GENERATED,
  lab_id BIGINT NOT NULL REFERENCES laboratorio(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,              -- "Humana", "Veterinaria", "Agua y efluentes"
  slug TEXT NOT NULL,                -- "humana", "veterinaria", "agua-efluentes"
  icono TEXT,                        -- nombre del ícono lucide: "stethoscope", "paw-print", "droplets"
  orden INT NOT NULL DEFAULT 0,      -- orden de aparición en el selector
  activo BOOLEAN NOT NULL DEFAULT true,
  -- Config de qué campos muestra el formulario de orden:
  usa_paciente_humano BOOLEAN NOT NULL DEFAULT false,   -- selector de paciente humano
  usa_paciente_animal BOOLEAN NOT NULL DEFAULT false,   -- selector de paciente animal
  usa_medico BOOLEAN NOT NULL DEFAULT false,            -- selector de médico derivante
  usa_veterinario BOOLEAN NOT NULL DEFAULT false,       -- selector de veterinario
  usa_propietario BOOLEAN NOT NULL DEFAULT false,       -- muestra propietario (viene del paciente animal)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(lab_id, slug)
)
```

Seed inicial por lab (o migración):
- { nombre: "Humana", slug: "humana", icono: "stethoscope", usa_paciente_humano: true, usa_medico: true }
- { nombre: "Veterinaria", slug: "veterinaria", icono: "paw-print", usa_paciente_animal: true, usa_veterinario: true }

### 2. Backend: vincular `preferencia_pdf` al servicio

Agregar columna `servicio_id BIGINT REFERENCES servicio(id)` a la tabla `preferencia_pdf`.
Cada servicio tiene su propio formato PDF (fondo, colores, márgenes).
Si `servicio_id IS NULL`, es el formato default/legacy.

### 3. Backend: vincular `order` al servicio

Reemplazar `order.order_type TEXT` por `order.servicio_id BIGINT REFERENCES servicio(id)`.
Migración: mapear orders existentes con order_type='humana' al servicio "Humana" y
order_type='veterinaria' al servicio "Veterinaria" de cada lab.

### 4. Backend: endpoints

- `GET /servicios` — lista servicios activos del lab (ordenados por `orden`)
- `POST /servicios` — crear servicio (admin)
- `PATCH /servicios/:id` — actualizar servicio
- `PATCH /servicios/:id/active` — activar/desactivar
- `DELETE /servicios/:id` — soft delete (solo si no tiene órdenes)

### 5. Frontend: formulario de orden dinámico

Archivo: `components/domain/new-order-form.tsx`

Actualmente tiene un toggle hardcodeado `humana | veterinaria`. Cambiar a:

1. Fetch `GET /servicios` al montar el componente
2. Renderizar botones dinámicamente: `servicios.map(s => <button>...)` con el ícono de lucide
3. Según los flags del servicio seleccionado (`usa_paciente_humano`, `usa_paciente_animal`, etc.),
   mostrar/ocultar los selectores correspondientes
4. Al submit, enviar `servicioId` en vez de `orderType`

```tsx
// Ejemplo de renderizado dinámico:
const { data: servicios = [] } = useQuery({
  queryKey: ['servicios'],
  queryFn: () => apiClient.get('/servicios').then(r => r.data),
});

// En el JSX:
<div className="flex rounded-lg border ...">
  {servicios.map(s => (
    <button
      key={s.id}
      onClick={() => setServicio(s)}
      className={cn('flex flex-1 ...', selected ? 'bg-elevated' : 'muted')}
    >
      <DynamicIcon name={s.icono} />
      {s.nombre}
    </button>
  ))}
</div>

// Campos condicionales:
{servicio.usa_paciente_humano && <PatientCombobox ... />}
{servicio.usa_paciente_animal && <AnimalPatientCombobox ... />}
{servicio.usa_medico && <DoctorCombobox ... />}
{servicio.usa_veterinario && <VeterinarioCombobox ... />}
```

### 6. Frontend: config PDF por servicio

Archivo: `app/(app)/configuracion/pdf/page.tsx`

Actualmente muestra formatos genéricos. Cambiar a:

1. Fetch servicios activos
2. Mostrar un formato por servicio (crear automáticamente si no existe)
3. Cada card muestra: nombre del servicio + miniatura del fondo
4. Al editar, se va a `/configuracion/pdf/:formatoId` (ya existe)

### 7. Frontend: admin de servicios

Crear `app/(app)/admin/servicios/page.tsx`:
- Lista de servicios del lab con drag-to-reorder (o flechas)
- Dialog para crear/editar: nombre, slug, ícono (selector de íconos lucide), flags de campos
- Toggle activar/desactivar
- Agregar al sidebar en Administración

### 8. Frontend: icono dinámico

Crear un componente `DynamicLucideIcon` que reciba un nombre de string y renderice
el ícono correspondiente de lucide-react:

```tsx
import * as icons from 'lucide-react';

function DynamicLucideIcon({ name, ...props }: { name: string } & icons.LucideProps) {
  const Icon = (icons as Record<string, icons.LucideIcon>)[
    name.replace(/(^|-)(\w)/g, (_, __, c) => c.toUpperCase())
  ];
  return Icon ? <Icon {...props} /> : null;
}
```

### 9. Backend: PDF rendering por servicio

Cuando se emite un informe, el backend debe:
1. Leer `order.servicio_id`
2. Buscar `preferencia_pdf` con ese `servicio_id` y el `lab_id`
3. Usar el fondo + colores de ese formato
4. Si no existe formato para ese servicio, usar el template estructurado default

### 10. Sidebar dinámico

Actualmente la sección "Veterinaria" está hardcodeada en `components/layout/sidebar.tsx`.
Cambiar a:
1. Los servicios con `usa_paciente_animal` o flags veterinarios muestran la sección Veterinaria
2. O mejor: cada servicio que no sea "Humana" genera una sección en el sidebar con sus entidades
3. Esto puede ser más complejo — evaluar si vale la pena o dejarlo hardcodeado por ahora

## Migración de datos

1. Crear tabla `servicio` con las columnas descritas
2. Para cada lab existente, insertar los servicios default (Humana + Veterinaria)
3. Agregar `servicio_id` a `preferencia_pdf` (nullable inicialmente)
4. Agregar `servicio_id` a `order`, migrar los valores de `order_type`:
   - `order_type = 'humana'` → servicio con slug 'humana' del mismo lab
   - `order_type = 'veterinaria'` → servicio con slug 'veterinaria' del mismo lab
5. Hacer `servicio_id` NOT NULL en `order`
6. Dropear columna `order_type` de `order`

## Orden de implementación sugerido

1. Schema + migración de datos
2. Endpoints CRUD de servicios
3. Admin de servicios (frontend)
4. Formulario de orden dinámico
5. Config PDF por servicio
6. Sidebar dinámico (opcional, puede quedar hardcodeado)

## Notas

- Mantener backward-compatible: si no hay servicios creados, el sistema funciona como ahora
- El seed de servicios default se puede hacer desde un endpoint `POST /servicios/seed-defaults`
  que el super admin ejecuta para cada lab
- Los íconos de lucide se pueden listar con un selector visual en el admin
- Para "Agua y efluentes" los flags serían: ningún paciente, ningún médico — solo prácticas + cobertura
