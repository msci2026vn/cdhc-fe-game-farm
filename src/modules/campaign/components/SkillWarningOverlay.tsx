// ═══════════════════════════════════════════════════════════════
// SkillWarningOverlay — Screen glow, phase transition, enrage badge
// ═══════════════════════════════════════════════════════════════

import type { SkillWarning } from '@/shared/match3/combat.types';
import type { BossPhase } from '../data/deVuongPhases';
import { PhaseTransition } from '@/modules/boss/components/hud';

interface SkillWarningGlowProps {
  skillWarning: SkillWarning | null;
}

export function SkillWarningGlow({ skillWarning }: SkillWarningGlowProps) {
  if (!skillWarning) return null;
  return (
    <div className="absolute inset-0 pointer-events-none z-30 animate-pulse"
      style={{ boxShadow: 'inset 0 0 60px rgba(231,76,60,0.3), inset 0 0 120px rgba(231,76,60,0.15)' }} />
  );
}

interface PhaseTransitionOverlayProps {
  phase: BossPhase | null;
}

import { useTranslation } from 'react-i18next';

export function PhaseTransitionOverlay({ phase }: PhaseTransitionOverlayProps) {
  const { t } = useTranslation();
  if (!phase) return null;

  const phaseKey = phase.name.toLowerCase().replace(' ', '_');
  return (
    <PhaseTransition
      phase={phase.phaseNumber}
      archetypeLabel={t(`campaign.archetypes.${phaseKey}.label`, { defaultValue: phase.name })}
      archetypeIcon={phase.icon}
      description={t(`campaign.boss_phases.${phaseKey}.description`, { defaultValue: phase.description })}
    />
  );
}

interface DamageVignetteProps {
  screenShake: boolean;
  ultActive: boolean;
}

export function DamageVignette({ screenShake, ultActive }: DamageVignetteProps) {
  if (!screenShake || ultActive) return null;
  return (
    <div className="absolute inset-0 pointer-events-none z-40 animate-fade-in"
      style={{ boxShadow: 'inset 0 0 80px rgba(231,76,60,0.25), inset 0 0 40px rgba(231,76,60,0.15)' }} />
  );
}

interface EnrageAlertBannerProps {
  enrageAlert: string | null;
  enrageLevel: number;
}

export function EnrageAlertBanner({ enrageAlert, enrageLevel }: EnrageAlertBannerProps) {
  if (!enrageAlert) return null;

  const percent = enrageLevel * 10;
  let noticeImg = '/assets/battle/notice_3.png';
  let percentColor = 'text-yellow-400';
  
  if (enrageLevel >= 9) {
    noticeImg = '/assets/battle/notice_5.png';
    percentColor = 'text-red-500';
  } else if (enrageLevel >= 5) {
    noticeImg = '/assets/battle/notice_4.png';
    percentColor = 'text-orange-500';
  }

  return (
    <div className="absolute top-[28%] left-0 right-0 z-40 flex flex-col items-center pointer-events-none animate-fade-in-up">
      <div className="relative flex items-center justify-center">
        <img 
          src={noticeImg} 
          alt="Enrage Alert" 
          className={`w-[260px] object-contain ${enrageLevel >= 9 ? 'animate-pulse' : ''}`} 
        />
        {/* Only show the percentage number below the image */}
        <div className="absolute -bottom-1 left-0 right-0 flex justify-center translate-y-full">
          <span className={`font-heading font-black text-xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] ${percentColor}`}>
            +{percent}%
          </span>
        </div>
      </div>
    </div>
  );
}
