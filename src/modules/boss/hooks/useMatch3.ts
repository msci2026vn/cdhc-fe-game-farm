import { useState, useCallback, useRef, useEffect } from 'react';
import { BossInfo } from '../data/bosses';

const COLS = 6;
const ROWS = 6;
const GEM_TYPES = ['atk', 'hp', 'def', 'star'] as const;
export type GemType = (typeof GEM_TYPES)[number];

export interface Gem { type: GemType; id: number; }

const GEM_META: Record<GemType, { emoji: string; css: string }> = {
  atk: { emoji: '⚔️', css: 'gem-atk' },
  hp:  { emoji: '💚', css: 'gem-hp' },
  def: { emoji: '🛡️', css: 'gem-def' },
  star:{ emoji: '⭐', css: 'gem-star' },
};

let nextId = 0;
const randomGem = (): Gem => ({ type: GEM_TYPES[Math.floor(Math.random() * GEM_TYPES.length)], id: nextId++ });

function createGrid(): Gem[] {
  const grid: Gem[] = [];
  for (let i = 0; i < ROWS * COLS; i++) {
    let gem = randomGem();
    const col = i % COLS; const row = Math.floor(i / COLS);
    while (
      (col >= 2 && grid[i - 1].type === gem.type && grid[i - 2].type === gem.type) ||
      (row >= 2 && grid[i - COLS].type === gem.type && grid[i - 2 * COLS].type === gem.type)
    ) { gem = randomGem(); }
    grid.push(gem);
  }
  return grid;
}

function findMatches(grid: Gem[]): Set<number> {
  const matched = new Set<number>();
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c <= COLS - 3; c++) {
      const idx = r * COLS + c; const t = grid[idx].type; let len = 1;
      while (c + len < COLS && grid[idx + len].type === t) len++;
      if (len >= 3) { for (let k = 0; k < len; k++) matched.add(idx + k); }
      if (len > 1) c += len - 2;
    }
  }
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r <= ROWS - 3; r++) {
      const idx = r * COLS + c; const t = grid[idx].type; let len = 1;
      while (r + len < ROWS && grid[idx + len * COLS].type === t) len++;
      if (len >= 3) { for (let k = 0; k < len; k++) matched.add(idx + k * COLS); }
      if (len > 1) r += len - 2;
    }
  }
  return matched;
}

function applyGravity(grid: Gem[]): Gem[] {
  const newGrid = [...grid];
  for (let c = 0; c < COLS; c++) {
    const col: Gem[] = [];
    for (let r = ROWS - 1; r >= 0; r--) { const g = newGrid[r * COLS + c]; if (g) col.push(g); }
    for (let r = ROWS - 1; r >= 0; r--) {
      const fromBottom = ROWS - 1 - r;
      newGrid[r * COLS + c] = fromBottom < col.length ? col[fromBottom] : randomGem();
    }
  }
  return newGrid;
}

function areAdjacent(a: number, b: number): boolean {
  const ar = Math.floor(a / COLS), ac = a % COLS;
  const br = Math.floor(b / COLS), bc = b % COLS;
  return (Math.abs(ar - br) + Math.abs(ac - bc)) === 1;
}

export interface BossState {
  bossHp: number; bossMaxHp: number;
  playerHp: number; playerMaxHp: number;
  shield: number; ultCharge: number;
}

export interface DamagePopup { id: number; text: string; color: string; x: number; y: number; }

const COMBO_TIERS = [
  { min: 2, mult: 1.5, label: 'COMBO', color: '#a29bfe' },
  { min: 3, mult: 2.0, label: 'SUPER', color: '#fdcb6e' },
  { min: 4, mult: 2.5, label: 'MEGA', color: '#ff6b6b' },
  { min: 5, mult: 3.0, label: 'ULTRA', color: '#fd79a8' },
  { min: 6, mult: 4.0, label: 'LEGENDARY', color: '#e056fd' },
  { min: 8, mult: 5.0, label: '🔥 GODLIKE', color: '#f0932b' },
];

function getComboInfo(combo: number) {
  let tier = { mult: 1, label: '', color: '#fff' };
  for (const t of COMBO_TIERS) { if (combo >= t.min) tier = t; }
  return tier;
}

const DMG_PER_GEM: Record<GemType, number> = { atk: 45, hp: 0, def: 0, star: 25 };

// Boss attack config
const BOSS_ATK_INTERVAL = 4000;
const BOSS_SKILL_CHANCE = 0.2;

interface BossAttackInfo { name: string; emoji: string; dmgMult: number; }
const BOSS_SKILLS: BossAttackInfo[] = [
  { name: 'Lửa Địa Ngục', emoji: '🔥', dmgMult: 2.0 },
  { name: 'Sấm Sét', emoji: '⚡', dmgMult: 1.8 },
  { name: 'Nọc Độc', emoji: '☠️', dmgMult: 1.5 },
  { name: 'Đòn Cuồng Phong', emoji: '🌪️', dmgMult: 2.5 },
];

// Dodge mechanic: boss warns 1.5s before attacking, player taps dodge button
const DODGE_WARNING_MS = 1500;
const DODGE_WINDOW_MS = 800; // time to tap dodge after warning

export type FightResult = 'fighting' | 'victory' | 'defeat';

export interface BossAttackWarning {
  skill: BossAttackInfo | null;
  rawDmg: number;
  phase: 'warning' | 'dodge_window' | 'hit';
}

export function useMatch3(bossInfo: BossInfo) {
  const [grid, setGrid] = useState<Gem[]>(createGrid);
  const [selected, setSelected] = useState<number | null>(null);
  const [animating, setAnimating] = useState(false);
  const [matchedCells, setMatchedCells] = useState<Set<number>>(new Set());
  const [combo, setCombo] = useState(0);
  const [showCombo, setShowCombo] = useState(false);
  const comboRef = useRef(0);
  const [boss, setBoss] = useState<BossState>({
    bossHp: bossInfo.hp, bossMaxHp: bossInfo.hp,
    playerHp: 1000, playerMaxHp: 1000,
    shield: 200, ultCharge: 0,
  });
  const [popups, setPopups] = useState<DamagePopup[]>([]);
  const popupId = useRef(0);
  const [bossAttackMsg, setBossAttackMsg] = useState<{ text: string; emoji: string } | null>(null);
  const [screenShake, setScreenShake] = useState(false);
  const [result, setResult] = useState<FightResult>('fighting');
  const [totalDmgDealt, setTotalDmgDealt] = useState(0);

  // Dodge mechanic
  const [attackWarning, setAttackWarning] = useState<BossAttackWarning | null>(null);
  const dodgedRef = useRef(false);
  const [ultActive, setUltActive] = useState(false);

  const addPopup = useCallback((text: string, color: string) => {
    const id = popupId.current++;
    const x = 20 + Math.random() * 60;
    const y = 15 + Math.random() * 40;
    setPopups(prev => [...prev, { id, text, color, x, y }]);
    setTimeout(() => setPopups(prev => prev.filter(p => p.id !== id)), 1400);
  }, []);

  // Check victory/defeat
  useEffect(() => {
    if (boss.bossHp <= 0 && result === 'fighting') setResult('victory');
    if (boss.playerHp <= 0 && result === 'fighting') setResult('defeat');
  }, [boss.bossHp, boss.playerHp, result]);

  // Boss auto-attack with warning + dodge
  useEffect(() => {
    if (result !== 'fighting') return;

    const interval = setInterval(() => {
      const isSkill = Math.random() < BOSS_SKILL_CHANCE;
      const skill = isSkill ? BOSS_SKILLS[Math.floor(Math.random() * BOSS_SKILLS.length)] : null;
      const rawDmg = bossInfo.attack + Math.floor(Math.random() * Math.round(bossInfo.attack * 0.3));
      const totalDmg = Math.round(rawDmg * (skill?.dmgMult || 1));

      // Phase 1: Warning
      dodgedRef.current = false;
      setAttackWarning({ skill, rawDmg: totalDmg, phase: 'warning' });

      // Phase 2: Dodge window
      setTimeout(() => {
        setAttackWarning(prev => prev ? { ...prev, phase: 'dodge_window' } : null);
      }, DODGE_WARNING_MS);

      // Phase 3: Hit (if not dodged)
      setTimeout(() => {
        setAttackWarning(null);

        if (dodgedRef.current) {
          // Dodged! No damage, show message
          setBossAttackMsg({ text: 'NÉ THÀNH CÔNG! 🏃', emoji: '💨' });
          setTimeout(() => setBossAttackMsg(null), 1000);
          return;
        }

        // Apply damage
        setBoss(prev => {
          if (prev.bossHp <= 0 || prev.playerHp <= 0) return prev;
          let shieldLeft = prev.shield;
          let hpDmg = totalDmg;
          if (shieldLeft > 0) {
            const absorbed = Math.min(shieldLeft, totalDmg);
            shieldLeft -= absorbed;
            hpDmg -= absorbed;
          }
          const newPlayerHp = Math.max(0, prev.playerHp - hpDmg);
          return { ...prev, playerHp: newPlayerHp, shield: shieldLeft };
        });

        if (skill) {
          setBossAttackMsg({ text: `${skill.name}! -${totalDmg}`, emoji: skill.emoji });
        } else {
          setBossAttackMsg({ text: `Boss tấn công! -${totalDmg}`, emoji: '💥' });
        }
        setScreenShake(true);
        addPopup(`-${totalDmg}`, '#e74c3c');
        setTimeout(() => { setBossAttackMsg(null); setScreenShake(false); }, 1200);
      }, DODGE_WARNING_MS + DODGE_WINDOW_MS);
    }, BOSS_ATK_INTERVAL);

    return () => clearInterval(interval);
  }, [bossInfo.attack, result, addPopup]);

  // Dodge handler
  const handleDodge = useCallback(() => {
    if (attackWarning?.phase === 'dodge_window') {
      dodgedRef.current = true;
      setAttackWarning(null);
    }
  }, [attackWarning]);

  // Ultimate: massive damage burst
  const fireUltimate = useCallback(() => {
    if (boss.ultCharge < 100 || result !== 'fighting') return;
    setUltActive(true);
    const ultDmg = Math.round(bossInfo.hp * 0.15); // 15% of boss max HP
    setBoss(prev => ({
      ...prev,
      bossHp: Math.max(0, prev.bossHp - ultDmg),
      ultCharge: 0,
    }));
    setTotalDmgDealt(d => d + ultDmg);
    addPopup(`⚡ ULTIMATE -${ultDmg}`, '#e056fd');
    setScreenShake(true);
    setTimeout(() => { setUltActive(false); setScreenShake(false); }, 1500);
  }, [boss.ultCharge, bossInfo.hp, result, addPopup]);

  const processMatches = useCallback((currentGrid: Gem[], currentCombo: number) => {
    const matched = findMatches(currentGrid);
    if (matched.size === 0) {
      if (currentCombo > 1) setTimeout(() => setShowCombo(false), 1500);
      else setShowCombo(false);
      comboRef.current = 0;
      setAnimating(false);
      return;
    }
    const newCombo = currentCombo + 1;
    comboRef.current = newCombo;
    setCombo(newCombo);
    if (newCombo >= 2) setShowCombo(true);
    const comboInfo = getComboInfo(newCombo);

    const tally: Partial<Record<GemType, number>> = {};
    matched.forEach(idx => { const t = currentGrid[idx].type; tally[t] = (tally[t] || 0) + 1; });
    setMatchedCells(new Set(matched));

    setTimeout(() => {
      setBoss(prev => {
        let { bossHp, playerHp, shield, ultCharge } = prev;
        const atkCount = tally.atk || 0;
        const hpCount = tally.hp || 0;
        const defCount = tally.def || 0;
        const starCount = tally.star || 0;

        const baseDmg = atkCount * DMG_PER_GEM.atk + starCount * DMG_PER_GEM.star;
        const totalDmg = Math.round(baseDmg * comboInfo.mult);
        bossHp = Math.max(0, bossHp - totalDmg);
        playerHp = Math.min(prev.playerMaxHp, playerHp + Math.round(hpCount * 30 * comboInfo.mult));
        shield = shield + Math.round(defCount * 25 * comboInfo.mult);
        ultCharge = Math.min(100, ultCharge + starCount * 8 + atkCount * 3 + (newCombo >= 2 ? 5 : 0));

        if (totalDmg > 0) {
          setTotalDmgDealt(d => d + totalDmg);
          const label = newCombo >= 2 ? `-${totalDmg} (x${comboInfo.mult})` : `-${totalDmg}`;
          addPopup(label, comboInfo.color);
        }
        if (hpCount > 0) addPopup(`+${Math.round(hpCount * 30 * comboInfo.mult)} HP`, '#55efc4');
        if (defCount > 0) addPopup(`+${Math.round(defCount * 25 * comboInfo.mult)} 🛡️`, '#74b9ff');

        return { ...prev, bossHp, playerHp, shield, ultCharge };
      });

      const cleared = currentGrid.map((g, i) => matched.has(i) ? null : g) as (Gem | null)[];
      const fallen = applyGravity(cleared as Gem[]);
      setGrid(fallen);
      setMatchedCells(new Set());
      setTimeout(() => processMatches(fallen, newCombo), 300);
    }, 350);
  }, [addPopup]);

  const handleTap = useCallback((idx: number) => {
    if (animating || result !== 'fighting') return;
    if (selected === null) { setSelected(idx); return; }
    if (selected === idx) { setSelected(null); return; }
    if (!areAdjacent(selected, idx)) { setSelected(idx); return; }

    setAnimating(true);
    setSelected(null);
    const newGrid = [...grid];
    [newGrid[selected], newGrid[idx]] = [newGrid[idx], newGrid[selected]];

    const matched = findMatches(newGrid);
    if (matched.size === 0) {
      setGrid(newGrid);
      setTimeout(() => {
        const reverted = [...newGrid];
        [reverted[selected], reverted[idx]] = [reverted[idx], reverted[selected]];
        setGrid(reverted);
        setAnimating(false);
      }, 300);
      return;
    }

    setGrid(newGrid);
    setTimeout(() => processMatches(newGrid, 0), 200);
  }, [grid, selected, animating, processMatches, result]);

  return {
    grid, selected, animating, matchedCells, combo, showCombo, boss, popups,
    handleTap, GEM_META, getComboInfo, bossAttackMsg, screenShake,
    result, totalDmgDealt, attackWarning, handleDodge, fireUltimate, ultActive,
  };
}
