/**
 * Impersonation state lives in cookies (not localStorage) so the server can
 * read it in SSR layouts and the axios request interceptor can attach the
 * `x-impersonate-lab` header on every call.
 *
 * Cookies (path=/, SameSite=Lax, NOT httpOnly so the client can read them):
 *  - impersonate_lab:  the impersonated labId (the value the API expects in
 *                      the `x-impersonate-lab` header).
 *  - impersonate_name: the lab display name, used by the banner.
 */

export const IMPERSONATE_LAB_COOKIE = 'impersonate_lab';
export const IMPERSONATE_NAME_COOKIE = 'impersonate_name';
export const IMPERSONATE_HEADER = 'x-impersonate-lab';

/** One year — the banner/exit flow is the real lifecycle, not expiry. */
const MAX_AGE = 60 * 60 * 24 * 365;

/** Read a cookie value by name from document.cookie (client-only). */
export function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const prefix = `${name}=`;
  const found = document.cookie.split('; ').find((c) => c.startsWith(prefix));
  return found ? decodeURIComponent(found.slice(prefix.length)) : null;
}

/** Current impersonated labId (client-only). */
export function getImpersonateLab(): string | null {
  return readCookie(IMPERSONATE_LAB_COOKIE);
}

/** Current impersonated lab name (client-only). */
export function getImpersonateName(): string | null {
  return readCookie(IMPERSONATE_NAME_COOKIE);
}

/** Begin impersonation: persist labId + name in cookies (client-only). */
export function setImpersonate(labId: number | string, name: string): void {
  if (typeof document === 'undefined') return;
  const attrs = `path=/; max-age=${MAX_AGE}; SameSite=Lax`;
  document.cookie = `${IMPERSONATE_LAB_COOKIE}=${encodeURIComponent(String(labId))}; ${attrs}`;
  document.cookie = `${IMPERSONATE_NAME_COOKIE}=${encodeURIComponent(name)}; ${attrs}`;
}

/** End impersonation: clear both cookies (client-only). */
export function clearImpersonate(): void {
  if (typeof document === 'undefined') return;
  const expired = 'path=/; max-age=0; SameSite=Lax';
  document.cookie = `${IMPERSONATE_LAB_COOKIE}=; ${expired}`;
  document.cookie = `${IMPERSONATE_NAME_COOKIE}=; ${expired}`;
}
