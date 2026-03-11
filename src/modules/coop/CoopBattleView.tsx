// ═══════════════════════════════════════════════════════════════
// CoopBattleView — Màn hình chiến đấu Co-op Boss
//
// Fork từ WorldBossBattleView.tsx — KHÔNG sửa component gốc
// Thay đổi so với gốc:
// 1. useCoopBossBattle thay vì useWorldBossBattle (có coopRoomCode)
// 2. bossHpPercent prop từ useCoopRoom thay vì sessionStats (server realtime)
// 3. Overlay co-op: TeamMultiplierBadge, TeammateStatus, reconnect button
// 4. Không render WorldBossCampaignResult — CoopScreen xử lý result
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useRef } from 'react';
import { useCoopBossBattle } from './hooks/useCoopBossBattle';
import { usePlayerStats } from '@/shared/hooks/usePlayerStats';
import { useSkillLevels } from '@/shared/hooks/usePlayerSkills';
import { useAuth } from '@/shared/hooks/useAuth';
import { useGemPointer, useComboParticles } from '@/shared/match3';
import { STAT_CONFIG } from '@/shared/utils/stat-constants';
import type { PlayerCombatStats } from '@/shared/utils/combat-formulas';
import type { WorldBossInfo } from '@/modules/world-boss/types/world-boss.types';
import type { CoopPlayer } from './types/coop.types';
import { useAutoPlayController } from '@/shared/autoplay/auto-controller';

// Campaign components — reuse giống WorldBossBattleView, không sửa
import CampaignMatch3Board from '@/modules/campaign/components/CampaignMatch3Board';
import CampaignArenaTop from '@/modules/campaign/components/CampaignArenaTop';
import CampaignPlayerHUD from '@/modules/campaign/components/CampaignPlayerHUD';
import UltimateFlash from '@/shared/match3/UltimateFlash';
import BossAttackFlash from '@/shared/match3/BossAttackFlash';
import ComboParticles from '@/shared/match3/ComboParticles';
import { SkillWarningGlow, DamageVignette } from '@/modules/campaign/components/SkillWarningOverlay';
import { BossRageOverlay } from '@/modules/boss/components/hud';
import { OT_HIEM_CONFIG, ROM_BOC_CONFIG } from '@/shared/match3/combat.config';

// Co-op components
import { TeamMultiplierBadge } from './components/TeamMultiplierBadge';
import { TeammateStatus } from './components/TeammateStatus';

interface Props {
  worldBoss:           WorldBossInfo;
  coopRoomCode:        string;
  teamSize:            number;
  multiplier:          number;
  teammates:           CoopPlayer[];
  /** % HP boss còn lại — từ useCoopRoom boss_hp_update (realtime 3s) */
  bossHpPercent:       number;
  /** true sau 3 lần auto-retry thất bại — hiển thị overlay reconnect */
  showReconnectButton: boolean;
  onReconnect:         () => Promise<void>;
  onExit:              () => void;
}

export default function CoopBattleView({
  worldBoss, coopRoomCode, teamSize, multiplier, teammates,
  bossHpPercent, showReconnectButton, onReconnect, onExit,
}: Props) {
  const { data: statInfo } = usePlayerStats();
  const { data: authData } = useAuth();

  const combatStats: PlayerCombatStats = statInfo ? {
    atk:  statInfo.effectiveStats.atk,
    hp:   statInfo.effectiveStats.hp,
    def:  statInfo.effectiveStats.def,
    mana: statInfo.effectiveStats.mana,
  } : {
    atk:  STAT_CONFIG.BASE.ATK,
    hp:   STAT_CONFIG.BASE.HP,
    def:  STAT_CONFIG.BASE.DEF,
    mana: STAT_CONFIG.BASE.MANA,
  };

  const skillLevels = useSkillLevels();

  const { engine, battleState, startBattle, notifyBossDeadFromServer } = useCoopBossBattle(
    worldBoss,
    combatStats,
    worldBoss.id,
    coopRoomCode,
    undefined,
    authData?.user?.name ?? undefined,
  );

  // Boss chết phía server → flush batch và exit
  // Dùng bossHpPercent từ useCoopRoom thay vì sessionStats — chính xác hơn cho co-op
  useEffect(() => {
    if (bossHpPercent <= 0 && battleState === 'fighting') {
      notifyBossDeadFromServer();
    }
  }, [bossHpPercent, battleState, notifyBossDeadFromServer]);

  // Session ended → CoopScreen xử lý transition sang CoopResultScreen
  useEffect(() => {
    if (battleState === 'ended') onExit();
  }, [battleState, onExit]);

  // Auto-start khi mount
  useEffect(() => {
    startBattle();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
    spawningGems, blastVfxs, hintedGems, particleBursts, floatingTexts,
    chainLightnings, activeBossStats, currentPhase, totalPhases,
  } = engine;

  // Refs cho auto-play controller
  const gridRef           = useRef(grid);           gridRef.current           = grid;
  const bossRef           = useRef(boss);           bossRef.current           = boss;
  const animatingRef      = useRef(animating);      animatingRef.current      = animating;
  const resultRef         = useRef<'fighting' | 'victory' | 'defeat'>(result); resultRef.current = result;
  const skillWarningRef   = useRef(skillWarning);   skillWarningRef.current   = skillWarning;
  const activeDebuffsRef  = useRef(activeDebuffs);  activeDebuffsRef.current  = activeDebuffs;
  const activeBossBuffsRef= useRef(activeBossBuffs);activeBossBuffsRef.current= activeBossBuffs;
  const eggRef            = useRef(egg);            eggRef.current            = egg;
  const lockedGemsRef     = useRef(lockedGems);     lockedGemsRef.current     = lockedGems;
  const activeBossStatsRef= useRef(activeBossStats);activeBossStatsRef.current= activeBossStats;
  const otHiemActiveRef   = useRef(otHiemActive);   otHiemActiveRef.current   = otHiemActive;
  const otHiemCooldownRef = useRef(otHiemCooldown > 0); otHiemCooldownRef.current = otHiemCooldown > 0;
  const romBocActiveRef   = useRef(romBocActive);   romBocActiveRef.current   = romBocActive;
  const romBocCooldownRef = useRef(romBocCooldown > 0); romBocCooldownRef.current = romBocCooldown > 0;
  const isStunnedRef      = useRef(isStunned);      isStunnedRef.current      = isStunned;
  const isPausedRef       = useRef(isPaused);       isPausedRef.current       = isPaused;
  const enrageRef         = useRef(enrageMultiplier);enrageRef.current        = enrageMultiplier;

  const [highlightedGem, setHighlightedGem] = useState<number | null>(null);

  const autoPlay = useAutoPlayController({
    gridRef, bossRef, lockedGemsRef,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    activeDebuffsRef:  activeDebuffsRef as React.MutableRefObject<any>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    activeBossBuffsRef:activeBossBuffsRef as React.MutableRefObject<any>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    eggRef:            eggRef as React.MutableRefObject<any>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    skillWarningRef:   skillWarningRef as React.MutableRefObject<any>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    activeBossStatsRef:activeBossStatsRef as React.MutableRefObject<any>,
    playerStats: combatStats, skillLevels,
    otHiemActiveRef, otHiemOnCooldownRef: otHiemCooldownRef,
    romBocActiveRef, romBocOnCooldownRef: romBocCooldownRef,
    mode: 'boss', bossArchetype: worldBoss.element ?? 'chaos',
    handleSwipe, handleDodge, fireUltimate,
    onOtHiem: castOtHiem, onRomBoc: castRomBoc,
    onHighlightGem: (pos) => setHighlightedGem(pos),
    onClearHighlight: () => setHighlightedGem(null),
    animatingRef, isStunnedRef, isPausedRef, result: resultRef,
  });

  useEffect(() => { autoPlay.setVipLevel(1); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const { handlePointerDown, handlePointerMove, handlePointerUp } = useGemPointer(handleTap, handleSwipe);
  const comboParticles = useComboParticles(combo, showCombo);

  // HP boss: dùng bossHpPercent từ prop (server realtime) thay vì sessionStats
  // Chính xác hơn cho co-op vì phản ánh damage của cả team
  const serverHpPct  = bossHpPercent;
  const serverHp     = Math.round(serverHpPct * worldBoss.stats.max_hp);
  const serverMaxHp  = worldBoss.stats.max_hp;
  const bossHpPct    = Math.round(serverHpPct * 100);
  const displayBoss  = { ...boss, bossHp: serverHp, bossMaxHp: serverMaxHp };
  const shieldMax    = Math.max(boss.playerMaxHp * 0.5, 200);
  const comboInfo    = getComboInfo(combo);

  const myUserId = authData?.user?.id ?? '';

  return (
    <div className={`h-[100dvh] max-w-[430px] mx-auto relative boss-gradient flex flex-col overflow-hidden ${screenShake ? 'animate-screen-shake' : ''}`}>
      {ultActive && <UltimateFlash />}
      {bossAttackMsg && !ultActive && <BossAttackFlash text={bossAttackMsg.text} emoji={bossAttackMsg.emoji} />}
      <ComboParticles particles={comboParticles} />
      <SkillWarningGlow skillWarning={skillWarning} />

      {combatNotifs.length > 0 && (
        <div className="absolute top-24 right-3 z-40 flex flex-col gap-1 pointer-events-none">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
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

      {/* Co-op overlay — TeamMultiplierBadge ở góc trên phải, không chặn gameplay */}
      {teamSize >= 2 && (
        <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 35 }}>
          <TeamMultiplierBadge multiplier={multiplier} teamSize={teamSize} />
        </div>
      )}

      <CampaignArenaTop
        boss={displayBoss}
        bossData={{ id: worldBoss.id, name: worldBoss.bossName, emoji: '👾', image: '', hp: serverMaxHp, attack: worldBoss.stats.atk, reward: 0, xpReward: 0, description: '', difficulty: worldBoss.difficulty, unlockLevel: 0, archetype: 'none', def: worldBoss.stats.def, freq: 1, healPercent: 0, turnLimit: 0, skills: [] }}
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

      <div className="flex-[1_1_70%] rounded-t-2xl px-3 pt-1.5 pb-[max(env(safe-area-inset-bottom,6px),6px)] flex flex-col"
        style={{ background: 'rgba(0,0,0,0.3)' }}>

        <CampaignMatch3Board
          grid={grid} selected={selected} matchedCells={matchedCells}
          spawningGems={spawningGems} lockedGems={lockedGems} highlightedGem={highlightedGem}
          isStunned={isStunned} animating={animating}
          handlePointerDown={handlePointerDown} handlePointerMove={handlePointerMove} handlePointerUp={handlePointerUp}
          combo={combo} showCombo={showCombo} otHiemActive={otHiemActive} romBocActive={romBocActive}
          GEM_META={GEM_META}
          blastVfxs={blastVfxs} hintedGems={hintedGems} particleBursts={particleBursts}
          floatingTexts={floatingTexts} chainLightnings={chainLightnings}
        />

        <CampaignPlayerHUD
          activeDebuffs={activeDebuffs} boss={boss} shieldMax={shieldMax}
          combatStats={combatStats} lastPlayerDamage={lastPlayerDamage}
          manaDodgeCost={manaDodgeCost} manaUltCost={manaUltCost}
          skillWarning={!!skillWarning} skillAlert={skillAlert}
          daysUntilExpiry={null}
          autoPlay={autoPlay} skillLevels={skillLevels}
          otHiemActive={otHiemActive} otHiemCooldown={otHiemCooldown} OT_HIEM_CONFIG={OT_HIEM_CONFIG} otHiemDuration={otHiemDuration} castOtHiem={castOtHiem}
          romBocActive={romBocActive} romBocCooldown={romBocCooldown} ROM_BOC_CONFIG={ROM_BOC_CONFIG} romBocDuration={romBocDuration} castRomBoc={castRomBoc}
          handleDodge={handleDodge} fireUltimate={fireUltimate}
        />

        {/* TeammateStatus — compact HP đồng đội ở cuối bottom section */}
        {teammates.length > 0 && (
          <div style={{ marginTop: 4 }}>
            <TeammateStatus players={teammates} myUserId={myUserId} />
          </div>
        )}
      </div>

      {/* Reconnect overlay — xuất hiện sau 3 lần auto-retry thất bại */}
      {/* Không block board — player biết mình đang offline nhưng game vẫn chạy local */}
      {showReconnectButton && (
        <div style={{
          position:       'fixed',
          inset:          0,
          zIndex:         200,
          background:     'rgba(0,0,0,0.85)',
          display:        'flex',
          flexDirection:  'column',
          alignItems:     'center',
          justifyContent: 'center',
          gap:            16,
        }}>
          <div style={{ fontSize: 40 }}>📡</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>Mất kết nối</div>
          <div style={{ fontSize: 13, color: '#9ca3af' }}>Không thể tự kết nối lại sau 3 lần thử</div>
          <button
            onClick={onReconnect}
            style={{
              padding:      '12px 28px',
              background:   '#f59e0b',
              color:        '#111',
              fontWeight:   700,
              fontSize:     15,
              border:       'none',
              borderRadius: 10,
              cursor:       'pointer',
            }}
          >
            Vào Lại Phòng
          </button>
          <button
            onClick={onExit}
            style={{
              padding:      '8px 20px',
              background:   'transparent',
              color:        '#6b7280',
              fontWeight:   600,
              fontSize:     13,
              border:       '1px solid #374151',
              borderRadius: 8,
              cursor:       'pointer',
            }}
          >
            Thoát
          </button>
        </div>
      )}
    </div>
  );
}
