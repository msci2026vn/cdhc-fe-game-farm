import { useEffect, useMemo } from 'react';
import type { Room } from '@colyseus/sdk';
import CampaignMatch3Board from '@/modules/campaign/components/CampaignMatch3Board';
import { PVP_GEM_META } from '@/modules/pvp/hooks/pvp-board.adapter';
import { PvpSkillButton } from '@/modules/pvp/components/PvpSkillButton';
import { SKILL_GROUPS, SKILL_COOLDOWNS } from '@/shared/api/api-pvp';
import { usePvpBoardInput } from '@/modules/pvp/hooks/usePvpBoardInput';
import { usePvpTeamRoom } from './hooks/usePvpTeamRoom';
import { TeamBattleHUD } from './TeamBattleHUD';
import { MiniBoard } from './MiniBoard';
import type { TeamRoomState, TeamId, ClientPlayerState, TeamMatchResult } from './pvp-team.types.client';
import '../pvp/pvp-battle.css';

interface TeamBattleScreenProps {
  room: Room<TeamRoomState>;
  myTeam: TeamId;
  onMatchEnd: (result: TeamMatchResult) => void;
}

// Tính max mana từ stat (mirror backend formula)
function calcMaxMana(mana: number) { return 100 + mana * 20; }

// Build skill list từ player state
function buildSkills(player: ClientPlayerState | undefined) {
  if (!player) return [];
  const keys = ['skillA', 'skillB', 'skillC'] as const;
  const groups = ['A', 'B', 'C'] as const;
  const skills: Array<{ id: string; icon: string; name: string; manaCost: number; cooldownMs: number }> = [];
  for (let i = 0; i < 3; i++) {
    const skillId = player[keys[i]];
    if (!skillId) continue;
    const def = SKILL_GROUPS[groups[i]].find(s => s.id === skillId);
    if (def) {
      skills.push({
        id: skillId,
        icon: def.icon,
        name: def.name,
        manaCost: def.manaCost,
        cooldownMs: SKILL_COOLDOWNS[skillId] ?? 20000,
      });
    }
  }
  return skills;
}

export default function TeamBattleScreen({
  room,
  myTeam,
  onMatchEnd,
}: TeamBattleScreenProps) {
  const {
    phase, timeLeft, isSuddenDeath, winnerId,
    teamAHp, teamAMaxHp, teamBHp, teamBMaxHp,
    myGems, matchedCells, spawningGems,
    myCurrentMana, myMaxMana,
    combo, showCombo,
    isStunned, otHiemActive, romBocActive,
    skillCooldowns,
    allBoards, allPlayers,
    notifications,
    matchResult,
    sendSwap, sendSkill,
  } = usePvpTeamRoom(room);

  // Gesture handler — giống PvpTestScreen
  const {
    selected: boardSelected,
    animating: boardAnimating,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  } = usePvpBoardInput({
    onSwap: sendSwap,
    disabled: phase !== 'playing' && phase !== 'sudden_death',
  });

  // Kết thúc trận — chờ game_over data rồi chuyển sang result
  useEffect(() => {
    if (phase === 'finished' && matchResult) {
      const timer = setTimeout(() => onMatchEnd(matchResult), 2000);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, matchResult]);

  const mySessionId = room.sessionId;
  const myPlayer = allPlayers[mySessionId];
  const mySkills = useMemo(() => buildSkills(myPlayer), [myPlayer]);

  // Phân loại đồng đội và địch (không kể mình)
  const { allies, enemies } = useMemo(() => {
    const allies: Array<{ sid: string; player: ClientPlayerState; tiles: number[] }> = [];
    const enemies: Array<{ sid: string; player: ClientPlayerState; tiles: number[] }> = [];
    Object.entries(allPlayers).forEach(([sid, player]) => {
      if (sid === mySessionId) return;
      const entry = { sid, player, tiles: allBoards[sid] ?? [] };
      if (player.team === myTeam) allies.push(entry);
      else enemies.push(entry);
    });
    return { allies, enemies };
  }, [allPlayers, allBoards, myTeam, mySessionId]);

  // HP% của các player (từ team HP pool, dùng max mana làm proxy nếu chưa có per-player HP)
  function getHpPct(teamId: TeamId) {
    const hp    = teamId === 'team_a' ? teamAHp    : teamBHp;
    const maxHp = teamId === 'team_a' ? teamAMaxHp : teamBMaxHp;
    return maxHp > 0 ? Math.min(100, Math.round((hp / maxHp) * 100)) : 100;
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      background: '#0a130a',
      color: '#f0e8d0',
      fontFamily: "'Nunito', -apple-system, sans-serif",
      overflowY: 'hidden',
    }}>
      {/* Center container */}
      <div style={{
        width: '100%',
        maxWidth: 430,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minHeight: 0,
      }}>

        {/* ── HUD: HP bars + timer + notifications ── */}
        <TeamBattleHUD
          teamAHp={teamAHp}
          teamAMaxHp={teamAMaxHp}
          teamBHp={teamBHp}
          teamBMaxHp={teamBMaxHp}
          timeLeft={timeLeft}
          isSuddenDeath={isSuddenDeath}
          myTeam={myTeam}
          notifications={notifications}
        />

        {/* ── Enemy mini boards ── */}
        {enemies.length > 0 && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 10,
            padding: '4px 10px',
            flexShrink: 0,
          }}>
            {enemies.map(({ sid, player, tiles }) => (
              <MiniBoard
                key={sid}
                tiles={tiles}
                username={player.name}
                isEnemy
                hpPercent={getHpPct(player.team)}
              />
            ))}
          </div>
        )}

        {/* ── My main board ── */}
        <div style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '4px 8px 2px',
        }}>
          {/* Wood-frame board wrapper */}
          <div className={[
            'pvp-board-wrap',
            isSuddenDeath && 'pvp-board-wrap--danger',
          ].filter(Boolean).join(' ')}
            style={{ width: '100%', maxWidth: 380 }}
          >
            <span className="pvp-vine pvp-vine--tl">🌿</span>
            <span className="pvp-vine pvp-vine--tr">🍃</span>
            <span className="pvp-vine pvp-vine--bl">🌿</span>
            <span className="pvp-vine pvp-vine--br">🍃</span>

            {myGems.length > 0 && (
              <CampaignMatch3Board
                grid={myGems}
                selected={boardSelected}
                matchedCells={matchedCells}
                spawningGems={spawningGems}
                lockedGems={new Set<number>()}
                highlightedGem={null}
                isStunned={isStunned}
                animating={boardAnimating}
                handlePointerDown={handlePointerDown}
                handlePointerMove={handlePointerMove}
                handlePointerUp={handlePointerUp}
                combo={combo}
                showCombo={showCombo}
                otHiemActive={otHiemActive}
                romBocActive={romBocActive}
                GEM_META={PVP_GEM_META}
              />
            )}

            {isStunned && <div className="pvp-freeze">❄️</div>}
          </div>

          {/* ── Skill bar + mana ── */}
          <div style={{
            width: '100%',
            maxWidth: 380,
            marginTop: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '0 4px',
          }}>
            {/* Skills */}
            <div style={{ display: 'flex', gap: 6, flex: 1, justifyContent: 'center' }}>
              {mySkills.map(skill => {
                const cd = skillCooldowns[skill.id];
                return (
                  <PvpSkillButton
                    key={skill.id}
                    skillId={skill.id}
                    icon={skill.icon}
                    name={skill.name}
                    manaCost={skill.manaCost}
                    currentMana={myCurrentMana}
                    cooldownTotal={skill.cooldownMs}
                    cooldownRemaining={cd?.remaining ?? 0}
                    onCast={() => sendSkill(skill.id)}
                  />
                );
              })}
            </div>

            {/* Mana bar */}
            <div style={{ width: 48, flexShrink: 0 }}>
              <div style={{ textAlign: 'center', fontSize: 9, color: '#60a5fa', marginBottom: 2 }}>
                ⭐ {myCurrentMana}/{myMaxMana}
              </div>
              <div style={{
                height: 8,
                background: 'rgba(0,0,0,0.55)',
                borderRadius: 4,
                overflow: 'hidden',
                border: '1px solid rgba(96,165,250,0.3)',
              }}>
                <div style={{
                  height: '100%',
                  width: `${myMaxMana > 0 ? (myCurrentMana / myMaxMana) * 100 : 0}%`,
                  background: 'linear-gradient(90deg,#1d4ed8,#60a5fa)',
                  transition: 'width 0.3s ease',
                  borderRadius: 3,
                }} />
              </div>
            </div>
          </div>
        </div>

        {/* ── Ally mini boards ── */}
        {allies.length > 0 && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 10,
            padding: '4px 10px',
            flexShrink: 0,
          }}>
            {allies.map(({ sid, player, tiles }) => (
              <MiniBoard
                key={sid}
                tiles={tiles}
                username={player.name}
                isEnemy={false}
                hpPercent={getHpPct(player.team)}
              />
            ))}
          </div>
        )}

      </div>

      {/* Sudden death banner */}
      {isSuddenDeath && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(168,85,247,0.9)',
          color: '#fff',
          fontSize: 20,
          fontWeight: 900,
          padding: '12px 24px',
          borderRadius: 12,
          pointerEvents: 'none',
          zIndex: 50,
          animation: 'pvpFadeIn 0.4s ease',
        }}>
          ⚡ SUDDEN DEATH — Damage ×1.5
        </div>
      )}
    </div>
  );
}
