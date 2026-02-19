/**
 * SoundToggle — Minimal mute/unmute button for game UI
 *
 * Usage: <SoundToggle /> — renders a small speaker icon button
 */
import { useState } from 'react';
import { audioManager } from './AudioManager';

interface SoundToggleProps {
  className?: string;
}

export function SoundToggle({ className = '' }: SoundToggleProps) {
  const [muted, setMuted] = useState(audioManager.muted);

  const toggle = () => {
    const newMuted = audioManager.toggleMute();
    setMuted(newMuted);
    if (!newMuted) {
      // Play a small click to confirm unmute
      audioManager.play('ui_click');
    }
  };

  return (
    <button
      onClick={toggle}
      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90 ${muted ? 'opacity-50' : 'opacity-100'} ${className}`}
      style={{ background: 'rgba(255,255,255,0.15)' }}
      title={muted ? 'Bật âm thanh' : 'Tắt âm thanh'}
    >
      <span className="material-symbols-outlined text-[18px] text-white">
        {muted ? 'volume_off' : 'volume_up'}
      </span>
    </button>
  );
}
