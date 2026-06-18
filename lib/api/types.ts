// Manual mirror of backend DTOs. When the back changes a schema, update here.
// Wire format: dates and decimals are JSON strings (never Date or number for money).

// ─────────────── Enums ───────────────

export type UserRole = 'admin' | 'recepcion' | 'bioquimico' | 'super';

export type Sex = 'F' | 'M' | 'X';

export type OrderStatus =
  | 'borrador'
  | 'confirmada'
  | 'en_proceso'
  | 'resultados_cargados'
  | 'emitida'
  | 'entregada'
  | 'anulada';

export type OrderOrigin = 'ambulatorio' | 'internacion' | 'urgencia';

export type AuthorizationStatus = 'no_aplica' | 'pendiente' | 'autorizada' | 'rechazada';

/** Backend stores result flags in this short form. UI classification helper uses the long form. */
export type ResultFlagShort = 'L' | 'N' | 'H';

// ─────────────── Session ───────────────

export interface MeResponse {
  userId: string;
  email: string;
  role: UserRole;
  labId: number | null;
  /** Slug del lab — informativo; ya NO se usa para ruteo (app única bancovital). */
  labSlug: string | null;
  /** Nombre + logo del lab del usuario, para el header. */
  labName: string | null;
  logoUrl: string | null;
  /** Paleta de marca del lab (hex #rrggbb) — el front deriva los tokens. null = Banco Vital. */
  primaryColor: string | null;
  accentColor: string | null;
}

// ─────────────── Lab config ───────────────

export type EstadoLab = 'activo' | 'suspendido' | 'inactivo';

export interface LabConfig {
  id: number;
  slug: string;
  legalName: string;
  cuit: string;
  streetAddress: string;
  city: string;
  province: string;
  phone: string | null;
  email: string | null;
  signingProfessionalName: string;
  signingProfessionalMp: string;
  signingSignaturePath: string | null;
  logoPath: string | null;
  shortName: string | null;
  primaryColor: string | null;
  accentColor: string | null;
  tagline: string | null;
  estado: EstadoLab;
  createdAt: string;
  updatedAt: string;
}

export interface LabAssetSignedUrlResponse {
  url: string | null;
  expiresInSeconds: number;
}

export interface UpdateLabConfigDto {
  legalName?: string;
  cuit?: string;
  streetAddress?: string;
  city?: string;
  province?: string;
  phone?: string | null;
  email?: string | null;
  signingProfessionalName?: string;
  signingProfessionalMp?: string;
  signingSignaturePath?: string | null;
  logoPath?: string | null;
  shortName?: string | null;
  /** Color primario de marca en hex (#rrggbb). */
  primaryColor?: string;
  /** Color de acento de marca en hex (#rrggbb). */
  accentColor?: string;
  /** Eslogan corto del lab (máx 120). */
  tagline?: string;
}

// ─────────────── Patients ───────────────

export interface Patient {
  id: number;
  dni: string;
  firstName: string;
  lastName: string;
  sex: Sex | null;
  birthDate: string | null;
  phone: string | null;
  email: string | null;
  streetAddress: string | null;
  city: string | null;
  notes: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreatePatientDto {
  dni: string;
  firstName: string;
  lastName: string;
  sex?: Sex | null;
  birthDate?: string | null;
  phone?: string | null;
  email?: string | null;
  streetAddress?: string | null;
  city?: string | null;
  notes?: string | null;
}

export type UpdatePatientDto = Partial<CreatePatientDto>;

// ─────────────── Doctors ───────────────

export interface Doctor {
  id: number;
  firstName: string;
  lastName: string;
  matricula: string;
  specialty: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateDoctorDto {
  firstName: string;
  lastName: string;
  matricula: string;
  specialty?: string | null;
  phone?: string | null;
  email?: string | null;
  notes?: string | null;
}

export type UpdateDoctorDto = Partial<CreateDoctorDto>;

// ─────────────── Insurers ───────────────

export interface Insurer {
  id: number;
  code: string;
  name: string;
  requiresAuthorization: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InsurerWithUb extends Insurer {
  currentUbValue: string | null;
  currentUbValidFrom: string | null;
}

export interface UbHistoryItem {
  id: number;
  insurerId: number;
  validFrom: string;
  validTo: string | null;
  value: string;
  notes: string | null;
  createdBy: string | null;
  createdAt: string;
}

export interface CreateInsurerDto {
  code: string;
  name: string;
  requiresAuthorization?: boolean;
  active?: boolean;
}

export type UpdateInsurerDto = Partial<CreateInsurerDto>;

export interface SetActiveDto {
  active: boolean;
}

export interface SetUbValueDto {
  insurerId: number;
  value: string;
  validFrom: string;
  notes?: string | null;
}

// ─────────────── Practices ───────────────

export interface Practice {
  id: number;
  nbuCode: string;
  name: string;
  shortName: string | null;
  category: string | null;
  section: string | null;
  units: string;
  parentId: number | null;
  requiresAuthorization: boolean;
  referenceValueTemplate: unknown | null;
  isSpecialAct: boolean;
  isElaborated: boolean;
  active: boolean;
  notes: string | null;
  referenceValue: string | null;
  methodology: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Returned by GET /practices/catalog and GET /practices/search — only root practices (parentId === null). */
export interface PracticeWithChildren extends Practice {
  children: { id: number; nbuCode: string; name: string }[];
}

export interface CreatePracticeDto {
  nbuCode: string;
  name: string;
  shortName?: string | null;
  category?: string | null;
  section?: string | null;
  units?: string | null;
  notes?: string | null;
  referenceValue?: string | null;
  requiresAuthorization?: boolean;
  isSpecialAct?: boolean;
  isElaborated?: boolean;
  active?: boolean;
}

export type UpdatePracticeDto = Partial<CreatePracticeDto> & { parentId?: number | null };

export interface PracticesCatalogPage {
  data: PracticeWithChildren[];
  total: number;
  page: number;
  pageSize: number;
  sections: string[];
}

// ─────────────── Unidades de medida (dinamicas) ───────────────
// Catalogo per-tenant. Reemplaza al campo legacy Practice.units (string libre).

export interface UnidadMedida {
  id: number;
  labId: number;
  nombre: string;
  simbolo: string | null;
  active: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UnidadMedidaCatalogPage {
  data: UnidadMedida[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateUnidadMedidaDto {
  nombre: string;
  simbolo?: string | null;
}

export type UpdateUnidadMedidaDto = Partial<CreateUnidadMedidaDto>;

export interface PracticeUnidad {
  id: number;
  labId: number;
  practiceId: number;
  unidadId: number;
  sortOrder: number;
  createdAt: string;
}

/** Item devuelto por GET /practices/:practiceId/unidades (asociaciones hidratadas). */
export interface PracticeUnidadListItem {
  associationId: number;
  unidad: UnidadMedida;
  sortOrder: number;
}

export interface AddPracticeUnidadDto {
  unidadId: number;
  sortOrder?: number;
}

export interface OrderPracticeUnidadValue {
  id: number;
  orderPracticeId: number;
  unidadId: number;
  unidadNombreSnapshot: string;
  unidadSimboloSnapshot: string | null;
  valueNumeric: string | null;
  valueText: string | null;
  notes: string | null;
  enteredBy: string;
  enteredAt: string;
  updatedAt: string;
}

/** Item devuelto por GET /order-practices/:opId/unidades — incluye el valor cargado (o null). */
export interface OrderPracticeUnidadItem {
  associationId: number;
  unidadId: number;
  nombre: string;
  simbolo: string | null;
  sortOrder: number;
  value: OrderPracticeUnidadValue | null;
}

export interface UpsertOrderPracticeUnidadDto {
  unidadId: number;
  valueNumeric?: string;
  valueText?: string;
  notes?: string;
}

// ─────────────── Orders ───────────────

export interface OrderListItem {
  id: number;
  protocolNumber: number;
  patientId: number;
  insurerId: number;
  insuranceAffiliateNumber: string | null;
  referringDoctorId: number | null;
  referringDoctorName: string | null;
  referringDoctorMp: string | null;
  diagnosis: string | null;
  origin: OrderOrigin;
  orderDate: string;
  status: OrderStatus;
  isUrgent: boolean;
  notes: string | null;
  cancellationReason: string | null;
  totalParticular: string;
  totalInsurer: string;
  totalPatientCopay: string;
  ubValueUsed: string;
  pdfReportPath: string | null;
  pdfReportIssuedAt: string | null;
  pdfReportSignedBy: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  patient: {
    id: number;
    firstName: string;
    lastName: string;
    dni: string;
  };
  insurer: {
    id: number;
    code: string;
    name: string;
  };
}

export type OrderDetail = OrderListItem;

export interface OrderPracticeInputDto {
  practiceId: number;
  includeInReport?: boolean;
  authorizationCode?: string | null;
  sortOrder?: number;
}

export interface CreateOrderDto {
  patientId: number;
  insurerId: number;
  insuranceAffiliateNumber?: string | null;
  referringDoctorId?: number | null;
  referringDoctorName?: string | null;
  referringDoctorMp?: string | null;
  diagnosis?: string | null;
  origin: OrderOrigin;
  isUrgent: boolean;
  notes?: string | null;
  practices: OrderPracticeInputDto[];
}

export interface UpdateOrderDto {
  patientId?: number;
  insurerId?: number;
  insuranceAffiliateNumber?: string | null;
  referringDoctorId?: number | null;
  referringDoctorName?: string | null;
  referringDoctorMp?: string | null;
  diagnosis?: string | null;
  origin?: OrderOrigin;
  isUrgent?: boolean;
  notes?: string | null;
  practices?: OrderPracticeInputDto[];
}

export interface CancelOrderDto {
  reason: string;
}

export interface OrderLine {
  id: number;
  orderId: number;
  practiceId: number | null;
  nbuCodeSnapshot: string;
  nameSnapshot: string;
  unitsSnapshot: string;
  ubValueSnapshot: string;
  priceParticular: string;
  priceInsurer: string;
  patientCopay: string;
  authorizationStatus: AuthorizationStatus;
  authorizationCode: string | null;
  includeInReport: boolean;
  sortOrder: number;
  createdAt: string;
}

// ─────────────── Results ───────────────

export interface OrderResult {
  id: number;
  orderPracticeId: number;
  valueNumeric: string | null;
  valueText: string | null;
  unit: string | null;
  referenceRangeLow: string | null;
  referenceRangeHigh: string | null;
  flag: ResultFlagShort | null;
  methodology: string | null;
  notes: string | null;
  enteredBy: string;
  enteredAt: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
}

export interface ResultLine {
  orderPractice: OrderLine;
  result: OrderResult | null;
  referenceRule: {
    sex?: Sex | null;
    ageFromYears?: number | null;
    ageToYears?: number | null;
    band: {
      low?: string | null;
      high?: string | null;
      criticalLow?: string | null;
      criticalHigh?: string | null;
    };
    unit?: string;
  } | null;
  /**
   * Unidades dinamicas asociadas a la practica + valor cargado (o null) por unidad.
   * Opcional por defensa: backends antiguos pueden no exponerlo todavia.
   */
  unidades?: OrderPracticeUnidadItem[];
  /** Texto orientativo de la práctica, inyectado client-side desde /practices/bulk. */
  referenceValue?: string | null;
}

export interface UpsertResultDto {
  orderPracticeId: number;
  valueNumeric?: string;
  valueText?: string;
  unit?: string;
  methodology?: string;
  notes?: string;
}

// ─────────────── PDF preferences ───────────────

export interface PdfLayoutCampo {
  x: number;
  y: number;
  fontSize?: number;
  color?: string;
}

export interface PdfLayoutConfig {
  usarFondo?: boolean;
  campos?: Record<string, PdfLayoutCampo>;
}

export interface PreferenciaPdf {
  id: number;
  labId: number;
  fondoPath: string | null;
  layoutConfig: PdfLayoutConfig | null;
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  createdAt: string;
  updatedAt: string;
}

export interface UpdatePreferenciaPdfDto {
  /** Dibujar la imagen de fondo (membrete) en el PDF. */
  usarFondo?: boolean;
  marginTop?: number;
  marginBottom?: number;
  marginLeft?: number;
  marginRight?: number;
}

export interface FondoSignedUrlResponse {
  url: string | null;
  expiresInSeconds: number;
}

// ─────────────── Sedes / ubicaciones ───────────────

export interface Sede {
  id: number;
  labId: number;
  nombre: string;
  direccion: string;
  localidad: string | null;
  telefono: string | null;
  email: string | null;
  horarios: string | null;
  principal: boolean;
  orden: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreateSedeDto {
  nombre: string;
  direccion: string;
  localidad?: string | null;
  telefono?: string | null;
  email?: string | null;
  horarios?: string | null;
  principal?: boolean;
  orden?: number;
}

export type UpdateSedeDto = Partial<CreateSedeDto>;

// ─────────────── Portal del paciente (F7) ───────────────

/** Metadata pública del informe (para tematizar la página del QR). Sin PII. */
export interface PublicInformeMeta {
  labName: string;
  shortName: string | null;
  logoUrl: string | null;
  primaryColor: string | null;
  accentColor: string | null;
  tagline: string | null;
  protocolNumber: string;
  emitidaAt: string | null;
}

// ─────────────── Reports ───────────────

export interface SignedUrlResponse {
  url: string;
  expiresInSeconds: number;
  regenerated: boolean;
  stale: boolean;
}

// ─────────────── Users (admin) ───────────────

export interface AdminUser {
  id: string;
  email: string;
  role: UserRole | null;
  displayName: string | null;
  matricula: string | null;
  active: boolean;
  labId: number | null;
  createdAt: string;
  lastSignInAt: string | null;
}

// ─────────────── Laboratorios (super admin) ───────────────

export interface Laboratorio {
  id: number;
  slug: string;
  legalName: string;
  shortName: string | null;
  cuit: string | null;
  streetAddress: string | null;
  city: string | null;
  province: string | null;
  phone: string | null;
  email: string | null;
  signingProfessionalName: string | null;
  signingProfessionalMp: string | null;
  estado: EstadoLab;
  /** True when the lab is flagged as past-due (super-managed). */
  moroso?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLaboratorioDto {
  slug: string;
  legalName: string;
  shortName?: string | null;
  cuit?: string | null;
  streetAddress?: string | null;
  city?: string;
  province?: string;
  phone?: string | null;
  email?: string | null;
  signingProfessionalName?: string | null;
  signingProfessionalMp?: string | null;
}

export interface UpdateLaboratorioDto extends Partial<CreateLaboratorioDto> {
  estado?: EstadoLab;
}

export interface InviteUserDto {
  email: string;
  role: UserRole;
  displayName?: string | null;
  matricula?: string | null;
  redirectTo?: string;
}

export interface SetRoleDto {
  role: UserRole;
}

// ─────────────── Plans & consumo ───────────────

export interface Plan {
  id: number;
  nombre: string;
  cupoOrdenesMes: number;
  precioMensual: string;
  precioOrdenExcedente: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlanDto {
  nombre: string;
  cupoOrdenesMes: number;
  precioMensual: string;
  precioOrdenExcedente: string;
}

export type UpdatePlanDto = Partial<CreatePlanDto>;

export interface ConsumoCiclo {
  periodo: string;
  plan: { id: number; nombre: string; cupoOrdenesMes: number; precioOrdenExcedente: string } | null;
  cupoBase: number | null;
  rollover: number;
  cupoEfectivo: number | null;
  usadas: number;
  excedentes: number;
  restantes: number | null;
  porcentaje: number | null;
}

export interface ConsumoResumen {
  labId: number;
  slug: string;
  nombre: string;
  plan: { id: number; nombre: string } | null;
  periodo: string;
  cupoEfectivo: number | null;
  usadas: number;
  excedentes: number;
  porcentaje: number | null;
}

// ─────────────── Contracts ───────────────

export type ContratoEstado = 'enviado' | 'firmado' | 'vencido' | 'anulado';

export interface ContratoPublicPlan {
  id: number;
  nombre: string;
  cupoOrdenesMes: number;
  precioMensual: string;
  precioOrdenExcedente: string;
}

/** Returned by GET /api/public/contracts/{token} */
export interface ContratoPublicDetail {
  estado: ContratoEstado;
  expiraAt: string;
  razonSocial: string;
  nombreContacto: string;
  emailFirmanteOfuscado: string;
  propuesta: { descripcion: string; notas?: string };
  planSugeridoId: number | null;
  planes: ContratoPublicPlan[];
  /** Firmado con URL solo tras verificar OTP (el PDF tiene PII); null antes. */
  pdfUrl: string | null;
}

export interface OtpRequestResponse {
  ok: boolean;
}

export interface OtpVerifyDto {
  codigo: string;
}

export interface OtpVerifyResponse {
  ok: boolean;
}

export interface DatosFacturacion {
  domicilioFiscal: string;
  cuit?: string;
  condicionIva?: string;
}

export interface SignContratoDto {
  planId: number;
  firmaDataUrl: string;
  datosFacturacion: DatosFacturacion;
  aceptaTerminos: true;
}

export interface SignContratoResponse {
  ok: boolean;
  labSlug: string;
}

/** Returned by GET /api/super/contracts */
export interface ContratoSuperListItem {
  id: number;
  token: string;
  razonSocial: string;
  nombreContacto: string;
  emailFirmante: string;
  telefono: string | null;
  cuit: string | null;
  estado: ContratoEstado;
  planSugeridoId: number | null;
  planElegidoId: number | null;
  planElegidoNombre: string | null;
  expiraAt: string;
  firmadoAt: string | null;
  contractUrl: string;
  propuesta: { descripcion: string; notas?: string };
  createdAt: string;
}

/** Returned by GET /api/super/contracts/:id */
export interface ContratoSuperDetail extends ContratoSuperListItem {
  pdfOriginalUrl: string | null;
  pdfFirmadoUrl: string | null;
  evidencia: Record<string, unknown> | null;
}

export interface CreateContratoDto {
  razonSocial: string;
  nombreContacto: string;
  cuit?: string;
  emailFirmante: string;
  telefono?: string;
  propuesta: { descripcion: string; notas?: string };
  planSugeridoId?: number;
}

export interface CreateContratoResponse {
  id: number;
  contractUrl: string;
}

export interface ResendContratoResponse {
  contractUrl: string;
}

// ─────────────── Super: impersonation, metrics, audit ───────────────

/** Returned by POST /api/super/impersonate/:labId */
export interface ImpersonateResponse {
  labId: number;
  slug: string;
  nombre: string;
}

export interface SuperMetricsLabs {
  activos: number;
  suspendidos: number;
  inactivos: number;
}

export interface SuperMetricsOrdenesMes {
  periodo: string;
  total: number;
  excedentes: number;
}

export interface SuperMetricsTopLab {
  labId: number;
  nombre: string;
  usadas: number;
  cupoEfectivo: number | null;
  excedentes: number;
  porcentaje: number | null;
}

/** Returned by GET /api/super/metrics */
export interface SuperMetrics {
  labs: SuperMetricsLabs;
  mrr: number;
  ordenesPorMes: SuperMetricsOrdenesMes[];
  topLabsUso: SuperMetricsTopLab[];
}

export interface AuditEntry {
  id: number | string;
  labId: number | null;
  labNombre: string | null;
  actorEmail: string | null;
  action: string;
  entity: string | null;
  entityId: string | number | null;
  createdAt: string;
}

/** Returned by GET /api/super/audit */
export interface AuditResponse {
  data: AuditEntry[];
  total: number;
}

// ─────────────── Super: estado de cuenta (movimientos) ───────────────

export type MovimientoTipo = 'cargo' | 'pago';

export interface Movimiento {
  id: number;
  tipo: MovimientoTipo;
  /** Decimal string (ARS). */
  monto: string;
  concepto: string;
  notas: string | null;
  fecha: string;
  createdAt: string;
}

/** Returned by GET /api/super/labs/:id/movimientos */
export interface EstadoCuenta {
  movimientos: Movimiento[];
  /** Net balance: totalPagos - totalCargos (negative = lab owes). */
  balance: number;
  totalPagos: number;
  totalCargos: number;
}

export interface CreateMovimientoDto {
  tipo: MovimientoTipo;
  monto: string;
  concepto: string;
  notas?: string | null;
  fecha?: string;
}

export interface SetMorosoDto {
  moroso: boolean;
}

export interface SetAdminPasswordResponse {
  ok: boolean;
  email: string;
}

// ─────────────── Super: anuncios ───────────────

export type AnuncioTipo = 'info' | 'advertencia' | 'mantenimiento';

export interface Anuncio {
  id: number;
  mensaje: string;
  tipo: AnuncioTipo;
  /** null = global; otherwise scoped to a single lab. */
  labId: number | null;
  activo: boolean;
  desde: string | null;
  hasta: string | null;
  createdAt: string;
}

export interface CreateAnuncioDto {
  mensaje: string;
  tipo: AnuncioTipo;
  labId?: number | null;
  activo?: boolean;
  desde?: string | null;
  hasta?: string | null;
}

export type UpdateAnuncioDto = Partial<CreateAnuncioDto>;

/** Lab-facing item returned by GET /api/announcements (already scoped server-side). */
export interface AnuncioPublic {
  id: number;
  mensaje: string;
  tipo: AnuncioTipo;
}

// ─────────────── Super: onboarding checklist ───────────────

export interface OnboardingItem {
  key: string;
  label: string;
  done: boolean;
}

/** Returned by GET /api/super/labs/:id/onboarding */
export interface OnboardingChecklist {
  items: OnboardingItem[];
  completados: number;
  total: number;
}

// ─────────────── Reuniones / Bookings ───────────────

export interface BookingSlot {
  inicio: string;
  fin: string;
}

export interface BookingAvailabilityResponse {
  date: string;
  slots: BookingSlot[];
}

export interface CreateBookingDto {
  nombre: string;
  email: string;
  empresa?: string;
  telefono?: string;
  mensaje?: string;
  slotInicio: string;
}

export interface CreateBookingResponse {
  ok: boolean;
  reunionId: string;
  slotInicio: string;
  slotFin: string;
  meetLink: string | null;
}

export type ReunionEstado = 'confirmada' | 'cancelada' | 'pendiente';

export interface ReunionItem {
  id: string;
  nombre: string;
  email: string;
  empresa: string | null;
  telefono: string | null;
  mensaje: string | null;
  slotInicio: string;
  slotFin: string;
  meetLink: string | null;
  estado: ReunionEstado;
  asistenciaConfirmada: boolean;
  createdAt: string;
}

/** Returned by GET /api/public/bookings/by-token/{token} */
export interface BookingPublicDetail {
  nombre: string;
  slotInicio: string;
  slotFin: string;
  estado: 'confirmada' | 'cancelada';
  meetLink: string | null;
  asistenciaConfirmada: boolean;
}

/** Returned by POST .../confirm and POST .../cancel */
export interface BookingActionResponse {
  ok: boolean;
  estado: 'confirmada' | 'cancelada';
  asistenciaConfirmada?: boolean;
}
