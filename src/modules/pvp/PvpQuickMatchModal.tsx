import { useTranslation } from 'react-i18next';

export function QuickMatchModal({
  waitSeconds,
  onCancel,
}: {
  waitSeconds: number;
  onCancel: () => void;
}) {
  const { t } = useTranslation('pvp');
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: 'linear-gradient(135deg,#1a1a2e,#16213e)',
        border: '2px solid #3b82f6',
        borderRadius: 16, padding: 32, maxWidth: 300, width: '90%',
        textAlign: 'center', color: '#fff',
        boxShadow: '0 0 40px rgba(59,130,246,0.3)',
      }}>
        <div style={{ fontSize: 40, marginBottom: 12, animation: 'spin 2s linear infinite' }}>🔍</div>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{t('matchmaking.searching')}</div>
        <div style={{ color: '#64748b', fontSize: 14, marginBottom: 24 }}>
          {t('matchmaking.waitTime')} <span style={{ color: '#f59e0b', fontWeight: 700 }}>{waitSeconds}s</span>
        </div>
        <button
          onClick={onCancel}
          style={{
            padding: '10px 24px', borderRadius: 8,
            border: '1px solid #ef4444', background: 'transparent',
            color: '#ef4444', fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}
        >
          {t('matchmaking.cancel')}
        </button>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
