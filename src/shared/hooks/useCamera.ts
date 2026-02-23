import { useQuery } from '@tanstack/react-query';
import { getCameraStreamInfo } from '../api/game-api';
import type { CameraStreamInfo } from '../api/game-api';

export function useCameraStream(deviceId?: string) {
  return useQuery<CameraStreamInfo>({
    queryKey: ['camera', 'stream', deviceId],
    queryFn: () => getCameraStreamInfo(deviceId),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}
