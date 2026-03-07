// ═══════════════════════════════════════════════════════════════
// BossFightCampaign — Campaign boss combat UI
// Forked from BossFightM3 — uses useMatch3Campaign with DEF/heal/freq
// Weekly boss uses original BossFightM3 — UNTOUCHED
// ═══════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useMatch3Campaign, CampaignBossData } from '../hooks/useMatch3Campaign';
import { campaignApi } from '@/shared/api/api-campaign';
import { useLevel } from '@/shared/hooks/usePlayerProfile';
import { useAuth } from '@/shared/hooks/useAuth';
import { usePlayerStats } from '@/shared/hooks/usePlayerStats';
import { STAT_CONFIG } from '@/shared/utils/stat-constants';
import type { PlayerCombatStats } from '@/shared/utils/combat-formulas';
import { audioManager } from '@/shared/audio';
import { useBossSprite } from '../hooks/useBossSprite';
import { useAutoPlayController } from '@/shared/autoplay/auto-controller';
import { onBattleEnd as learnerBattleEnd } from '@/shared/autoplay/auto-learner';
import { useAutoPlayLevel } from '@/shared/hooks/useAutoPlayLevel';
import { useSkillLevels } from '@/shared/hooks/usePlayerSkills';
import { OT_HIEM_CONFIG, ROM_BOC_CONFIG } from '@/shared/match3/combat.config';

// Shared match-3 components & hooks
import { useGemPointer, useComboParticles } from '@/shared/match3';
import UltimateFlash from '@/shared/match3/UltimateFlash';
import BossAttackFlash from '@/shared/match3/BossAttackFlash';
import ComboParticles from '@/shared/match3/ComboParticles';
import FpsCounter from '@/shared/components/FpsCounter';

// Local extracted hooks
import { useDeathAnimation } from './hooks/useDeathAnimation';
import { useEnrageAlert } from './hooks/useEnrageAlert';
import { useBattleEnd } from './hooks/useBattleEnd';

// Local extracted components
import DeathOverlay from './DeathOverlay';
import { SkillWarningGlow, PhaseTransitionOverlay, DamageVignette, EnrageAlertBanner } from './SkillWarningOverlay';
import { BossRageOverlay } from '@/modules/boss/components/hud';

// Refactored sub-components
import CampaignBattleResultHandler from './CampaignBattleResultHandler';
import CampaignSessionLoader from './CampaignSessionLoader';
import CampaignArenaTop from './CampaignArenaTop';
import CampaignMatch3Board from './CampaignMatch3Board';
import CampaignPlayerHUD from './CampaignPlayerHUD';

interface Props {
  boss: CampaignBossData;
  onBack: () => void;
  campaignBossId: string;
  zoneName?: string;
  zoneNumber?: number;
  archetype: string;
  archetypeIcon?: string;
  archetypeTip?: string;
  onRetry: () => void;
}

export default function BossFightCampaign({
  boss: bossData, onBack,
  campaignBossId, zoneName, zoneNumber = 1,
  archetype, archetypeIcon, archetypeTip,
  onRetry,
}: Props) {
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

  const {
    grid, selected, animating, matchedCells, combo, showCombo, boss, popups,
    handleTap, handleSwipe, GEM_META, getComboInfo, bossAttackMsg, screenShake,
    result, totalDmgDealt, attackWarning, handleDodge, fireUltimate, ultActive,
    durationSeconds, fightStartTime,
    milestones, manaDodgeCost, manaUltCost,
    combatStatsTracker, combatNotifs,
    skillWarning, lastPlayerDamage, enrageMultiplier, stars, maxCombo,
    currentPhase, totalPhases, showPhaseTransition, activeBossStats,
    elapsedSeconds, isPaused, pauseBattle, resumeBattle,
    // Boss skills
    activeDebuffs, isStunned, skillAlert,
    activeBossBuffs, egg, lockedGems,
    // Player skills
    otHiemActive, otHiemCooldown, otHiemDuration, castOtHiem,
    romBocActive, romBocCooldown, romBocDuration, castRomBoc,
    // Animation
    spawningGems,
    blastVfxs,
    hintedGems,
    particleBursts,
    floatingTexts,
    chainLightnings,
  } = useMatch3Campaign(bossData, combatStats, skillLevels, zoneNumber);

  // ═══ Auto-play (Lv1 free for all, Lv2+ via purchase/rent) ═══
  const { effectiveLevel, daysUntilExpiry } = useAutoPlayLevel();
  const [highlightedGem, setHighlightedGem] = useState<number | null>(null);

  // Create refs from state for auto-play controller
  const gridRef = useRef(grid); gridRef.current = grid;
  const bossRef = useRef(boss); bossRef.current = boss;
  const animatingRef = useRef(animating); animatingRef.current = animating;
  const resultRef = useRef<'fighting' | 'victory' | 'defeat'>(result); resultRef.current = result;
  const skillWarningRef = useRef(skillWarning); skillWarningRef.current = skillWarning;
  const activeDebuffsRef = useRef(activeDebuffs); activeDebuffsRef.current = activeDebuffs;
  const activeBossBuffsRef = useRef(activeBossBuffs); activeBossBuffsRef.current = activeBossBuffs;
  const eggRef = useRef(egg); eggRef.current = egg;
  const lockedGemsRef = useRef(lockedGems); lockedGemsRef.current = lockedGems;
  const activeBossStatsRef = useRef(activeBossStats); activeBossStatsRef.current = activeBossStats;
  const otHiemActiveRef = useRef(otHiemActive); otHiemActiveRef.current = otHiemActive;
  const otHiemCooldownRef = useRef(otHiemCooldown > 0); otHiemCooldownRef.current = otHiemCooldown > 0;
  const romBocActiveRef = useRef(romBocActive); romBocActiveRef.current = romBocActive;
  const romBocCooldownRef = useRef(romBocCooldown > 0); romBocCooldownRef.current = romBocCooldown > 0;
  const isStunnedRef = useRef(isStunned); isStunnedRef.current = isStunned;
  const isPausedRef = useRef(isPaused); isPausedRef.current = isPaused;
  const enrageRef = useRef(enrageMultiplier); enrageRef.current = enrageMultiplier;
  const deVuongPhaseRef = useRef(currentPhase); deVuongPhaseRef.current = currentPhase;

  const isDeVuong = Number(bossData.id) === 40 || (totalPhases ?? 0) >= 4;

  const autoPlay = useAutoPlayController({
    gridRef,
    bossRef,
    lockedGemsRef,
    activeDebuffsRef: activeDebuffsRef as React.MutableRefObject<any>,
    activeBossBuffsRef: activeBossBuffsRef as React.MutableRefObject<any>,
    eggRef: eggRef as React.MutableRefObject<any>,
    skillWarningRef: skillWarningRef as React.MutableRefObject<any>,
    activeBossStatsRef: activeBossStatsRef as React.MutableRefObject<any>,
    playerStats: combatStats,
    skillLevels,
    otHiemActiveRef,
    otHiemOnCooldownRef: otHiemCooldownRef,
    romBocActiveRef,
    romBocOnCooldownRef: romBocCooldownRef,
    mode: 'campaign',
    bossArchetype: archetype,
    isDeVuong,
    deVuongPhaseRef,
    enrageMultiplierRef: enrageRef,
    handleSwipe,
    handleDodge,
    fireUltimate,
    onOtHiem: castOtHiem,
    onRomBoc: castRomBoc,
    onHighlightGem: (pos) => setHighlightedGem(pos),
    onClearHighlight: () => setHighlightedGem(null),
    animatingRef,
    isStunnedRef,
    isPausedRef,
    result: resultRef,
  });

  // Sync auto-play level from API (effectiveLevel = max of purchased/rented)
  useEffect(() => { autoPlay.setVipLevel(effectiveLevel); }, [effectiveLevel]); // eslint-disable-line react-hooks/exhaustive-deps

  // ═══ Boss sprite state management (multi-state SVG) ═══
  const {
    state: spriteState,
    src: spriteSrc,
    hasSprites,
    triggerAttack: triggerBossAttack,
    triggerDead: triggerBossDead,
  } = useBossSprite({
    spritePath: bossData.spritePath,
    fallbackImage: bossData.image,
    attackDuration: 900,
  });

  // ═══ Start battle session on BE (anti-cheat) ═══
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [battleSessionId, setBattleSessionId] = useState<string | undefined>(undefined);
  const battleSessionStarted = useRef(false);

  useEffect(() => {
    if (battleSessionStarted.current) return;
    battleSessionStarted.current = true;
    campaignApi.startCampaignBattle(campaignBossId)
      .then((res) => {
        setBattleSessionId(res?.sessionId);
        setSessionReady(true);
      })
      .catch((err: any) => {
        console.error('[BATTLE] Failed to start battle session:', err);
        setSessionError(err.message || 'Không thể bắt đầu trận đấu');
      });
  }, [campaignBossId]);

  // ═══ Preload battle sounds + BGM ═══
  useEffect(() => {
    audioManager.preloadScene('battle');
    audioManager.preloadScene('campaign');
    audioManager.startBgm('campaign');
    return () => { audioManager.stopBgm(); };
  }, []);

  useEffect(() => {
    if (result !== 'fighting') {
      audioManager.stopBgm();
    }
  }, [result]);

  const { data: auth } = useAuth();
  const level = useLevel();

  // ═══ Shared hooks: pointer gestures + combo particles ═══
  const { handlePointerDown, handlePointerMove, handlePointerUp } = useGemPointer(handleTap, handleSwipe);
  const comboParticles = useComboParticles(combo, showCombo);

  // ═══ Local extracted hooks ═══
  const { deathPhase, setDeathPhase } = useDeathAnimation(result);
  const { enrageLevel, enrageAlert } = useEnrageAlert(enrageMultiplier, result);
  const bossComplete = useBattleEnd({
    result, boss, campaignBossId,
    totalDmgDealt, durationSeconds, stars,
    maxCombo, combatStatsTracker,
    battleSessionId,
    autoAILevel: effectiveLevel,
    isAutoPlayActive: autoPlay.isActive,
    getBattleLog: autoPlay.getBattleLog,
  });

  // Self-learning (Lv5 only)
  const learnerCalledRef = useRef(false);
  useEffect(() => {
    if (result !== 'fighting' && !learnerCalledRef.current) {
      learnerCalledRef.current = true;
      if (autoPlay.isActive && autoPlay.vipLevel >= 5 && archetype) {
        const playerHpPct = Math.round((boss.playerHp / boss.playerMaxHp) * 100);
        learnerBattleEnd({
          won: result === 'victory',
          bossArchetype: isDeVuong ? 'de_vuong' : archetype,
          bossId: Number(campaignBossId) || 0,
          totalTurns: boss.turnCount,
          turnLimit: 0,
          gemsUsed: autoPlay.gemsUsed,
          playerHPPercent: playerHpPct,
          dodgesUsed: autoPlay.dodgesUsed,
          ultsUsed: autoPlay.ultsUsed,
          timeSeconds: durationSeconds,
        });
      }
    }
  }, [result]); // eslint-disable-line react-hooks/exhaustive-deps

  // ═══ Fragment drop animation state ═══
  const [showDropAnim, setShowDropAnim] = useState(true);

  // ═══ Trigger sprite attack on boss skill or normal attack ═══
  useEffect(() => {
    if (skillWarning && hasSprites) triggerBossAttack();
  }, [skillWarning]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (bossAttackMsg && hasSprites) triggerBossAttack();
  }, [bossAttackMsg]); // eslint-disable-line react-hooks/exhaustive-deps

  // ═══ Trigger sprite dead when boss HP reaches 0 ═══
  useEffect(() => {
    if (boss.bossHp <= 0 && hasSprites) triggerBossDead();
  }, [boss.bossHp <= 0]); // eslint-disable-line react-hooks/exhaustive-deps

  const bossHpPct = Math.round((boss.bossHp / boss.bossMaxHp) * 100);
  const playerHpPct = Math.round((boss.playerHp / boss.playerMaxHp) * 100);
  const shieldMax = Math.max(boss.playerMaxHp * 0.5, 200);
  const comboInfo = getComboInfo(combo);

  // ═══ Death overlay (shown before BattleResult on defeat) ═══
  if (result === 'defeat' && deathPhase === 'dying') {
    return (
      <DeathOverlay
        spriteSrc={spriteSrc}
        bossName={bossData.name}
        bossEmoji={bossData.emoji}
        onSkip={() => setDeathPhase('done')}
      />
    );
  }

  // Victory / Defeat summary screen
  if ((result === 'victory' || result === 'defeat') && deathPhase === 'done') {
    return (
      <CampaignBattleResultHandler
        won={result === 'victory'}
        bossComplete={bossComplete}
        dropData={bossComplete.data?.drop}
        showDropAnim={showDropAnim}
        setShowDropAnim={setShowDropAnim}
        bossData={bossData}
        totalDmgDealt={totalDmgDealt}
        combatStatsTracker={combatStatsTracker}
        level={level}
        playerHpPct={playerHpPct}
        bossTurnCount={boss.turnCount}
        archetype={archetype}
        archetypeTip={archetypeTip}
        onBack={onBack}
        onRetry={onRetry}
        stars={stars}
        durationSeconds={durationSeconds}
        maxCombo={maxCombo}
      />
    );
  }

  // Session Loading or Error states
  if (sessionError || !sessionReady) {
    return (
      <CampaignSessionLoader
        sessionError={sessionError}
        sessionReady={sessionReady}
        onBack={onBack}
      />
    );
  }

  return (
    <div className={`h-[100dvh] max-w-[430px] mx-auto relative campaign-battle-gradient flex flex-col overflow-hidden ${screenShake ? 'animate-screen-shake' : ''} ${result === 'victory' && deathPhase === 'dying' ? 'animate-screen-shake-violent' : ''}`}>

      {/* FPS Counter — test độ mượt */}
      <FpsCounter />

      {/* ── Forest decorative layers (simplified for performance) ── */}
      <div className="campaign-trees-layer z-[1]" />

      {/* Victory Boss Death Flash */}
      {result === 'victory' && deathPhase === 'dying' && (
        <div className="absolute inset-0 z-[60] bg-white pointer-events-none animate-ult-flash" style={{ mixBlendMode: 'overlay' }} />
      )}
      {/* Ultimate fullscreen flash */}
      {ultActive && <UltimateFlash />}

      {/* Boss attack flash */}
      {bossAttackMsg && !ultActive && <BossAttackFlash text={bossAttackMsg.text} emoji={bossAttackMsg.emoji} />}

      {/* Combo particles */}
      <ComboParticles particles={comboParticles} />

      {/* Skill warning — screen edge glow */}
      <SkillWarningGlow skillWarning={skillWarning} />

      {/* Phase transition overlay */}
      <PhaseTransitionOverlay phase={showPhaseTransition} />

      {/* Combat notifications — memoized slice to avoid new array every render */}
      <CombatNotifList notifs={combatNotifs} />

      {/* Red vignette flash when player takes damage */}
      <DamageVignette screenShake={screenShake} ultActive={ultActive} />

      {/* Enrage alert popup */}
      <EnrageAlertBanner enrageAlert={enrageAlert} enrageLevel={enrageLevel} />

      {/* Boss rage overlay */}
      <BossRageOverlay bossHpPct={bossHpPct} bossEmoji={bossData.emoji} />

      {/* Top half: Boss arena UI component */}
      <CampaignArenaTop
        boss={boss} bossData={bossData} level={level} combatStats={combatStats}
        onBack={onBack} elapsedSeconds={elapsedSeconds} enrageLevel={enrageLevel}
        pauseBattle={pauseBattle} resumeBattle={resumeBattle} zoneName={zoneName}
        archetype={archetype} archetypeIcon={archetypeIcon}
        currentPhase={currentPhase} totalPhases={totalPhases}
        activeBossStats={activeBossStats} activeBossBuffs={activeBossBuffs}
        spriteSrc={spriteSrc} spriteState={spriteState} hasSprites={hasSprites}
        enrageMultiplier={enrageMultiplier} skillWarning={!!skillWarning}
        egg={egg} popups={popups} combo={combo} showCombo={showCombo} comboInfo={comboInfo}
      />

      {/* Bottom half: Match-3 + Skills */}
      <div className="flex-[1_1_70%] rounded-t-2xl px-3 pt-1.5 pb-[max(env(safe-area-inset-bottom,6px),6px)] flex flex-col"
        style={{ background: 'rgba(0,0,0,0.3)' }}>

        {/* Match-3 Board */}
        <CampaignMatch3Board
          grid={grid} selected={selected} matchedCells={matchedCells}
          spawningGems={spawningGems} lockedGems={lockedGems} highlightedGem={highlightedGem}
          isStunned={isStunned} animating={animating}
          handlePointerDown={handlePointerDown} handlePointerMove={handlePointerMove} handlePointerUp={handlePointerUp}
          combo={combo} showCombo={showCombo} otHiemActive={otHiemActive} romBocActive={romBocActive}
          GEM_META={GEM_META}
          blastVfxs={blastVfxs} hintedGems={hintedGems} particleBursts={particleBursts} floatingTexts={floatingTexts} chainLightnings={chainLightnings}
        />

        {/* Player HUD & Controls */}
        <CampaignPlayerHUD
          activeDebuffs={activeDebuffs} boss={boss} shieldMax={shieldMax}
          combatStats={combatStats} lastPlayerDamage={lastPlayerDamage}
          manaDodgeCost={manaDodgeCost} manaUltCost={manaUltCost}
          skillWarning={!!skillWarning} skillAlert={skillAlert} daysUntilExpiry={daysUntilExpiry}
          autoPlay={autoPlay} skillLevels={skillLevels}
          otHiemActive={otHiemActive} otHiemCooldown={otHiemCooldown} OT_HIEM_CONFIG={OT_HIEM_CONFIG} otHiemDuration={otHiemDuration} castOtHiem={castOtHiem}
          romBocActive={romBocActive} romBocCooldown={romBocCooldown} ROM_BOC_CONFIG={ROM_BOC_CONFIG} romBocDuration={romBocDuration} castRomBoc={castRomBoc}
          handleDodge={handleDodge} fireUltimate={fireUltimate}
        />
      </div>
    </div>
  );
}

// Extracted to avoid .slice(-3) creating new array on every parent render
const CombatNotifList = React.memo(function CombatNotifList({ notifs }: { notifs: any[] }) {
  if (notifs.length === 0) return null;
  const visible = notifs.length <= 3 ? notifs : notifs.slice(-3);
  return (
    <div className="absolute top-24 right-3 z-40 flex flex-col gap-1 pointer-events-none">
      {visible.map((n: any) => (
        <div key={n.id} className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-white animate-fade-in"
          style={{ background: `${n.color}cc`, boxShadow: `0 0 8px ${n.color}60` }}>
          {n.text}
        </div>
      ))}
    </div>
  );
});
