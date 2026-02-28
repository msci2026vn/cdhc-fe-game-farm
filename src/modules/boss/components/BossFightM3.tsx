import { useEffect, useRef } from 'react';
import { useMatch3 } from '../hooks/useMatch3';
import { BossInfo } from '../data/bosses';
import { campaignApi } from '@/shared/api/api-campaign';
import { useLevel } from '@/shared/hooks/usePlayerProfile';
import { useAuth } from '@/shared/hooks/useAuth';
import { useBossComplete } from '@/shared/hooks/useBossComplete';
import { usePlayerStats } from '@/shared/hooks/usePlayerStats';
import { STAT_CONFIG } from '@/shared/utils/stat-constants';
import type { PlayerCombatStats } from '@/shared/utils/combat-formulas';
import { getDominantAura } from '@/shared/components/BuildAura';
import { audioManager } from '@/shared/audio';
import BossSkillWarning from './BossSkillWarning';
import { useAutoPlay } from '@/shared/hooks/useAutoPlay';
import { useVipStatus } from '@/shared/hooks/useVipStatus';

// Shared match-3 components & hooks
import { useGemPointer, useComboParticles } from '@/shared/match3';
import UltimateFlash from '@/shared/match3/UltimateFlash';
import BossAttackFlash from '@/shared/match3/BossAttackFlash';
import ComboParticles from '@/shared/match3/ComboParticles';

// HUD components
import {
  BossHPBar, PlayerHPBar, ManaBar, SkillBar, BattleTopBar,
  ComboDisplay, DamagePopupLayer,
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
    handleTap, handleSwipe, GEM_META, getComboInfo, bossAttackMsg, screenShake,
    result, totalDmgDealt, attackWarning, handleDodge, fireUltimate, ultActive,
    durationSeconds, fightStartTime,
    milestones, manaDodgeCost, manaUltCost,
    combatStatsTracker, combatNotifs,
    skillWarning, enrageMultiplier, stars, maxCombo,
  } = useMatch3(bossInfo, combatStats, turnLimit);

  const auraType = getDominantAura(combatStats);

  // ═══ Auto-play (VIP only) ═══
  const { isVip } = useVipStatus();
  const { autoEnabled, toggleAuto } = useAutoPlay({
    grid, animating, result,
    handleSwipe, handleDodge, fireUltimate,
    ultCharge: boss.ultCharge,
    skillWarning, isVip,
  });

  // ═══ Start battle session on BE (anti-cheat) ═══
  const battleSessionStarted = useRef(false);
  useEffect(() => {
    if (battleSessionStarted.current) return;
    battleSessionStarted.current = true;
    const bossIdForSession = campaignBossId || bossInfo.id;
    campaignApi.startCampaignBattle(bossIdForSession).catch(err => {
      console.error('[BATTLE] Failed to start battle session:', err);
    });
  }, [campaignBossId, bossInfo.id]);

  // ═══ Preload battle sounds + BGM ═══
  useEffect(() => {
    audioManager.preloadScene('battle');
    audioManager.startBgm('battle');
    return () => { audioManager.stopBgm(); };
  }, []);

  useEffect(() => {
    if (result !== 'fighting') {
      audioManager.stopBgm();
    }
  }, [result]);

  const bossComplete = useBossComplete();
  const { data: auth } = useAuth();
  const level = useLevel();
  const rewardedRef = useRef(false);

  // ═══ Shared hooks: pointer gestures + combo particles ═══
  const { handlePointerDown, handlePointerMove, handlePointerUp } = useGemPointer(handleTap, handleSwipe);
  const comboParticles = useComboParticles(combo, showCombo);

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

  const bossHpPct = Math.round((boss.bossHp / boss.bossMaxHp) * 100);
  const playerHpPct = Math.round((boss.playerHp / boss.playerMaxHp) * 100);
  const shieldMax = Math.max(boss.playerMaxHp * 0.5, 200);
  const comboInfo = getComboInfo(combo);

  // Determine max turns: campaign turnLimit or default 99
  const maxTurns = turnLimit > 0 ? turnLimit : 99;

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
      {ultActive && <UltimateFlash />}

      {/* Boss attack flash with animation */}
      {bossAttackMsg && !ultActive && <BossAttackFlash text={bossAttackMsg.text} emoji={bossAttackMsg.emoji} />}

      {/* Combo particles */}
      <ComboParticles particles={comboParticles} />

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

      {/* Top half: Boss arena — ultra-compact for mobile */}
      <div className="flex-[0_0_30%] pt-safe px-3 pb-0 flex flex-col relative overflow-hidden">
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
          <div className={`animate-boss-idle ${boss.bossHp <= 0 ? 'opacity-30 grayscale' : ''} ${skillWarning ? 'animate-boss-attack' : ''}`}
            style={{
              filter: enrageMultiplier >= 1.3
                ? `drop-shadow(0 0 20px rgba(231,76,60,0.5)) drop-shadow(0 0 10px rgba(255,50,50,${Math.min(0.8, (enrageMultiplier - 1.3) * 2 + 0.4)}))`
                : 'drop-shadow(0 0 20px rgba(231,76,60,0.5))',
              transition: 'filter 1s ease',
            }}>
            {bossInfo.image ? (
              <img src={bossInfo.image} alt={bossInfo.name} className="w-40 h-40 object-contain" />
            ) : (
              <span className="text-[48px]">{bossInfo.emoji}</span>
            )}
          </div>

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

      {/* Bottom half: Match-3 + Skills — max space for grid */}
      <div className="flex-[1_1_70%] rounded-t-2xl px-3 pt-1.5 pb-[max(env(safe-area-inset-bottom,6px),6px)] flex flex-col"
        style={{ background: 'rgba(0,0,0,0.3)' }}>

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
            onPointerMove={handlePointerMove}
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', touchAction: 'none' }}>
            {grid.map((gem, i) => {
              const meta = GEM_META[gem.type];
              const isSelected = selected === i;
              const isMatched = matchedCells.has(i);
              return (
                <div key={gem.id}
                  onPointerDown={(e) => handlePointerDown(i, e)}
                  onPointerUp={handlePointerUp}
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

        {/* Skill bar: Dodge + ULT charge + ULT button + Auto */}
        <div className="flex items-center gap-1.5">
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
              <span className="material-symbols-outlined text-sm">👑</span>
              AUTO
            </button>
          )}
        </div>
      </div>

    </div>
  );
}
