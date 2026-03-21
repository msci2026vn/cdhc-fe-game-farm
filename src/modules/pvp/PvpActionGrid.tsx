import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function PvpActionGrid({
  onFindMatch,
  findMatchDisabled,
  onRoomList,
  onCreateRoom,
  createRoomLoading,
  isPublic,
  onTogglePublic,
}: {
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

      <div style={{ display: 'flex', flexDirection: 'row', gap: 8, marginBottom: 12, marginTop: 25, justifyContent: 'center' }}>
        {/* Tìm trận */}
        <button
          onClick={onFindMatch}
          disabled={findMatchDisabled}
          style={{
            background: 'none', border: 'none', padding: 0,
            cursor: findMatchDisabled ? 'not-allowed' : 'pointer',
            opacity: findMatchDisabled ? 0.6 : 1,
            transition: 'transform 0.1s, opacity 0.1s',
            display: 'block', width: 90, flexShrink: 0,
          }}
          onPointerDown={e => { if (!findMatchDisabled) e.currentTarget.style.transform = 'scale(0.96)'; }}
          onPointerUp={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <img
            src="/assets/pvp_1vs1_arena/btn_find_matches.png"
            alt={t('lobby.findMatch')}
            style={{ width: '100%', height: 'auto', objectFit: 'contain', display: 'block' }}
          />
        </button>

        {/* Danh sách phòng */}
        <button
          onClick={onRoomList}
          style={{
            background: 'none', border: 'none', padding: 0,
            cursor: 'pointer',
            transition: 'transform 0.1s',
            display: 'block', width: 90, flexShrink: 0,
          }}
          onPointerDown={e => (e.currentTarget.style.transform = 'scale(0.96)')}
          onPointerUp={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <img
            src="/assets/pvp_1vs1_arena/btn_room_list.png"
            alt={t('lobby.roomList')}
            style={{ width: '100%', height: 'auto', objectFit: 'contain', display: 'block' }}
          />
        </button>

        {/* Tạo phòng */}
        <button
          onClick={onCreateRoom}
          disabled={createRoomLoading}
          style={{
            background: 'none', border: 'none', padding: 0,
            cursor: createRoomLoading ? 'not-allowed' : 'pointer',
            opacity: createRoomLoading ? 0.6 : 1,
            transition: 'transform 0.1s, opacity 0.1s',
            display: 'block', width: 90, flexShrink: 0,
          }}
          onPointerDown={e => { if (!createRoomLoading) e.currentTarget.style.transform = 'scale(0.96)'; }}
          onPointerUp={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <img
            src="/assets/pvp_1vs1_arena/btn_create_room.png"
            alt={t('lobby.createRoom')}
            style={{ width: '100%', height: 'auto', objectFit: 'contain', display: 'block' }}
          />
        </button>
      </div>

      {/* Toggle Public/Private */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: "url('/assets/pvp_1vs1_arena/frame_wood_7.png') no-repeat center center / 100% 100%",
        borderRadius: '12px',
        padding: '8px 14px',
        marginBottom: '6px',
      }}>
        <div>
          <div style={{
            fontSize: '13px', color: '#FFFEA3', fontWeight: 900,
            fontFamily: "'Fredoka One', 'Nunito', sans-serif", letterSpacing: 0.5,
            textShadow: '1px 1px 0 #1a0a00, -1px 1px 0 #1a0a00, 1px -1px 0 #1a0a00, -1px -1px 0 #1a0a00'
          }}>
            Phòng công khai
          </div>
          <div style={{
            fontSize: '11px', color: '#fff', fontWeight: 500, marginTop: '2px',
            fontFamily: "'Fredoka One', 'Nunito', sans-serif", letterSpacing: 0.5,
            textShadow: '1px 1px 0 #1a0a00, -1px 1px 0 #1a0a00, 1px -1px 0 #1a0a00, -1px -1px 0 #1a0a00'
          }}>
            {isPublic ? 'Mọi người có thể xem trận đấu' : 'Chỉ người được mời mới vào được'}
          </div>
        </div>
        <div
          onClick={onTogglePublic}
          style={{
            width: '36px', height: '20px',
            borderRadius: '10px',
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
            left: isPublic ? '19px' : '3px',
            width: '14px', height: '14px',
            borderRadius: '50%',
            background: '#fff',
            transition: 'left 0.2s',
          }} />
        </div>
      </div>
    </>
  );
}
