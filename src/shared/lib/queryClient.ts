import { QueryClient } from '@tanstack/react-query';

/**
 * Shared QueryClient instance
 *
 * Used by:
 * - App.tsx (QueryClientProvider)
 * - LoginScreen.tsx (prefetch after login)
 * - Anywhere that needs direct queryClient access
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry for 403, 404
        if ([403, 404].includes(error?.status)) return false;
        // For 401: allow ONE retry — handleUnauthorized auto-refreshes token
        // in the background, and the retry will benefit from the new cookie.
        // Most 401 errors throw without .status, so they fall through to default.
        if (error?.status === 401) return failureCount < 1;
        return failureCount < 2;
      },
      // Delay retry to give token refresh time to complete (~1-2s)
      retryDelay: (attemptIndex) => Math.min(1500 * (attemptIndex + 1), 5000),
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});
