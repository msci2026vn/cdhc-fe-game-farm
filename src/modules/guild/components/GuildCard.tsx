// ============================================================
// GuildCard — Admin-Editable
// LỚP 1: getPos('GuildCard') — applied when admin sets coordinates
// LỚP 2: guild icon từ getSpriteUrl(), fallback /assets/guild/default.svg
// LỚP 3: text từ t('guild.list.*')
// ============================================================
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUIPositions } from '@/shared/hooks/useUIPositions';
import { useSprites } from '@/shared/hooks/useSprites';
import type { Guild } from '../hooks/useGuild';
import { useJoinGuild } from '../hooks/useGuild';

interface Props {
  guild: Guild;
  isMyGuild: boolean;
  canJoin: boolean;
}

export function GuildCard({ guild, isMyGuild, canJoin }: Props) {
  const { t } = useTranslation('guild');
  const { getPos } = useUIPositions('guild');
  const { getSpriteUrl } = useSprites();
  const [joining, setJoining] = useState(false);
  const joinMutation = useJoinGuild();

  // LỚP 1: only apply getPos style if admin has set explicit coordinates
  const posStyle = getPos('GuildCard');
  const cardStyle = (posStyle.left !== undefined || posStyle.top !== undefined) ? posStyle : {};

  const handleJoin = async () => {
    setJoining(true);
    try {
      await joinMutation.mutateAsync(guild.id);
    } catch (err: any) {
      alert(err?.message || t('errors.join_failed'));
    } finally {
      setJoining(false);
    }
  };

  return (
    <div
      style={cardStyle}
      className={`rounded-xl p-4 border transition-all
        ${isMyGuild
          ? 'bg-green-900/20 border-green-600'
          : 'bg-gray-900 border-gray-800 hover:border-gray-600'}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* LỚP 2: guild icon từ sprite system */}
          <img
            src={getSpriteUrl(`guild_icon_${guild.id}`)}
            onError={e => { (e.target as HTMLImageElement).src = '/assets/guild/default.svg'; }}
            className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
            alt={guild.name}
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-white truncate">
                {guild.name}
              </span>
              {/* LỚP 3: badge text từ i18n */}
              {isMyGuild && (
                <span className="text-xs bg-green-500 text-black px-2 py-0.5 rounded-full font-semibold flex-shrink-0">
                  {t('list.badge_mine')}
                </span>
              )}
              {!guild.active && (
                <span className="text-xs bg-red-900 text-red-300 px-2 py-0.5 rounded-full flex-shrink-0">
                  {t('list.badge_dissolved')}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
              <span>👥 {t('list.members_count', { count: guild.memberCount })}</span>
              <span>💰 {t('list.staked', { amount: parseFloat(guild.stakedAmount).toFixed(3) })}</span>
            </div>

            <div className="text-xs text-gray-600 mt-1 font-mono">
              {t('list.owner_label')}: {guild.owner.slice(0, 6)}...{guild.owner.slice(-4)}
            </div>
          </div>
        </div>

        {!isMyGuild && guild.active && canJoin && (
          <button
            onClick={handleJoin}
            disabled={joining || joinMutation.isPending}
            className="ml-3 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm
              rounded-lg font-medium active:scale-95 transition-all
              disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            {joining ? '...' : t('list.join_btn')}
          </button>
        )}
      </div>
    </div>
  );
}
