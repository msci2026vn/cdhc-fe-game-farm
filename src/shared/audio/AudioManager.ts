/**
 * AudioManager — Lightweight synthesized game audio
 *
 * Zero external files. All sounds generated via Web Audio API.
 * Total overhead: ~3KB gzipped. No downloads needed.
 *
 * Design:
 * - Single AudioContext, lazy-initialized on first user interaction
 * - All sounds are procedurally generated (no files to load)
 * - Volume/mute persisted in localStorage
 * - Safe for mobile: respects autoplay policies
 */

type SoundName =
  // Battle - Match 3
  | 'gem_select' | 'gem_swap' | 'gem_match' | 'gem_no_match'
  | 'combo_2' | 'combo_3' | 'combo_4' | 'combo_5' | 'combo_6' | 'combo_godlike'
  // Battle - Combat
  | 'damage_dealt' | 'damage_crit' | 'boss_attack' | 'boss_skill'
  | 'dodge_success' | 'shield_gain' | 'heal' | 'ult_charge' | 'ult_fire'
  | 'boss_enrage'
  // Battle - Result
  | 'victory' | 'defeat'
  // Farming
  | 'plant_seed' | 'water_plant' | 'harvest' | 'bug_catch' | 'plant_die'
  // Prayer
  | 'prayer_submit' | 'prayer_reward' | 'prayer_sparkle'
  // Quiz
  | 'quiz_start' | 'quiz_select' | 'quiz_correct' | 'quiz_wrong' | 'quiz_timer_low' | 'quiz_complete'
  // Shop
  | 'shop_buy' | 'shop_confirm'
  // UI
  | 'ui_click' | 'ui_tab' | 'ui_back' | 'ui_modal_open' | 'ui_modal_close'
  | 'ui_toast' | 'ui_notification'
  // Progression
  | 'level_up' | 'xp_gain' | 'ogn_gain' | 'star_earn'
  // Campaign
  | 'zone_unlock' | 'zone_clear' | 'boss_select';

export type { SoundName };

const STORAGE_KEY = 'farmverse_audio';

interface AudioSettings {
  muted: boolean;
  volume: number; // 0-1
  sfxVolume: number; // 0-1
}

function loadSettings(): AudioSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { muted: false, volume: 0.7, sfxVolume: 0.8 };
}

function saveSettings(s: AudioSettings) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

export class AudioManager {
  private ctx: AudioContext | null = null;
  private settings: AudioSettings;
  private initialized = false;
  /** Throttle: track last play time per sound to avoid spam on weak phones */
  private lastPlayTime: Map<string, number> = new Map();
  /** Max concurrent sounds to prevent audio overload */
  private activeSounds = 0;
  private static MAX_CONCURRENT = 8;

  constructor() {
    this.settings = loadSettings();
  }

  /** Initialize AudioContext — must be called from user gesture */
  private ensureContext(): AudioContext | null {
    if (this.ctx && this.ctx.state !== 'closed') {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    }
    try {
      this.ctx = new AudioContext();
      this.initialized = true;
      return this.ctx;
    } catch {
      return null;
    }
  }

  /** Initialize on first user interaction */
  init() {
    if (this.initialized) return;
    this.ensureContext();
  }

  // ═══════════════════════════════════════════════════════════
  // SETTINGS
  // ═══════════════════════════════════════════════════════════

  get muted() { return this.settings.muted; }
  get volume() { return this.settings.volume; }
  get sfxVolume() { return this.settings.sfxVolume; }

  setMuted(m: boolean) {
    this.settings.muted = m;
    saveSettings(this.settings);
  }

  toggleMute() {
    this.settings.muted = !this.settings.muted;
    saveSettings(this.settings);
    return this.settings.muted;
  }

  setVolume(v: number) {
    this.settings.volume = Math.max(0, Math.min(1, v));
    saveSettings(this.settings);
  }

  setSfxVolume(v: number) {
    this.settings.sfxVolume = Math.max(0, Math.min(1, v));
    saveSettings(this.settings);
  }

  // ═══════════════════════════════════════════════════════════
  // CORE SYNTH HELPERS
  // ═══════════════════════════════════════════════════════════

  private getGain(): number {
    if (this.settings.muted) return 0;
    return this.settings.volume * this.settings.sfxVolume;
  }

  /** Throttle check — returns true if sound should be skipped */
  private shouldThrottle(name: string, minIntervalMs = 50): boolean {
    const now = Date.now();
    const last = this.lastPlayTime.get(name) || 0;
    if (now - last < minIntervalMs) return true;
    if (this.activeSounds >= AudioManager.MAX_CONCURRENT) return true;
    this.lastPlayTime.set(name, now);
    return false;
  }

  /** Track active sound count for auto-cleanup */
  private trackSound(duration: number) {
    this.activeSounds++;
    setTimeout(() => { this.activeSounds = Math.max(0, this.activeSounds - 1); }, duration * 1000 + 100);
  }

  /** Play a single tone */
  private tone(freq: number, duration: number, vol = 1, type: OscillatorType = 'sine', delay = 0) {
    const ctx = this.ensureContext();
    if (!ctx || this.settings.muted) return;

    const gain = ctx.createGain();
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;

    const effectiveVol = vol * this.getGain();
    const now = ctx.currentTime + delay;

    gain.gain.setValueAtTime(effectiveVol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.05);
  }

  /** Play noise burst (for percussion-like sounds) */
  private noise(duration: number, vol = 0.3, delay = 0) {
    const ctx = this.ensureContext();
    if (!ctx || this.settings.muted) return;

    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.5;

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const gain = ctx.createGain();
    const effectiveVol = vol * this.getGain();
    const now = ctx.currentTime + delay;

    gain.gain.setValueAtTime(effectiveVol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    // Bandpass filter for different textures
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1000;
    filter.Q.value = 1;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start(now);
    source.stop(now + duration + 0.05);
  }

  /** Play a quick arpeggio */
  private arpeggio(freqs: number[], noteLen: number, vol = 0.5, type: OscillatorType = 'sine') {
    freqs.forEach((f, i) => this.tone(f, noteLen, vol, type, i * noteLen * 0.7));
  }

  // ═══════════════════════════════════════════════════════════
  // SOUND DEFINITIONS
  // ═══════════════════════════════════════════════════════════

  play(name: SoundName) {
    if (this.settings.muted) return;

    // Throttle: prevent same sound playing too fast (50ms min for combat, 30ms for UI)
    const throttleMs = name.startsWith('ui_') || name === 'gem_select' ? 30 : 50;
    if (this.shouldThrottle(name, throttleMs)) return;
    this.trackSound(0.5);

    switch (name) {
      // ─── BATTLE: Match-3 ───
      case 'gem_select':
        this.tone(880, 0.08, 0.3, 'sine');
        break;

      case 'gem_swap':
        this.tone(440, 0.08, 0.25, 'sine');
        this.tone(660, 0.08, 0.25, 'sine', 0.06);
        break;

      case 'gem_match':
        this.tone(523, 0.15, 0.4, 'sine');
        this.tone(659, 0.15, 0.35, 'sine', 0.08);
        this.tone(784, 0.2, 0.3, 'sine', 0.16);
        break;

      case 'gem_no_match':
        this.tone(300, 0.15, 0.25, 'square');
        this.tone(250, 0.2, 0.2, 'square', 0.1);
        break;

      // ─── COMBOS (escalating pitch & complexity) ───
      case 'combo_2':
        this.arpeggio([523, 659, 784], 0.1, 0.35);
        break;

      case 'combo_3':
        this.arpeggio([587, 740, 880, 1047], 0.09, 0.4);
        break;

      case 'combo_4':
        this.arpeggio([659, 831, 988, 1175, 1319], 0.08, 0.45, 'triangle');
        break;

      case 'combo_5':
        this.arpeggio([784, 988, 1175, 1397, 1568], 0.07, 0.5, 'triangle');
        this.noise(0.1, 0.15, 0.2);
        break;

      case 'combo_6':
        this.arpeggio([880, 1047, 1319, 1568, 1760, 2093], 0.06, 0.5, 'triangle');
        this.noise(0.15, 0.2, 0.25);
        break;

      case 'combo_godlike':
        this.arpeggio([523, 659, 784, 1047, 1319, 1568, 2093], 0.06, 0.55, 'sawtooth');
        this.noise(0.2, 0.25, 0.3);
        this.tone(2093, 0.5, 0.3, 'sine', 0.35);
        break;

      // ─── BATTLE: Combat ───
      case 'damage_dealt':
        this.noise(0.08, 0.3);
        this.tone(200, 0.1, 0.35, 'square');
        break;

      case 'damage_crit':
        this.noise(0.12, 0.4);
        this.tone(150, 0.08, 0.4, 'square');
        this.tone(400, 0.15, 0.35, 'sawtooth', 0.05);
        break;

      case 'boss_attack':
        this.tone(150, 0.2, 0.45, 'sawtooth');
        this.tone(100, 0.3, 0.35, 'square', 0.1);
        this.noise(0.15, 0.3, 0.05);
        break;

      case 'boss_skill':
        this.tone(200, 0.1, 0.4, 'sawtooth');
        this.tone(100, 0.15, 0.45, 'square', 0.08);
        this.tone(80, 0.2, 0.4, 'sawtooth', 0.15);
        this.noise(0.2, 0.35, 0.1);
        break;

      case 'dodge_success':
        this.tone(800, 0.08, 0.35, 'sine');
        this.tone(1200, 0.1, 0.3, 'sine', 0.06);
        this.tone(1600, 0.12, 0.25, 'sine', 0.12);
        break;

      case 'shield_gain':
        this.tone(400, 0.15, 0.3, 'triangle');
        this.tone(600, 0.15, 0.25, 'triangle', 0.08);
        break;

      case 'heal':
        this.arpeggio([392, 494, 587, 784], 0.12, 0.3, 'sine');
        break;

      case 'ult_charge':
        this.tone(220, 0.05, 0.2, 'triangle');
        break;

      case 'ult_fire':
        this.noise(0.3, 0.4);
        this.arpeggio([262, 392, 523, 784, 1047, 1319], 0.08, 0.5, 'sawtooth');
        this.tone(100, 0.5, 0.35, 'square', 0.2);
        break;

      case 'boss_enrage':
        this.tone(100, 0.4, 0.4, 'sawtooth');
        this.tone(80, 0.5, 0.35, 'square', 0.2);
        this.noise(0.3, 0.3, 0.1);
        break;

      // ─── BATTLE: Result ───
      case 'victory':
        this.arpeggio([523, 659, 784, 1047], 0.2, 0.5, 'sine');
        this.arpeggio([784, 988, 1175, 1568], 0.2, 0.45, 'triangle');
        this.tone(1568, 0.6, 0.4, 'sine', 0.8);
        break;

      case 'defeat':
        this.tone(400, 0.3, 0.4, 'sine');
        this.tone(350, 0.3, 0.35, 'sine', 0.3);
        this.tone(300, 0.3, 0.3, 'sine', 0.6);
        this.tone(200, 0.6, 0.35, 'sine', 0.9);
        break;

      // ─── FARMING ───
      case 'plant_seed':
        this.tone(330, 0.1, 0.3, 'sine');
        this.tone(440, 0.12, 0.25, 'sine', 0.08);
        this.noise(0.05, 0.15, 0.05);
        break;

      case 'water_plant':
        // Bubbly water sound
        this.tone(600, 0.06, 0.25, 'sine');
        this.tone(800, 0.06, 0.2, 'sine', 0.05);
        this.tone(700, 0.06, 0.2, 'sine', 0.1);
        this.tone(900, 0.06, 0.18, 'sine', 0.15);
        this.tone(650, 0.08, 0.2, 'sine', 0.2);
        break;

      case 'harvest':
        this.arpeggio([440, 554, 659, 880], 0.12, 0.45, 'sine');
        this.tone(880, 0.3, 0.35, 'triangle', 0.4);
        this.noise(0.1, 0.15, 0.3);
        break;

      case 'bug_catch':
        this.tone(800, 0.05, 0.3, 'square');
        this.tone(1200, 0.08, 0.25, 'sine', 0.04);
        break;

      case 'plant_die':
        this.tone(300, 0.2, 0.3, 'sine');
        this.tone(250, 0.25, 0.25, 'sine', 0.15);
        this.tone(200, 0.3, 0.2, 'sine', 0.3);
        break;

      // ─── PRAYER ───
      case 'prayer_submit':
        // Sacred bell-like
        this.tone(523, 0.4, 0.35, 'sine');
        this.tone(659, 0.4, 0.3, 'sine', 0.15);
        this.tone(784, 0.5, 0.35, 'sine', 0.3);
        this.tone(1047, 0.6, 0.25, 'sine', 0.45);
        break;

      case 'prayer_reward':
        this.arpeggio([523, 659, 784, 1047, 1319], 0.15, 0.4, 'sine');
        break;

      case 'prayer_sparkle':
        this.tone(1500 + Math.random() * 500, 0.1, 0.15, 'sine');
        break;

      // ─── QUIZ ───
      case 'quiz_start':
        this.arpeggio([392, 494, 587, 784], 0.1, 0.35, 'triangle');
        break;

      case 'quiz_select':
        this.tone(660, 0.08, 0.25, 'sine');
        break;

      case 'quiz_correct':
        this.arpeggio([523, 659, 784], 0.12, 0.45, 'sine');
        this.tone(1047, 0.3, 0.3, 'sine', 0.3);
        break;

      case 'quiz_wrong':
        this.tone(300, 0.15, 0.35, 'square');
        this.tone(200, 0.25, 0.3, 'square', 0.12);
        break;

      case 'quiz_timer_low':
        this.tone(800, 0.08, 0.3, 'square');
        break;

      case 'quiz_complete':
        this.arpeggio([523, 659, 784, 1047], 0.15, 0.4, 'sine');
        this.tone(1568, 0.5, 0.3, 'sine', 0.5);
        break;

      // ─── SHOP ───
      case 'shop_buy':
        this.tone(800, 0.08, 0.3, 'sine');
        this.tone(1000, 0.08, 0.25, 'sine', 0.06);
        this.tone(1200, 0.1, 0.3, 'sine', 0.12);
        this.noise(0.08, 0.15, 0.1);
        break;

      case 'shop_confirm':
        this.tone(600, 0.1, 0.3, 'sine');
        this.tone(800, 0.12, 0.25, 'sine', 0.08);
        break;

      // ─── UI ───
      case 'ui_click':
        this.tone(800, 0.04, 0.2, 'sine');
        break;

      case 'ui_tab':
        this.tone(600, 0.05, 0.2, 'sine');
        this.tone(800, 0.05, 0.15, 'sine', 0.03);
        break;

      case 'ui_back':
        this.tone(600, 0.05, 0.2, 'sine');
        this.tone(400, 0.06, 0.15, 'sine', 0.04);
        break;

      case 'ui_modal_open':
        this.tone(400, 0.08, 0.2, 'sine');
        this.tone(600, 0.08, 0.18, 'sine', 0.06);
        break;

      case 'ui_modal_close':
        this.tone(600, 0.06, 0.18, 'sine');
        this.tone(400, 0.08, 0.15, 'sine', 0.04);
        break;

      case 'ui_toast':
        this.tone(1000, 0.06, 0.2, 'sine');
        break;

      case 'ui_notification':
        this.tone(880, 0.08, 0.25, 'sine');
        this.tone(1100, 0.1, 0.2, 'sine', 0.08);
        break;

      // ─── PROGRESSION ───
      case 'level_up':
        this.arpeggio([392, 494, 587, 784, 988, 1175], 0.12, 0.5, 'sine');
        this.arpeggio([784, 988, 1175, 1568], 0.15, 0.4, 'triangle');
        this.noise(0.15, 0.2, 0.5);
        this.tone(1568, 0.8, 0.35, 'sine', 0.7);
        break;

      case 'xp_gain':
        this.tone(800, 0.06, 0.2, 'sine');
        this.tone(1000, 0.06, 0.15, 'sine', 0.04);
        break;

      case 'ogn_gain':
        this.tone(1000, 0.06, 0.25, 'sine');
        this.tone(1200, 0.06, 0.2, 'sine', 0.05);
        this.tone(1500, 0.08, 0.2, 'sine', 0.1);
        break;

      case 'star_earn':
        this.tone(1200, 0.1, 0.3, 'sine');
        this.tone(1500, 0.12, 0.25, 'sine', 0.08);
        this.tone(1800, 0.15, 0.3, 'sine', 0.16);
        break;

      // ─── CAMPAIGN ───
      case 'zone_unlock':
        this.arpeggio([440, 554, 659, 880, 1047], 0.1, 0.4, 'triangle');
        this.noise(0.1, 0.2, 0.3);
        break;

      case 'zone_clear':
        this.arpeggio([523, 659, 784, 1047], 0.15, 0.45, 'sine');
        this.tone(1047, 0.4, 0.3, 'sine', 0.5);
        break;

      case 'boss_select':
        this.tone(200, 0.15, 0.3, 'sine');
        this.tone(300, 0.15, 0.25, 'sine', 0.1);
        this.tone(400, 0.15, 0.3, 'sine', 0.2);
        break;
    }
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
}

// Singleton instance
export const audioManager = new AudioManager();

// Convenience function
export function playSound(name: SoundName) {
  audioManager.play(name);
}
