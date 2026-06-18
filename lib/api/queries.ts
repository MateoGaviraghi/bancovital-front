/** Centralized TanStack Query keys. Keep one key per resource for predictable invalidation. */
export const queries = {
  me: ['me'] as const,

  labConfig: ['lab-config'] as const,

  preferenciaPdf: {
    list: () => ['preferencia-pdf'] as const,
    detail: (id: number) => ['preferencia-pdf', id] as const,
    fondoUrl: (id: number) => ['preferencia-pdf', id, 'fondo-url'] as const,
  },

  sedes: {
    list: () => ['sedes'] as const,
    detail: (id: number) => ['sedes', id] as const,
  },

  patients: {
    list: (filters: Record<string, unknown> = {}) => ['patients', filters] as const,
    detail: (id: number) => ['patients', id] as const,
  },

  doctors: {
    list: (filters: Record<string, unknown> = {}) => ['doctors', filters] as const,
    detail: (id: number) => ['doctors', id] as const,
  },

  insurers: {
    list: (filters: Record<string, unknown> = {}) => ['insurers', filters] as const,
    withUb: ['insurers', 'with-ub'] as const,
    ubValues: ['insurers', 'ub-values'] as const,
    ubHistory: (id: number) => ['insurers', id, 'ub-history'] as const,
    detail: (id: number) => ['insurers', id] as const,
  },

  practices: {
    list: (filters: Record<string, unknown> = {}) => ['practices', filters] as const,
    detail: (id: number) => ['practices', id] as const,
    unidades: (practiceId: number) => ['practices', practiceId, 'unidades'] as const,
  },

  orders: {
    list: (filters: Record<string, unknown> = {}) => ['orders', filters] as const,
    detail: (id: number) => ['orders', id] as const,
    lines: (id: number) => ['orders', id, 'lines'] as const,
    results: (id: number) => ['orders', id, 'results'] as const,
  },

  unidadesMedida: {
    list: (q: string) => ['unidades-medida', 'list', q] as const,
    catalog: (filters: Record<string, unknown> = {}) =>
      ['unidades-medida', 'catalog', filters] as const,
    detail: (id: number) => ['unidades-medida', id] as const,
  },

  orderPracticeUnidades: (orderPracticeId: number) =>
    ['order-practices', orderPracticeId, 'unidades'] as const,

  users: ['users'] as const,

  laboratorios: {
    list: () => ['laboratorios'] as const,
    detail: (id: number) => ['laboratorios', id] as const,
  },

  plans: {
    list: () => ['plans'] as const,
    detail: (id: number) => ['plans', id] as const,
  },

  consumo: {
    /** Consumo del ciclo actual del lab autenticado (tenant view). */
    ciclo: () => ['consumo', 'ciclo'] as const,
    /** Resumen de consumo de todos los labs (super view). */
    resumen: () => ['consumo', 'resumen'] as const,
  },

  contracts: {
    /** Public contract detail by token (no auth). */
    public: (token: string) => ['contracts', 'public', token] as const,
    /** Super: list of all contracts. */
    superList: () => ['contracts', 'super', 'list'] as const,
    /** Super: single contract detail. */
    superDetail: (id: number) => ['contracts', 'super', id] as const,
  },

  bookings: {
    /** Public: available slots for a given date. */
    availability: (date: string) => ['bookings', 'availability', date] as const,
    /** Super: list of all meeting bookings. */
    superList: () => ['bookings', 'super', 'list'] as const,
  },

  super: {
    /** Super: aggregate metrics dashboard. */
    metrics: () => ['super', 'metrics'] as const,
    /** Super: audit log (paginated, optionally filtered by lab). */
    audit: (filters: Record<string, unknown> = {}) => ['super', 'audit', filters] as const,
    /** Super: estado de cuenta (movimientos + balance) de un lab. */
    cuenta: (labId: number) => ['super', 'cuenta', labId] as const,
    /** Super: lista de anuncios (global + por lab). */
    announcements: () => ['super', 'announcements'] as const,
    /** Super: onboarding checklist de un lab. */
    onboarding: (labId: number) => ['super', 'onboarding', labId] as const,
  },

  /** Lab-facing: anuncios activos para el lab autenticado (global + propio). */
  announcements: () => ['announcements'] as const,
};
