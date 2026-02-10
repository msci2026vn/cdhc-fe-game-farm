import { useState, useCallback, useRef, useEffect } from 'react';
import { BossInfo } from '../data/bosses';
import { getRandomBossQuestions, BossQuestion } from '../data/bossQuestions';

export type FightPhase = 'ready' | 'question' | 'result' | 'victory' | 'defeat';

export interface DamagePopup {
  id: number;
  text: string;
  color: string;
  x: number;
  y: number;
}

const TIMER_SECONDS = 3;
const QUESTIONS_PER_FIGHT = 10;
const PLAYER_ATTACK = 80;

export function useBossFight(boss: BossInfo) {
  const [phase, setPhase] = useState<FightPhase>('ready');
  const [bossHp, setBossHp] = useState(boss.hp);
  const [playerHp, setPlayerHp] = useState(500);
  const playerMaxHp = 500;
  const [questions] = useState(() => getRandomBossQuestions(QUESTIONS_PER_FIGHT));
  const [qIdx, setQIdx] = useState(0);
  const [timer, setTimer] = useState(TIMER_SECONDS);
  const [lastResult, setLastResult] = useState<{ correct: boolean; explanation: string } | null>(null);
  const [popups, setPopups] = useState<DamagePopup[]>([]);
  const [combo, setCombo] = useState(0);
  const [totalDmg, setTotalDmg] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const popupId = useRef(0);

  const currentQ: BossQuestion | undefined = questions[qIdx];

  const addPopup = useCallback((text: string, color: string) => {
    const id = popupId.current++;
    const x = 25 + Math.random() * 50;
    const y = 20 + Math.random() * 30;
    setPopups(prev => [...prev, { id, text, color, x, y }]);
    setTimeout(() => setPopups(prev => prev.filter(p => p.id !== id)), 1200);
  }, []);

  const endFight = useCallback((won: boolean) => {
    clearInterval(timerRef.current);
    setPhase(won ? 'victory' : 'defeat');
  }, []);

  const nextQuestion = useCallback(() => {
    const nextIdx = qIdx + 1;
    if (nextIdx >= questions.length) {
      // Ran out of questions - check who won
      endFight(bossHp <= 0);
      return;
    }
    setQIdx(nextIdx);
    setTimer(TIMER_SECONDS);
    setLastResult(null);
    setPhase('question');
  }, [qIdx, questions.length, bossHp, endFight]);

  const handleAnswer = useCallback((playerAnswer: boolean) => {
    clearInterval(timerRef.current);
    const correct = currentQ && playerAnswer === currentQ.answer;

    if (correct) {
      const dmgMultiplier = 1 + combo * 0.2;
      const dmg = Math.round(PLAYER_ATTACK * dmgMultiplier);
      const newHp = Math.max(0, bossHp - dmg);
      setBossHp(newHp);
      setCombo(c => c + 1);
      setTotalDmg(d => d + dmg);
      addPopup(`-${dmg}`, '#ff6b6b');
      if (newHp <= 0) {
        setLastResult({ correct: true, explanation: currentQ?.explanation || '' });
        setPhase('result');
        setTimeout(() => endFight(true), 1500);
        return;
      }
    } else {
      // Boss attacks back
      const dmg = boss.attack;
      const newPlayerHp = Math.max(0, playerHp - dmg);
      setPlayerHp(newPlayerHp);
      setCombo(0);
      addPopup(`-${dmg} HP`, '#e74c3c');
      if (newPlayerHp <= 0) {
        setLastResult({ correct: false, explanation: currentQ?.explanation || '' });
        setPhase('result');
        setTimeout(() => endFight(false), 1500);
        return;
      }
    }

    setLastResult({ correct: !!correct, explanation: currentQ?.explanation || '' });
    setPhase('result');
  }, [currentQ, bossHp, playerHp, combo, boss.attack, addPopup, endFight]);

  // Timer countdown
  useEffect(() => {
    if (phase !== 'question') return;
    setTimer(TIMER_SECONDS);
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          // Time's up = wrong answer, boss attacks
          handleAnswer(!currentQ?.answer); // opposite of correct
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase, qIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  const startFight = useCallback(() => {
    setBossHp(boss.hp);
    setPlayerHp(playerMaxHp);
    setQIdx(0);
    setCombo(0);
    setTotalDmg(0);
    setLastResult(null);
    setPhase('question');
  }, [boss.hp]);

  return {
    phase, bossHp, playerHp, playerMaxHp, timer, currentQ, lastResult,
    popups, combo, totalDmg, qIdx, totalQuestions: questions.length,
    startFight, handleAnswer, nextQuestion,
    bossMaxHp: boss.hp,
  };
}
