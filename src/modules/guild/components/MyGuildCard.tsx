// ============================================================
// MyGuildCard — Admin-Editable
// LỚP 1: getPos('MyGuildCard')
// LỚP 2: banner từ getSpriteUrl('guild_banner'), fallback /assets/guild/banner.svg
// LỚP 3: text từ t('guild.my_guild.*')
// ============================================================
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUIPositions } from '@/shared/hooks/useUIPositions';
import { useSprites } from '@/shared/hooks/useSprites';
import type { Guild } from '../hooks/useGuild';
import { useLeaveGuild } from '../hooks/useGuild';

interface Props {
  guild: Guild;
}

export function MyGuildCard({ guild }: Props) {
  const { t } = useTranslation('guild');
  const { getPos } = useUIPositions('guild');
  const { getSpriteUrl } = useSprites();
  const [confirmLeave, setConfirmLeave] = useState(false);
  const leaveMutation = useLeaveGuild();

  // LỚP 1: only apply getPos when admin has set explicit coordinates
  const posStyle = getPos('MyGuildCard');
  const cardStyle = (posStyle.left !== undefined || posStyle.top !== undefined) ? posStyle : {};

  const handleLeave = async () => {
    try {
      await leaveMutation.mutateAsync();
      setConfirmLeave(false);
    } catch (err: any) {
      alert(err?.message || t('errors.leave_failed'));
    }
  };

  return (
    <div
      style={cardStyle}
      className="rounded-xl p-4 border border-green-600 relative overflow-hidden
        bg-gradient-to-br from-green-900/40 to-gray-900"
    >
      {/* LỚP 2: banner sprite */}
      <img
        src={getSpriteUrl('guild_banner')}
        onError={e => { (e.target as HTMLImageElement).src = '/assets/guild/banner.svg'; }}
        className="absolute top-0 right-0 h-full opacity-10 object-cover pointer-events-none"
        alt=""
      />

      <div className="flex items-start justify-between relative">
        <div>
          <div className="text-xs text-green-400 font-semibold uppercase tracking-wider mb-1">
            {t('my_guild.label')}
          </div>
          <div className="text-xl font-bold text-white">🏰 {guild.name}</div>

          <div className="flex gap-4 mt-2 text-sm text-gray-300">
            <div>
              <span className="text-gray-500 text-xs">{t('my_guild.members')}</span>
              <div className="font-semibold">👥 {guild.memberCount}</div>
            </div>
            <div>
              <span className="text-gray-500 text-xs">{t('my_guild.total_stake')}</span>
              <div className="font-semibold text-green-400">
                {parseFloat(guild.stakedAmount).toFixed(3)} AVAX
              </div>
            </div>
          </div>
        </div>

        {!confirmLeave ? (
          <button
            onClick={() => setConfirmLeave(true)}
            className="text-xs text-gray-500 hover:text-red-400 transition-colors px-2 py-1"
          >
            {t('my_guild.leave')}
          </button>
        ) : (
          <div className="flex flex-col gap-1 items-end">
            <div className="text-xs text-red-400">{t('my_guild.confirm_leave')}</div>
            <div className="text-xs text-gray-500">{t('my_guild.refund_note')}</div>
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => setConfirmLeave(false)}
                className="text-xs px-2 py-1 bg-gray-700 rounded"
              >
                {t('my_guild.cancel')}
              </button>
              <button
                onClick={handleLeave}
                disabled={leaveMutation.isPending}
                className="text-xs px-2 py-1 bg-red-700 hover:bg-red-600 rounded disabled:opacity-50"
              >
                {leaveMutation.isPending ? '...' : t('my_guild.confirm')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
