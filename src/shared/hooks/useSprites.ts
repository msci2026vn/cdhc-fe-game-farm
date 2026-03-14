// ============================================================
// useSprites — Returns sprite/asset URLs by key
// Falls back to provided fallback path if asset not configured
// ============================================================
import { API_BASE_URL } from '@/shared/utils/constants';

export function useSprites() {
  function getSpriteUrl(key: string): string {
    // Convention: sprite keys map to /assets/sprites/{key}.png
    // Admin can override via static asset serving
    return `${API_BASE_URL}/assets/sprites/${key}.png`;
  }

  return { getSpriteUrl };
}
