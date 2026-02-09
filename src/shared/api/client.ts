import { API_BASE_URL } from '../utils/constants';
import type { ApiResponse } from '../types/common';

type RequestOptions = RequestInit & { skipAuth?: boolean };

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { skipAuth, ...fetchOptions } = options;

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...fetchOptions,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    },
  });

  if (res.status === 401 && !skipAuth) {
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Lỗi kết nối' }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { method: 'GET', ...options }),
  post: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, { method: 'POST', body: body ? JSON.stringify(body) : undefined, ...options }),
};

// ═══════════════════════════════════════════════════════════════
// GAME CLIENT - Wrapper for game API endpoints
// Automatically parses { success, data } responses and handles 401
// ═══════════════════════════════════════════════════════════════
export const gameClient = {
  get: async <T>(path: string): Promise<T> => {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: 'GET',
      credentials: 'include', // Cookie sent cross-subdomain
      headers: { 'Accept': 'application/json' },
    });

    if (res.status === 401) {
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Lỗi kết nối' }));
      throw new Error(error.message || `HTTP ${res.status}`);
    }

    const result: ApiResponse<T> = await res.json();
    if (!result.success) {
      throw new Error(result.message || 'API Error');
    }
    return result.data;
  },

  post: async <T>(path: string, data?: unknown): Promise<T> => {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (res.status === 401) {
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Lỗi kết nối' }));
      throw new Error(error.message || `HTTP ${res.status}`);
    }

    const result: ApiResponse<T> = await res.json();
    if (!result.success) {
      throw new Error(result.message || 'API Error');
    }
    return result.data;
  },
};
