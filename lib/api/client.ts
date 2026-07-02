'use client';

import { IMPERSONATE_HEADER, getImpersonateLab } from '@/lib/impersonate';
import { getSupabase } from '@/lib/supabase-browser';
import axios, { type AxiosInstance } from 'axios';

let cached: AxiosInstance | undefined;

/**
 * Reads the access token straight from the Supabase auth cookie.
 * getSession() can momentarily return null right after sign-in (or in some
 * client states), so this guarantees the token is attached when the cookie
 * is present.
 */
function readAccessTokenFromCookie(): string | null {
  try {
    const ref = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname.split('.')[0];
    const base = `sb-${ref}-auth-token`;
    const all = document.cookie.split('; ');

    const exact = all.find((c) => c.startsWith(`${base}=`));
    let raw = exact ? decodeURIComponent(exact.slice(base.length + 1)) : '';
    if (!raw) {
      raw = all
        .filter((c) => c.startsWith(`${base}.`))
        .sort()
        .map((c) => decodeURIComponent(c.slice(c.indexOf('=') + 1)))
        .join('');
    }
    if (!raw) return null;

    if (raw.startsWith('base64-')) raw = raw.slice(7);
    const session = JSON.parse(atob(raw));
    return session?.access_token ?? null;
  } catch {
    return null;
  }
}

export function getApiClient(): AxiosInstance {
  if (cached) return cached;

  const client = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    timeout: 30_000,
    headers: { 'Content-Type': 'application/json' },
  });

  client.interceptors.request.use(async (config) => {
    const { data } = await getSupabase().auth.getSession();
    const token = data.session?.access_token ?? readAccessTokenFromCookie();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Super impersonation: attach the impersonated labId so /me and guards
    // resolve to that lab. Cookie is set/cleared by the impersonation flow.
    const impersonateLab = getImpersonateLab();
    if (impersonateLab) {
      config.headers[IMPERSONATE_HEADER] = impersonateLab;
    }
    return config;
  });

  client.interceptors.response.use(
    (res) => res,
    (err) => {
      if (err.response?.status === 401 && typeof window !== 'undefined') {
        const path = window.location.pathname;
        // Don't bounce if we're already on a login page (avoids redirect loops).
        // App única, sin slug routing: siempre redirige a /login.
        if (!path.endsWith('/login')) {
          window.location.href = '/login';
        }
      }
      return Promise.reject(err);
    },
  );

  cached = client;
  return client;
}

export const apiClient = getApiClient();
