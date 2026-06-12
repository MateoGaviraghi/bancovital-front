/** Centralized TanStack Query keys. Keep one key per resource for predictable invalidation. */
export const queries = {
  me: ['me'] as const,

  labConfig: ['lab-config'] as const,

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
};
