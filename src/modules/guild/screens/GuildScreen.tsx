// ============================================================
// GuildScreen — Admin-Editable
// LỚP 1: getPos('GuildScreen') — applied to outer container
// LỚP 3: text từ t('guild.*')
// LỚP 4: config từ useGuildConfig()
// ============================================================
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUIPositions } from '@/shared/hooks/useUIPositions';
import { useGuildList, useMyGuild, useSubnetBalance } from '../hooks/useGuild';
import { useGuildConfig } from '../hooks/useGuildConfig';
import { GuildCard } from '../components/GuildCard';
import { MyGuildCard } from '../components/MyGuildCard';
import { CreateGuildModal } from '../components/CreateGuildModal';

export function GuildScreen() {
  const { t } = useTranslation('guild');
  const { getPos } = useUIPositions('guild');
  const [showCreate, setShowCreate] = useState(false);

  const { data: guilds, isLoading: loadingList } = useGuildList();
  const { data: myGuild, isLoading: loadingMy } = useMyGuild();
  const { data: balanceData } = useSubnetBalance();
  const { data: config } = useGuildConfig();

  const balance = parseFloat(balanceData?.balance || '0');
  const creationFee = parseFloat(config?.creationFee || '0.1');
  const joinFee = parseFloat(config?.joinFee || '0.01');
  const hasEnoughForCreate = balance >= creationFee;
  const hasEnoughForJoin = balance >= joinFee;
  const isLoading = loadingList || loadingMy;

  // LỚP 1: apply getPos to outer container
  const screenStyle = getPos('GuildScreen');

  return (
    <div
      style={screenStyle}
      className="min-h-screen bg-gray-950 text-white p-4 pb-24 overflow-y-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          {/* LỚP 3: text từ i18n */}
          <h1 className="text-2xl font-bold text-green-400">
            ⚔️ {t('screen.title')}
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {t('screen.subtitle')}
          </p>
        </div>

        <div className="text-right">
          <div className="text-xs text-gray-500">{t('balance.label')}</div>
          <div className={`text-sm font-mono font-bold
            ${balance > 0 ? 'text-green-400' : 'text-gray-500'}`}>
            {balance.toFixed(4)} {t('balance.unit')}
          </div>
        </div>
      </div>

      {/* Warning nếu không đủ AVAX */}
      {balance < joinFee && !myGuild && (
        <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-3 mb-4 text-sm text-yellow-300">
          ⚠️ {t('warning.need_avax', { amount: joinFee })}
          {' '}{t('warning.contact_admin')}
        </div>
      )}

      {/* Guild của user */}
      {myGuild && (
        <div className="mb-6">
          <h2 className="text-sm text-gray-400 uppercase tracking-wider mb-2">
            {t('my_guild.label')}
          </h2>
          <MyGuildCard guild={myGuild} />
        </div>
      )}

      {/* Nút tạo guild — LỚP 4: fee từ config API */}
      {!myGuild && (
        <button
          onClick={() => setShowCreate(true)}
          disabled={!hasEnoughForCreate}
          className={`w-full py-3 rounded-xl font-semibold text-sm mb-6 transition-all
            ${hasEnoughForCreate
              ? 'bg-green-500 hover:bg-green-400 text-black active:scale-95'
              : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
        >
          {hasEnoughForCreate
            ? t('create.btn_enough', { fee: creationFee })
            : t('create.btn_not_enough', { fee: creationFee, current: balance.toFixed(4) })}
        </button>
      )}

      {/* Danh sách guild */}
      <div>
        <h2 className="text-sm text-gray-400 uppercase tracking-wider mb-3">
          {t('list.title')} {guilds ? `(${guilds.length})` : ''}
        </h2>

        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : guilds?.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            <div className="text-4xl mb-2">🏰</div>
            <p>{t('list.empty_title')}</p>
            <p className="text-sm mt-1">{t('list.empty_desc')}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {guilds?.map(guild => (
              <GuildCard
                key={guild.id}
                guild={guild}
                isMyGuild={myGuild?.id === guild.id}
                canJoin={!myGuild && hasEnoughForJoin}
              />
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateGuildModal
          onClose={() => setShowCreate(false)}
          creationFee={creationFee}
        />
      )}
    </div>
  );
}
