// ═══════════════════════════════════════════════════════════════
// TurnCounter — Turn N/Max with 3 urgency levels
// ═══════════════════════════════════════════════════════════════

import { useTranslation } from 'react-i18next';

interface TurnCounterProps {
  current: number;
  max: number;
}

function getUrgency(current: number, max: number): 'normal' | 'warning' | 'critical' {
  if (max <= 0) return 'normal';
  const remaining = max - current;
  const pct = remaining / max;
  if (pct <= 0.15 || remaining <= 3) return 'critical';
  if (pct <= 0.35) return 'warning';
  return 'normal';
}

const URGENCY_STYLES = {
  normal: { color: 'rgba(255,255,255,0.8)', animation: '' },
  warning: { color: '#fdcb6e', animation: 'animate-pulse' },
  critical: { color: '#ff6b6b', animation: 'animate-pulse' },
} as const;

export default function TurnCounter({ current, max }: TurnCounterProps) {
  const { t } = useTranslation();
  const urgency = getUrgency(current, max);
  const style = URGENCY_STYLES[urgency];
  const remaining = max - current;

  return (
    <div className={`flex items-center gap-1 ${style.animation}`}>
      <span className="text-sm">⏱️</span>
      <span className="font-heading text-sm font-bold" style={{ color: style.color }}>
        {current}/{max}
      </span>
      {urgency === 'critical' && remaining > 0 && (
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
          style={{ background: 'rgba(255,107,107,0.2)', color: '#ff6b6b' }}>
          {t('remaining_turns_warning', { remaining })}
        </span>
      )}
      {remaining <= 0 && max > 0 && (
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
          style={{ background: 'rgba(255,107,107,0.3)', color: '#ff6b6b' }}>
          {t('out_of_turns')}
        </span>
      )}
    </div>
  );
}
