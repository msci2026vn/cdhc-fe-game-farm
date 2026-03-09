import { useState, useEffect, useRef } from 'react';
import { useCameraStream } from '@/shared/hooks/useCamera';
import { useTranslation } from 'react-i18next';

const CameraLiveView = () => {
  const { t } = useTranslation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { data: streamInfo, isLoading, error } = useCameraStream();

  // Check stream availability via GET (not HEAD)
  useEffect(() => {
    if (!streamInfo) return;
    const streamUrl = streamInfo.hlsUrl || streamInfo.webrtcUrl;

    const checkStream = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        await fetch(streamUrl, { mode: 'no-cors', signal: controller.signal });
        clearTimeout(timeoutId);
        setIsOnline(true);
      } catch {
        setIsOnline(false);
      }
    };

    checkStream();
    const interval = setInterval(checkStream, 30000);
    return () => clearInterval(interval);
  }, [streamInfo]);

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

  // No camera
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
          <span className="font-semibold text-gray-800">{t('rwa.camera.title')}</span>
          <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
        </div>
        <span className="text-gray-400 text-sm">{isCollapsed ? '▼' : '▲'}</span>
      </button>

      {!isCollapsed && (
        <>
          {/* Player — iframe mediamtx built-in HLS player */}
          <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black">
            {isOnline ? (
              <>
                <iframe
                  ref={iframeRef}
                  src={streamUrl}
                  className="w-full h-full border-0"
                  allow="autoplay"
                  allowFullScreen
                  onLoad={() => setIframeLoaded(true)}
                />
                {/* Loading spinner while iframe loads */}
                {!iframeLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500" />
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <span className="text-4xl block mb-2">📹</span>
                  <p className="text-sm font-medium">{t('rwa.camera.camera_offline')}</p>
                  <p className="text-xs mt-1">{t('rwa.camera.reconnecting')}</p>
                </div>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="mt-2 flex items-center gap-2 text-sm">
            <span className={isOnline ? 'text-green-600' : 'text-red-500'}>
              {isOnline ? t('rwa.camera.live') : t('rwa.camera.offline')}
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
