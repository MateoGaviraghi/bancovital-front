'use client';

import { getSupabase } from '@/lib/supabase-browser';
import axios, { type AxiosInstance } from 'axios';

let cached: AxiosInstance | undefined;

export function getApiClient(): AxiosInstance {
  if (cached) return cached;

  const client = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    timeout: 30_000,
    headers: { 'Content-Type': 'application/json' },
  });

  client.interceptors.request.use(async (config) => {
    const { data } = await getSupabase().auth.getSession();
    if (data.session?.access_token) {
      config.headers.Authorization = `Bearer ${data.session.access_token}`;
    }
    return config;
  });

  client.interceptors.response.use(
    (res) => res,
    (err) => {
      if (err.response?.status === 401 && typeof window !== 'undefined') {
        // Send lab users back to their own branded login
        const seg = window.location.pathname.split('/')[1];
        window.location.href = seg && seg !== 'super' ? `/${seg}/login` : '/login';
      }
      return Promise.reject(err);
    },
  );

  cached = client;
  return client;
}

export const apiClient = getApiClient();
