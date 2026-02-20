/**
 * SoundToggle — Mute/unmute button with optional settings popover
 *
 * Usage: <SoundToggle /> — renders a small speaker icon button
 * Long press or click gear icon to open AudioSettings panel
 */
import { useState, useRef } from 'react';
import { audioManager } from './AudioManager';
import { AudioSettingsPanel } from './AudioSettings';

interface SoundToggleProps {
  className?: string;
  showSettings?: boolean;
}

export function SoundToggle({ className = '', showSettings = false }: SoundToggleProps) {
  const [muted, setMuted] = useState(audioManager.muted);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout>>(null);

  const toggle = () => {
    const newMuted = audioManager.toggleMute();
    setMuted(newMuted);
    if (!newMuted) {
      audioManager.play('ui_click');
    }
  };

  const handlePointerDown = () => {
    if (!showSettings) return;
    longPressTimer.current = setTimeout(() => {
      setSettingsOpen(true);
    }, 500);
  };

  const handlePointerUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={toggle}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90 ${muted ? 'opacity-50' : 'opacity-100'} ${className}`}
        style={{ background: 'rgba(255,255,255,0.15)' }}
        title={muted ? 'Bat am thanh' : 'Tat am thanh'}
      >
        <span className="material-symbols-outlined text-[18px] text-white">
          {muted ? 'volume_off' : 'volume_up'}
        </span>
      </button>

      {showSettings && (
        <button
          onClick={() => setSettingsOpen(!settingsOpen)}
          className="w-6 h-6 rounded-full flex items-center justify-center transition-all active:scale-90 ml-1"
          style={{ background: 'rgba(255,255,255,0.1)' }}
          title="Cai dat am thanh"
        >
          <span className="material-symbols-outlined text-[14px] text-white/70">
            tune
          </span>
        </button>
      )}

      {settingsOpen && (
        <div className="absolute right-0 top-10 z-50">
          <AudioSettingsPanel onClose={() => setSettingsOpen(false)} />
        </div>
      )}
    </div>
  );
}
