import { useState, useEffect, useRef } from 'react';
import { useCameraStream } from '@/shared/hooks/useCamera';

export default function CameraLiveView() {
  const { data: stream, isLoading, error } = useCameraStream();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Auto-retry video khi offline
  useEffect(() => {
    if (!isOnline && stream && videoRef.current) {
      const timer = setTimeout(() => {
        if (videoRef.current) {
          const url = stream.hlsUrl || stream.webrtcUrl;
          videoRef.current.src = url + '?retry=' + Date.now();
          videoRef.current.load();
          setRetryCount(prev => prev + 1);
        }
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, retryCount, stream]);

  if (isLoading) {
    return (
      <div className="bg-white/60 border border-stone-200 rounded-xl p-4 animate-pulse">
        <div className="h-4 w-32 bg-stone-200 rounded mb-3" />
        <div className="aspect-video bg-stone-200 rounded-lg" />
      </div>
    );
  }

  // No camera configured or API error — hide section silently
  if (error || !stream) return null;

  const streamUrl = stream.hlsUrl || stream.webrtcUrl;

  return (
    <div className="bg-white/60 border border-green-200 rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full flex items-center justify-between px-4 py-3"
      >
        <div className="flex items-center gap-2">
          <span className="text-base">📹</span>
          <span className="text-sm font-bold text-green-800">Camera Vuon</span>
          <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-400'}`} />
        </div>
        <span className="material-symbols-outlined text-stone-400 text-lg">
          {isCollapsed ? 'expand_more' : 'expand_less'}
        </span>
      </button>

      {!isCollapsed && (
        <div className="px-4 pb-4">
          {/* Video HLS player */}
          <div className="relative">
            <video
              ref={videoRef}
              src={streamUrl}
              autoPlay
              muted
              playsInline
              controls
              className={`w-full aspect-video rounded-lg border border-stone-200 bg-black object-contain ${!isOnline ? 'hidden' : ''}`}
              onPlaying={() => { setIsOnline(true); setRetryCount(0); }}
              onError={() => setIsOnline(false)}
            />

            {/* Offline placeholder */}
            {!isOnline && (
              <div className="w-full aspect-video rounded-lg bg-stone-800 flex items-center justify-center border border-stone-700">
                <div className="text-center text-stone-400">
                  <span className="text-3xl block mb-1">📹</span>
                  <p className="text-sm font-medium">Camera dang offline</p>
                  <p className="text-xs mt-0.5 text-stone-500">Dang thu ket noi lai...</p>
                </div>
              </div>
            )}
          </div>

          {/* Info bar */}
          <div className="flex items-center gap-2 mt-2.5 text-xs">
            <span className={isOnline ? 'text-green-600 font-semibold' : 'text-red-500 font-semibold'}>
              {isOnline ? 'Dang phat truc tiep' : 'Offline'}
            </span>
            <span className="text-stone-300">|</span>
            <span className="text-stone-500">{stream.location}</span>
          </div>
          <div className="text-[11px] text-stone-400 mt-1">
            {stream.name} · {stream.resolution}
          </div>
        </div>
      )}
    </div>
  );
}
