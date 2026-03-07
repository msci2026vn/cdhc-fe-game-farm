import { useNavigate } from 'react-router-dom';
import { flushSync } from 'react-dom';

type NavFn = ReturnType<typeof useNavigate>;

/**
 * useNav — drop-in replacement for useNavigate.
 * Wraps navigation with View Transitions API for iOS-smooth page changes.
 * Gracefully falls back to instant navigation when:
 *   - Browser doesn't support startViewTransition (Safari < 18)
 *   - `to` is a numeric delta (history.go) — those are async, can't flushSync
 */
export function useNav(): NavFn {
  const navigate = useNavigate();

  return ((to: any, options?: any) => {
    // Numeric delta (navigate(-1)) is async — VT can't capture it reliably
    if (typeof to === 'number' || !('startViewTransition' in document)) {
      navigate(to, options);
      return;
    }
    (document as any).startViewTransition(() => {
      // flushSync forces React to update the DOM synchronously inside the VT callback
      // so the browser can capture the "new" state for the animation
      flushSync(() => navigate(to, options));
    });
  }) as NavFn;
}
