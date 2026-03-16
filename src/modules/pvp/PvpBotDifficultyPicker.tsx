import { useTranslation } from 'react-i18next';

export function PvpBotDifficultyPicker({
  onClose,
  onSelect,
}: {
  onClose: () => void;
  onSelect: (tier: string) => void;
}) {
  const { t } = useTranslation('pvp');

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 250,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'linear-gradient(180deg,#1a1a2e,#0f1624)',
          border: '1px solid #dc2626',
          borderRadius: '16px 16px 0 0',
          width: '100%', maxWidth: 420,
          padding: '20px 20px 28px',
        }}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 16, marginBottom: 16, textAlign: 'center' }}>
          🤖 {t('bot.selectDifficulty')}
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {([
            { tier: 'easy', label: t('bot.easy'), emoji: '😊', bg: 'linear-gradient(135deg,#16a34a,#15803d)' },
            { tier: 'medium', label: t('bot.medium'), emoji: '😐', bg: 'linear-gradient(135deg,#ca8a04,#a16207)' },
            { tier: 'hard', label: t('bot.hard'), emoji: '😤', bg: 'linear-gradient(135deg,#ea580c,#c2410c)' },
            { tier: 'expert', label: t('bot.expert'), emoji: '😈', bg: 'linear-gradient(135deg,#dc2626,#991b1b)' },
          ] as const).map(({ tier, label, emoji, bg }) => (
            <button
              key={tier}
              onClick={() => onSelect(tier)}
              style={{
                background: bg, color: '#fff',
                borderRadius: 12, padding: '18px 8px',
                border: 'none', cursor: 'pointer',
                fontWeight: 700, fontSize: 15,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              }}
            >
              <span style={{ fontSize: 30 }}>{emoji}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
