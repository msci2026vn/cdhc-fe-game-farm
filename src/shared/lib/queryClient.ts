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
        // Don't retry for 401, 403, 404
        if ([401, 403, 404].includes(error?.status)) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});
