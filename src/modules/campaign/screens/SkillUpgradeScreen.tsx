// ═══════════════════════════════════════════════════════════════
// SkillUpgradeScreen — View and upgrade 3 player skills
// Route: /campaign/skills
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayerSkills, useUpgradeSkill } from '@/shared/hooks/usePlayerSkills';
import { useOgn } from '@/shared/hooks/usePlayerProfile';
import SkillCard from '../components/SkillCard';
import type { SkillId, PlayerSkill } from '../types/skill.types';
import { playSound } from '@/shared/audio';
import { AnimatedNumber } from '@/shared/components/AnimatedNumber';

// Default skill data when API hasn't loaded yet
const DEFAULT_SKILLS: PlayerSkill[] = [
  {
    skillId: 'sam_dong', name: 'Sấm Đồng', emoji: '⚡', level: 1,
    description: 'Chiêu tuyệt kỹ: Gây sát thương khổng lồ lên boss.',
    effects: [{ label: 'Sát thương', value: '×3.0 ATK' }],
    nextLevelEffects: [{ label: 'Sát thương', value: '×3.5 ATK' }],
    upgradeCost: { ogn: 2000, fragments: 5 },
    unlockCondition: null, isUnlocked: true,
  },
  {
    skillId: 'ot_hiem', name: 'Ớt Hiểm', emoji: '🌶️', level: 0,
    description: 'Tăng sát thương trong thời gian ngắn.',
    effects: [],
    upgradeCost: null,
    unlockCondition: 'Thắng Boss #4', isUnlocked: false,
  },
  {
    skillId: 'rom_boc', name: 'Rơm Bọc', emoji: '🪹', level: 0,
    description: 'Tạo khiên và giảm sát thương nhận vào.',
    effects: [],
    upgradeCost: null,
    unlockCondition: 'Thắng Boss #8', isUnlocked: false,
  },
];

export default function SkillUpgradeScreen() {
  const navigate = useNavigate();
  const { data: skills, isLoading, error } = usePlayerSkills();
  const ogn = useOgn();
  const upgradeSkill = useUpgradeSkill();
  const [upgradingSkillId, setUpgradingSkillId] = useState<SkillId | null>(null);
  const [upgradeSuccess, setUpgradeSuccess] = useState<SkillId | null>(null);

  // Use API data or fallback to defaults
  const displaySkills = skills && skills.length > 0 ? skills : DEFAULT_SKILLS;

  // Player fragments — from profile or 0
  const playerFragments = 0; // TODO: read from profile when fragment system is live

  const handleUpgrade = async (skillId: SkillId) => {
    setUpgradingSkillId(skillId);
    try {
      await upgradeSkill.mutateAsync(skillId);
      playSound('level_up');
      setUpgradeSuccess(skillId);
      setTimeout(() => setUpgradeSuccess(null), 2000);
    } catch (err) {
      playSound('damage_dealt');
    } finally {
      setUpgradingSkillId(null);
    }
  };

  return (
    <div className="h-[100dvh] max-w-[430px] mx-auto relative overflow-hidden flex flex-col boss-gradient">
      {/* Header */}
      <div className="pt-safe px-4 pb-3 relative z-10">
        <div className="flex items-center justify-between mt-2">
          <button
            onClick={() => { playSound('ui_click'); navigate(-1); }}
            className="w-10 h-10 rounded-full flex items-center justify-center text-white active:scale-90 transition-transform"
            style={{ background: 'rgba(255,255,255,0.1)' }}
          >
            ←
          </button>
          <h1 className="font-heading font-bold text-lg text-white">
            ⚔️ Kỹ Năng Chiến Binh
          </h1>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>

        {/* Currency bar */}
        <div className="flex items-center justify-center gap-4 mt-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
            style={{ background: 'rgba(253,203,110,0.15)', border: '1px solid rgba(253,203,110,0.2)' }}>
            <span className="text-sm">💰</span>
            <span className="text-xs font-bold text-yellow-300">
              <AnimatedNumber value={ogn} />
            </span>
            <span className="text-[9px] text-yellow-300/60">OGN</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
            style={{ background: 'rgba(108,92,231,0.15)', border: '1px solid rgba(108,92,231,0.2)' }}>
            <span className="text-sm">🧩</span>
            <span className="text-xs font-bold text-purple-300">{playerFragments}</span>
            <span className="text-[9px] text-purple-300/60">Mảnh</span>
          </div>
        </div>
      </div>

      {/* Skill cards */}
      <div className="flex-1 overflow-y-auto px-4 pb-24 space-y-3 scrollbar-hide">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-3 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <span className="text-4xl block mb-3">😵</span>
            <p className="text-red-300 text-sm font-bold">Lỗi tải kỹ năng</p>
            <p className="text-white/40 text-xs mt-1">{String(error)}</p>
          </div>
        ) : (
          displaySkills.map(skill => (
            <div key={skill.skillId} className="relative">
              {/* Upgrade success flash */}
              {upgradeSuccess === skill.skillId && (
                <div className="absolute inset-0 z-10 rounded-2xl animate-pulse pointer-events-none"
                  style={{ background: 'rgba(253,203,110,0.15)', boxShadow: '0 0 30px rgba(253,203,110,0.3)' }} />
              )}
              <SkillCard
                skill={skill}
                playerOgn={ogn}
                playerFragments={playerFragments}
                onUpgrade={() => handleUpgrade(skill.skillId)}
                isUpgrading={upgradingSkillId === skill.skillId}
              />
            </div>
          ))
        )}

        {/* Info note */}
        <div className="text-center py-4">
          <p className="text-[10px] text-white/30">
            Mở khóa kỹ năng mới bằng cách thắng boss trong chiến dịch.
            <br />
            Thu thập mảnh kỹ năng 🧩 từ drop khi đánh boss.
          </p>
        </div>
      </div>
    </div>
  );
}
