import { useState, useEffect, useRef } from 'react';
import { useCameraStream } from '@/shared/hooks/useCamera';

export default function CameraLiveView() {
  const { data: stream, isLoading, error } = useCameraStream();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [useHls, setUseHls] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Check stream online status periodically
  useEffect(() => {
    if (!stream?.webrtcUrl) return;

    let mounted = true;
    const check = async () => {
      try {
        await fetch(stream.webrtcUrl, { method: 'HEAD', mode: 'no-cors' });
        if (mounted) setIsOnline(true);
      } catch {
        if (mounted) setIsOnline(false);
      }
    };

    check();
    const interval = setInterval(check, 30_000);
    return () => { mounted = false; clearInterval(interval); };
  }, [stream?.webrtcUrl]);

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
          {/* Video player */}
          {isOnline ? (
            !useHls ? (
              <iframe
                ref={iframeRef}
                src={stream.webrtcUrl}
                className="w-full aspect-video rounded-lg border border-stone-200 bg-black"
                allow="autoplay"
                allowFullScreen
                onError={() => setUseHls(true)}
              />
            ) : stream.hlsUrl ? (
              <video
                src={stream.hlsUrl}
                className="w-full aspect-video rounded-lg border border-stone-200 bg-black"
                autoPlay
                muted
                playsInline
                controls
              />
            ) : (
              <OfflinePlaceholder />
            )
          ) : (
            <OfflinePlaceholder />
          )}

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

          {/* Toggle WebRTC/HLS */}
          {isOnline && stream.hlsUrl && (
            <button
              onClick={() => setUseHls(!useHls)}
              className="mt-2 text-[11px] text-green-600 underline underline-offset-2"
            >
              {useHls ? 'Chuyen WebRTC (nhanh hon)' : 'Chuyen HLS (on dinh hon)'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function OfflinePlaceholder() {
  return (
    <div className="w-full aspect-video rounded-lg bg-stone-800 flex items-center justify-center border border-stone-700">
      <div className="text-center text-stone-400">
        <span className="text-3xl block mb-1">📹</span>
        <p className="text-sm font-medium">Camera dang offline</p>
        <p className="text-xs mt-0.5 text-stone-500">Vui long thu lai sau</p>
      </div>
    </div>
  );
}
