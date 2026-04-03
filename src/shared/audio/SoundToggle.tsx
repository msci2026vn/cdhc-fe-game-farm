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
  size?: number;
}

export function SoundToggle({ className = '', showSettings = false, size = 32 }: SoundToggleProps) {
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
        className={`flex items-center justify-center transition-transform active:scale-90 ${className}`}
        style={{ width: size, height: size }}
        title={muted ? 'Bật âm thanh' : 'Tắt âm thanh'}
      >
        <img 
            src={muted ? '/assets/battle/btn_muted.png' : '/assets/battle/btn_sound_on.png'} 
            alt={muted ? 'muted' : 'sound on'} 
            className="w-full h-full object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" 
        />
      </button>

      {showSettings && (
        <button
          onClick={() => setSettingsOpen(!settingsOpen)}
          className="w-6 h-6 rounded-full flex items-center justify-center transition-all active:scale-90 ml-1"
          style={{ background: 'rgba(255,255,255,0.1)' }}
          title="Cài đặt âm thanh"
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
