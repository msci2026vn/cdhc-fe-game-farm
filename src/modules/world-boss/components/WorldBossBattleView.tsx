// ═══════════════════════════════════════════════════════════════
// WorldBossBattleView — Fullscreen campaign combat for World Boss
// Layout: absolute % positioning, canvas 390×693 (9:16)
//   All positions from ui-match.json, relative to root 390×693
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
import type { WorldBossInfo, ActiveBossSkill, BossSkillId } from '../types/world-boss.types';
import { useWorldBossLite } from '../hooks/useWorldBoss';
import { useWorldBossSSE } from '../hooks/useWorldBossSSE';
import { FloatingDamage } from './FloatingDamage';
import { useAutoPlayController } from '@/shared/autoplay/auto-controller';
import { useUIPositions } from '@/shared/hooks/useUIPositions';

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

// ─── ActiveSkillBadge — badge với countdown cho mỗi boss skill đang active ───

const SKILL_LABEL: Record<BossSkillId, string> = {
  burn:          '🔥 Burn',
  gem_swap:      '🔄 Gem Swap',
  slow_swap:     '⛓️ Slow',
  chaos_shuffle: '🌀 Chaos',
  darkness:      '🌑 Darkness',
  stun:          '⚡ Stun',
  gem_lock:      '🔒 Lock',
  direct_strike: '💥 Strike',
  junk_rain:     '🧊 Junk',
  meteor:        '☄️ Meteor',
  zone_lock:     '🔒 Zone',
  void_drain:    '🕳️ Void',
  armor_break:   '🛡️ Armor',
  shield:        '🔰 Shield',
  heal_self:     '💚 Heal',
};

function ActiveSkillBadge({ skill }: { skill: ActiveBossSkill }) {
  const [remaining, setRemaining] = useState(
    Math.ceil((skill.endTime - Date.now()) / 1000),
  );

  useEffect(() => {
    const t = setInterval(() => {
      setRemaining(Math.ceil((skill.endTime - Date.now()) / 1000));
    }, 500);
    return () => clearInterval(t);
  }, [skill.endTime]);

  if (remaining <= 0) return null;

  return (
    <span className="bg-red-900/90 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold whitespace-nowrap">
      {SKILL_LABEL[skill.skillId] ?? skill.skillId} {remaining}s
    </span>
  );
}

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

  // SSE realtime HP + boss skill events
  const { sseHpPercent, damageFeed, activeSkills, boardVisible, isBossStunned } = useWorldBossSSE(
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
    currentPhase, totalPhases, landedGems,
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

  const { getPos } = useUIPositions('world-boss');

  // Seed UI positions lên DB nếu chưa có
  useEffect(() => {
    if (!authData?.isAdmin) return;
    fetch('/api/ui-config?screen=world-boss')
      .then(r => r.json())
      .then(json => {
        if (json.data) return; // đã có rồi, skip
        // Chưa có → seed từ ui-match.json
        fetch('/json/ui-match.json')
          .then(r => r.json())
          .then((m: any) => {
            const data: Record<string, any> = {};
            m.elements.forEach((el: any) => {
              if (el.position && !el.position.left?.includes('–')) {
                data[el.name] = el.position;
              }
            });
            fetch('/api/ui-config/admin', {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ screen: 'world-boss', data }),
            });
          });
      });
  }, [authData?.isAdmin]); // eslint-disable-line react-hooks/exhaustive-deps

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
    <div className={`relative w-full max-w-[390px] h-[693px] mx-auto boss-gradient overflow-hidden ${screenShake ? 'animate-screen-shake' : ''}`}>

      {/* ── BossRageOverlay: inset-0 z-20 ── */}
      <BossRageOverlay bossHpPct={bossHpPct} bossEmoji={'👾'} />

      {/* ── UltimateFlash: inset-0 z-[60] ── */}
      {ultActive && <UltimateFlash />}

      {/* ── BossAttackFlash: inset-0 z-[50] ── */}
      {bossAttackMsg && !ultActive && <BossAttackFlash text={bossAttackMsg.text} emoji={bossAttackMsg.emoji} />}

      {/* ── ComboParticles + SkillWarningGlow + DamageVignette (fullscreen overlays) ── */}
      <ComboParticles particles={comboParticles} />
      <SkillWarningGlow skillWarning={skillWarning} />
      <DamageVignette screenShake={screenShake} ultActive={ultActive} />

      {/* ── CombatNotifList: absolute top-24 right-3 z-40 ── */}
      {combatNotifs.length > 0 && (
        <div style={getPos('CombatNotifList')} className="z-40 flex flex-col gap-1 pointer-events-none">
          {combatNotifs.slice(-3).map((n: any) => (
            <div key={n.id} className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-white animate-fade-in"
              style={{ background: `${n.color}cc`, boxShadow: `0 0 8px ${n.color}60` }}>
              {n.text}
            </div>
          ))}
        </div>
      )}

      {/* ── DamagePopupLayer: left:0% top:8% width:100% height:14% z-30 ── */}
      <div style={getPos('DamagePopupLayer')}>
        <DamagePopupLayer popups={popups} />
      </div>

      {/* ── FloatingDamage (other players SSE): absolute, positioned internally ── */}
      <FloatingDamage entries={damageFeed} />

      {/* ── BattleTopBar: left:0% top:0.5% width:100% height:8% ── */}
      <div style={getPos('BattleTopBar')}>
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
      </div>

      {/* ── BossStatsBadges: left:24.87% top:2.95% width:50.56% height:5.33% ── */}
      <div style={getPos('BossStatsBadges')}>
        <BossStatsBadges def={activeBossStats.def} freq={activeBossStats.freq} enrageLevel={0} />
      </div>

      {/* ── BossHPBar: left:35.38% top:9.58% width:33.64% height:4.33% ── */}
      <div style={getPos('BossHPBar')}>
        <BossHPBar
          name={worldBoss.bossName}
          emoji="👾"
          hp={serverHp}
          maxHp={serverMaxHp}
          phase={currentPhase}
          totalPhases={totalPhases}
          healPerTurn={activeBossStats.healPercent}
        />
      </div>

      {/* ── BossBuffsBadges: left:71.03% top:9.99% width:28% height:3.49% ── */}
      <div style={getPos('BossBuffsBadges')}>
        <BossBuffsBadges activeBossBuffs={activeBossBuffs} />
      </div>

      {/* ── BossSprite: left:73.62% top:10.96% width:19.5% height:19% ── */}
      <div style={getPos('BossSprite')}
        className="flex items-center justify-center">
        {bossSpriteSrc ? (
          <img
            src={bossSpriteSrc}
            alt={worldBoss.bossName}
            className={`object-contain select-none pointer-events-none w-full h-full ${skillWarning ? 'animate-boss-attack' : 'animate-boss-idle'}`}
            style={{ opacity: serverHp <= 0 ? 0.3 : 1 }}
            draggable={false}
          />
        ) : (
          <span
            className={`text-[44px] ${skillWarning ? 'animate-boss-attack' : 'animate-boss-idle'}`}
            style={{ opacity: serverHp <= 0 ? 0.3 : 1 }}>
            👾
          </span>
        )}
      </div>

      {/* ── PlayerAvatar: left:4.03% top:11.3% width:17.82% height:9.25% ── */}
      <div style={getPos('PlayerAvatar')}
        className="flex items-center justify-center">
        {playerAvatarUrl ? (
          <img
            src={playerAvatarUrl}
            alt="you"
            className={`aspect-square rounded-full object-cover border-2 w-full h-full ${isBurning ? 'border-orange-500' : 'border-green-400/60'}`}
          />
        ) : (
          <div
            className={`aspect-square rounded-full flex items-center justify-center text-sm border-2 bg-gray-700 w-full h-full ${isBurning ? 'border-orange-500' : 'border-green-400/40'}`}>
            👤
          </div>
        )}
      </div>

      {/* ── PlayerHPBar: left:6.54% top:21.19% width:30.95% height:3.54% ── */}
      <div style={getPos('PlayerHPBar')}
        className={`relative ${isBurning ? 'ring-1 ring-orange-500/50 rounded' : ''}`}>
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

      {/* ── ManaBar: left:6% top:26.39% width:29.95% height:3.54% ── */}
      <div style={getPos('ManaBar')}>
        <ManaBar
          mana={boss.mana}
          maxMana={boss.maxMana}
          dodgeCost={manaDodgeCost}
          ultCost={manaUltCost}
          ultCharge={boss.ultCharge ?? 0}
        />
      </div>

      {/* ── PlayerDebuffs: compact, max 2 ── */}
      {activeDebuffs.length > 0 && (
        <div className="flex flex-col gap-0.5" style={getPos('PlayerDebuffs')}>
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

      {/* ── SkillWarning: left:7.18% top:30.28% width:30.56% height:2.24% ── */}
      {skillWarning && (
        <div style={getPos('SkillWarningBanner')}
          className="flex items-center justify-center pointer-events-none">
          <span className="bg-red-900/80 text-red-300 px-4 py-0.5 rounded-full text-xs font-bold">
            {t('campaign.ui.strong_attack_warning')}
          </span>
        </div>
      )}

      {/* ── ComboDisplay: left:37.82% top:24.22% width:30% height:5% ── */}
      <div style={getPos('ComboDisplay')}>
        <ComboDisplay combo={combo} show={showCombo} label={comboInfo.label} mult={comboInfo.mult} color={comboInfo.color} />
      </div>

      {/* ── Boss skill alert ── */}
      {skillAlert && (
        <div className="absolute left-0 right-0 flex justify-center animate-fade-in" style={{ top: '30.28%' }}>
          <span className="px-4 py-1 rounded-full text-xs font-bold text-purple-200"
            style={{ background: 'rgba(108,92,231,0.85)', boxShadow: '0 0 15px rgba(108,92,231,0.3)' }}>
            {skillAlert.icon} {skillAlert.text}
          </span>
        </div>
      )}

      {/* ── Active Boss Skills badges ── */}
      {activeSkills.length > 0 && (
        <div className="absolute flex flex-wrap gap-1 z-30 pointer-events-none"
          style={{ left: '2%', top: '31%' }}>
          {activeSkills.map((skill) => (
            <ActiveSkillBadge key={skill.skillId} skill={skill} />
          ))}
        </div>
      )}

      {/* ── CampaignMatch3Board: left:2% top:34% width:96% height:46% ── */}
      <div style={getPos('CampaignMatch3Board')} className="relative">
        <CampaignMatch3Board
          grid={grid} selected={selected} matchedCells={matchedCells}
          spawningGems={spawningGems} lockedGems={lockedGems} highlightedGem={highlightedGem}
          isStunned={isStunned || isBossStunned} animating={animating}
          handlePointerDown={handlePointerDown} handlePointerMove={handlePointerMove} handlePointerUp={handlePointerUp}
          combo={combo} showCombo={showCombo} otHiemActive={otHiemActive} romBocActive={romBocActive}
          GEM_META={GEM_META}
          blastVfxs={blastVfxs} hintedGems={hintedGems} particleBursts={particleBursts} floatingTexts={floatingTexts} chainLightnings={chainLightnings}
          landedGems={landedGems}
        />
        {/* Darkness overlay */}
        {!boardVisible && (
          <div className="absolute inset-0 bg-black/95 z-20 flex items-center justify-center rounded-lg">
            <span className="text-white text-base font-bold animate-pulse">🌑 Màn Đêm...</span>
          </div>
        )}
      </div>

      {/* ── ManaBarText: left:3% top:80% width:94% height:2% ── */}
      <div style={getPos('ManaBarText')}
        className="flex justify-between text-[8px] text-gray-400 pointer-events-none">
        <span>Mana</span>
        <span>NE: {manaDodgeCost} | ULT: {manaUltCost}</span>
      </div>

      {/* ── CircleSkillBtn_Dodge: left:10.26% top:85.13% width:17.49% height:11.75% ── */}
      <div style={getPos('CircleSkillBtn_Dodge')}
        className="flex items-center justify-center">
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
      </div>

      {/* ── CircleSkillBtn_1 (Ớt Hiểm): left:31.08% top:86% width:18.46% height:10.16% ── */}
      <div style={getPos('CircleSkillBtn_1')}
        className="flex items-center justify-center">
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
      </div>

      {/* ── CircleSkillBtn_2 (Rơm Bọc): left:51.69% top:85.57% width:18.62% height:11.32% ── */}
      <div style={getPos('CircleSkillBtn_2')}
        className="flex items-center justify-center">
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
      </div>

      {/* ── CircleSkillBtn_Ult: left:74.15% top:85.15% width:17.69% height:12.45% ── */}
      <div style={getPos('CircleSkillBtn_Ult')}
        className="flex items-center justify-center">
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
      </div>

      {/* ── AutoPlayToggle: left:5.38% top:3.75% width:12.87% height:5.4% ── */}
      <div style={getPos('AutoPlayToggle')}
        className="flex items-center justify-center">
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
  );
}
