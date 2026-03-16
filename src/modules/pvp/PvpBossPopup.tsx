import { useTranslation } from 'react-i18next';

export function PvpBossPopup({
  bossData,
  onClose,
  onAccept,
}: {
  bossData: { name: string; avatar: string; greeting: string };
  onClose: () => void;
  onAccept: () => void;
}) {
  const { t } = useTranslation('pvp');

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div style={{
        background: 'linear-gradient(135deg,#1a1a2e,#16213e)',
        border: '2px solid #ef4444',
        borderRadius: 16, padding: 28, maxWidth: 340, width: '100%',
        textAlign: 'center', color: '#fff',
        boxShadow: '0 0 60px rgba(239,68,68,0.3)',
      }}>
        <div style={{ fontSize: 56, marginBottom: 8 }}>{bossData.avatar}</div>
        <div style={{ fontSize: 14, color: '#ef4444', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>
          {t('boss.challenge')}
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>{bossData.name}</div>
        <div style={{ fontSize: 14, color: '#94a3b8', fontStyle: 'italic', marginBottom: 20 }}>
          "{bossData.greeting}"
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '12px', borderRadius: 10,
              border: '1px solid #64748b', background: 'transparent',
              color: '#94a3b8', fontSize: 15, fontWeight: 700, cursor: 'pointer',
            }}
          >
            {t('boss.flee')}
          </button>
          <button
            onClick={onAccept}
            style={{
              flex: 1, padding: '12px', borderRadius: 10,
              border: 'none', background: 'linear-gradient(135deg,#dc2626,#991b1b)',
              color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer',
            }}
          >
            {t('boss.fight')} ⚔️
          </button>
        </div>
      </div>
    </div>
  );
}
