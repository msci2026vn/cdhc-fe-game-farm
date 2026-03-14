// ============================================================
// GuildScreen — Màn hình Guild hoàn chỉnh
//
// Trạng thái:
//   A. Chưa có guild → danh sách + nút "Tạo Guild"
//   B. Đang trong guild → "Guild của tôi" + danh sách (không có nút join)
//
// Admin-Editable: LỚP 3 t('guild.*') | LỚP 4 useGuildConfig()
// ============================================================
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGuildList, useMyGuild, useSubnetBalance, type Guild } from '../hooks/useGuild';
import { useGuildConfig } from '../hooks/useGuildConfig';
import { CreateGuildModal } from '../components/CreateGuildModal';
import { JoinGuildModal } from '../components/JoinGuildModal';
import { MyGuildCard } from '../components/MyGuildCard';
import { GuildListItem } from '../components/GuildListItem';

export function GuildScreen() {
  const { t } = useTranslation('guild');
  const [showCreate, setShowCreate] = useState(false);
  const [joinTarget, setJoinTarget] = useState<Guild | null>(null);

  const { data: guilds = [], isLoading: loadingList, refetch } = useGuildList();
  const { data: myGuild, isLoading: loadingMy } = useMyGuild();
  const { data: balanceData, isLoading: loadingBalance } = useSubnetBalance();
  const { data: config } = useGuildConfig();

  const balance = parseFloat(balanceData?.balance || '0');
  const creationFee = parseFloat(config?.creationFee || '0.1');
  const joinFee = parseFloat(config?.joinFee || '0.01');
  const isLoading = loadingList || loadingMy;

  const activeGuilds = guilds.filter(g => g.active);

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">

      {/* ── Header sticky ─────────────────────────────── */}
      <div className="px-4 pt-5 pb-3 bg-gray-950 sticky top-0 z-10 border-b border-gray-800/60">
        <div className="flex items-start justify-between">
          <div>
            {/* LỚP 3: text từ i18n */}
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              ⚔️ {t('screen.title')}
            </h1>
            <p className="text-gray-400 text-xs mt-0.5">{t('screen.subtitle')}</p>
          </div>

          {/* LỚP 4: balance data từ API */}
          <div className="text-right bg-gray-900 rounded-xl px-3 py-2 border border-gray-800">
            <div className="text-xs text-gray-500">{t('balance.label')}</div>
            {loadingBalance ? (
              <div className="w-16 h-4 bg-gray-700 rounded animate-pulse mt-1" />
            ) : (
              <div className={`text-sm font-mono font-bold ${balance > 0 ? 'text-green-400' : 'text-gray-500'}`}>
                {balance.toFixed(4)}
              </div>
            )}
            <div className="text-xs text-gray-600">{t('balance.unit')}</div>
          </div>
        </div>

        {/* Warning thiếu AVAX */}
        {!loadingBalance && balance < joinFee && !myGuild && (
          <div className="mt-2 bg-amber-900/30 border border-amber-700/50 rounded-lg px-3 py-2 flex items-start gap-2">
            <span className="text-amber-400 text-sm">⚠️</span>
            <p className="text-amber-300 text-xs">
              {t('warning.need_avax', { amount: joinFee })}
            </p>
          </div>
        )}
      </div>

      {/* ── Scrollable content ────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 space-y-5">

        {/* Guild của tôi */}
        {myGuild && (
          <section>
            <h2 className="text-xs font-semibold text-green-400 uppercase tracking-widest mb-2">
              {t('my_guild.label')}
            </h2>
            <MyGuildCard guild={myGuild} />
          </section>
        )}

        {/* Nút tạo guild — LỚP 4: fee từ config */}
        {!myGuild && (
          <button
            onClick={() => setShowCreate(true)}
            disabled={balance < creationFee}
            className={`w-full py-3.5 rounded-2xl font-semibold text-sm
              flex items-center justify-center gap-2 transition-all active:scale-95
              ${balance >= creationFee
                ? 'bg-gradient-to-r from-green-600 to-green-500 text-white shadow-lg shadow-green-900/40'
                : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
          >
            {balance >= creationFee ? (
              <><span className="text-lg">🏰</span> {t('create.btn_enough', { fee: creationFee })}</>
            ) : (
              t('create.btn_not_enough', { fee: creationFee, current: balance.toFixed(4) })
            )}
          </button>
        )}

        {/* Danh sách guild */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
              {t('list.title')}
              {activeGuilds.length > 0 && (
                <span className="ml-2 text-gray-600 normal-case font-normal">
                  {activeGuilds.length} guild
                </span>
              )}
            </h2>
            <button
              onClick={() => refetch()}
              className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
            >
              ↻ Làm mới
            </button>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-gray-900 rounded-2xl animate-pulse border border-gray-800" />
              ))}
            </div>
          ) : activeGuilds.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-3">🏰</div>
              <p className="text-gray-400 font-medium">{t('list.empty_title')}</p>
              <p className="text-gray-600 text-sm mt-1">{t('list.empty_desc')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeGuilds.map(guild => (
                <GuildListItem
                  key={guild.id}
                  guild={guild}
                  isMyGuild={myGuild?.id === guild.id}
                  alreadyInGuild={!!myGuild}
                  canJoin={!myGuild && balance >= joinFee}
                  onJoinRequest={() => setJoinTarget(guild)}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ── Modals ──────────────────────────────────────── */}
      {showCreate && (
        <CreateGuildModal
          onClose={() => setShowCreate(false)}
          creationFee={creationFee}
        />
      )}
      {joinTarget && (
        <JoinGuildModal
          guild={joinTarget}
          joinFee={joinFee}
          onClose={() => setJoinTarget(null)}
        />
      )}
    </div>
  );
}
