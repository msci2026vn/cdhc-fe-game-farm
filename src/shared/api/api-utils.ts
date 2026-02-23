// ═══════════════════════════════════════════════════════════════
// API UTILS — Shared helpers for all API modules
// ═══════════════════════════════════════════════════════════════

import { queryClient } from '../lib/queryClient';

export { API_BASE_URL } from '../utils/constants';

// ═══════════════════════════════════════════════════════════════
// GLOBAL 401 HANDLER — Single source of truth for session expiry
// ═══════════════════════════════════════════════════════════════
let isRedirecting = false;

/**
 * Reset redirect lock — call after successful login so future 401s
 * can trigger redirect again.
 */
export function resetRedirectLock() {
  isRedirecting = false;
}

export function handleUnauthorized(context: string = 'API') {
  if (isRedirecting) return; // Prevent multiple redirects
  isRedirecting = true;

  console.warn(`[GameAPI] 401 Unauthorized in ${context} — redirecting to login`);

  // ⚠️ FIX: Do NOT call queryClient.clear() here!
  // clear() wipes ALL cached data, causing every active hook to refetch.
  // Those refetches also hit 401 → creating a cascade of redirects.
  // Instead, only cancel active queries to stop background refetches,
  // then invalidate auth so components know session is gone.
  try {
    queryClient.cancelQueries();                      // Stop all in-flight + auto-refetches
    queryClient.setQueryData(['auth', 'status'], {    // Immediately mark as logged-out
      isLoggedIn: false, user: null
    });
  } catch (_) { /* ignore */ }

  // Show toast notification (if available)
  try {
    const toastEvent = new CustomEvent('session-expired', {
      detail: { message: 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.' }
    });
    window.dispatchEvent(toastEvent);
  } catch (e) {
    // Ignore if toast not available
  }

  // Redirect to login after a short delay to show toast
  setTimeout(() => {
    window.location.href = '/login';
  }, 800);
}

// ═══════════════════════════════════════════════════════════════
// ERROR HANDLER HELPER
// ═══════════════════════════════════════════════════════════════
export async function handleApiError(response: Response): Promise<never> {
  // Handle 401 globally — redirect to login
  if (response.status === 401) {
    handleUnauthorized('API call');
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
