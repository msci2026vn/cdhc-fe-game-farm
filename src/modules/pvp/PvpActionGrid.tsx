import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function PvpActionGrid({
  onPlayBot,
  botLoading,
  onInviteFriend,
  onFindMatch,
  findMatchDisabled,
  onRoomList,
  onCreateRoom,
  createRoomLoading,
  isPublic,
  onTogglePublic,
}: {
  onPlayBot: () => void;
  botLoading: boolean;
  onInviteFriend: () => void;
  onFindMatch: () => void;
  findMatchDisabled: boolean;
  onRoomList: () => void;
  onCreateRoom: () => void;
  createRoomLoading: boolean;
  isPublic: boolean;
  onTogglePublic: () => void;
}) {
  const navigate = useNavigate();
  const { t } = useTranslation('pvp');

  return (
    <>
      {/* Build button */}
      <button
        onClick={() => navigate('/pvp/build')}
        style={{
          width: '100%', padding: '12px', borderRadius: 12, marginBottom: 10,
          background: 'linear-gradient(135deg,#b45309,#92400e)',
          color: '#fff', cursor: 'pointer', textAlign: 'center',
          border: '1px solid #b45309',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        }}
      >
        <span style={{ fontSize: 22 }}>⚙️</span>
        <span style={{ fontSize: 14, fontWeight: 700 }}>Thiết Lập Build</span>
      </button>

      {/* Play vs Bot — full width highlight */}
      <button
        onClick={onPlayBot}
        disabled={botLoading}
        style={{
          width: '100%', padding: '14px', borderRadius: 12, marginBottom: 10,
          background: botLoading
            ? 'linear-gradient(135deg,#333,#222)'
            : 'linear-gradient(135deg,#dc2626,#b91c1c)',
          color: '#fff', cursor: botLoading ? 'not-allowed' : 'pointer',
          textAlign: 'center', border: '1px solid #dc2626',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          opacity: botLoading ? 0.7 : 1,
        }}
      >
        <span style={{ fontSize: 26 }}>🤖</span>
        <span style={{ fontSize: 15, fontWeight: 700 }}>
          {botLoading ? t('common.loading') : t('bot.playWithBot')}
        </span>
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
        {/* Mời bạn */}
        <button
          onClick={onInviteFriend}
          style={{
            padding: '16px 8px', borderRadius: 12,
            background: 'linear-gradient(135deg,#1e4d78,#0f3460)',
            color: '#fff', cursor: 'pointer', textAlign: 'center',
            border: '1px solid #1e4d78',
          }}
        >
          <div style={{ fontSize: 26, marginBottom: 6 }}>👥</div>
          <div style={{ fontSize: 12, fontWeight: 700 }}>{t('lobby.inviteFriend')}</div>
        </button>

        {/* Tìm trận */}
        <button
          onClick={onFindMatch}
          disabled={findMatchDisabled}
          style={{
            padding: '16px 8px', borderRadius: 12,
            background: 'linear-gradient(135deg,#7c3aed,#4f46e5)',
            color: '#fff', cursor: findMatchDisabled ? 'not-allowed' : 'pointer', textAlign: 'center',
            opacity: findMatchDisabled ? 0.7 : 1,
            border: '1px solid #7c3aed',
          }}
        >
          <div style={{ fontSize: 26, marginBottom: 6 }}>🔍</div>
          <div style={{ fontSize: 12, fontWeight: 700 }}>{t('lobby.findMatch')}</div>
        </button>

        {/* Danh sách phòng */}
        <button
          onClick={onRoomList}
          style={{
            padding: '16px 8px', borderRadius: 12,
            background: 'linear-gradient(135deg,#0f5132,#064e3b)',
            color: '#fff', cursor: 'pointer', textAlign: 'center',
            border: '1px solid #065f46',
          }}
        >
          <div style={{ fontSize: 26, marginBottom: 6 }}>📋</div>
          <div style={{ fontSize: 12, fontWeight: 700 }}>{t('lobby.roomList')}</div>
        </button>

        {/* Tạo phòng */}
        <button
          onClick={onCreateRoom}
          disabled={createRoomLoading}
          style={{
            padding: '16px 8px', borderRadius: 12,
            background: createRoomLoading
              ? 'linear-gradient(135deg,#333,#222)'
              : 'linear-gradient(135deg,#b45309,#92400e)',
            color: '#fff', cursor: createRoomLoading ? 'not-allowed' : 'pointer', textAlign: 'center',
            border: '1px solid #b45309', opacity: createRoomLoading ? 0.7 : 1,
          }}
        >
          <div style={{ fontSize: 26, marginBottom: 6 }}>{createRoomLoading ? '⏳' : '➕'}</div>
          <div style={{ fontSize: 12, fontWeight: 700 }}>{t('lobby.createRoom')}</div>
        </button>
      </div>

      {/* Toggle Public/Private */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(255,255,255,0.04)',
        border: '0.5px solid rgba(255,255,255,0.08)',
        borderRadius: '12px',
        padding: '10px 14px',
        marginBottom: '10px',
      }}>
        <div>
          <div style={{ fontSize: '13px', color: '#fff', fontWeight: 500 }}>
            Phòng công khai
          </div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
            {isPublic ? 'Mọi người có thể xem trận đấu' : 'Chỉ người được mời mới vào được'}
          </div>
        </div>
        <div
          onClick={onTogglePublic}
          style={{
            width: '44px', height: '24px',
            borderRadius: '12px',
            background: isPublic ? 'rgba(29,158,117,0.7)' : 'rgba(255,255,255,0.15)',
            position: 'relative',
            cursor: 'pointer',
            transition: 'background 0.2s',
            flexShrink: 0,
          }}
        >
          <div style={{
            position: 'absolute',
            top: '3px',
            left: isPublic ? '23px' : '3px',
            width: '18px', height: '18px',
            borderRadius: '50%',
            background: '#fff',
            transition: 'left 0.2s',
          }} />
        </div>
      </div>
    </>
  );
}
