import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { socialApi } from '@/shared/api/api-social';

export function FriendPickerModal({
  onClose,
  onSend,
  sending,
}: {
  onClose: () => void;
  onSend: (friendId: string) => void;
  sending: boolean;
}) {
  const { t } = useTranslation('pvp');
  const { data: friends } = useQuery({
    queryKey: ['friends'],
    queryFn: socialApi.getFriends,
  });

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }} onClick={onClose}>
      <div
        style={{
          background: 'linear-gradient(180deg,#1a1a2e,#0f1624)',
          border: '1px solid #1e4d78',
          borderRadius: '16px 16px 0 0',
          width: '100%', maxWidth: 480,
          maxHeight: '70vh', overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid #1e3a5a',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontWeight: 700, color: '#fff', fontSize: 16 }}>{t('invite.selectFriend')}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {!friends?.friends?.length ? (
            <div style={{ textAlign: 'center', padding: 32, color: '#64748b' }}>
              {t('invite.noFriends')}
            </div>
          ) : (
            friends.friends.map(f => (
              <div
                key={f.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 20px',
                  borderBottom: '1px solid #0f1e30',
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                  background: '#1e4d78', overflow: 'hidden',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18,
                }}>
                  {f.avatar ? <img src={f.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : '👤'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: 14 }}>{f.name}</div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>Lv.{f.level}</div>
                </div>
                <button
                  onClick={() => onSend(f.id)}
                  disabled={sending}
                  style={{
                    padding: '8px 16px', borderRadius: 8, border: 'none',
                    background: sending ? '#333' : '#e94560',
                    color: '#fff', fontSize: 12, fontWeight: 700,
                    cursor: sending ? 'not-allowed' : 'pointer',
                  }}
                >
                  {sending ? t('invite.sending') : t('invite.send')}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
