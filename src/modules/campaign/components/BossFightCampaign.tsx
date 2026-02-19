// ═══════════════════════════════════════════════════════════════
// BossFightCampaign — Campaign boss combat UI
// Forked from BossFightM3 — uses useMatch3Campaign with DEF/heal/freq
// Weekly boss uses original BossFightM3 — UNTOUCHED
// ═══════════════════════════════════════════════════════════════

import { useEffect, useRef, useState } from 'react';
import { useMatch3Campaign, CampaignBossData } from '../hooks/useMatch3Campaign';
import { useLevel } from '@/shared/hooks/usePlayerProfile';
import { useAuth } from '@/shared/hooks/useAuth';
import { useBossComplete } from '@/shared/hooks/useBossComplete';
import { usePlayerStats } from '@/shared/hooks/usePlayerStats';
import { STAT_CONFIG } from '@/shared/utils/stat-constants';
import type { PlayerCombatStats } from '@/shared/utils/combat-formulas';
import { getDominantAura } from '@/shared/components/BuildAura';
// BossSkillWarning overlay removed — NÉ button in SkillBar handles dodge now

// HUD components (reused from boss module)
import {
  BossHPBar, PlayerHPBar, ManaBar, SkillBar, BattleTopBar,
  ComboDisplay, COMBO_VFX, DamagePopupLayer,
  BossRageOverlay, BattleResult, PhaseTransition,
} from '@/modules/boss/components/hud';

interface Props {
  boss: CampaignBossData;
  onBack: () => void;
  campaignBossId: string;
  zoneName?: string;
  archetype: string;
  archetypeIcon?: string;
  archetypeTip?: string;
  onRetry: () => void;
}

export default function BossFightCampaign({
  boss: bossData, onBack,
  campaignBossId, zoneName,
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

  const {
    grid, selected, animating, matchedCells, combo, showCombo, boss, popups,
    handleTap, GEM_META, getComboInfo, bossAttackMsg, screenShake,
    result, totalDmgDealt, attackWarning, handleDodge, fireUltimate, ultActive,
    durationSeconds, fightStartTime,
    milestones, manaDodgeCost, manaUltCost,
    combatStatsTracker, combatNotifs,
    skillWarning, lastPlayerDamage, enrageMultiplier, stars, maxCombo,
    currentPhase, totalPhases, showPhaseTransition, activeBossStats,
    elapsedSeconds, pauseBattle, resumeBattle,
    // Boss skills
    activeDebuffs, isStunned, skillAlert,
    activeBossBuffs, egg, lockedGems,
  } = useMatch3Campaign(bossData, combatStats);

  const auraType = getDominantAura(combatStats);

  const bossComplete = useBossComplete();
  const { data: auth } = useAuth();
  const level = useLevel();
  const rewardedRef = useRef(false);
  const [comboParticles, setComboParticles] = useState<{ id: number; char: string; x: number; y: number }[]>([]);
  const particleId = useRef(0);

  // ═══ Death phase: dying overlay → then BattleResult ═══
  const [deathPhase, setDeathPhase] = useState<'none' | 'dying' | 'done'>('none');

  useEffect(() => {
    if (result === 'defeat' && deathPhase === 'none') {
      setDeathPhase('dying');
      const timer = setTimeout(() => setDeathPhase('done'), 2500);
      return () => clearTimeout(timer);
    }
  }, [result, deathPhase]);

  // ═══ Enrage alert ═══
  const enrageLevel = Math.round((enrageMultiplier - 1) * 10);
  const prevEnrageLevelRef = useRef(0);
  const [enrageAlert, setEnrageAlert] = useState<string | null>(null);

  useEffect(() => {
    if (result !== 'fighting') return;
    if (enrageLevel > prevEnrageLevelRef.current && enrageLevel > 0) {
      prevEnrageLevelRef.current = enrageLevel;
      const alerts: Record<number, string> = {
        1: '⚡ Boss tức giận! +10%',
        2: '🔥 Boss cuồng nộ! +20%',
        3: '💀 Boss điên cuồng! +30%',
      };
      setEnrageAlert(alerts[enrageLevel] || `☠️ RẤT NGUY HIỂM! +${enrageLevel * 10}%`);
      const timer = setTimeout(() => setEnrageAlert(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [enrageLevel, result]);

  // Call API on fight end
  useEffect(() => {
    if (result !== 'fighting' && !rewardedRef.current) {
      rewardedRef.current = true;
      const playerHpPct = Math.round((boss.playerHp / boss.playerMaxHp) * 100);
      bossComplete.mutate({
        bossId: campaignBossId,
        won: result === 'victory',
        totalDamage: totalDmgDealt,
        durationSeconds,
        stars: result === 'victory' ? stars : 0,
        playerHpPercent: playerHpPct,
        maxCombo,
        dodgeCount: combatStatsTracker.dodgeCount,
        isCampaign: true,
      });
    }
  }, [result, campaignBossId, totalDmgDealt, durationSeconds, bossComplete, stars, maxCombo, combatStatsTracker.dodgeCount, boss.playerHp, boss.playerMaxHp]);

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

  // ═══ Death overlay (shown before BattleResult on defeat) ═══
  if (result === 'defeat' && deathPhase === 'dying') {
    return (
      <div className="h-[100dvh] max-w-[430px] mx-auto relative boss-gradient flex flex-col items-center justify-center overflow-hidden">
        {/* Red vignette */}
        <div className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse at center, transparent 30%, rgba(139,0,0,0.5) 100%)' }} />
        <div className="absolute inset-0 bg-black/60 animate-fade-in" />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center px-6">
          <span className="text-7xl mb-4 animate-bounce">💀</span>
          <h1 className="text-3xl font-heading font-bold text-red-400 mb-2">
            Bạn đã gục!
          </h1>
          <p className="text-gray-400 mb-8 text-sm">
            {bossData.emoji} {bossData.name} đã đánh bại bạn
          </p>
          <button
            onClick={() => setDeathPhase('done')}
            className="px-8 py-3 bg-gray-700 text-white rounded-xl text-lg font-heading font-bold hover:bg-gray-600 transition active:scale-95"
            style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}
          >
            Xem kết quả
          </button>
        </div>
      </div>
    );
  }

  // Victory / Defeat summary screen
  if (result === 'victory' || (result === 'defeat' && deathPhase === 'done')) {
    const won = result === 'victory';
    const serverData = bossComplete.data;

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

      {/* Boss attack flash */}
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

      {/* Skill warning — screen edge glow (does NOT block interaction) */}
      {skillWarning && (
        <div className="absolute inset-0 pointer-events-none z-30 animate-pulse"
          style={{ boxShadow: 'inset 0 0 60px rgba(231,76,60,0.3), inset 0 0 120px rgba(231,76,60,0.15)' }} />
      )}

      {/* Phase transition overlay */}
      {showPhaseTransition && (
        <PhaseTransition
          phase={showPhaseTransition.phaseNumber}
          archetypeLabel={showPhaseTransition.name}
          archetypeIcon={showPhaseTransition.icon}
          description={showPhaseTransition.description}
        />
      )}

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
      {screenShake && !ultActive && (
        <div className="absolute inset-0 pointer-events-none z-40 animate-fade-in"
          style={{ boxShadow: 'inset 0 0 80px rgba(231,76,60,0.25), inset 0 0 40px rgba(231,76,60,0.15)' }} />
      )}

      {/* Enrage alert popup (3s then fade) */}
      {enrageAlert && (
        <div className={`absolute top-20 left-4 right-4 z-40 text-center py-2 px-4 rounded-lg pointer-events-none animate-fade-in font-heading font-bold ${
          enrageLevel >= 4 ? 'text-red-300 text-lg animate-pulse' :
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
      )}

      {/* Boss rage overlay */}
      <BossRageOverlay bossHpPct={bossHpPct} bossEmoji={bossData.emoji} />

      {/* Top half: Boss arena — ultra-compact for mobile */}
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

        {/* Boss HP bar — with DEF and heal indicators */}
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

        {/* Campaign-specific boss info badges (dynamic from active phase) */}
        {(activeBossStats.def > 0 || activeBossStats.freq > 1 || enrageLevel > 0) && (
          <div className="z-10 flex gap-1.5 mt-1 flex-wrap">
            {activeBossStats.def > 0 && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                style={{ background: 'rgba(116,185,255,0.2)', color: '#74b9ff', border: '1px solid rgba(116,185,255,0.3)' }}>
                🛡️ DEF {activeBossStats.def}
              </span>
            )}
            {activeBossStats.freq > 1 && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                style={{ background: 'rgba(253,121,168,0.2)', color: '#fd79a8', border: '1px solid rgba(253,121,168,0.3)' }}>
                ⚡ x{activeBossStats.freq} đòn
              </span>
            )}
            {enrageLevel > 0 && (
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${enrageLevel >= 3 ? 'animate-pulse' : ''}`}
                style={{
                  background: enrageLevel >= 3 ? 'rgba(231,76,60,0.3)' : enrageLevel >= 2 ? 'rgba(243,156,18,0.2)' : 'rgba(253,203,110,0.2)',
                  color: enrageLevel >= 3 ? '#ff6b6b' : enrageLevel >= 2 ? '#f39c12' : '#fdcb6e',
                  border: `1px solid ${enrageLevel >= 3 ? 'rgba(231,76,60,0.4)' : enrageLevel >= 2 ? 'rgba(243,156,18,0.3)' : 'rgba(253,203,110,0.3)'}`,
                }}>
                {enrageLevel >= 3 ? '💀' : enrageLevel >= 2 ? '🔥' : '⚡'} +{enrageLevel * 10}% ATK
              </span>
            )}
          </div>
        )}

        {/* Boss buffs (shield/reflect) */}
        {activeBossBuffs.length > 0 && (
          <div className="z-10 flex gap-1.5 mt-1 flex-wrap">
            {activeBossBuffs.map((b, i) => (
              <span key={`${b.type}-${i}`} className="text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse"
                style={{
                  background: b.type === 'shield' ? 'rgba(116,185,255,0.3)' : 'rgba(108,92,231,0.3)',
                  color: b.type === 'shield' ? '#74b9ff' : '#a29bfe',
                  border: `1px solid ${b.type === 'shield' ? 'rgba(116,185,255,0.4)' : 'rgba(108,92,231,0.4)'}`,
                }}>
                {b.icon} {b.label} {b.remainingSec}s
              </span>
            ))}
          </div>
        )}

        {/* Boss sprite + damage popups + combo */}
        <div className="flex-1 flex items-center justify-center relative z-10">
          <span className={`text-[48px] animate-boss-idle ${boss.bossHp <= 0 ? 'opacity-30 grayscale' : ''} ${skillWarning ? 'animate-boss-attack' : ''
            }`} style={{
              filter: [
                enrageMultiplier >= 1.3
                  ? `drop-shadow(0 0 20px rgba(231,76,60,0.5)) drop-shadow(0 0 10px rgba(255,50,50,${Math.min(0.8, (enrageMultiplier - 1.3) * 2 + 0.4)}))`
                  : 'drop-shadow(0 0 20px rgba(231,76,60,0.5))',
                activeBossBuffs.some(b => b.type === 'shield') && 'drop-shadow(0 0 15px rgba(116,185,255,0.7))',
                activeBossBuffs.some(b => b.type === 'reflect') && 'drop-shadow(0 0 15px rgba(168,85,247,0.7))',
              ].filter(Boolean).join(' '),
              transition: 'filter 1s ease',
            }}>
            {bossData.emoji}
          </span>

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

      {/* Bottom half: Match-3 + Skills — max space for grid */}
      <div className="flex-[1_1_70%] rounded-t-2xl px-3 pt-1.5 pb-[max(env(safe-area-inset-bottom,6px),6px)] flex flex-col"
        style={{ background: 'rgba(0,0,0,0.3)' }}>

        {/* Debuff bar (Phase 1 boss skills) */}
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
                  border: `1px solid ${
                    d.type === 'burn' ? 'rgba(231,76,60,0.4)' :
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

        {/* Skill warning inline text (does NOT block gem grid) */}
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
          {/* Combo flash overlay */}
          {showCombo && combo >= 2 && (
            <div key={`flash-${combo}`} className={`combo-flash-overlay combo-flash-${Math.min(combo, 6)}`} />
          )}
          <div className={`grid grid-cols-6 gap-1 p-1 rounded-lg h-full ${isStunned ? 'pointer-events-none' : ''} ${combo >= 3 && showCombo ? 'grid-combo-shake' : ''}`}
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
                    ${lockedGems.has(i) ? 'opacity-50 ring-1 ring-gray-500' : ''}
                  `}>
                  {meta.emoji}
                  {lockedGems.has(i) && (
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] pointer-events-none">🔒</span>
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
