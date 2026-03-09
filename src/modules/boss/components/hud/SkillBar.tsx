// ═══════════════════════════════════════════════════════════════
// SkillBar — Dodge + ULT buttons layout + ULT charge bar
// ═══════════════════════════════════════════════════════════════

import SkillButton from './SkillButton';

interface SkillBarProps {
  mana: number;
  maxMana: number;
  dodgeCost: number;
  ultCost: number;
  ultCharge: number;
  ultCooldown: number;
  isDodgeWindow: boolean;
  onDodge: () => void;
  onUlt: () => void;
}

export default function SkillBar({
  mana, dodgeCost, ultCost, ultCharge, ultCooldown,
  isDodgeWindow, onDodge, onUlt,
}: SkillBarProps) {
  const ultReady = ultCharge >= 100;

  return (
    <div className="flex items-center gap-1.5 mt-1">
      {/* Dodge */}
      <SkillButton
        icon="🏃"
        label="NÉ"
        manaCost={dodgeCost}
        currentMana={mana}
        onUse={onDodge}
        variant="dodge"
        isDodgeWindow={isDodgeWindow}
      />

      {/* ULT charge bar (between buttons) */}
      <div className="flex-1 flex flex-col gap-0.5">
        <div className="h-2 rounded-lg overflow-hidden relative"
          style={{ background: 'rgba(255,255,255,0.1)' }}>
          <div className={`h-full rounded-lg transition-[width] duration-500 ${ultReady ? 'animate-ult-glow' : ''}`}
            style={{
              width: `${ultCharge}%`,
              background: ultReady
                ? 'linear-gradient(90deg, #a29bfe, #fd79a8, #fdcb6e)'
                : 'linear-gradient(90deg, #6c5ce7, #a29bfe)',
              boxShadow: ultReady ? '0 0 10px rgba(253,121,168,0.5)' : 'none',
            }} />
          <div className="absolute inset-x-0 top-0 h-1/2"
            style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.2), transparent)' }} />
        </div>
        <span className="text-[8px] font-bold text-center"
          style={{ color: ultReady ? '#fdcb6e' : 'rgba(255,255,255,0.4)' }}>
          {ultReady ? '⚡ SẴN SÀNG!' : `⚡ ${ultCharge}%`}
        </span>
      </div>

      {/* ULT */}
      <SkillButton
        icon="⚡"
        label="ULT"
        manaCost={ultCost}
        currentMana={mana}
        onUse={onUlt}
        variant="ult"
        ultCharge={ultCharge}
        cooldown={ultCooldown}
      />
    </div>
  );
}
