// ═══════════════════════════════════════════════════════════════
// API UTILS — Shared helpers for all API modules
// ═══════════════════════════════════════════════════════════════

import { queryClient } from '../lib/queryClient';

export { API_BASE_URL } from '../utils/constants';
import { API_BASE_URL } from '../utils/constants';

// ═══════════════════════════════════════════════════════════════
// AUTO-REFRESH TOKEN — Try refresh before forcing logout
// ═══════════════════════════════════════════════════════════════
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

/**
 * Attempt to refresh the access token using the refresh_token cookie (7-day TTL).
 * Deduplicates concurrent calls — if a refresh is already in progress, all callers
 * wait on the same promise.
 */
async function tryRefreshToken(): Promise<boolean> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const response = await fetch(API_BASE_URL + '/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          console.log('[Auth] Token refreshed successfully');
          return true;
        }
      }

      console.warn('[Auth] Refresh failed:', response.status);
      return false;
    } catch (error) {
      console.error('[Auth] Refresh error:', error);
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Wrapper around fetch that auto-retries once on 401 after refreshing tokens.
 * Use this for API calls that need transparent session renewal.
 */
export async function authenticatedFetch(
  url: string,
  options?: RequestInit,
): Promise<Response> {
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
  });

  if (response.status === 401) {
    const refreshed = await tryRefreshToken();

    if (refreshed) {
      // Retry the original request with the new access token cookie
      return fetch(url, {
        ...options,
        credentials: 'include',
      });
    }

    // Refresh also failed — session truly expired
  }

  return response;
}

// ═══════════════════════════════════════════════════════════════
// GLOBAL 401 HANDLER — Single source of truth for session expiry
// ═══════════════════════════════════════════════════════════════
let isRedirecting = false;
let redirectTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * Reset redirect lock — call after successful login so future 401s
 * can trigger redirect again.
 */
export function resetRedirectLock() {
  isRedirecting = false;
  if (redirectTimeout) {
    clearTimeout(redirectTimeout);
    redirectTimeout = null;
  }
}

/**
 * Handle 401 — attempt refresh first, only redirect if refresh also fails.
 * Call this when any API response returns 401.
 */
export async function handleUnauthorized(context: string = 'API') {
  if (isRedirecting) return;

  // Try refresh first before giving up
  const refreshed = await tryRefreshToken();
  if (refreshed) {
    console.log(`[GameAPI] 401 in ${context} — refreshed successfully, NOT redirecting`);
    return;
  }

  // Refresh failed — truly expired, proceed with logout redirect
  if (isRedirecting) return; // Re-check after async refresh
  isRedirecting = true;

  console.warn(`[GameAPI] 401 Unauthorized in ${context} — refresh failed, redirecting to login`);

  // Cancel active queries to stop background refetches,
  // then invalidate auth so components know session is gone.
  try {
    queryClient.cancelQueries();
    queryClient.setQueryData(['auth', 'status'], {
      isLoggedIn: false, user: null
    });
  } catch (_) { /* ignore */ }

  // Show toast notification
  try {
    const toastEvent = new CustomEvent('session-expired', {
      detail: { message: 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.' }
    });
    window.dispatchEvent(toastEvent);
  } catch (_) { /* ignore */ }

  // Redirect to login after a short delay to show toast
  redirectTimeout = setTimeout(() => {
    window.location.href = '/login';
  }, 800);

  // Safety: auto-reset lock after 5s in case redirect doesn't happen
  // (e.g. network issue, browser blocks navigation)
  setTimeout(() => {
    resetRedirectLock();
  }, 5000);
}

// ═══════════════════════════════════════════════════════════════
// 401 CHECK HELPER — Use in API functions for transparent refresh
// ═══════════════════════════════════════════════════════════════

/**
 * Check response for 401, try refresh, and re-execute the original request.
 * Returns the new response if refresh+retry succeeded, or null if caller
 * should proceed with original error handling.
 *
 * Usage in API functions:
 *   const response = await fetch(url, opts);
 *   if (response.status === 401) {
 *     const retried = await retryAfterRefresh(url, opts);
 *     if (retried) return retried; // Use the retried response
 *     handleUnauthorized('context');
 *     throw new Error('Session expired');
 *   }
 */
export async function retryAfterRefresh(
  url: string,
  options?: RequestInit,
): Promise<Response | null> {
  const refreshed = await tryRefreshToken();
  if (!refreshed) return null;

  // Retry with new token
  const retried = await fetch(url, {
    ...options,
    credentials: 'include',
  });

  // If retry also 401, give up
  if (retried.status === 401) return null;

  return retried;
}

// ═══════════════════════════════════════════════════════════════
// ERROR HANDLER HELPER
// ═══════════════════════════════════════════════════════════════
export async function handleApiError(response: Response): Promise<never> {
  // Handle 401 globally — attempt refresh, then redirect to login
  if (response.status === 401) {
    await handleUnauthorized('API call');
    throw new Error('Session expired');
  }

  const isServerError = response.status >= 500 && response.status <= 599;
  const errorData = await response.json().catch(() => ({}));
  
  const errMsg = typeof errorData?.error === 'string'
    ? errorData.error
    : errorData?.error?.message || errorData?.message || `API Error: ${response.status}`;
    
  const err = new Error(isServerError ? 'Server is currently undergoing maintenance. Please try again later.' : errMsg);
  (err as any).status = response.status;
  (err as any).isServerError = isServerError;
  (err as any).code = typeof errorData?.error === 'object' ? errorData?.error?.code : (isServerError ? 'SERVER_ERROR' : 'UNKNOWN');
  (err as any).cooldownRemaining = typeof errorData?.error === 'object' ? errorData?.error?.cooldownRemaining : undefined;

  if (!isServerError) {
    console.log('[GameAPI] handleApiError()', JSON.stringify({
      status: response.status,
      code: (err as any).code,
      message: err.message,
    }));
  }

  throw err;
}
