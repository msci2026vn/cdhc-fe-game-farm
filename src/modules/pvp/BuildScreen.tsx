import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  pvpApi,
  SKILL_GROUPS, STAT_DEFS, STAT_TOTAL,
  type PvpBuildConfig,
} from '@/shared/api/api-pvp';

// ── Types ──
type StatKey = 'str' | 'vit' | 'wis' | 'arm' | 'mana';
type SkillGroup = 'A' | 'B' | 'C';

interface SkillDef {
  id: string;
  name: string;
  icon: string;
  desc: string;
  manaCost: number;
}

// ── Default build ──
const DEFAULT_STATS: Record<StatKey, number> = { str: 6, vit: 6, wis: 6, arm: 6, mana: 6 };

export default function BuildScreen() {
  const navigate = useNavigate();

  // ── State ──
  const [stats, setStats] = useState<Record<StatKey, number>>({ ...DEFAULT_STATS });
  const [skills, setSkills] = useState<{ A: string | null; B: string | null; C: string | null }>({
    A: null, B: null, C: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // ── Derived ──
  const totalUsed = Object.values(stats).reduce((a, b) => a + b, 0);
  const remaining = STAT_TOTAL - totalUsed;

  // ── Load existing build ──
  useEffect(() => {
    (async () => {
      try {
        const res = await pvpApi.getBuild();
        if (res.build) {
          setStats({
            str:  res.build.str  ?? 6,
            vit:  res.build.vit  ?? 6,
            wis:  res.build.wis  ?? 6,
            arm:  res.build.arm  ?? 6,
            mana: res.build.mana ?? 6,
          });
          setSkills({
            A: res.build.skillA || null,
            B: res.build.skillB || null,
            C: res.build.skillC || null,
          });
        }
      } catch {
        console.warn('Failed to load build, using defaults');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Stat handlers ──
  const changeStat = useCallback((key: StatKey, delta: number) => {
    setStats(prev => {
      const newVal = prev[key] + delta;
      if (newVal < 0 || newVal > 30) return prev;
      const curTotal = Object.values(prev).reduce((a, b) => a + b, 0);
      if (curTotal + delta > STAT_TOTAL) return prev;
      return { ...prev, [key]: newVal };
    });
    setSaveSuccess(false);
  }, []);

  const resetStats = useCallback(() => {
    setStats({ ...DEFAULT_STATS });
    setSaveSuccess(false);
  }, []);

  // ── Skill handler ──
  const selectSkill = useCallback((group: SkillGroup, skillId: string) => {
    setSkills(prev => ({
      ...prev,
      [group]: prev[group] === skillId ? null : skillId,
    }));
    setSaveSuccess(false);
  }, []);

  // ── Save ──
  const handleSave = async () => {
    if (remaining !== 0) {
      setError(`Cần phân bổ đủ ${STAT_TOTAL} điểm (còn ${remaining})`);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await pvpApi.saveBuild({
        str:    stats.str,
        vit:    stats.vit,
        wis:    stats.wis,
        arm:    stats.arm,
        mana:   stats.mana,
        skillA: skills.A,
        skillB: skills.B,
        skillC: skills.C,
      });
      setSaveSuccess(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Lỗi khi lưu build');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100dvh', background: 'linear-gradient(135deg,#0f0f1a,#1a1a2e)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ color: '#fff', fontSize: 16 }}>Đang tải build...</div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(135deg,#0f0f1a 0%,#1a1a2e 50%,#0f3460 100%)',
      color: '#e0e0e0',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
      paddingBottom: 100,
    }}>
      {/* ── Header ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(15,15,26,0.95)', backdropFilter: 'blur(8px)',
        borderBottom: '1px solid #1e3a5a',
        padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <button
          onClick={() => navigate('/pvp')}
          style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 20, cursor: 'pointer' }}
        >
          ←
        </button>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#fff' }}>⚙️ Thiết Lập Chiến Đấu</h1>
        <div style={{ marginLeft: 'auto', fontSize: 13 }}>
          <span style={{ color: remaining === 0 ? '#22c55e' : '#eab308' }}>
            {remaining === 0 ? '✓ Đã phân bổ đủ' : `Còn ${remaining} điểm`}
          </span>
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px 16px 0' }}>

        {/* ══════ STAT ALLOCATION ══════ */}
        <section style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#94a3b8' }}>
              Phân Bổ Chỉ Số ({totalUsed}/{STAT_TOTAL})
            </h2>
            <button
              onClick={resetStats}
              style={{
                fontSize: 11, color: '#64748b', background: 'none',
                border: '1px solid #334155', borderRadius: 6, padding: '4px 10px', cursor: 'pointer',
              }}
            >
              Đặt lại
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {STAT_DEFS.map(stat => (
              <StatRow
                key={stat.key}
                stat={stat}
                value={stats[stat.key]}
                remaining={remaining}
                onChange={(delta) => changeStat(stat.key, delta)}
              />
            ))}
          </div>
        </section>

        {/* ══════ PREVIEW PANEL ══════ */}
        <section style={{
          background: 'rgba(30,58,90,0.3)', borderRadius: 12, padding: 16,
          border: '1px solid #1e3a5a', marginBottom: 20,
        }}>
          <h2 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: '#64748b' }}>Xem Trước Chỉ Số</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <PreviewItem label="❤️ HP" value={`${2500 + stats.vit * 120}`} />
            <PreviewItem label="⚔️ ATK/gem" value={`${40 + stats.str * 8}`} />
            <PreviewItem label="💚 Heal/gem" value={`${25 + stats.wis * 3}`} />
            <PreviewItem label="🛡️ Armor/gem" value={`${20 + stats.arm * 5}`} />
            <PreviewItem label="⭐ Max Mana" value={`${100 + stats.mana * 20}`} />
            <PreviewItem label="⭐ Mana/star" value={`${8 + stats.wis * 2}`} />
          </div>
        </section>

        {/* ══════ SKILL PICKER ══════ */}
        <section>
          <h2 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700, color: '#94a3b8' }}>Kỹ Năng Chiến Đấu</h2>

          <SkillSlotPicker
            label="⚔️ Tấn Công (Nhóm A)"
            skills={SKILL_GROUPS.A as unknown as SkillDef[]}
            selected={skills.A}
            onSelect={(id) => selectSkill('A', id)}
            maxMana={100 + stats.mana * 20}
          />

          <SkillSlotPicker
            label="⛓️ Kiểm Soát (Nhóm B)"
            skills={SKILL_GROUPS.B as unknown as SkillDef[]}
            selected={skills.B}
            onSelect={(id) => selectSkill('B', id)}
            maxMana={100 + stats.mana * 20}
          />

          <SkillSlotPicker
            label="💚 Hỗ Trợ (Nhóm C)"
            skills={SKILL_GROUPS.C as unknown as SkillDef[]}
            selected={skills.C}
            onSelect={(id) => selectSkill('C', id)}
            maxMana={100 + stats.mana * 20}
          />
        </section>
      </div>

      {/* ══════ STICKY BOTTOM BAR ══════ */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'rgba(15,15,26,0.95)', backdropFilter: 'blur(8px)',
        borderTop: '1px solid #1e3a5a', padding: 16,
      }}>
        <div style={{ maxWidth: 480, margin: '0 auto', display: 'flex', gap: 12 }}>
          <button
            onClick={() => navigate('/pvp')}
            style={{
              flex: 1, padding: '14px', borderRadius: 12,
              background: '#1e293b', color: '#94a3b8', border: 'none',
              fontSize: 15, fontWeight: 700, cursor: 'pointer',
            }}
          >
            Huỷ
          </button>
          <button
            onClick={handleSave}
            disabled={saving || remaining !== 0}
            style={{
              flex: 1, padding: '14px', borderRadius: 12, border: 'none',
              fontSize: 15, fontWeight: 700, cursor: saving || remaining !== 0 ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              ...(saveSuccess
                ? { background: '#16a34a', color: '#fff' }
                : remaining !== 0
                  ? { background: '#334155', color: '#64748b' }
                  : { background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#0f0f1a' }),
            }}
          >
            {saving ? 'Đang lưu...' : saveSuccess ? '✓ Đã Lưu' : 'Xác Nhận Build'}
          </button>
        </div>
        {error && (
          <p style={{ color: '#ef4444', fontSize: 13, textAlign: 'center', marginTop: 8 }}>{error}</p>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
// SUB-COMPONENTS
// ══════════════════════════════════════════════

function StatRow({
  stat,
  value,
  remaining,
  onChange,
}: {
  stat: typeof STAT_DEFS[number];
  value: number;
  remaining: number;
  onChange: (delta: number) => void;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      background: 'rgba(30,58,90,0.2)', borderRadius: 10, padding: '8px 12px',
    }}>
      {/* Icon + Name */}
      <div style={{ width: 28, textAlign: 'center', fontSize: 18 }}>{stat.icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: stat.color }}>{stat.name}</span>
          <span style={{ fontSize: 10, color: '#64748b' }}>{stat.desc}</span>
        </div>
        {/* Value bar */}
        <div style={{ marginTop: 4, height: 4, background: '#1f2937', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            width: `${(value / 30) * 100}%`, height: '100%', borderRadius: 2,
            background: stat.color, transition: 'width 0.2s',
          }} />
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 8 }}>
        <button
          onClick={() => onChange(-1)}
          disabled={value <= 0}
          style={{
            width: 30, height: 30, borderRadius: 8, border: 'none',
            background: '#1e293b', color: '#94a3b8', fontWeight: 700, fontSize: 16,
            cursor: value <= 0 ? 'not-allowed' : 'pointer',
            opacity: value <= 0 ? 0.3 : 1,
          }}
        >
          −
        </button>
        <span style={{ width: 28, textAlign: 'center', fontFamily: 'monospace', fontWeight: 700, fontSize: 16 }}>
          {value}
        </span>
        <button
          onClick={() => onChange(+1)}
          disabled={value >= 30 || remaining <= 0}
          style={{
            width: 30, height: 30, borderRadius: 8, border: 'none',
            background: '#1e293b', color: '#94a3b8', fontWeight: 700, fontSize: 16,
            cursor: (value >= 30 || remaining <= 0) ? 'not-allowed' : 'pointer',
            opacity: (value >= 30 || remaining <= 0) ? 0.3 : 1,
          }}
        >
          +
        </button>
      </div>

      {/* Formula preview */}
      <div style={{ fontSize: 11, color: '#64748b', width: 90, textAlign: 'right', fontFamily: 'monospace' }}>
        {stat.formula(value)}
      </div>
    </div>
  );
}

function SkillSlotPicker({
  label,
  skills,
  selected,
  onSelect,
  maxMana,
}: {
  label: string;
  skills: SkillDef[];
  selected: string | null;
  onSelect: (id: string) => void;
  maxMana: number;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h3 style={{ margin: '0 0 8px', fontSize: 13, color: '#64748b' }}>{label}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
        {skills.map(skill => {
          const isSelected = selected === skill.id;
          const canAfford = maxMana >= skill.manaCost;
          return (
            <button
              key={skill.id}
              onClick={() => onSelect(skill.id)}
              style={{
                position: 'relative', display: 'flex', flexDirection: 'column',
                alignItems: 'center', padding: '8px 4px', borderRadius: 12,
                border: isSelected ? '2px solid #f59e0b' : '2px solid #1e3a5a',
                background: isSelected ? 'rgba(245,158,11,0.1)' : 'rgba(30,58,90,0.2)',
                cursor: 'pointer', transition: 'all 0.15s',
                opacity: canAfford ? 1 : 0.5,
                boxShadow: isSelected ? '0 0 16px rgba(245,158,11,0.2)' : 'none',
              }}
            >
              <span style={{ fontSize: 22 }}>{skill.icon}</span>
              <span style={{ fontSize: 9, marginTop: 4, textAlign: 'center', lineHeight: 1.2, fontWeight: 600, color: '#e2e8f0' }}>
                {skill.name}
              </span>
              <span style={{ fontSize: 8, color: '#64748b', marginTop: 2 }}>
                ⭐{skill.manaCost}
              </span>
              {!canAfford && (
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(0,0,0,0.4)', borderRadius: 12,
                }}>
                  <span style={{ fontSize: 8, color: '#ef4444' }}>Thiếu mana</span>
                </div>
              )}
              {isSelected && (
                <div style={{
                  position: 'absolute', top: -4, right: -4,
                  width: 16, height: 16, borderRadius: '50%',
                  background: '#f59e0b', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: 9, color: '#0f0f1a', fontWeight: 700 }}>✓</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
      {/* Selected skill description */}
      {selected && (
        <div style={{
          marginTop: 8, fontSize: 12, color: '#94a3b8',
          background: 'rgba(30,58,90,0.2)', borderRadius: 8, padding: '8px 12px',
        }}>
          {skills.find(s => s.id === selected)?.desc}
        </div>
      )}
    </div>
  );
}

function PreviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: 'rgba(30,58,90,0.3)', borderRadius: 8, padding: '6px 12px',
    }}>
      <span style={{ fontSize: 12, color: '#94a3b8' }}>{label}</span>
      <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#f59e0b' }}>{value}</span>
    </div>
  );
}
