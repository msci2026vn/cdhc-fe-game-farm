// ═══════════════════════════════════════════════════════════════
// WorldBossBattleView — Fullscreen campaign combat for World Boss
// Layout: absolute % positioning, canvas 390×693 (9:16)
//   0-22%  → Boss area (HP bar + avatar)
//  22-34%  → Player area (avatar + HP bar)
//  34-80%  → Gem board
//  80-100% → Mana bar + skill buttons
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useWorldBossBattle, type WorldBossSessionResult } from '../hooks/useWorldBossBattle';
import { usePlayerStats } from '@/shared/hooks/usePlayerStats';
import { useSkillLevels } from '@/shared/hooks/usePlayerSkills';
import { useAuth } from '@/shared/hooks/useAuth';
import { useGemPointer, useComboParticles } from '@/shared/match3';
import { STAT_CONFIG } from '@/shared/utils/stat-constants';
import type { PlayerCombatStats } from '@/shared/utils/combat-formulas';
import type { WorldBossInfo } from '../types/world-boss.types';
import { useWorldBossLite } from '../hooks/useWorldBoss';
import { useWorldBossSSE } from '../hooks/useWorldBossSSE';
import { FloatingDamage } from './FloatingDamage';
import { useAutoPlayController } from '@/shared/autoplay/auto-controller';

// Shared sub-components (source files not modified)
import CampaignMatch3Board from '@/modules/campaign/components/CampaignMatch3Board';
import { BossStatsBadges, BossBuffsBadges } from '@/modules/campaign/components/BossStatsDisplay';
import { CircleSkillBtn } from '@/modules/campaign/components/CampaignPlayerHUD';
import UltimateFlash from '@/shared/match3/UltimateFlash';
import BossAttackFlash from '@/shared/match3/BossAttackFlash';
import ComboParticles from '@/shared/match3/ComboParticles';
import { SkillWarningGlow, DamageVignette } from '@/modules/campaign/components/SkillWarningOverlay';
import {
  BossHPBar, BattleTopBar, PlayerHPBar, ManaBar,
  DamagePopupLayer, ComboDisplay, BossRageOverlay,
} from '@/modules/boss/components/hud';
import AutoPlayToggle from '@/shared/components/AutoPlayToggle';
import { OT_HIEM_CONFIG, ROM_BOC_CONFIG } from '@/shared/match3/combat.config';
import { WorldBossCampaignResult } from './WorldBossCampaignResult';

// Boss sprite assets — mirrors BossDisplay.tsx SPRITE_MAP
const SPRITE_MAP: Record<string, string> = {
  ray_nau:      '/assets/bosses/ray-nau.svg',
  nhen_do:      '/assets/bosses/nhen-do.svg',
  dao_on:       '/assets/bosses/dao-on.svg',
  oc_buou:      '/assets/bosses/oc-buou.svg',
  oc_sen:       '/assets/bosses/oc-sen.svg',
  nam_re:       '/assets/bosses/nam-re.svg',
  chau_chau:    '/assets/bosses/chau-chau.svg',
  bo_xit:       '/assets/bosses/bo-xit.svg',
  bo_rua:       '/assets/bosses/bo-rua.svg',
  sau_duc_than: '/assets/bosses/sau-duc-than.svg',
  sau_cuon_la:  '/assets/bosses/sau-cuon-la.svg',
  sau_to:       '/assets/bosses/sau-to.svg',
  kho_van:      '/assets/bosses/kho-van.svg',
  rep:          '/assets/bosses/rep-xanh.svg',
  bac_la:       '/assets/bosses/bac-la.svg',
  dom_nau:      '/assets/bosses/dom-nau.svg',
  chuot_dong:   '/assets/bosses/chuot-dong.svg',
  rong_lua:     '/assets/bosses/rong-lua.svg',
};

interface Props {
  worldBoss: WorldBossInfo;
  onExit: () => void;
}

export function WorldBossBattleView({ worldBoss, onExit }: Props) {
  const { t } = useTranslation();
  const { data: statInfo } = usePlayerStats();
  const { data: authData } = useAuth();
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
    authData?.user?.name ?? undefined,
  );

  // SSE realtime HP — <100ms latency
  const { sseHpPercent, damageFeed } = useWorldBossSSE(
    worldBoss.id,
    authData?.user?.id,
  );

  // Lite polling — detect boss death/expiry (fallback when SSE drops)
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

  // ═══ Auto-play: wire refs for controller ═══
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

  const [highlightedGem, setHighlightedGem] = useState<number | null>(null);

  // NOTE: VIP level hiện tại = 1 (free). Sau này gating VIP sẽ dùng useAutoPlayLevel()
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
    mode: 'boss',
    bossArchetype: worldBoss.element ?? 'chaos',
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

  // VIP Lv1: free for all (later will gate to VIP only via useAutoPlayLevel)
  useEffect(() => { autoPlay.setVipLevel(1); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const { handlePointerDown, handlePointerMove, handlePointerUp } = useGemPointer(handleTap, handleSwipe);
  const comboParticles = useComboParticles(combo, showCombo);

  // HP từ server — ưu tiên SSE realtime > liteData poll 2s > sessionStats local
  const serverHpPct = sseHpPercent ?? liteData?.hpPercent ?? sessionStats.hpPercent; // 0..1
  const serverHp = Math.round(serverHpPct * worldBoss.stats.max_hp);
  const serverMaxHp = worldBoss.stats.max_hp;
  const bossHpPct = Math.round(serverHpPct * 100); // rage overlay

  const shieldMax = Math.max(boss.playerMaxHp * 0.5, 200);
  const comboInfo = getComboInfo(combo);

  // Derived state
  const bossSpriteSrc = SPRITE_MAP[worldBoss.baseSprite] ?? '';
  const playerAvatarUrl = authData?.user?.avatarUrl ?? '';
  const ultReady = (boss.ultCharge ?? 0) >= 100;
  const hasDodgeMana = boss.mana >= manaDodgeCost;
  const hasUltMana = boss.mana >= manaUltCost;
  const ultOnCooldown = (boss.ultCooldown ?? 0) > 0;
  const isBurning = activeDebuffs.length > 0 && activeDebuffs.some((d: any) => d.type === 'burn');

  // Session ended — show result
  if (battleState === 'ended' && sessionResult) {
    return (
      <WorldBossCampaignResult
        result={sessionResult}
        onFightAgain={() => {
          setSessionResult(null);
          onExit();
        }}
        onExit={onExit}
      />
    );
  }

  return (
    <div className={`relative h-[100dvh] max-w-[390px] mx-auto boss-gradient overflow-hidden ${screenShake ? 'animate-screen-shake' : ''}`}>

      {/* === OVERLAYS: full-screen z-index layers === */}
      <FloatingDamage entries={damageFeed} />
      {ultActive && <UltimateFlash />}
      {bossAttackMsg && !ultActive && <BossAttackFlash text={bossAttackMsg.text} emoji={bossAttackMsg.emoji} />}
      <ComboParticles particles={comboParticles} />
      <SkillWarningGlow skillWarning={skillWarning} />
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
      <DamageVignette screenShake={screenShake} ultActive={ultActive} />
      <BossRageOverlay bossHpPct={bossHpPct} bossEmoji={'👾'} />

      {/* ═══════════════════════════════════════
          BOSS AREA — top 0~22%
          Left: timer bar + HP bar + stat badges
          Right: boss sprite avatar
      ═══════════════════════════════════════ */}
      <div className="absolute flex flex-col pt-safe px-3 pb-1 z-[5]"
        style={{ top: 0, left: 0, right: 0, height: '22%' }}>
        {/* Background gradient */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(circle at 50% 60%, rgba(30,100,15,0.2) 0%, transparent 55%), radial-gradient(circle at 20% 20%, rgba(20,80,10,0.12) 0%, transparent 40%)' }} />

        {/* Top bar: timer + controls */}
        <BattleTopBar
          turn={boss.turnCount}
          maxTurns={0}
          level={1}
          atk={combatStats.atk}
          def={combatStats.def}
          onRetreat={onExit}
          isCampaign={true}
          elapsedSeconds={elapsedSeconds}
          enrageLevel={0}
          onPause={pauseBattle}
          onResume={resumeBattle}
        />

        {/* Boss HP info (left) + sprite avatar (right) */}
        <div className="flex items-center gap-2 flex-1 min-h-0">
          <div className="flex-1 min-w-0">
            <BossHPBar
              name={worldBoss.bossName}
              emoji="👾"
              hp={serverHp}
              maxHp={serverMaxHp}
              phase={currentPhase}
              totalPhases={totalPhases}
              healPerTurn={activeBossStats.healPercent}
            />
            <BossStatsBadges def={activeBossStats.def} freq={activeBossStats.freq} enrageLevel={0} />
            <BossBuffsBadges activeBossBuffs={activeBossBuffs} />
          </div>

          {/* Boss sprite — SVG if available, emoji fallback */}
          <div className="relative flex-shrink-0 flex items-center justify-center">
            {bossSpriteSrc ? (
              <img
                src={bossSpriteSrc}
                alt={worldBoss.bossName}
                className={`object-contain select-none pointer-events-none ${skillWarning ? 'animate-boss-attack' : 'animate-boss-idle'}`}
                style={{ width: 76, height: 76, opacity: serverHp <= 0 ? 0.3 : 1 }}
                draggable={false}
              />
            ) : (
              <span
                className={`text-[44px] ${skillWarning ? 'animate-boss-attack' : 'animate-boss-idle'}`}
                style={{ opacity: serverHp <= 0 ? 0.3 : 1 }}>
                👾
              </span>
            )}
            {/* Damage popups float over boss sprite */}
            <DamagePopupLayer popups={popups} />
          </div>
        </div>

        {/* Combo badge — positioned relative to boss area */}
        <div className="relative h-0">
          <ComboDisplay combo={combo} show={showCombo} label={comboInfo.label} mult={comboInfo.mult} color={comboInfo.color} />
        </div>
      </div>

      {/* ═══════════════════════════════════════
          PLAYER AREA — top 22~34%
          Left: player avatar
          Center-right: HP + shield bars
          Right: compact debuffs
      ═══════════════════════════════════════ */}
      <div className="absolute flex items-center gap-2 px-3"
        style={{ top: '22%', left: 0, right: 0, height: '12%', background: 'rgba(0,0,0,0.28)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>

        {/* Player avatar */}
        {playerAvatarUrl ? (
          <img
            src={playerAvatarUrl}
            alt="you"
            className={`aspect-square rounded-full object-cover border-2 flex-shrink-0 ${isBurning ? 'border-orange-500' : 'border-green-400/60'}`}
            style={{ height: '72%' }}
          />
        ) : (
          <div
            className={`aspect-square rounded-full flex items-center justify-center text-sm border-2 flex-shrink-0 bg-gray-700 ${isBurning ? 'border-orange-500' : 'border-green-400/40'}`}
            style={{ height: '72%' }}>
            👤
          </div>
        )}

        {/* HP + shield bars */}
        <div className={`flex-1 min-w-0 relative ${isBurning ? 'ring-1 ring-orange-500/50 rounded' : ''}`}>
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

        {/* Debuffs — compact, max 2 */}
        {activeDebuffs.length > 0 && (
          <div className="flex flex-col gap-0.5 flex-shrink-0">
            {activeDebuffs.slice(0, 2).map((d: any, i: number) => (
              <span key={`${d.type}-${i}`} className="text-[8px] font-bold px-1.5 py-0.5 rounded-full"
                style={{
                  background: d.type === 'burn' ? 'rgba(231,76,60,0.3)' : d.type === 'heal_block' ? 'rgba(108,92,231,0.3)' : 'rgba(253,121,168,0.3)',
                  color: d.type === 'burn' ? '#ff6b6b' : d.type === 'heal_block' ? '#a29bfe' : '#fd79a8',
                }}>
                {d.icon} {d.remainingSec}s
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════
          GEM BOARD — top 34%~80%
      ═══════════════════════════════════════ */}
      <div className="absolute flex flex-col"
        style={{ top: '34%', left: '2%', right: '2%', height: '46%' }}>
        <CampaignMatch3Board
          grid={grid} selected={selected} matchedCells={matchedCells}
          spawningGems={spawningGems} lockedGems={lockedGems} highlightedGem={highlightedGem}
          isStunned={isStunned} animating={animating}
          handlePointerDown={handlePointerDown} handlePointerMove={handlePointerMove} handlePointerUp={handlePointerUp}
          combo={combo} showCombo={showCombo} otHiemActive={otHiemActive} romBocActive={romBocActive}
          GEM_META={GEM_META}
          blastVfxs={blastVfxs} hintedGems={hintedGems} particleBursts={particleBursts} floatingTexts={floatingTexts} chainLightnings={chainLightnings}
        />
      </div>

      {/* ═══════════════════════════════════════
          BOTTOM HUD — top 80%~100%
          Mana bar + skill warning + skill buttons
      ═══════════════════════════════════════ */}
      <div className="absolute flex flex-col justify-end px-3"
        style={{ top: '80%', left: 0, right: 0, bottom: 0, paddingBottom: 'max(env(safe-area-inset-bottom, 4px), 4px)' }}>

        <ManaBar
          mana={boss.mana}
          maxMana={boss.maxMana}
          dodgeCost={manaDodgeCost}
          ultCost={manaUltCost}
          ultCharge={boss.ultCharge ?? 0}
        />

        {/* Skill warning */}
        {skillWarning && (
          <div className="text-center py-0.5 pointer-events-none">
            <span className="bg-red-900/80 text-red-300 px-4 py-0.5 rounded-full text-xs font-bold">
              {t('campaign.ui.strong_attack_warning')}
            </span>
          </div>
        )}

        {/* Boss skill alert */}
        {skillAlert && (
          <div className="text-center py-0.5 animate-fade-in">
            <span className="px-4 py-1 rounded-full text-xs font-bold text-purple-200"
              style={{ background: 'rgba(108,92,231,0.85)', boxShadow: '0 0 15px rgba(108,92,231,0.3)' }}>
              {skillAlert.icon} {skillAlert.text}
            </span>
          </div>
        )}

        {/* Skill buttons row */}
        <div className="flex items-end justify-around pt-1 pb-1">
          {/* Ớt Hiểm */}
          <CircleSkillBtn
            icon="🌶️"
            label={`${t('campaign.skills.ot_hiem.short_name')}${skillLevels.ot_hiem > 0 ? ` Lv${skillLevels.ot_hiem}` : ''}`}
            sublabel={otHiemCooldown > 0 ? undefined : otHiemActive ? 'active' : undefined}
            variant="red"
            isActive={otHiemActive}
            onCooldown={otHiemCooldown > 0}
            cooldownSec={otHiemCooldown}
            cooldownPct={OT_HIEM_CONFIG.cooldown > 0 ? (otHiemCooldown / OT_HIEM_CONFIG.cooldown) * 100 : 0}
            isReady={skillLevels.ot_hiem > 0 && otHiemCooldown === 0 && !otHiemActive}
            isLocked={skillLevels.ot_hiem === 0}
            onClick={castOtHiem}
            size="md"
          />
          {/* Rơm Bọc */}
          <CircleSkillBtn
            icon="🪹"
            label={`${t('campaign.skills.rom_boc.short_name')}${skillLevels.rom_boc > 0 ? ` Lv${skillLevels.rom_boc}` : ''}`}
            variant="green"
            isActive={romBocActive}
            onCooldown={romBocCooldown > 0}
            cooldownSec={romBocCooldown}
            cooldownPct={ROM_BOC_CONFIG.cooldown > 0 ? (romBocCooldown / ROM_BOC_CONFIG.cooldown) * 100 : 0}
            isReady={skillLevels.rom_boc > 0 && romBocCooldown === 0 && !romBocActive}
            isLocked={skillLevels.rom_boc === 0}
            onClick={castRomBoc}
            size="md"
          />
          {/* NÉ */}
          <CircleSkillBtn
            className={skillWarning && hasDodgeMana ? 'campaign-skill-btn-dodge-active' : ''}
            icon="🏃"
            label={`${t('campaign.combat.dodge')} (${manaDodgeCost})`}
            variant="run"
            isReady={hasDodgeMana}
            isDodgeWindow={skillWarning && hasDodgeMana}
            onClick={handleDodge}
            size="md"
          />
          {/* ULT */}
          <CircleSkillBtn
            icon="⚡"
            label={ultReady ? 'ULT ⚡' : `ULT, ${boss.ultCharge ?? 0}%`}
            variant="ult"
            isReady={ultReady && hasUltMana && !ultOnCooldown}
            onCooldown={ultOnCooldown}
            cooldownSec={boss.ultCooldown ?? 0}
            ultChargePct={boss.ultCharge ?? 0}
            onClick={fireUltimate}
            size="lg"
          />
          {/* Auto AI */}
          <AutoPlayToggle
            isActive={autoPlay.isActive}
            onToggle={autoPlay.toggle}
            vipLevel={autoPlay.vipLevel}
            dodgeFreeRemaining={autoPlay.dodgeFreeRemaining}
            currentSituation={autoPlay.currentSituation}
            compact
          />
        </div>
      </div>
    </div>
  );
}
