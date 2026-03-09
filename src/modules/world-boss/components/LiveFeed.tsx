import { useRef, useEffect } from 'react';
import type { WorldBossFeedEntry } from '../types/world-boss.types';
import { useTranslation } from 'react-i18next';

function timeAgo(timestamp: number, t: any): string {
  const diff = Math.floor((Date.now() - timestamp) / 1000);
  if (diff < 5) return t('world_boss.live_feed.just_now');
  if (diff < 60) return t('world_boss.live_feed.seconds_ago', { time: diff });
  if (diff < 3600) return t('world_boss.live_feed.minutes_ago', { time: Math.floor(diff / 60) });
  return t('world_boss.live_feed.hours_ago', { time: Math.floor(diff / 3600) });
}

interface LiveFeedProps {
  feed: WorldBossFeedEntry[];
}

export function LiveFeed({ feed }: LiveFeedProps) {
  const { t } = useTranslation();
  const feedRef = useRef<HTMLDivElement>(null);
  const prevFirstKey = useRef('');

  useEffect(() => {
    if (!feed.length) return;
    const currentKey = feed[0].userId + feed[0].timestamp;
    if (currentKey !== prevFirstKey.current) {
      prevFirstKey.current = currentKey;
      feedRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [feed]);

  const visible = feed.slice(0, 15);

  return (
    <div
      ref={feedRef}
      className="px-4 py-2"
    >
      {visible.length === 0 ? (
        <p className="text-xs text-gray-500 text-center py-4">{t('world_boss.live_feed.no_activity')}</p>
      ) : (
        <div className="flex flex-col gap-0.5">
          {visible.map((entry, i) => {
            const opacity = Math.max(0.4, 1 - i * 0.05);
            return (
              <div
                key={entry.userId + entry.timestamp}
                className="flex items-center justify-between text-xs py-1"
                style={{ opacity }}
              >
                <span className="text-gray-300 flex items-center gap-1 min-w-0">
                  <span className="flex-shrink-0">⚔️</span>
                  <span className="font-mono truncate" style={{ maxWidth: 80 }}>
                    {entry.username ?? entry.userId.slice(0, 10)}
                  </span>
                  {entry.isCrit && (
                    <span className="bg-red-600 text-white text-xs px-1 rounded flex-shrink-0">
                      CRIT
                    </span>
                  )}
                </span>
                <span className="flex items-center gap-2 flex-shrink-0 ml-1">
                  <span className="text-yellow-400 font-mono">{entry.damage.toLocaleString()}</span>
                  <span className="text-gray-500 text-xs">{timeAgo(entry.timestamp, t)}</span>
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
