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

export function PhaseTransitionOverlay({ phase }: PhaseTransitionOverlayProps) {
  if (!phase) return null;
  return (
    <PhaseTransition
      phase={phase.phaseNumber}
      archetypeLabel={phase.name}
      archetypeIcon={phase.icon}
      description={phase.description}
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
  return (
    <div className={`absolute top-20 left-4 right-4 z-40 text-center py-2 px-4 rounded-lg pointer-events-none animate-fade-in font-heading font-bold ${enrageLevel >= 4 ? 'text-red-300 text-lg animate-pulse' :
      enrageLevel >= 3 ? 'text-red-400' :
        enrageLevel >= 2 ? 'text-orange-300' :
          'text-yellow-300 text-sm'
      }`} style={{
        background: enrageLevel >= 3 ? 'rgba(139,0,0,0.85)' :
          enrageLevel >= 2 ? 'rgba(180,90,0,0.8)' :
            'rgba(120,100,0,0.75)',
        boxShadow: enrageLevel >= 3 ? '0 0 20px rgba(231,76,60,0.4)' : 'none',
      }}>
      {enrageAlert}
    </div>
  );
}
