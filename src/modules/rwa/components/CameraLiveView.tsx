import { useState, useEffect, useRef } from 'react';
import { useCameraStream } from '@/shared/hooks/useCamera';

const CameraLiveView = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isOnline, setIsOnline] = useState(true); // default true, video sẽ tự detect
  const [retryCount, setRetryCount] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { data: streamInfo, isLoading, error } = useCameraStream();

  // Auto-retry video khi lỗi
  useEffect(() => {
    if (!isOnline && streamInfo && videoRef.current) {
      const timer = setTimeout(() => {
        if (videoRef.current && streamInfo) {
          const url = streamInfo.hlsUrl || streamInfo.webrtcUrl;
          videoRef.current.src = url + '?retry=' + Date.now();
          videoRef.current.load();
          setRetryCount(prev => prev + 1);
        }
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, retryCount, streamInfo]);

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
        <div className="animate-pulse">
          <div className="h-5 bg-gray-200 rounded w-32 mb-3" />
          <div className="aspect-video bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  // No camera hoặc lỗi API → ẩn hoàn toàn
  if (error || !streamInfo) return null;

  const streamUrl = streamInfo.hlsUrl || streamInfo.webrtcUrl;

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
      {/* Header */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center justify-between w-full mb-3"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">📹</span>
          <span className="font-semibold text-gray-800">Camera Vườn</span>
          <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
        </div>
        <span className="text-gray-400 text-sm">{isCollapsed ? '▼' : '▲'}</span>
      </button>

      {!isCollapsed && (
        <>
          {/* Video Player */}
          <div className="relative">
            <video
              ref={videoRef}
              src={streamUrl}
              autoPlay
              muted
              playsInline
              controls
              className={`w-full aspect-video rounded-xl bg-black object-contain ${!isOnline ? 'hidden' : ''}`}
              onPlaying={() => { setIsOnline(true); setRetryCount(0); }}
              onError={() => setIsOnline(false)}
            />

            {/* Offline placeholder */}
            {!isOnline && (
              <div className="w-full aspect-video rounded-xl bg-gray-800 flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <span className="text-4xl block mb-2">📹</span>
                  <p className="text-sm font-medium">Camera đang offline</p>
                  <p className="text-xs mt-1">Đang thử kết nối lại...</p>
                </div>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="mt-2 flex items-center gap-2 text-sm">
            <span className={isOnline ? 'text-green-600' : 'text-red-500'}>
              {isOnline ? 'Đang phát trực tiếp' : 'Offline'}
            </span>
            <span className="text-gray-300">|</span>
            <span className="text-gray-500">{streamInfo.location}</span>
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {streamInfo.name} · {streamInfo.resolution}
          </div>
        </>
      )}
    </div>
  );
};

export default CameraLiveView;
