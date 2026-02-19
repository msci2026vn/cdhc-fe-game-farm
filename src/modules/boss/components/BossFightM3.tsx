import { useEffect, useRef, useState } from 'react';
import { useMatch3 } from '../hooks/useMatch3';
import { BossInfo } from '../data/bosses';
import { useLevel } from '@/shared/hooks/usePlayerProfile';
import { useAuth } from '@/shared/hooks/useAuth';
import { useBossComplete } from '@/shared/hooks/useBossComplete';
import { usePlayerStats } from '@/shared/hooks/usePlayerStats';
import { STAT_CONFIG } from '@/shared/utils/stat-constants';
import type { PlayerCombatStats } from '@/shared/utils/combat-formulas';
import { getDominantAura } from '@/shared/components/BuildAura';
import BossSkillWarning from './BossSkillWarning';

// HUD components
import {
  BossHPBar, PlayerHPBar, ManaBar, SkillBar, BattleTopBar,
  ComboDisplay, COMBO_VFX, DamagePopupLayer,
  BossRageOverlay, BattleResult,
} from './hud';

interface Props {
  boss: BossInfo;
  onBack: () => void;
  /** Campaign mode props */
  isCampaign?: boolean;
  campaignBossId?: string;
  zoneName?: string;
  archetype?: string;
  archetypeIcon?: string;
  archetypeTip?: string;
  turnLimit?: number;
  healPerTurn?: number;
  onRetry?: () => void;
}

export default function BossFightM3({
  boss: bossInfo, onBack,
  isCampaign = false, campaignBossId, zoneName,
  archetype, archetypeIcon, archetypeTip,
  turnLimit = 0, healPerTurn = 0,
  onRetry,
}: Props) {
  const { data: statInfo } = usePlayerStats();

  // Compute effective combat stats from stat info (or use defaults)
  const combatStats: PlayerCombatStats = statInfo ? {
    atk: statInfo.effectiveStats.atk,
    hp: statInfo.effectiveStats.hp,
    def: statInfo.effectiveStats.def,
    mana: statInfo.effectiveStats.mana,
  } : {
    atk: STAT_CONFIG.BASE.ATK,
    hp: STAT_CONFIG.BASE.HP,
    def: STAT_CONFIG.BASE.DEF,
    mana: STAT_CONFIG.BASE.MANA,
  };

  const {
    grid, selected, animating, matchedCells, combo, showCombo, boss, popups,
    handleTap, GEM_META, getComboInfo, bossAttackMsg, screenShake,
    result, totalDmgDealt, attackWarning, handleDodge, fireUltimate, ultActive,
    durationSeconds, fightStartTime,
    milestones, manaDodgeCost, manaUltCost,
    combatStatsTracker, combatNotifs,
    skillWarning, enrageMultiplier, stars, maxCombo,
  } = useMatch3(bossInfo, combatStats, turnLimit);

  const auraType = getDominantAura(combatStats);

  const bossComplete = useBossComplete();
  const { data: auth } = useAuth();
  const level = useLevel();
  const rewardedRef = useRef(false);
  const [comboParticles, setComboParticles] = useState<{ id: number; char: string; x: number; y: number }[]>([]);
  const particleId = useRef(0);

  // Call API on fight end (victory or defeat)
  useEffect(() => {
    if (result !== 'fighting' && !rewardedRef.current) {
      rewardedRef.current = true;
      const playerHpPct = Math.round((boss.playerHp / boss.playerMaxHp) * 100);
      bossComplete.mutate({
        bossId: campaignBossId || bossInfo.id,
        won: result === 'victory',
        totalDamage: totalDmgDealt,
        durationSeconds,
        stars: result === 'victory' ? stars : 0,
        playerHpPercent: playerHpPct,
        maxCombo,
        dodgeCount: combatStatsTracker.dodgeCount,
        isCampaign,
      });
    }
  }, [result, bossInfo.id, campaignBossId, totalDmgDealt, durationSeconds, bossComplete, stars, maxCombo, combatStatsTracker.dodgeCount, isCampaign, boss.playerHp, boss.playerMaxHp]);

  // Spawn combo particles
  useEffect(() => {
    if (!showCombo || combo < 2) return;
    const comboInfo = getComboInfo(combo);
    const vfx = COMBO_VFX[comboInfo.label];
    if (!vfx) return;

    const particles = vfx.particles.flatMap((char) =>
      Array.from({ length: 2 }, () => ({
        id: particleId.current++,
        char,
        x: 20 + Math.random() * 60,
        y: 10 + Math.random() * 30,
      }))
    );
    setComboParticles(prev => [...prev, ...particles]);
    setTimeout(() => {
      setComboParticles(prev => prev.filter(p => !particles.some(np => np.id === p.id)));
    }, 1200);
  }, [combo, showCombo]); // eslint-disable-line react-hooks/exhaustive-deps

  const bossHpPct = Math.round((boss.bossHp / boss.bossMaxHp) * 100);
  const playerHpPct = Math.round((boss.playerHp / boss.playerMaxHp) * 100);
  const shieldMax = Math.max(boss.playerMaxHp * 0.5, 200);
  const comboInfo = getComboInfo(combo);

  // Determine max turns: campaign turnLimit or default 99
  const maxTurns = turnLimit > 0 ? turnLimit : 99;

  // Turn limit defeat is now handled inside useMatch3

  // Victory / Defeat screen using BattleResult component
  if (result !== 'fighting') {
    const won = result === 'victory';
    const serverData = bossComplete.data;

    return (
      <BattleResult
        won={won}
        bossName={bossInfo.name}
        bossEmoji={bossInfo.emoji}
        totalDmgDealt={totalDmgDealt}
        serverData={serverData}
        combatStats={combatStatsTracker}
        playerLevel={level}
        isCampaign={isCampaign}
        playerHpPct={playerHpPct}
        turnUsed={boss.turnCount}
        turnMax={maxTurns}
        archetype={archetype}
        archetypeTip={archetypeTip}
        onBack={onBack}
        onRetry={onRetry}
        leveledUp={serverData?.leveledUp}
        newLevel={serverData?.newLevel}
        combatStars={stars}
        durationSeconds={durationSeconds}
        maxCombo={maxCombo}
      />
    );
  }

  return (
    <div className={`h-[100dvh] max-w-[430px] mx-auto relative boss-gradient flex flex-col overflow-hidden ${screenShake ? 'animate-screen-shake' : ''}`}>
      {/* Ultimate fullscreen flash */}
      {ultActive && (
        <div className="absolute inset-0 z-50 pointer-events-none">
          <div className="absolute inset-0 animate-ult-flash" />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-scale-in">
            <div className="text-7xl mb-2 text-center animate-boss-idle">⚡</div>
            <div className="px-8 py-4 rounded-2xl font-heading text-2xl font-bold text-white text-center"
              style={{ background: 'linear-gradient(135deg, #6c5ce7, #e056fd, #a29bfe)', boxShadow: '0 0 80px rgba(108,92,231,0.9)' }}>
              ⚡ ULTIMATE! ⚡
            </div>
          </div>
          {Array.from({ length: 12 }).map((_, i) => (
            <span key={i} className="absolute animate-sparkle-up text-2xl pointer-events-none"
              style={{ left: `${10 + Math.random() * 80}%`, top: `${20 + Math.random() * 50}%`, animationDelay: `${i * 0.1}s` }}>
              {['⚡', '💜', '✨', '💎'][i % 4]}
            </span>
          ))}
        </div>
      )}

      {/* Boss attack flash with animation */}
      {bossAttackMsg && !ultActive && (
        <div className="absolute inset-0 z-50 pointer-events-none">
          <div className={`absolute inset-0 ${bossAttackMsg.emoji === '💨' ? '' : 'animate-boss-atk-flash'}`}
            style={{ background: bossAttackMsg.emoji === '💨' ? 'rgba(85,239,196,0.1)' : 'transparent' }} />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="px-6 py-3 rounded-2xl font-heading font-bold text-white text-center animate-scale-in"
              style={{
                background: bossAttackMsg.emoji === '💨' ? 'rgba(85,239,196,0.9)' : 'rgba(231,76,60,0.95)',
                boxShadow: bossAttackMsg.emoji === '💨' ? '0 0 30px rgba(85,239,196,0.5)' : '0 0 50px rgba(231,76,60,0.7)',
              }}>
              <span className="text-4xl block mb-1 animate-boss-idle">{bossAttackMsg.emoji}</span>
              <span className="text-sm">{bossAttackMsg.text}</span>
            </div>
          </div>
          {bossAttackMsg.emoji !== '💨' && Array.from({ length: 8 }).map((_, i) => (
            <span key={i} className="absolute animate-sparkle-up text-xl pointer-events-none"
              style={{ left: `${15 + Math.random() * 70}%`, top: `${30 + Math.random() * 40}%`, animationDelay: `${i * 0.05}s` }}>
              {['💥', '🔥', '⚡', '💢'][i % 4]}
            </span>
          ))}
        </div>
      )}

      {/* Combo particles */}
      {comboParticles.map(p => (
        <span key={p.id} className="absolute z-30 animate-sparkle-up pointer-events-none text-xl"
          style={{ left: `${p.x}%`, top: `${p.y}%` }}>
          {p.char}
        </span>
      ))}

      {/* Skill warning overlay — only for skill attacks (25% chance) */}
      {skillWarning && (
        <BossSkillWarning
          warning={skillWarning}
          bossName={bossInfo.name}
          bossEmoji={bossInfo.emoji}
          manaCost={manaDodgeCost}
          currentMana={boss.mana}
          onDodge={handleDodge}
        />
      )}

      {/* Combat notifications (right side) */}
      {combatNotifs.length > 0 && (
        <div className="absolute top-24 right-3 z-40 flex flex-col gap-1 pointer-events-none">
          {combatNotifs.slice(-3).map(n => (
            <div key={n.id} className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-white animate-fade-in"
              style={{ background: `${n.color}cc`, boxShadow: `0 0 8px ${n.color}60` }}>
              {n.text}
            </div>
          ))}
        </div>
      )}

      {/* Boss rage overlay */}
      <BossRageOverlay bossHpPct={bossHpPct} bossEmoji={bossInfo.emoji} />

      {/* Top half: Boss arena — compact for mobile */}
      <div className="flex-[0_0_36%] pt-safe px-4 pb-1 flex flex-col relative overflow-hidden">
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(circle at 50% 60%, rgba(231,76,60,0.15) 0%, transparent 50%), radial-gradient(circle at 20% 20%, rgba(142,68,173,0.1) 0%, transparent 40%)'
        }} />

        {/* Top bar: Turn counter + stats + retreat */}
        <BattleTopBar
          turn={boss.turnCount}
          maxTurns={maxTurns}
          level={level}
          atk={combatStats.atk}
          def={combatStats.def}
          onRetreat={onBack}
          isCampaign={isCampaign}
        />

        {/* Campaign zone label */}
        {isCampaign && zoneName && (
          <div className="z-10 mb-1">
            <span className="text-[9px] font-bold px-2 py-0.5 rounded"
              style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>
              📍 {zoneName}
            </span>
          </div>
        )}

        {/* Boss HP bar */}
        <BossHPBar
          name={bossInfo.name}
          emoji={bossInfo.emoji}
          hp={boss.bossHp}
          maxHp={boss.bossMaxHp}
          archetype={archetype}
          archetypeIcon={archetypeIcon}
          healPerTurn={healPerTurn}
        />

        {/* Boss sprite + damage popups + combo */}
        <div className="flex-1 flex items-center justify-center relative z-10">
          <span className={`text-[56px] animate-boss-idle ${boss.bossHp <= 0 ? 'opacity-30 grayscale' : ''} ${skillWarning ? 'animate-boss-attack' : ''
            }`} style={{
              filter: enrageMultiplier >= 1.3
                ? `drop-shadow(0 0 20px rgba(231,76,60,0.5)) drop-shadow(0 0 10px rgba(255,50,50,${Math.min(0.8, (enrageMultiplier - 1.3) * 2 + 0.4)}))`
                : 'drop-shadow(0 0 20px rgba(231,76,60,0.5))',
              transition: 'filter 1s ease',
            }}>
            {bossInfo.emoji}
          </span>

          {/* Damage popups */}
          <DamagePopupLayer popups={popups} />

          {/* Combo display */}
          <ComboDisplay
            combo={combo}
            show={showCombo}
            label={comboInfo.label}
            mult={comboInfo.mult}
            color={comboInfo.color}
          />
        </div>

      </div>

      {/* Bottom half: Match-3 + Skills — expanded for mobile */}
      <div className="flex-[1_1_64%] rounded-t-2xl px-3 pt-2 pb-[max(env(safe-area-inset-bottom,8px),8px)] flex flex-col"
        style={{ background: 'rgba(0,0,0,0.3)' }}>
        <div className="w-8 h-0.5 rounded-full mx-auto mb-1" style={{ background: 'rgba(255,255,255,0.2)' }} />

        {/* Player HP + Shield bars */}
        <PlayerHPBar
          hp={boss.playerHp}
          maxHp={boss.playerMaxHp}
          shield={boss.shield}
          maxShield={shieldMax}
          def={combatStats.def}
        />

        {/* Mana bar */}
        <ManaBar
          mana={boss.mana}
          maxMana={boss.maxMana}
          dodgeCost={manaDodgeCost}
          ultCost={manaUltCost}
        />

        {/* Gem grid — compact for mobile */}
        <div className="relative flex-1">
          {/* Combo flash overlay */}
          {showCombo && combo >= 2 && (
            <div key={`flash-${combo}`} className={`combo-flash-overlay combo-flash-${Math.min(combo, 6)}`} />
          )}
          <div className={`grid grid-cols-6 gap-1 p-1 rounded-lg h-full ${combo >= 3 && showCombo ? 'grid-combo-shake' : ''}`}
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            {grid.map((gem, i) => {
              const meta = GEM_META[gem.type];
              const isSelected = selected === i;
              const isMatched = matchedCells.has(i);
              return (
                <div key={gem.id} onClick={() => handleTap(i)}
                  className={`aspect-square rounded-lg flex items-center justify-center text-[20px] cursor-pointer relative gem-shine transition-all duration-200 ${meta.css}
                    ${isSelected ? 'ring-2 ring-white scale-110 z-10 animate-gem-swap' : 'active:scale-[0.88]'}
                    ${isMatched ? 'animate-gem-pop gem-match-burst' : ''}
                    ${animating && !isMatched ? 'pointer-events-none' : ''}
                  `}>
                  {meta.emoji}
                </div>
              );
            })}
          </div>
        </div>

        {/* Skill bar: Dodge + ULT charge + ULT button */}
        <SkillBar
          mana={boss.mana}
          maxMana={boss.maxMana}
          dodgeCost={manaDodgeCost}
          ultCost={manaUltCost}
          ultCharge={boss.ultCharge}
          ultCooldown={boss.ultCooldown}
          isDodgeWindow={!!skillWarning}
          onDodge={handleDodge}
          onUlt={fireUltimate}
        />
      </div>

    </div>
  );
}
