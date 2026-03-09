// ═══════════════════════════════════════════════════════════════
// API AUTH — ping, logout, auth status, passkeys
// ═══════════════════════════════════════════════════════════════

import { handleUnauthorized, handleApiError, API_BASE_URL } from './api-utils';
import { queryClient } from '../lib/queryClient';
import type { ApiResponse } from '../types/common';
import type { PingResult, AuthStatus } from '../types/game-api.types';

export const authApi = {
  /**
   * Health check - test auth chain (bước 8)
   * Success = route + auth + CORS + cookie ALL work
   */
  ping: async (): Promise<PingResult> => {
    try {
      const res = await fetch(API_BASE_URL + '/api/game/ping', {
        method: 'GET',
        credentials: 'include', // ← BẮT BUỘC — gửi cookie cross-subdomain
        headers: { 'Accept': 'application/json' },
      });

      if (res.status === 401) {
        // Session expired — redirect to login
        handleUnauthorized('ping');
        return { success: false, message: 'Unauthorized — cần đăng nhập' };
      }

      if (res.status === 403) {
        return { success: false, message: 'Forbidden — tài khoản chưa được duyệt' };
      }

      if (!res.ok) {
        return { success: false, message: `HTTP ${res.status}` };
      }

      const result: ApiResponse<{ message: string; userId: string; email: string; timestamp: string }> = await res.json();
      if (!result.success) {
        return { success: false, message: result.message || 'API Error' };
      }

      return {
        success: true,
        message: result.data.message,
      };
    } catch (error) {
      return { success: false, message: String(error) };
    }
  },

  /**
   * Logout — xóa session cookie phía server, clear local data, redirect về /login
   */
  logout: async (): Promise<void> => {
    try {
      await fetch(API_BASE_URL + '/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.warn('[GameAPI] logout request failed:', error);
    }

    // Clear toàn bộ TanStack Query cache — tránh data leak giữa các user
    try {
      queryClient.clear();
    } catch (_) { /* ignore */ }

    // Clear farmverse localStorage data to prevent stale data on next login
    try {
      Object.keys(localStorage)
        .filter(key => key.startsWith('farmverse_'))
        .forEach(key => localStorage.removeItem(key));
    } catch (_) { /* ignore */ }

    // Dù API thành công hay thất bại, luôn redirect về login
    window.location.href = '/login';
  },

  /**
   * Get auth status - Check if user is logged in
   * Bước 10 — REAL API: Calls /api/auth/me
   */
  getAuthStatus: async (): Promise<AuthStatus> => {
    try {
      const response = await fetch(API_BASE_URL + '/api/auth/me', {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.status === 401) {
        // Don't redirect here - this is used to check auth status initially
        // The caller (AuthGuard) will handle the redirect
        return { isLoggedIn: false, user: null };
      }

      if (!response.ok) {
        console.error('[GameAPI] getAuthStatus failed:', response.status);
        return { isLoggedIn: false, user: null };
      }

      const json = await response.json();
      if (!json.success) {
        return { isLoggedIn: false, user: null };
      }

      // Return user data
      return {
        isLoggedIn: true,
        user: json.data || json.user || null,
      };
    } catch (error) {
      console.error('[GameAPI] getAuthStatus error:', error);
      return { isLoggedIn: false, user: null };
    }
  },

  // ═══ PASSKEY (WebAuthn) ═══

  getPasskeyRegisterOptions: async (): Promise<any> => {
    const url = API_BASE_URL + '/api/auth/passkey/register/options';
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    if (response.status === 401) { handleUnauthorized('getPasskeyRegisterOptions'); throw new Error('Session expired'); }
    if (!response.ok) { await handleApiError(response); }
    const json = await response.json();
    return json.options;
  },

  registerPasskey: async (credential: any): Promise<any> => {
    const url = API_BASE_URL + '/api/auth/passkey/register/verify';
    const { friendlyName, ...response } = credential;
    const res = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ response, friendlyName }),
    });
    if (res.status === 401) { handleUnauthorized('registerPasskey'); throw new Error('Session expired'); }
    if (!res.ok) { await handleApiError(res); }
    const json = await res.json();
    return json;
  },

  listPasskeys: async (): Promise<Array<{ id: string; friendlyName: string; createdAt: string }>> => {
    const url = API_BASE_URL + '/api/auth/passkey/list';
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    if (response.status === 401) { handleUnauthorized('listPasskeys'); throw new Error('Session expired'); }
    if (!response.ok) { await handleApiError(response); }
    const json = await response.json();
    return json.passkeys || json.data || [];
  },
};
