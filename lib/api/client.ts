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
        window.location.href = '/login';
      }
      return Promise.reject(err);
    },
  );

  cached = client;
  return client;
}

export const apiClient = getApiClient();
