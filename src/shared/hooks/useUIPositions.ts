import { useQuery } from '@tanstack/react-query';
import defaultData from '../../../public/json/ui-match.json';

const API_BASE = import.meta.env.VITE_API_URL || '';

export type UIPosition = {
  left: string; top: string; width: string; height: string;
};
export type UIPositionsMap = Record<string, UIPosition>;

function buildDefaultMap(): UIPositionsMap {
  const map: UIPositionsMap = {};
  (defaultData as any).elements.forEach((el: any) => {
    if (el.position && !el.position.left?.includes('–')) {
      map[el.name] = el.position;
    }
  });
  return map;
}
const DEFAULT_MAP = buildDefaultMap();

export function useUIPositions(screen = 'world-boss') {
  const { data } = useQuery<UIPositionsMap | null>({
    queryKey: ['ui-positions', screen],
    queryFn: async () => {
      try {
        const res = await fetch(`${API_BASE}/api/ui-config?screen=${screen}`);
        const json = await res.json();
        return json.data as UIPositionsMap | null;
      } catch {
        return null;
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const positions = data ? { ...DEFAULT_MAP, ...data } : DEFAULT_MAP;

  function getPos(name: string): React.CSSProperties {
    const p = positions[name];
    if (!p) return { position: 'absolute' };
    return {
      position: 'absolute',
      left: p.left,
      top: p.top,
      width: p.width,
      height: p.height,
    };
  }

  return { getPos };
}
