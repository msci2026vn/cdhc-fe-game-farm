/**
 * AudioSettingsPanel — Per-category volume sliders
 *
 * Renders a compact panel with sliders for Master, BGM, SFX, and UI volume.
 * Matches the existing Tailwind game UI style.
 */
import { useState } from 'react';
import { audioManager, type AudioCategory } from './AudioManager';

interface AudioSettingsPanelProps {
  onClose?: () => void;
}

interface SliderConfig {
  label: string;
  icon: string;
  category: AudioCategory | 'master';
  getValue: () => number;
  setValue: (v: number) => void;
}

export function AudioSettingsPanel({ onClose }: AudioSettingsPanelProps) {
  const [, forceUpdate] = useState(0);
  const rerender = () => forceUpdate(n => n + 1);

  const sliders: SliderConfig[] = [
    {
      label: 'Am luong',
      icon: 'volume_up',
      category: 'master',
      getValue: () => audioManager.volume,
      setValue: (v) => { audioManager.setVolume(v); rerender(); },
    },
    {
      label: 'Nhac nen',
      icon: 'music_note',
      category: 'bgm',
      getValue: () => audioManager.bgmVolume,
      setValue: (v) => { audioManager.setBgmVolume(v); rerender(); },
    },
    {
      label: 'Hieu ung',
      icon: 'graphic_eq',
      category: 'sfx',
      getValue: () => audioManager.sfxVolume,
      setValue: (v) => { audioManager.setSfxVolume(v); rerender(); },
    },
    {
      label: 'Giao dien',
      icon: 'touch_app',
      category: 'ui',
      getValue: () => audioManager.uiVolume,
      setValue: (v) => { audioManager.setUiVolume(v); rerender(); },
    },
  ];

  return (
    <div
      className="bg-gray-900/95 backdrop-blur-sm rounded-xl p-3 shadow-xl border border-white/10 min-w-[200px]"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-white/90 text-xs font-medium">Am thanh</span>
        {onClose && (
          <button
            onClick={onClose}
            className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-white/10"
          >
            <span className="material-symbols-outlined text-[14px] text-white/50">close</span>
          </button>
        )}
      </div>

      <div className="space-y-2">
        {sliders.map(({ label, icon, getValue, setValue }) => (
          <div key={label} className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-white/60 w-5 text-center">
              {icon}
            </span>
            <span className="text-[10px] text-white/50 w-14 shrink-0">{label}</span>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(getValue() * 100)}
              onChange={(e) => setValue(Number(e.target.value) / 100)}
              className="flex-1 h-1 accent-emerald-400 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-400"
            />
            <span className="text-[10px] text-white/40 w-6 text-right">
              {Math.round(getValue() * 100)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
