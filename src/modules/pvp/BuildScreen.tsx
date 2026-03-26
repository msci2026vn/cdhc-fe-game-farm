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
const DEFAULT_STATS: Record<StatKey, number> = { str: 10, vit: 10, wis: 10, arm: 10, mana: 10 };

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
            str: res.build.str ?? 10,
            vit: res.build.vit ?? 10,
            wis: res.build.wis ?? 10,
            arm: res.build.arm ?? 10,
            mana: res.build.mana ?? 10,
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
      if (newVal < 0 || newVal > 50) return prev;
      const curTotal = Object.values(prev).reduce((a, b) => a + b, 0);
      if (curTotal + delta > STAT_TOTAL) return prev;
      return { ...prev, [key]: newVal };
    });
    setSaveSuccess(false);
  }, []);

  const resetStats = useCallback(() => {
    setStats({ str: 0, vit: 0, wis: 0, arm: 0, mana: 0 });
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
        str: stats.str,
        vit: stats.vit,
        wis: stats.wis,
        arm: stats.arm,
        mana: stats.mana,
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
      height: '100dvh',
      overflowY: 'auto',
      background: "url('/assets/build/bg_build.png') no-repeat center center / cover",
      color: '#e0e0e0',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
      paddingBottom: 40,
    }}>
      {/* ── Header ── */}
      <div style={{
        position: 'relative', width: '100%', height: 90,
        display: 'flex', alignItems: 'center', gap: 4, padding: '10px 10px 0'
      }}>
        {/* Back Button */}
        <button
          onClick={() => navigate('/pvp/arena')}
          style={{
            width: 40, height: 40, border: 'none', cursor: 'pointer', flexShrink: 0,
            background: "url('/assets/stats/btn_back_arrow.png') no-repeat center center / contain",
          }}
        />

        {/* Title Frame */}
        <div style={{
          flex: 1, height: 64, maxWidth: 260,
          background: "url('/assets/build/frame_title_build.png') no-repeat center center / contain",
          display: 'flex', alignItems: 'center', justifyContent: 'center', paddingBottom: 6
        }}>
          <h1 style={{
            margin: 0, fontSize: 17, fontWeight: 900,
            color: '#FFFEA3', textShadow: '1px 1px 0 #3b1e0a',
            textAlign: 'center'
          }}>
            Thiết lập chiến đấu
          </h1>
        </div>

        {/* Allocation Status Frame & Reset */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center', marginTop: 10 }}>
          <div style={{
            width: 110, height: 52, flexShrink: 0,
            background: "url('/assets/build/frame_allocation.png') no-repeat center center / contain",
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: remaining === 0 ? '#bef264' : '#fb923c', paddingBottom: 2
          }}>
            <div style={{ textAlign: 'center', lineHeight: 1, fontSize: 8, fontWeight: 800 }}>
              <div>{remaining === 0 ? 'Đã phân bổ đủ' : 'Chưa phân bổ đủ'}</div>
              <div style={{ fontSize: 11, marginTop: 1 }}>{totalUsed}/{STAT_TOTAL}</div>
            </div>
          </div>
          <button
            onClick={resetStats}
            style={{
              width: 60, height: 22, border: 'none', cursor: 'pointer',
              background: "url('/assets/build/btn_reset.png') no-repeat center center / contain",
            }}
          />
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 16px 0' }}>

        {/* ══════ STAT ALLOCATION ══════ */}
        <div style={{
          width: '100%', maxWidth: 480, margin: '0 auto 20px',
          background: "url('/assets/build/frame_index_allocation.png') no-repeat center center / 100% 100%",
          padding: '36px 44px 24px',
          display: 'flex', flexDirection: 'column'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', marginBottom: 12, marginTop: -20, paddingLeft: 4 }}>
            <h2 style={{
              margin: 0, fontSize: 14, fontWeight: 900, color: '#FFFEA3',
              textShadow: '1px 1px 0 #3b1e0a'
            }}>
              CHỈ SỐ ({totalUsed}/{STAT_TOTAL})
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
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
        </div>

        {/* ══════ PREVIEW PANEL ══════ */}
        <section style={{
          background: "url('/assets/build/frame_wood_3.png') no-repeat center center / 100% 100%",
          padding: '24px 28px', marginBottom: 20, position: 'relative'
        }}>
          <h2 style={{
            margin: '0 4px 12px', fontSize: 14, fontWeight: 900, color: '#FFFEA3',
            textShadow: '1px 1px 0 #3b1e0a', textAlign: 'left'
          }}>
            Xem Trước Chỉ Số
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <PreviewItem label="HP" value={`${5000 + stats.vit * 200}`} icon="heart_icon.png" />
            <PreviewItem label="ATK/GEM" value={`${40 + stats.str * 8}`} icon="atk_icon.png" />
            <PreviewItem label="HEAL/GEM" value={`${25 + stats.wis * 4}`} icon="heal_icon.png" />
            <PreviewItem label="ARMOR/GEM" value={`${20 + stats.arm * 6}`} icon="armor_icon.png" />
            <PreviewItem label="MAX MANA" value={`${100 + stats.mana * 20}`} icon="mana_icon.png" />
            <PreviewItem label="MANA/STAR" value={`${8 + stats.wis * 2}`} icon="mana_star_icon.png" />
          </div>
        </section>

        {/* ══════ SKILL PICKER ══════ */}
        <section style={{
          background: "url('/assets/build/frame_wood_4.png') no-repeat center center / 100% 100%",
          padding: '24px 32px', margin: '0 -12px 20px', position: 'relative'
        }}>
          <h2 style={{
            margin: '-18px 0 12px', fontSize: 14, fontWeight: 900, color: '#FFFEA3',
            textShadow: '1px 1px 0 #3b1e0a', textAlign: 'center'
          }}>
            Kỹ Năng Chiến Đấu
          </h2>

          <SkillSlotPicker
            label="TẤN CÔNG"
            skills={SKILL_GROUPS.A as unknown as SkillDef[]}
            selected={skills.A}
            onSelect={(id) => selectSkill('A', id)}
            maxMana={100 + stats.mana * 20}
          />

          <SkillSlotPicker
            label="KIỂM SOÁT"
            skills={SKILL_GROUPS.B as unknown as SkillDef[]}
            selected={skills.B}
            onSelect={(id) => selectSkill('B', id)}
            maxMana={100 + stats.mana * 20}
          />

          <SkillSlotPicker
            label="HỖ TRỢ"
            skills={SKILL_GROUPS.C as unknown as SkillDef[]}
            selected={skills.C}
            onSelect={(id) => selectSkill('C', id)}
            maxMana={100 + stats.mana * 20}
          />
        </section>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 12 }}>
          <button
            onClick={() => navigate('/pvp/arena')}
            style={{
              width: 120, height: 40, border: 'none',
              background: "url('/assets/build/btn_cancel.png') no-repeat center center / contain",
              cursor: 'pointer', transition: 'all 0.2s',
            }}
            aria-label="Huỷ"
          />
          <button
            onClick={handleSave}
            disabled={saving || remaining !== 0}
            style={{
              width: 140, height: 40, border: 'none',
              background: "url('/assets/build/btn_confirm_build.png') no-repeat center center / contain",
              cursor: saving || remaining !== 0 ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              opacity: saving || remaining !== 0 ? 0.6 : 1,
            }}
            aria-label="Xác Nhận Build"
          />
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
    <div style={{ display: 'flex', alignItems: 'stretch', gap: 4 }}>
      {/* Main Wood Plank */}
      <div style={{
        flex: 1,
        width: 0, // Force equal flex distribution
        display: 'flex', alignItems: 'center', gap: 6,
        background: "url('/assets/build/frame_wood_5.png') no-repeat center center / 100% 100%",
        padding: '4px 12px',
        minWidth: 0,
      }}>
        {/* Icon + Name */}
        <div style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src={`/assets/build/${stat.icon}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 9, fontWeight: 900, color: stat.color, letterSpacing: 0.3, fontFamily: 'monospace' }}>
              {stat.name.toUpperCase()}
            </span>
          </div>
          {/* Value bar */}
          <div style={{ marginTop: 2, height: 3, background: 'rgba(0,0,0,0.4)', borderRadius: 1.5, overflow: 'hidden' }}>
            <div style={{
              width: `${(value / 50) * 100}%`, height: '100%', borderRadius: 1.5,
              background: stat.color, transition: 'width 0.2s',
            }} />
          </div>
        </div>

        {/* Controls */}
        <div style={{
          display: 'flex', alignItems: 'center', position: 'relative',
          width: 80, height: 30, justifyContent: 'center', marginLeft: 8
        }}>
          {/* Middle dark frame */}
          <div style={{
            position: 'absolute', left: 8, right: 8, top: 4, bottom: 4,
            background: "url('/assets/build/frame_index_2.png') no-repeat center center / 100% 100%",
            zIndex: 0
          }} />

          <button
            onClick={() => onChange(-1)}
            disabled={value <= 0}
            style={{
              position: 'absolute', left: -4, width: 28, height: 28, border: 'none',
              cursor: value <= 0 ? 'not-allowed' : 'pointer',
              background: "url('/assets/build/minus_icon.png') no-repeat center center / contain",
              opacity: 1, transition: 'all 0.1s', zIndex: 2
            }}
            onMouseDown={e => value > 0 && (e.currentTarget.style.transform = 'scale(0.9)')}
            onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
          />

          <span style={{
            position: 'relative', zIndex: 1, textAlign: 'center',
            fontFamily: 'monospace', fontWeight: 900, fontSize: 13,
            color: '#FFFFFF',
            textShadow: '0 0 2px #000, 1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000'
          }}>
            {value}
          </span>

          <button
            onClick={() => onChange(+1)}
            disabled={value >= 50 || remaining <= 0}
            style={{
              position: 'absolute', right: -4, width: 28, height: 28, border: 'none',
              cursor: (value >= 50 || remaining <= 0) ? 'not-allowed' : 'pointer',
              background: "url('/assets/build/plus_icon.png') no-repeat center center / contain",
              opacity: 1, transition: 'all 0.1s', zIndex: 2
            }}
            onMouseDown={e => (value < 50 && remaining > 0) && (e.currentTarget.style.transform = 'scale(0.9)')}
            onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
          />
        </div>
      </div>

      {/* Formula preview Frame */}
      <div style={{
        width: 75, height: 38, flexShrink: 0,
        background: "url('/assets/build/frame_index_1.png') no-repeat center center / 100% 100%",
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0 8px',
        overflow: 'hidden'
      }}>
        <div style={{
          fontSize: 8, color: '#FFFEA3', fontWeight: 800,
          textAlign: 'center', fontFamily: 'monospace', lineHeight: 1,
          textShadow: '0.5px 0.5px 0 rgba(0,0,0,0.5)'
        }}>
          {stat.formula(value)}
        </div>
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
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
        <h3 style={{
          margin: 0, fontSize: 11, fontWeight: 900, color: '#FFFEA3',
          textShadow: '0.5px 0.5px 0 #000',
          background: "url('/assets/build/frame_group.png') no-repeat center center / 100% 100%",
          padding: '5px 20px', minWidth: 110, textAlign: 'center'
        }}>{label}</h3>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4 }}>
        {skills.map(skill => {
          const isSelected = selected === skill.id;
          const canAfford = maxMana >= skill.manaCost;
          return (
            <button
              key={skill.id}
              onClick={() => onSelect(skill.id)}
              style={{
                position: 'relative', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', width: 62, height: 62, border: 'none',
                background: "url('/assets/build/btn_skill.png') no-repeat center center / contain",
                cursor: 'pointer', transition: 'all 0.15s',
                opacity: canAfford ? 1 : 0.5,
                filter: isSelected ? 'drop-shadow(0 0 4px #f59e0b) brightness(1.1)' : 'none',
              }}
            >
              <img
                src={`/assets/build/icon_skills/${skill.icon}`}
                alt=""
                style={{ width: 26, height: 26, objectFit: 'contain' }}
              />
              <span style={{
                fontSize: 7, marginTop: 1, textAlign: 'center', lineHeight: 1,
                fontWeight: 900, color: '#FFFFFF', textShadow: '0.5px 0.5px 0 #000',
                maxWidth: '85%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
              }}>
                {skill.name}
              </span>
              <span style={{
                fontSize: 6.5, color: '#bef264', fontWeight: 900,
                textShadow: '0.5px 0.5px 0 #000', marginTop: 1
              }}>
                ⭐{skill.manaCost}
              </span>
              {!canAfford && (
                <div style={{
                  position: 'absolute', inset: 4, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(0,0,0,0.4)', borderRadius: '50%',
                }}>
                  <span style={{ fontSize: 7, color: '#ef4444', fontWeight: 900 }}>THIẾU</span>
                </div>
              )}
              {isSelected && (
                <div style={{
                  position: 'absolute', top: 2, right: 2,
                  width: 14, height: 14, borderRadius: '50%',
                  background: '#f59e0b', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: 8, color: '#0f0f1a', fontWeight: 900 }}>✓</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
      {/* Selected skill description */}
      {selected && (
        <div style={{
          marginTop: 8, fontSize: 11, fontWeight: 900, color: '#3b1e0a',
          textShadow: '0.5px 0.5px 0 rgba(255,254,163,0.3)',
          background: "url('/assets/build/frame_recent_match.png') no-repeat center center / 100% 100%",
          padding: '10px 20px', minHeight: 40, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          {skills.find(s => s.id === selected)?.desc}
        </div>
      )}
    </div>
  );
}

function PreviewItem({ label, value, icon }: { label: string; value: string; icon?: string }) {
  const st: React.CSSProperties = {
    fontSize: 11, fontWeight: 900, color: '#FFFEA3',
    textShadow: '0 0 2px #000, 1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000',
    letterSpacing: 0.3
  };
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: "url('/assets/build/frame_index_3.png') no-repeat center center / 100% 100%",
      padding: '8px 12px', height: 32, boxSizing: 'border-box'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {icon && (
          <img
            src={`/assets/build/${icon}`}
            alt=""
            style={{ width: 18, height: 18, objectFit: 'contain' }}
          />
        )}
        <span style={st}>{label}</span>
      </div>
      <span style={st}>{value}</span>
    </div>
  );
}
