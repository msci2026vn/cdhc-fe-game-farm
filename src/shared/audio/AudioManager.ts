/**
 * AudioManager — File-based game audio with oscillator fallback
 *
 * Features:
 * - AudioBuffer loading: fetch → decodeAudioData → cache
 * - Per-category gain nodes: master → bgm/sfx/ui/ambient
 * - File-first with FallbackSynth when MP3 files fail to load
 * - BGM crossfade with linearRampToValueAtTime
 * - Scene-based preloading
 * - Throttling + max concurrent limits
 * - Volume/mute persisted in localStorage
 */

import { FallbackSynth } from './FallbackSynth';
import {
  SOUND_REGISTRY,
  BGM_REGISTRY,
  SCENE_PRELOADS,
  type SoundName,
  type AudioCategory,
} from './SoundRegistry';

export type { SoundName, AudioCategory };

const STORAGE_KEY = 'farmverse_audio';

export interface AudioSettings {
  muted: boolean;
  masterVolume: number;
  bgmVolume: number;
  sfxVolume: number;
  uiVolume: number;
  ambientVolume: number;
}

const DEFAULT_SETTINGS: AudioSettings = {
  muted: false,
  masterVolume: 0.7,
  bgmVolume: 0.8,
  sfxVolume: 0.8,
  uiVolume: 0.7,
  ambientVolume: 0.5,
};

function loadSettings(): AudioSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Migrate from old format (volume/sfxVolume → new format)
      if ('volume' in parsed && !('masterVolume' in parsed)) {
        return {
          ...DEFAULT_SETTINGS,
          muted: parsed.muted ?? false,
          masterVolume: parsed.volume ?? 0.7,
          sfxVolume: parsed.sfxVolume ?? 0.8,
        };
      }
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch { /* ignore */ }
  return { ...DEFAULT_SETTINGS };
}

function saveSettings(s: AudioSettings) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

export class AudioManager {
  private ctx: AudioContext | null = null;
  private initialized = false;
  private settings: AudioSettings;

  // Gain node chain: source → categoryGain → masterGain → destination
  private masterGain: GainNode | null = null;
  private categoryGains: Record<AudioCategory, GainNode | null> = {
    bgm: null, sfx: null, ui: null, ambient: null,
  };

  // AudioBuffer cache
  private bufferCache: Map<string, AudioBuffer> = new Map();
  private loadingPromises: Map<string, Promise<AudioBuffer | null>> = new Map();

  // Throttling
  private lastPlayTime: Map<string, number> = new Map();
  private activeSounds = 0;
  private static MAX_CONCURRENT = 12;

  // BGM state
  private bgmSource: AudioBufferSourceNode | null = null;
  private bgmGainNode: GainNode | null = null;
  private bgmFallback: { stop: () => void } | null = null;
  private bgmPlaying = false;
  private currentBgm: string | null = null;

  constructor() {
    this.settings = loadSettings();
  }

  // ═══════════════════════════════════════════════════════════
  // CONTEXT & INITIALIZATION
  // ═══════════════════════════════════════════════════════════

  private ensureContext(): AudioContext | null {
    if (this.ctx && this.ctx.state !== 'closed') {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    }
    try {
      this.ctx = new AudioContext();
      this.setupGainNodes();
      this.initialized = true;
      return this.ctx;
    } catch {
      return null;
    }
  }

  private setupGainNodes() {
    const ctx = this.ctx!;

    this.masterGain = ctx.createGain();
    this.masterGain.gain.value = this.settings.muted ? 0 : this.settings.masterVolume;
    this.masterGain.connect(ctx.destination);

    const categories: AudioCategory[] = ['bgm', 'sfx', 'ui', 'ambient'];
    for (const cat of categories) {
      const gain = ctx.createGain();
      gain.gain.value = this.getCategoryVolume(cat);
      gain.connect(this.masterGain);
      this.categoryGains[cat] = gain;
    }
  }

  private getCategoryVolume(cat: AudioCategory): number {
    switch (cat) {
      case 'bgm': return this.settings.bgmVolume;
      case 'sfx': return this.settings.sfxVolume;
      case 'ui': return this.settings.uiVolume;
      case 'ambient': return this.settings.ambientVolume;
    }
  }

  /** Initialize AudioContext — call from user gesture */
  init() {
    if (this.initialized) return;
    this.ensureContext();
  }

  // ═══════════════════════════════════════════════════════════
  // SETTINGS
  // ═══════════════════════════════════════════════════════════

  get muted() { return this.settings.muted; }
  get volume() { return this.settings.masterVolume; }
  get sfxVolume() { return this.settings.sfxVolume; }
  get bgmVolume() { return this.settings.bgmVolume; }
  get uiVolume() { return this.settings.uiVolume; }
  get ambientVolume() { return this.settings.ambientVolume; }
  get allSettings() { return { ...this.settings }; }

  setMuted(m: boolean) {
    this.settings.muted = m;
    if (this.masterGain) {
      this.masterGain.gain.value = m ? 0 : this.settings.masterVolume;
    }
    if (m) this.stopBgm();
    saveSettings(this.settings);
  }

  toggleMute() {
    this.setMuted(!this.settings.muted);
    return this.settings.muted;
  }

  setVolume(v: number) {
    this.settings.masterVolume = Math.max(0, Math.min(1, v));
    if (this.masterGain && !this.settings.muted) {
      this.masterGain.gain.value = this.settings.masterVolume;
    }
    saveSettings(this.settings);
  }

  setSfxVolume(v: number) {
    this.settings.sfxVolume = Math.max(0, Math.min(1, v));
    if (this.categoryGains.sfx) {
      this.categoryGains.sfx.gain.value = this.settings.sfxVolume;
    }
    saveSettings(this.settings);
  }

  setBgmVolume(v: number) {
    this.settings.bgmVolume = Math.max(0, Math.min(1, v));
    if (this.categoryGains.bgm) {
      this.categoryGains.bgm.gain.value = this.settings.bgmVolume;
    }
    saveSettings(this.settings);
  }

  setUiVolume(v: number) {
    this.settings.uiVolume = Math.max(0, Math.min(1, v));
    if (this.categoryGains.ui) {
      this.categoryGains.ui.gain.value = this.settings.uiVolume;
    }
    saveSettings(this.settings);
  }

  setAmbientVolume(v: number) {
    this.settings.ambientVolume = Math.max(0, Math.min(1, v));
    if (this.categoryGains.ambient) {
      this.categoryGains.ambient.gain.value = this.settings.ambientVolume;
    }
    saveSettings(this.settings);
  }

  setCategoryVolume(cat: AudioCategory, v: number) {
    switch (cat) {
      case 'bgm': this.setBgmVolume(v); break;
      case 'sfx': this.setSfxVolume(v); break;
      case 'ui': this.setUiVolume(v); break;
      case 'ambient': this.setAmbientVolume(v); break;
    }
  }

  // ═══════════════════════════════════════════════════════════
  // AUDIO BUFFER LOADING
  // ═══════════════════════════════════════════════════════════

  /** Load a single audio file into buffer cache */
  private async loadBuffer(url: string): Promise<AudioBuffer | null> {
    if (this.bufferCache.has(url)) return this.bufferCache.get(url)!;

    // Deduplicate concurrent loads
    const existing = this.loadingPromises.get(url);
    if (existing) return existing;

    const promise = (async () => {
      try {
        const ctx = this.ensureContext();
        if (!ctx) return null;
        const response = await fetch(url);
        if (!response.ok) return null;
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
        this.bufferCache.set(url, audioBuffer);
        return audioBuffer;
      } catch {
        return null;
      } finally {
        this.loadingPromises.delete(url);
      }
    })();

    this.loadingPromises.set(url, promise);
    return promise;
  }

  /** Preload a single sound by name */
  async preload(name: SoundName): Promise<void> {
    const entry = SOUND_REGISTRY[name];
    if (entry) await this.loadBuffer(entry.url);
  }

  /** Preload all sounds for a scene */
  async preloadScene(scene: string): Promise<void> {
    const sounds = SCENE_PRELOADS[scene];
    if (!sounds) return;
    await Promise.all(sounds.map(name => this.preload(name)));
  }

  // ═══════════════════════════════════════════════════════════
  // THROTTLING
  // ═══════════════════════════════════════════════════════════

  private shouldThrottle(name: string, minIntervalMs = 50): boolean {
    const now = Date.now();
    const last = this.lastPlayTime.get(name) || 0;
    if (now - last < minIntervalMs) return true;
    if (this.activeSounds >= AudioManager.MAX_CONCURRENT) return true;
    this.lastPlayTime.set(name, now);
    return false;
  }

  private trackSound(duration: number) {
    this.activeSounds++;
    setTimeout(() => { this.activeSounds = Math.max(0, this.activeSounds - 1); }, duration * 1000 + 100);
  }

  // ═══════════════════════════════════════════════════════════
  // SFX PLAYBACK
  // ═══════════════════════════════════════════════════════════

  /** Play a sound effect — file-first, fallback to synth */
  play(name: SoundName) {
    if (this.settings.muted) return;

    const throttleMs = name.startsWith('ui_') || name === 'gem_select' ? 30 : 50;
    if (this.shouldThrottle(name, throttleMs)) return;
    this.trackSound(0.5);

    const entry = SOUND_REGISTRY[name];
    if (!entry) return;

    const ctx = this.ensureContext();
    if (!ctx) return;

    const categoryGain = this.categoryGains[entry.category];
    if (!categoryGain) return;

    // Try cached buffer first (instant playback)
    const cached = this.bufferCache.get(entry.url);
    if (cached) {
      this.playBuffer(ctx, cached, categoryGain, entry.volume ?? 1);
      return;
    }

    // Try async load, with synth fallback for immediate feedback
    FallbackSynth.playSfx(ctx, categoryGain, name);

    // Also start loading the file for next time
    this.loadBuffer(entry.url).catch(() => {});
  }

  private playBuffer(
    ctx: AudioContext,
    buffer: AudioBuffer,
    dest: AudioNode,
    volume: number,
  ) {
    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const gain = ctx.createGain();
    gain.gain.value = volume;

    source.connect(gain);
    gain.connect(dest);
    source.start(0);
  }

  /** Get combo sound name from combo count */
  static comboSound(combo: number): SoundName | null {
    if (combo >= 8) return 'combo_godlike';
    if (combo >= 6) return 'combo_6';
    if (combo >= 5) return 'combo_5';
    if (combo >= 4) return 'combo_4';
    if (combo >= 3) return 'combo_3';
    if (combo >= 2) return 'combo_2';
    return null;
  }

  // ═══════════════════════════════════════════════════════════
  // BGM — File-based with crossfade and oscillator fallback
  // ═══════════════════════════════════════════════════════════

  startBgm(preset: 'battle' | 'campaign' | 'boss' = 'campaign') {
    if (this.settings.muted) return;
    if (this.bgmPlaying && this.currentBgm === preset) return;

    const ctx = this.ensureContext();
    if (!ctx) return;

    const bgmGain = this.categoryGains.bgm;
    if (!bgmGain) return;

    // Crossfade: fade out old BGM
    this.stopBgm();

    this.currentBgm = preset;
    this.bgmPlaying = true;

    const bgmEntry = BGM_REGISTRY[preset];
    if (!bgmEntry) {
      // No registry entry — use oscillator fallback
      this.bgmFallback = FallbackSynth.startBgm(ctx, bgmGain, preset, 1);
      return;
    }

    // Try loading the BGM file
    this.loadBuffer(bgmEntry.url).then(buffer => {
      // Check we're still supposed to play this preset
      if (this.currentBgm !== preset || !this.bgmPlaying) return;

      if (buffer) {
        // Play file-based BGM
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = bgmEntry.loop;

        const gainNode = ctx.createGain();
        // Fade in
        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(bgmEntry.volume, ctx.currentTime + 0.5);

        source.connect(gainNode);
        gainNode.connect(bgmGain);
        source.start(0);

        // Stop any fallback that may have started
        if (this.bgmFallback) {
          this.bgmFallback.stop();
          this.bgmFallback = null;
        }

        this.bgmSource = source;
        this.bgmGainNode = gainNode;
      } else {
        // File failed to load — use oscillator fallback
        if (!this.bgmFallback) {
          this.bgmFallback = FallbackSynth.startBgm(ctx, bgmGain, preset, 1);
        }
      }
    }).catch(() => {
      // On error, start oscillator fallback
      if (this.currentBgm === preset && !this.bgmFallback) {
        this.bgmFallback = FallbackSynth.startBgm(ctx, bgmGain, preset, 1);
      }
    });

    // Start oscillator fallback immediately for instant audio while file loads
    this.bgmFallback = FallbackSynth.startBgm(ctx, bgmGain, preset, 1);
  }

  stopBgm() {
    if (!this.bgmPlaying) return;

    // Fade out file-based BGM
    if (this.bgmSource && this.bgmGainNode && this.ctx) {
      const now = this.ctx.currentTime;
      this.bgmGainNode.gain.setValueAtTime(this.bgmGainNode.gain.value, now);
      this.bgmGainNode.gain.linearRampToValueAtTime(0, now + 0.5);

      const source = this.bgmSource;
      const gainNode = this.bgmGainNode;
      setTimeout(() => {
        try { source.stop(); source.disconnect(); } catch {}
        try { gainNode.disconnect(); } catch {}
      }, 600);

      this.bgmSource = null;
      this.bgmGainNode = null;
    }

    // Stop oscillator fallback
    if (this.bgmFallback) {
      this.bgmFallback.stop();
      this.bgmFallback = null;
    }

    this.bgmPlaying = false;
    this.currentBgm = null;
  }

  get isBgmPlaying() { return this.bgmPlaying; }
}

// Singleton instance
export const audioManager = new AudioManager();

// Convenience function
export function playSound(name: SoundName) {
  audioManager.play(name);
}
