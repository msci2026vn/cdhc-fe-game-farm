import React from 'react';

interface Props {
  avatarUrl?: string;
  name: string;
  title?: string;
  level: number;
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  armor: number;
  maxArmor: number;
}

const ARMOR_SEGMENTS = 5;

export default function FarmCharacterHUD({
  avatarUrl, name, title, level,
  hp, maxHp, mana, maxMana, armor, maxArmor,
}: Props) {
  const hpPct = maxHp > 0 ? Math.min(100, (hp / maxHp) * 100) : 0;
  const manaPct = maxMana > 0 ? Math.min(100, (mana / maxMana) * 100) : 0;
  const filledSegments = maxArmor > 0 ? Math.round((armor / maxArmor) * ARMOR_SEGMENTS) : 0;

  return (
    <div className="farm-hud">
      <div className="farm-hud-avatar">
        {avatarUrl ? (
          <img src={avatarUrl} alt={name} />
        ) : (
          <span style={{ fontSize: 22 }}>🧑‍🌾</span>
        )}
      </div>
      <div className="farm-hud-info">
        <span className="farm-hud-name">{name}</span>
        {title && <span className="farm-title-gold">{title}</span>}
        <div className="farm-hp-bar">
          <div className="farm-hp-bar-fill" style={{ width: `${hpPct}%` }} />
        </div>
        <div className="farm-mana-bar">
          <div className="farm-mana-bar-fill" style={{ width: `${manaPct}%` }} />
        </div>
        <div className="farm-armor-segments">
          {Array.from({ length: ARMOR_SEGMENTS }, (_, i) => (
            <div
              key={i}
              className={`farm-armor-segment ${i < filledSegments ? 'farm-armor-segment--filled' : ''}`}
            />
          ))}
        </div>
      </div>
      <span className="farm-lv-badge">Lv.{level}</span>
    </div>
  );
}
