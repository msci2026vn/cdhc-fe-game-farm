// ============================================================
// GuildListItem — 1 guild trong danh sách
//
// Trạng thái nút:
//   isMyGuild      → dot xanh, không có nút
//   alreadyInGuild → không có nút (đang trong guild khác)
//   canJoin        → nút "Xin vào" (xanh)
//   !canJoin       → text "Thiếu AVAX"
// ============================================================
import { useTranslation } from 'react-i18next';
import type { Guild } from '../hooks/useGuild';

interface Props {
  guild: Guild;
  isMyGuild: boolean;
  alreadyInGuild: boolean;
  canJoin: boolean;
  onJoinRequest: () => void;
}

export function GuildListItem({ guild, isMyGuild, alreadyInGuild, canJoin, onJoinRequest }: Props) {
  const { t } = useTranslation('guild');

  return (
    <div
      className={`rounded-2xl p-4 border transition-all
        ${isMyGuild
          ? 'bg-green-950/40 border-green-700/60'
          : 'bg-gray-900 border-gray-800/80'}`}
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0
          ${isMyGuild ? 'bg-green-900/60' : 'bg-gray-800'}`}>
          🏰
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-white truncate">{guild.name}</span>
            {isMyGuild && (
              <span className="text-xs bg-green-500 text-black px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0">
                {t('list.badge_mine')}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
            <span>👥 {guild.memberCount} {t('list.members_unit')}</span>
            <span>💰 {parseFloat(guild.stakedAmount).toFixed(3)} AVAX</span>
          </div>
          <div className="text-xs text-gray-700 mt-0.5 font-mono">
            {guild.owner.slice(0, 6)}...{guild.owner.slice(-4)}
          </div>
        </div>

        {/* Action */}
        <div className="flex-shrink-0">
          {isMyGuild ? (
            <div className="w-2 h-2 rounded-full bg-green-400" />
          ) : alreadyInGuild ? null : canJoin ? (
            <button
              onClick={onJoinRequest}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs
                font-semibold rounded-xl active:scale-95 transition-all"
            >
              {t('list.join_btn')}
            </button>
          ) : (
            <span className="text-xs text-gray-600 px-2">Thiếu AVAX</span>
          )}
        </div>
      </div>
    </div>
  );
}
