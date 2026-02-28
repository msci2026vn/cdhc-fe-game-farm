// ═══════════════════════════════════════════════════════════════
// BossFightCampaign — Campaign boss combat UI
// Forked from BossFightM3 — uses useMatch3Campaign with DEF/heal/freq
// Weekly boss uses original BossFightM3 — UNTOUCHED
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useRef } from 'react';
import { useMatch3Campaign, CampaignBossData } from '../hooks/useMatch3Campaign';
import { campaignApi } from '@/shared/api/api-campaign';
import { useLevel } from '@/shared/hooks/usePlayerProfile';
import { useAuth } from '@/shared/hooks/useAuth';
import { usePlayerStats } from '@/shared/hooks/usePlayerStats';
import { STAT_CONFIG } from '@/shared/utils/stat-constants';
import type { PlayerCombatStats } from '@/shared/utils/combat-formulas';
import { getDominantAura } from '@/shared/components/BuildAura';
import { audioManager } from '@/shared/audio';
import { useBossSprite } from '../hooks/useBossSprite';
import { BossSprite } from './BossSprite';
import { useAutoPlay } from '@/shared/hooks/useAutoPlay';
import { useVipStatus } from '@/shared/hooks/useVipStatus';
import { useSkillLevels } from '@/shared/hooks/usePlayerSkills';
import { OT_HIEM_CONFIG, ROM_BOC_CONFIG } from '@/shared/match3/combat.config';
import CampaignSkillButton from './CampaignSkillButton';
import BuffIndicator from './BuffIndicator';
import type { BuffInfo } from './BuffIndicator';
import DropAnimation from './DropAnimation';
import type { DropResult } from '../types/fragment.types';

// Shared match-3 components & hooks
import { useGemPointer, useComboParticles } from '@/shared/match3';
import UltimateFlash from '@/shared/match3/UltimateFlash';
import BossAttackFlash from '@/shared/match3/BossAttackFlash';
import ComboParticles from '@/shared/match3/ComboParticles';

// Local extracted hooks
import { useDeathAnimation } from './hooks/useDeathAnimation';
import { useEnrageAlert } from './hooks/useEnrageAlert';
import { useBattleEnd } from './hooks/useBattleEnd';

// Local extracted components
import DeathOverlay from './DeathOverlay';
import { SkillWarningGlow, PhaseTransitionOverlay, DamageVignette, EnrageAlertBanner } from './SkillWarningOverlay';
import { BossStatsBadges, BossBuffsBadges } from './BossStatsDisplay';

// HUD components (reused from boss module)
import {
  BossHPBar, PlayerHPBar, ManaBar, SkillBar, BattleTopBar,
  ComboDisplay, DamagePopupLayer,
  BossRageOverlay, BattleResult,
} from '@/modules/boss/components/hud';

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
  } = useMatch3Campaign(bossData, combatStats, skillLevels, zoneNumber);

  const auraType = getDominantAura(combatStats);

  // ═══ Auto-play (VIP only) ═══
  const { isVip } = useVipStatus();
  const { autoEnabled, toggleAuto } = useAutoPlay({
    grid, animating, result,
    handleSwipe, handleDodge, fireUltimate,
    ultCharge: boss.ultCharge,
    skillWarning, isVip,
    lockedGems, isStunned, isPaused,
  });

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
  const battleSessionStarted = useRef(false);
  useEffect(() => {
    if (battleSessionStarted.current) return;
    battleSessionStarted.current = true;
    campaignApi.startCampaignBattle(campaignBossId).catch(err => {
      console.error('[BATTLE] Failed to start battle session:', err);
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
  });

  // ═══ Fragment drop animation state ═══
  const [showDropAnim, setShowDropAnim] = useState(true);
  const dropData: DropResult | undefined = bossComplete.data?.drop as DropResult | undefined;

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

  // ═══ Build active buffs list for BuffIndicator ═══
  const activeBuffs: BuffInfo[] = [];
  if (otHiemActive) {
    const ohLv = skillLevels.ot_hiem;
    activeBuffs.push({
      icon: '🌶️', name: 'Ớt Hiểm',
      remainingSeconds: otHiemDuration,
      totalSeconds: OT_HIEM_CONFIG.duration[ohLv - 1] || 6,
      description: `+${Math.round(OT_HIEM_CONFIG.damageBonus[(ohLv || 1) - 1] * 100)}%`,
      type: 'buff', color: '#e74c3c',
    });
  }
  if (romBocActive) {
    const rbLv = skillLevels.rom_boc;
    activeBuffs.push({
      icon: '🪹', name: 'Rơm Bọc',
      remainingSeconds: romBocDuration,
      totalSeconds: ROM_BOC_CONFIG.duration[rbLv - 1] || 4,
      description: `-${Math.round(ROM_BOC_CONFIG.damageReduction[(rbLv || 1) - 1] * 100)}%`,
      type: 'buff', color: '#27ae60',
    });
  }
  if (enrageMultiplier > 1) {
    activeBuffs.push({
      icon: '😡', name: 'Boss Enrage',
      remainingSeconds: 0, totalSeconds: 0,
      description: `×${enrageMultiplier.toFixed(1)}`,
      type: 'debuff', color: '#e74c3c',
    });
  }

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
  if (result === 'victory' || (result === 'defeat' && deathPhase === 'done')) {
    const won = result === 'victory';
    const serverData = bossComplete.data;

    // API still processing — show loading spinner
    if (bossComplete.isPending) {
      return (
        <div className="h-[100dvh] max-w-[430px] mx-auto boss-gradient flex items-center justify-center overflow-hidden">
          <div className="text-center animate-fade-in">
            <div className="text-[64px] mb-3">{won ? '🏆' : '💀'}</div>
            <div className="w-10 h-10 border-3 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-3" />
            <p className="text-white/70 font-heading font-bold text-sm">Đang ghi nhận kết quả...</p>
          </div>
        </div>
      );
    }

    // API failed — show error with retry
    if (bossComplete.isError && !serverData) {
      return (
        <div className="h-[100dvh] max-w-[430px] mx-auto boss-gradient flex items-center justify-center overflow-hidden px-6">
          <div className="text-center animate-fade-in">
            <div className="text-[56px] mb-3">{won ? '🏆' : '💀'}</div>
            <p className="text-white font-heading font-bold text-lg mb-1">
              {won ? 'Chiến thắng!' : 'Thất bại!'}
            </p>
            <p className="text-white/50 text-xs mb-4">
              Kết quả chưa được ghi nhận do lỗi kết nối.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={onBack}
                className="px-5 py-2.5 rounded-xl font-heading text-sm font-bold text-white active:scale-[0.97] transition-transform"
                style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
                Về Map
              </button>
              <button
                onClick={onRetry}
                className="px-5 py-2.5 rounded-xl font-heading text-sm font-bold text-white active:scale-[0.97] transition-transform btn-green">
                Đánh lại
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Show drop animation before BattleResult (if drop data exists)
    if (won && dropData && showDropAnim) {
      return (
        <div className="h-[100dvh] max-w-[430px] mx-auto boss-gradient flex items-center justify-center overflow-hidden">
          <DropAnimation
            drop={dropData}
            isVisible={showDropAnim}
            onClose={() => setShowDropAnim(false)}
          />
        </div>
      );
    }

    return (
      <BattleResult
        won={won}
        bossName={bossData.name}
        bossEmoji={bossData.emoji}
        totalDmgDealt={totalDmgDealt}
        serverData={serverData}
        combatStats={combatStatsTracker}
        playerLevel={level}
        isCampaign={true}
        playerHpPct={playerHpPct}
        turnUsed={boss.turnCount}
        turnMax={0}
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
      {ultActive && <UltimateFlash />}

      {/* Boss attack flash */}
      {bossAttackMsg && !ultActive && <BossAttackFlash text={bossAttackMsg.text} emoji={bossAttackMsg.emoji} />}

      {/* Combo particles */}
      <ComboParticles particles={comboParticles} />

      {/* Skill warning — screen edge glow */}
      <SkillWarningGlow skillWarning={skillWarning} />

      {/* Phase transition overlay */}
      <PhaseTransitionOverlay phase={showPhaseTransition} />

      {/* Combat notifications */}
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

      {/* Red vignette flash when player takes damage */}
      <DamageVignette screenShake={screenShake} ultActive={ultActive} />

      {/* Enrage alert popup */}
      <EnrageAlertBanner enrageAlert={enrageAlert} enrageLevel={enrageLevel} />

      {/* Boss rage overlay */}
      <BossRageOverlay bossHpPct={bossHpPct} bossEmoji={bossData.emoji} />

      {/* Top half: Boss arena */}
      <div className="flex-[0_0_30%] pt-safe px-3 pb-0 flex flex-col relative overflow-hidden">
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(circle at 50% 60%, rgba(231,76,60,0.15) 0%, transparent 50%), radial-gradient(circle at 20% 20%, rgba(142,68,173,0.1) 0%, transparent 40%)'
        }} />

        {/* Top bar */}
        <BattleTopBar
          turn={boss.turnCount}
          maxTurns={0}
          level={level}
          atk={combatStats.atk}
          def={combatStats.def}
          onRetreat={onBack}
          isCampaign={true}
          elapsedSeconds={elapsedSeconds}
          enrageLevel={enrageLevel}
          onPause={pauseBattle}
          onResume={resumeBattle}
        />

        {/* Zone label */}
        {zoneName && (
          <div className="z-10 mb-1">
            <span className="text-[9px] font-bold px-2 py-0.5 rounded"
              style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>
              📍 {zoneName}
            </span>
          </div>
        )}

        {/* Boss HP bar */}
        <BossHPBar
          name={bossData.name}
          emoji={bossData.emoji}
          hp={boss.bossHp}
          maxHp={boss.bossMaxHp}
          archetype={archetype}
          archetypeIcon={archetypeIcon}
          phase={currentPhase}
          totalPhases={totalPhases}
          healPerTurn={activeBossStats.healPercent}
        />

        {/* Boss stats badges */}
        <BossStatsBadges def={activeBossStats.def} freq={activeBossStats.freq} enrageLevel={enrageLevel} />

        {/* Boss buffs */}
        <BossBuffsBadges activeBossBuffs={activeBossBuffs} />

        {/* Boss sprite + damage popups + combo */}
        <div className="flex-1 flex items-center justify-center relative z-10">
          <BossSprite
            src={spriteSrc}
            state={spriteState}
            hasSprites={hasSprites}
            emoji={bossData.emoji}
            name={bossData.name}
            enrageMultiplier={enrageMultiplier}
            shieldBuff={activeBossBuffs.some(b => b.type === 'shield')}
            reflectBuff={activeBossBuffs.some(b => b.type === 'reflect')}
            skillWarning={!!skillWarning}
            bossDead={boss.bossHp <= 0}
          />

          {/* Egg */}
          {egg && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center animate-scale-in">
              <span className={`text-4xl ${egg.countdown <= 3 ? 'animate-pulse' : 'animate-boss-idle'}`}>🥚</span>
              <div className="w-12 h-1.5 rounded-full bg-gray-700 mt-1 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.round((egg.hp / egg.maxHp) * 100)}%`,
                    background: egg.hp / egg.maxHp > 0.5 ? '#27ae60' : egg.hp / egg.maxHp > 0.25 ? '#f39c12' : '#e74c3c',
                  }} />
              </div>
              <span className="text-[9px] font-bold text-white mt-0.5">{egg.hp}/{egg.maxHp}</span>
              {egg.countdown <= 3 && (
                <span className="text-[8px] font-bold text-red-400 animate-pulse">SẮP NỞ!</span>
              )}
            </div>
          )}

          <DamagePopupLayer popups={popups} />

          <ComboDisplay
            combo={combo}
            show={showCombo}
            label={comboInfo.label}
            mult={comboInfo.mult}
            color={comboInfo.color}
          />
        </div>
      </div>

      {/* Bottom half: Match-3 + Skills */}
      <div className="flex-[1_1_70%] rounded-t-2xl px-3 pt-1.5 pb-[max(env(safe-area-inset-bottom,6px),6px)] flex flex-col"
        style={{ background: 'rgba(0,0,0,0.3)' }}>

        {/* Debuff bar */}
        {activeDebuffs.length > 0 && (
          <div className="flex gap-1.5 mb-1 flex-wrap">
            {activeDebuffs.map((d, i) => (
              <span key={`${d.type}-${i}`} className="text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse"
                style={{
                  background: d.type === 'burn' ? 'rgba(231,76,60,0.3)' :
                    d.type === 'heal_block' ? 'rgba(108,92,231,0.3)' :
                      'rgba(253,121,168,0.3)',
                  color: d.type === 'burn' ? '#ff6b6b' :
                    d.type === 'heal_block' ? '#a29bfe' :
                      '#fd79a8',
                  border: `1px solid ${d.type === 'burn' ? 'rgba(231,76,60,0.4)' :
                    d.type === 'heal_block' ? 'rgba(108,92,231,0.4)' :
                      'rgba(253,121,168,0.4)'
                    }`,
                }}>
                {d.icon} {d.label} {d.remainingSec}s
              </span>
            ))}
          </div>
        )}

        {/* Player damage popup near HP bar */}
        <div className={`relative ${activeDebuffs.some(d => d.type === 'burn') ? 'ring-1 ring-orange-500/50' : ''}`}
          style={activeDebuffs.some(d => d.type === 'burn') ? { boxShadow: '0 0 12px rgba(231,76,60,0.3), inset 0 0 8px rgba(231,76,60,0.15)' } : {}}>
          <PlayerHPBar
            hp={boss.playerHp}
            maxHp={boss.playerMaxHp}
            shield={boss.shield}
            maxShield={shieldMax}
            def={combatStats.def}
            isHit={!!lastPlayerDamage}
          />
          {lastPlayerDamage > 0 && (
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 pointer-events-none z-30 animate-damage-float">
              <span className="font-heading text-xl font-bold text-red-500"
                style={{ textShadow: '0 0 8px rgba(231,76,60,0.6), 0 2px 4px rgba(0,0,0,0.5)' }}>
                -{lastPlayerDamage}
              </span>
            </div>
          )}
        </div>

        <ManaBar
          mana={boss.mana}
          maxMana={boss.maxMana}
          dodgeCost={manaDodgeCost}
          ultCost={manaUltCost}
        />

        {/* Skill warning inline text */}
        {skillWarning && (
          <div className="text-center py-1 pointer-events-none animate-pulse">
            <span className="bg-red-900/80 text-red-300 px-4 py-1 rounded-full text-sm font-bold">
              ⚡ Đòn mạnh đang đến!
            </span>
          </div>
        )}

        {/* Boss skill alert banner */}
        {skillAlert && (
          <div className="text-center py-1 animate-fade-in">
            <span className="px-4 py-1.5 rounded-full text-xs font-bold text-purple-200"
              style={{ background: 'rgba(108,92,231,0.85)', boxShadow: '0 0 15px rgba(108,92,231,0.3)' }}>
              {skillAlert.icon} {skillAlert.text}
            </span>
          </div>
        )}

        {/* Gem grid + Stun overlay */}
        <div className="relative flex-1">
          {showCombo && combo >= 3 && (
            <div key={`flash-${combo}`} className={`combo-flash-overlay combo-flash-${combo >= 20 ? 6 : combo >= 8 ? 5 : combo >= 5 ? 4 : combo >= 3 ? 3 : 2}`} />
          )}
          <div className={`grid grid-cols-8 gap-0.5 p-1 rounded-lg h-full ${isStunned ? 'pointer-events-none' : ''} ${combo >= 5 && showCombo ? 'grid-combo-shake' : ''} transition-all duration-300`}
            onPointerMove={handlePointerMove}
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: otHiemActive
                ? '2px solid rgba(231,76,60,0.6)'
                : romBocActive
                  ? '2px solid rgba(39,174,96,0.6)'
                  : '1px solid rgba(255,255,255,0.06)',
              boxShadow: otHiemActive
                ? '0 0 20px rgba(231,76,60,0.3), inset 0 0 10px rgba(231,76,60,0.1)'
                : romBocActive
                  ? '0 0 20px rgba(39,174,96,0.3), inset 0 0 10px rgba(39,174,96,0.1)'
                  : 'none',
              touchAction: 'none',
            }}>
            {grid.map((gem, i) => {
              const meta = GEM_META[gem.type];
              const isSelected = selected === i;
              const isMatched = matchedCells.has(i);
              const sp = gem.special;
              return (
                <div key={gem.id}
                  onPointerDown={(e) => handlePointerDown(i, e)}
                  onPointerUp={handlePointerUp}
                  className={`aspect-square rounded-md flex items-center justify-center text-[16px] cursor-pointer relative gem-shine transition-all duration-200
                    ${sp === 'rainbow' ? 'gem-rainbow' : meta.css}
                    ${sp === 'striped_h' ? 'gem-special-striped-h' : ''}
                    ${sp === 'striped_v' ? 'gem-special-striped-v' : ''}
                    ${sp === 'bomb' ? 'gem-special-bomb' : ''}
                    ${sp === 'rainbow' ? 'gem-special-rainbow' : ''}
                    ${spawningGems.has(gem.id) ? 'gem-special-spawn' : ''}
                    ${isSelected ? 'ring-2 ring-white scale-110 z-10 animate-gem-swap' : 'active:scale-[0.88]'}
                    ${isMatched ? 'animate-gem-pop gem-match-burst' : ''}
                    ${animating && !isMatched ? 'pointer-events-none' : ''}
                    ${lockedGems.has(i) ? 'opacity-50 ring-1 ring-gray-500' : ''}
                  `}>
                  {sp === 'rainbow' ? '🌈' : meta.emoji}
                  {lockedGems.has(i) && (
                    <span className="absolute inset-0 flex items-center justify-center text-[8px] pointer-events-none">🔒</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Stun overlay */}
          {isStunned && (
            <div className="absolute inset-0 z-20 flex items-center justify-center rounded-lg"
              style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)' }}>
              <div className="text-center animate-scale-in">
                <span className="text-5xl block" style={{ animation: 'spin 1s linear infinite' }}>💫</span>
                <span className="text-white font-heading font-bold text-xl block mt-2"
                  style={{ textShadow: '0 0 20px rgba(253,203,110,0.8)' }}>
                  CHOÁNG!
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Active buffs indicator */}
        <BuffIndicator buffs={activeBuffs} />

        {/* Player skill buttons row */}
        <div className="flex items-center gap-1 mt-0.5">
          <CampaignSkillButton
            skillId="ot_hiem"
            emoji="🌶️"
            label="Ớt"
            level={skillLevels.ot_hiem}
            isActive={otHiemActive}
            cooldownRemaining={otHiemCooldown}
            cooldownTotal={OT_HIEM_CONFIG.cooldown}
            durationRemaining={otHiemDuration}
            onCast={castOtHiem}
          />
          <CampaignSkillButton
            skillId="rom_boc"
            emoji="🪹"
            label="Rơm"
            level={skillLevels.rom_boc}
            isActive={romBocActive}
            cooldownRemaining={romBocCooldown}
            cooldownTotal={ROM_BOC_CONFIG.cooldown}
            durationRemaining={romBocDuration}
            onCast={castRomBoc}
          />
          <div className="flex-1">
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
          {isVip && (
            <button
              onClick={toggleAuto}
              className={`flex-shrink-0 px-3 py-2 rounded-xl text-[11px] font-bold transition-all active:scale-95 flex items-center gap-1 ${
                autoEnabled
                  ? 'bg-green-500 text-white shadow-[0_0_12px_rgba(34,197,94,0.5)]'
                  : 'bg-white/10 text-white/60 border border-white/10'
              }`}
            >
              <span className="text-sm">👑</span>
              AUTO
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
