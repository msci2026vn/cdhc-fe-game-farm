// ═══════════════════════════════════════════════════════════════
// WorldBossBattleView — Fullscreen campaign combat for World Boss
// Mounts only when player starts battle. Uses useWorldBossBattle.
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { useWorldBossBattle, type WorldBossSessionResult } from '../hooks/useWorldBossBattle';
import { usePlayerStats } from '@/shared/hooks/usePlayerStats';
import { useSkillLevels } from '@/shared/hooks/usePlayerSkills';
import { useGemPointer, useComboParticles } from '@/shared/match3';
import { STAT_CONFIG } from '@/shared/utils/stat-constants';
import type { PlayerCombatStats } from '@/shared/utils/combat-formulas';
import type { WorldBossInfo } from '../types/world-boss.types';
import { useWorldBossLite } from '../hooks/useWorldBoss';

// Campaign components (reuse, NOT modify)
import CampaignMatch3Board from '@/modules/campaign/components/CampaignMatch3Board';
import CampaignArenaTop from '@/modules/campaign/components/CampaignArenaTop';
import CampaignPlayerHUD from '@/modules/campaign/components/CampaignPlayerHUD';
import UltimateFlash from '@/shared/match3/UltimateFlash';
import BossAttackFlash from '@/shared/match3/BossAttackFlash';
import ComboParticles from '@/shared/match3/ComboParticles';
import { SkillWarningGlow, DamageVignette } from '@/modules/campaign/components/SkillWarningOverlay';
import { BossRageOverlay } from '@/modules/boss/components/hud';
import { OT_HIEM_CONFIG, ROM_BOC_CONFIG } from '@/shared/match3/combat.config';

import { WorldBossCampaignResult } from './WorldBossCampaignResult';
import { HpBar } from './HpBar';

interface Props {
  worldBoss: WorldBossInfo;
  onExit: () => void;
}

export function WorldBossBattleView({ worldBoss, onExit }: Props) {
  const { data: statInfo } = usePlayerStats();
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

  const skillLevels = useSkillLevels();

  // Session result
  const [sessionResult, setSessionResult] = useState<WorldBossSessionResult | null>(null);

  const handleSessionEnd = (result: WorldBossSessionResult) => {
    setSessionResult(result);
  };

  const { engine, battleState, sessionStats, startBattle, notifyBossDeadFromServer } = useWorldBossBattle(
    worldBoss,
    combatStats,
    worldBoss.id,
    handleSessionEnd,
  );

  // Lite polling — detect boss death/expiry while fighting
  const { data: liteData } = useWorldBossLite(battleState === 'fighting');

  useEffect(() => {
    if (!liteData || battleState !== 'fighting') return;
    if (!liteData.active || (liteData.hpPercent !== undefined && liteData.hpPercent <= 0)) {
      notifyBossDeadFromServer();
    }
  }, [liteData, battleState, notifyBossDeadFromServer]);

  // Auto-start battle on mount
  useEffect(() => {
    startBattle();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Destructure engine
  const {
    grid, selected, animating, matchedCells, combo, showCombo, boss, popups,
    handleTap, handleSwipe, GEM_META, getComboInfo, bossAttackMsg, screenShake,
    result, totalDmgDealt, attackWarning, handleDodge, fireUltimate, ultActive,
    milestones, manaDodgeCost, manaUltCost,
    combatStatsTracker, combatNotifs,
    skillWarning, lastPlayerDamage, enrageMultiplier, maxCombo,
    elapsedSeconds, isPaused, pauseBattle, resumeBattle,
    activeDebuffs, isStunned, skillAlert,
    activeBossBuffs, egg, lockedGems,
    otHiemActive, otHiemCooldown, otHiemDuration, castOtHiem,
    romBocActive, romBocCooldown, romBocDuration, castRomBoc,
    spawningGems,
    blastVfxs,
    hintedGems,
    particleBursts,
    floatingTexts,
    chainLightnings,
    activeBossStats,
    currentPhase, totalPhases,
  } = engine;

  const { handlePointerDown, handlePointerMove, handlePointerUp } = useGemPointer(handleTap, handleSwipe);
  const comboParticles = useComboParticles(combo, showCombo);

  const bossHpPct = Math.round((boss.bossHp / boss.bossMaxHp) * 100);
  const shieldMax = Math.max(boss.playerMaxHp * 0.5, 200);
  const comboInfo = getComboInfo(combo);

  // Session ended — show result
  if (battleState === 'ended' && sessionResult) {
    return (
      <WorldBossCampaignResult
        result={sessionResult}
        onFightAgain={() => {
          setSessionResult(null);
          // Re-mount by exiting and re-entering
          onExit();
        }}
        onExit={onExit}
      />
    );
  }

  return (
    <div className={`h-[100dvh] max-w-[430px] mx-auto relative boss-gradient flex flex-col overflow-hidden ${screenShake ? 'animate-screen-shake' : ''}`}>
      {/* Ultimate flash */}
      {ultActive && <UltimateFlash />}

      {/* Boss attack flash */}
      {bossAttackMsg && !ultActive && <BossAttackFlash text={bossAttackMsg.text} emoji={bossAttackMsg.emoji} />}

      {/* Combo particles */}
      <ComboParticles particles={comboParticles} />

      {/* Skill warning glow */}
      <SkillWarningGlow skillWarning={skillWarning} />

      {/* Combat notifications */}
      {combatNotifs.length > 0 && (
        <div className="absolute top-24 right-3 z-40 flex flex-col gap-1 pointer-events-none">
          {combatNotifs.slice(-3).map((n: any) => (
            <div key={n.id} className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-white animate-fade-in"
              style={{ background: `${n.color}cc`, boxShadow: `0 0 8px ${n.color}60` }}>
              {n.text}
            </div>
          ))}
        </div>
      )}

      {/* Damage vignette */}
      <DamageVignette screenShake={screenShake} ultActive={ultActive} />

      {/* Boss rage */}
      <BossRageOverlay bossHpPct={bossHpPct} bossEmoji={'👾'} />

      {/* Global boss HP indicator */}
      <div className="absolute top-2 left-2 right-2 z-30">
        <div className="flex items-center gap-2 bg-black/60 rounded-lg px-2 py-1 text-[10px]">
          <span className="text-gray-400">Boss HP:</span>
          <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-500 transition-all duration-500"
              style={{ width: `${(sessionStats.hpPercent * 100).toFixed(1)}%` }}
            />
          </div>
          <span className="text-gray-300">{(sessionStats.hpPercent * 100).toFixed(1)}%</span>
        </div>
      </div>

      {/* Top half: Boss arena */}
      <CampaignArenaTop
        boss={boss} bossData={{ id: worldBoss.id, name: worldBoss.bossName, emoji: '👾', image: '', hp: worldBoss.stats.max_hp, attack: worldBoss.stats.atk, reward: 0, xpReward: 0, description: '', difficulty: worldBoss.difficulty, unlockLevel: 0, archetype: 'none', def: worldBoss.stats.def, freq: 1, healPercent: 0, turnLimit: 0, skills: [] }}
        level={1} combatStats={combatStats}
        onBack={onExit} elapsedSeconds={elapsedSeconds} enrageLevel={0}
        pauseBattle={pauseBattle} resumeBattle={resumeBattle}
        archetype={'none'}
        currentPhase={currentPhase} totalPhases={totalPhases}
        activeBossStats={activeBossStats} activeBossBuffs={activeBossBuffs}
        spriteSrc={''} spriteState={'idle'} hasSprites={false}
        enrageMultiplier={enrageMultiplier} skillWarning={!!skillWarning}
        egg={egg} popups={popups} combo={combo} showCombo={showCombo} comboInfo={comboInfo}
      />

      {/* Bottom half: Match-3 + Skills */}
      <div className="flex-[1_1_70%] rounded-t-2xl px-3 pt-1.5 pb-[max(env(safe-area-inset-bottom,6px),6px)] flex flex-col"
        style={{ background: 'rgba(0,0,0,0.3)' }}>

        <CampaignMatch3Board
          grid={grid} selected={selected} matchedCells={matchedCells}
          spawningGems={spawningGems} lockedGems={lockedGems} highlightedGem={null}
          isStunned={isStunned} animating={animating}
          handlePointerDown={handlePointerDown} handlePointerMove={handlePointerMove} handlePointerUp={handlePointerUp}
          combo={combo} showCombo={showCombo} otHiemActive={otHiemActive} romBocActive={romBocActive}
          GEM_META={GEM_META}
          blastVfxs={blastVfxs} hintedGems={hintedGems} particleBursts={particleBursts} floatingTexts={floatingTexts} chainLightnings={chainLightnings}
        />

        <CampaignPlayerHUD
          activeDebuffs={activeDebuffs} boss={boss} shieldMax={shieldMax}
          combatStats={combatStats} lastPlayerDamage={lastPlayerDamage}
          manaDodgeCost={manaDodgeCost} manaUltCost={manaUltCost}
          skillWarning={!!skillWarning} skillAlert={skillAlert}
          daysUntilExpiry={null}
          autoPlay={{ isActive: false, toggle: () => {}, vipLevel: 0, dodgeFreeRemaining: 0, currentSituation: '' }}
          skillLevels={skillLevels}
          otHiemActive={otHiemActive} otHiemCooldown={otHiemCooldown} OT_HIEM_CONFIG={OT_HIEM_CONFIG} otHiemDuration={otHiemDuration} castOtHiem={castOtHiem}
          romBocActive={romBocActive} romBocCooldown={romBocCooldown} ROM_BOC_CONFIG={ROM_BOC_CONFIG} romBocDuration={romBocDuration} castRomBoc={castRomBoc}
          handleDodge={handleDodge} fireUltimate={fireUltimate}
        />
      </div>
    </div>
  );
}
