// ═══════════════════════════════════════════════════════════════
// API UTILS — Shared helpers for all API modules
// ═══════════════════════════════════════════════════════════════

import { queryClient } from '../lib/queryClient';
import { useUIStore } from '../stores/uiStore';

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
async function tryRefreshToken(retryCount = 0): Promise<boolean> {
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
      
      // Retry once if it was a technical error (not 401/403)
      if (retryCount < 1 && response.status >= 500) {
        console.log('[Auth] Retrying refresh...');
        isRefreshing = false; // Reset for retry
        return tryRefreshToken(retryCount + 1);
      }

      return false;
    } catch (error) {
      console.error('[Auth] Refresh error:', error);
      if (retryCount < 1) {
          isRefreshing = false;
          return tryRefreshToken(retryCount + 1);
      }
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

  console.log(`[GameAPI] 401 in ${context} — attempting silent refresh...`);

  // Try refresh first before giving up
  const refreshed = await tryRefreshToken();
  if (refreshed) {
    console.log(`[GameAPI] 401 in ${context} — refreshed successfully, NOT redirecting`);
    return;
  }

  // Refresh failed — truly expired, proceed with logout overlay
  if (isRedirecting) return; // Re-check after async refresh
  isRedirecting = true;

  console.warn(`[GameAPI] 401 Unauthorized in ${context} — refresh failed, showing session expired overlay`);

  // Cancel active queries to stop background refetches,
  // then invalidate auth so components know session is gone.
  try {
    queryClient.cancelQueries();
    queryClient.setQueryData(['auth', 'status'], {
      isLoggedIn: false, user: null
    });
  } catch (_) { /* ignore */ }

  // Set global session expired state in UI store
  // This will trigger the SessionExpiredOverlay instead of immediate window.location change
  try {
    useUIStore.getState().setSessionExpired(true);
  } catch (_) { /* ignore */ }

  // We still provide a safety redirect after a VERY long time (5 mins) 
  // if the user doesn't interact with the overlay
  redirectTimeout = setTimeout(() => {
    if (useUIStore.getState().isSessionExpired) {
        window.location.href = '/login';
    }
  }, 300000); 

  // Dispatch event for any local listeners
  try {
    const toastEvent = new CustomEvent('session-expired', {
      detail: { message: 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.' }
    });
    window.dispatchEvent(toastEvent);
  } catch (_) { /* ignore */ }
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

  const errorData = await response.json().catch(() => ({}));
  const errMsg = typeof errorData?.error === 'string'
    ? errorData.error
    : errorData?.error?.message || errorData?.message || `API Error: ${response.status}`;
  const err = new Error(errMsg);
  (err as any).status = response.status;
  (err as any).code = typeof errorData?.error === 'object' ? errorData?.error?.code : 'UNKNOWN';
  (err as any).cooldownRemaining = typeof errorData?.error === 'object' ? errorData?.error?.cooldownRemaining : undefined;

  console.log('[FARM-DEBUG] handleApiError()', JSON.stringify({
    status: response.status,
    code: (err as any).code,
    message: err.message,
    cooldownRemaining: (err as any).cooldownRemaining,
  }));

  throw err;
}
