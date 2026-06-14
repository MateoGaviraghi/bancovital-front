import { getSessionToken } from '@/lib/auth/session';
import { IMPERSONATE_HEADER, IMPERSONATE_LAB_COOKIE } from '@/lib/impersonate';
import axios, { type AxiosInstance } from 'axios';
import { cookies } from 'next/headers';
import { cache } from 'react';

export const getServerApi = cache(async (): Promise<AxiosInstance> => {
  const token = await getSessionToken();
  // Super impersonation: forward the impersonated labId to the API so /me and
  // SSR guards resolve to that lab.
  const impersonateLab = (await cookies()).get(IMPERSONATE_LAB_COOKIE)?.value;
  return axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    timeout: 30_000,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(impersonateLab ? { [IMPERSONATE_HEADER]: impersonateLab } : {}),
    },
  });
});

/** Extract a NestJS-style error message ({statusCode, message: string | string[], error}). */
export function extractApiError(err: unknown, fallback = 'Error inesperado'): string {
  if (axios.isAxiosError(err)) {
    const msg = err.response?.data?.message;
    if (Array.isArray(msg)) return msg.join('. ');
    if (typeof msg === 'string') return msg;
  }
  return fallback;
}
