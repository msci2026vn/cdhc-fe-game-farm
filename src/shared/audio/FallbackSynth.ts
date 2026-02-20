/**
 * FallbackSynth — Procedural oscillator sounds (fallback when MP3 files fail to load)
 *
 * Extracted from the original AudioManager. Provides identical synthesized sounds
 * using Web Audio oscillators. Used as a backup when audio files are unavailable.
 */

import type { SoundName } from './SoundRegistry';

export class FallbackSynth {
  /** Play a single tone */
  static tone(
    ctx: AudioContext,
    dest: AudioNode,
    freq: number,
    duration: number,
    vol = 1,
    type: OscillatorType = 'sine',
    delay = 0,
  ) {
    const gain = ctx.createGain();
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;

    const now = ctx.currentTime + delay;
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(dest);
    osc.start(now);
    osc.stop(now + duration + 0.05);
  }

  /** Play noise burst (percussion-like) */
  static noise(
    ctx: AudioContext,
    dest: AudioNode,
    duration: number,
    vol = 0.3,
    delay = 0,
  ) {
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.5;

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const gain = ctx.createGain();
    const now = ctx.currentTime + delay;
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1000;
    filter.Q.value = 1;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    source.start(now);
    source.stop(now + duration + 0.05);
  }

  /** Play a quick arpeggio */
  static arpeggio(
    ctx: AudioContext,
    dest: AudioNode,
    freqs: number[],
    noteLen: number,
    vol = 0.5,
    type: OscillatorType = 'sine',
  ) {
    freqs.forEach((f, i) =>
      FallbackSynth.tone(ctx, dest, f, noteLen, vol, type, i * noteLen * 0.7),
    );
  }

  /** Play a synthesized SFX by name */
  static playSfx(ctx: AudioContext, dest: AudioNode, name: SoundName) {
    const t = FallbackSynth.tone.bind(null, ctx, dest);
    const n = FallbackSynth.noise.bind(null, ctx, dest);
    const a = FallbackSynth.arpeggio.bind(null, ctx, dest);

    switch (name) {
      // ─── BATTLE: Match-3 ───
      case 'gem_select':
        t(880, 0.08, 0.3, 'sine');
        break;
      case 'gem_swap':
        t(440, 0.08, 0.25, 'sine');
        t(660, 0.08, 0.25, 'sine', 0.06);
        break;
      case 'gem_match':
        t(523, 0.15, 0.4, 'sine');
        t(659, 0.15, 0.35, 'sine', 0.08);
        t(784, 0.2, 0.3, 'sine', 0.16);
        break;
      case 'gem_no_match':
        t(300, 0.15, 0.25, 'square');
        t(250, 0.2, 0.2, 'square', 0.1);
        break;

      // ─── COMBOS ───
      case 'combo_2':
        a([523, 659, 784], 0.1, 0.35);
        break;
      case 'combo_3':
        a([587, 740, 880, 1047], 0.09, 0.4);
        break;
      case 'combo_4':
        a([659, 831, 988, 1175, 1319], 0.08, 0.45, 'triangle');
        break;
      case 'combo_5':
        a([784, 988, 1175, 1397, 1568], 0.07, 0.5, 'triangle');
        n(0.1, 0.15, 0.2);
        break;
      case 'combo_6':
        a([880, 1047, 1319, 1568, 1760, 2093], 0.06, 0.5, 'triangle');
        n(0.15, 0.2, 0.25);
        break;
      case 'combo_godlike':
        a([523, 659, 784, 1047, 1319, 1568, 2093], 0.06, 0.55, 'sawtooth');
        n(0.2, 0.25, 0.3);
        t(2093, 0.5, 0.3, 'sine', 0.35);
        break;

      // ─── BATTLE: Combat ───
      case 'damage_dealt':
        n(0.08, 0.3);
        t(200, 0.1, 0.35, 'square');
        break;
      case 'damage_crit':
        n(0.12, 0.4);
        t(150, 0.08, 0.4, 'square');
        t(400, 0.15, 0.35, 'sawtooth', 0.05);
        break;
      case 'boss_attack':
        t(150, 0.2, 0.45, 'sawtooth');
        t(100, 0.3, 0.35, 'square', 0.1);
        n(0.15, 0.3, 0.05);
        break;
      case 'boss_skill':
        t(200, 0.1, 0.4, 'sawtooth');
        t(100, 0.15, 0.45, 'square', 0.08);
        t(80, 0.2, 0.4, 'sawtooth', 0.15);
        n(0.2, 0.35, 0.1);
        break;
      case 'dodge_success':
        t(800, 0.08, 0.35, 'sine');
        t(1200, 0.1, 0.3, 'sine', 0.06);
        t(1600, 0.12, 0.25, 'sine', 0.12);
        break;
      case 'shield_gain':
        t(400, 0.15, 0.3, 'triangle');
        t(600, 0.15, 0.25, 'triangle', 0.08);
        break;
      case 'heal':
        a([392, 494, 587, 784], 0.12, 0.3, 'sine');
        break;
      case 'ult_charge':
        t(220, 0.05, 0.2, 'triangle');
        break;
      case 'ult_fire':
        n(0.3, 0.4);
        a([262, 392, 523, 784, 1047, 1319], 0.08, 0.5, 'sawtooth');
        t(100, 0.5, 0.35, 'square', 0.2);
        break;
      case 'boss_enrage':
        t(100, 0.4, 0.4, 'sawtooth');
        t(80, 0.5, 0.35, 'square', 0.2);
        n(0.3, 0.3, 0.1);
        break;

      // ─── BATTLE: Result ───
      case 'victory':
        a([523, 659, 784, 1047], 0.2, 0.5, 'sine');
        a([784, 988, 1175, 1568], 0.2, 0.45, 'triangle');
        t(1568, 0.6, 0.4, 'sine', 0.8);
        break;
      case 'defeat':
        t(400, 0.3, 0.4, 'sine');
        t(350, 0.3, 0.35, 'sine', 0.3);
        t(300, 0.3, 0.3, 'sine', 0.6);
        t(200, 0.6, 0.35, 'sine', 0.9);
        break;

      // ─── FARMING ───
      case 'plant_seed':
        t(330, 0.1, 0.3, 'sine');
        t(440, 0.12, 0.25, 'sine', 0.08);
        n(0.05, 0.15, 0.05);
        break;
      case 'water_plant':
        t(600, 0.06, 0.25, 'sine');
        t(800, 0.06, 0.2, 'sine', 0.05);
        t(700, 0.06, 0.2, 'sine', 0.1);
        t(900, 0.06, 0.18, 'sine', 0.15);
        t(650, 0.08, 0.2, 'sine', 0.2);
        break;
      case 'harvest':
        a([440, 554, 659, 880], 0.12, 0.45, 'sine');
        t(880, 0.3, 0.35, 'triangle', 0.4);
        n(0.1, 0.15, 0.3);
        break;
      case 'bug_catch':
        t(800, 0.05, 0.3, 'square');
        t(1200, 0.08, 0.25, 'sine', 0.04);
        break;
      case 'plant_die':
        t(300, 0.2, 0.3, 'sine');
        t(250, 0.25, 0.25, 'sine', 0.15);
        t(200, 0.3, 0.2, 'sine', 0.3);
        break;

      // ─── PRAYER ───
      case 'prayer_submit':
        t(523, 0.4, 0.35, 'sine');
        t(659, 0.4, 0.3, 'sine', 0.15);
        t(784, 0.5, 0.35, 'sine', 0.3);
        t(1047, 0.6, 0.25, 'sine', 0.45);
        break;
      case 'prayer_reward':
        a([523, 659, 784, 1047, 1319], 0.15, 0.4, 'sine');
        break;
      case 'prayer_sparkle':
        t(1500 + Math.random() * 500, 0.1, 0.15, 'sine');
        break;

      // ─── QUIZ ───
      case 'quiz_start':
        a([392, 494, 587, 784], 0.1, 0.35, 'triangle');
        break;
      case 'quiz_select':
        t(660, 0.08, 0.25, 'sine');
        break;
      case 'quiz_correct':
        a([523, 659, 784], 0.12, 0.45, 'sine');
        t(1047, 0.3, 0.3, 'sine', 0.3);
        break;
      case 'quiz_wrong':
        t(300, 0.15, 0.35, 'square');
        t(200, 0.25, 0.3, 'square', 0.12);
        break;
      case 'quiz_timer_low':
        t(800, 0.08, 0.3, 'square');
        break;
      case 'quiz_complete':
        a([523, 659, 784, 1047], 0.15, 0.4, 'sine');
        t(1568, 0.5, 0.3, 'sine', 0.5);
        break;

      // ─── SHOP ───
      case 'shop_buy':
        t(800, 0.08, 0.3, 'sine');
        t(1000, 0.08, 0.25, 'sine', 0.06);
        t(1200, 0.1, 0.3, 'sine', 0.12);
        n(0.08, 0.15, 0.1);
        break;
      case 'shop_confirm':
        t(600, 0.1, 0.3, 'sine');
        t(800, 0.12, 0.25, 'sine', 0.08);
        break;

      // ─── UI ───
      case 'ui_click':
        t(800, 0.04, 0.2, 'sine');
        break;
      case 'ui_tab':
        t(600, 0.05, 0.2, 'sine');
        t(800, 0.05, 0.15, 'sine', 0.03);
        break;
      case 'ui_back':
        t(600, 0.05, 0.2, 'sine');
        t(400, 0.06, 0.15, 'sine', 0.04);
        break;
      case 'ui_modal_open':
        t(400, 0.08, 0.2, 'sine');
        t(600, 0.08, 0.18, 'sine', 0.06);
        break;
      case 'ui_modal_close':
        t(600, 0.06, 0.18, 'sine');
        t(400, 0.08, 0.15, 'sine', 0.04);
        break;
      case 'ui_toast':
        t(1000, 0.06, 0.2, 'sine');
        break;
      case 'ui_notification':
        t(880, 0.08, 0.25, 'sine');
        t(1100, 0.1, 0.2, 'sine', 0.08);
        break;

      // ─── PROGRESSION ───
      case 'level_up':
        a([392, 494, 587, 784, 988, 1175], 0.12, 0.5, 'sine');
        a([784, 988, 1175, 1568], 0.15, 0.4, 'triangle');
        n(0.15, 0.2, 0.5);
        t(1568, 0.8, 0.35, 'sine', 0.7);
        break;
      case 'xp_gain':
        t(800, 0.06, 0.2, 'sine');
        t(1000, 0.06, 0.15, 'sine', 0.04);
        break;
      case 'ogn_gain':
        t(1000, 0.06, 0.25, 'sine');
        t(1200, 0.06, 0.2, 'sine', 0.05);
        t(1500, 0.08, 0.2, 'sine', 0.1);
        break;
      case 'star_earn':
        t(1200, 0.1, 0.3, 'sine');
        t(1500, 0.12, 0.25, 'sine', 0.08);
        t(1800, 0.15, 0.3, 'sine', 0.16);
        break;

      // ─── CAMPAIGN ───
      case 'zone_unlock':
        a([440, 554, 659, 880, 1047], 0.1, 0.4, 'triangle');
        n(0.1, 0.2, 0.3);
        break;
      case 'zone_clear':
        a([523, 659, 784, 1047], 0.15, 0.45, 'sine');
        t(1047, 0.4, 0.3, 'sine', 0.5);
        break;
      case 'boss_select':
        t(200, 0.15, 0.3, 'sine');
        t(300, 0.15, 0.25, 'sine', 0.1);
        t(400, 0.15, 0.3, 'sine', 0.2);
        break;
    }
  }

  // ═══════════════════════════════════════════════════════════
  // BGM — Oscillator-based background music (fallback)
  // ═══════════════════════════════════════════════════════════

  static readonly BGM_PRESETS: Record<string, {
    notes: number[];
    types: OscillatorType[];
    volumes: number[];
    lfoRate: number;
    lfoDepth: number;
    masterVol: number;
  }> = {
    battle: {
      notes: [73.42, 146.83, 174.61, 220.00],
      types: ['sine', 'triangle', 'sine', 'sine'],
      volumes: [0.12, 0.08, 0.06, 0.05],
      lfoRate: 0.15,
      lfoDepth: 0.4,
      masterVol: 0.25,
    },
    campaign: {
      notes: [55.00, 110.00, 130.81, 164.81],
      types: ['triangle', 'sine', 'sine', 'triangle'],
      volumes: [0.10, 0.07, 0.06, 0.05],
      lfoRate: 0.12,
      lfoDepth: 0.35,
      masterVol: 0.22,
    },
    boss: {
      notes: [82.41, 123.47, 164.81, 196.00],
      types: ['sawtooth', 'triangle', 'sine', 'sine'],
      volumes: [0.08, 0.06, 0.05, 0.04],
      lfoRate: 0.25,
      lfoDepth: 0.5,
      masterVol: 0.20,
    },
    farm: {
      // Pastoral C major: C3, E3, G3, C4 — warm and peaceful
      notes: [130.81, 164.81, 196.00, 261.63],
      types: ['sine', 'triangle', 'sine', 'sine'],
      volumes: [0.08, 0.06, 0.05, 0.04],
      lfoRate: 0.08,
      lfoDepth: 0.25,
      masterVol: 0.15,
    },
    shop: {
      // Cheerful F major: F3, A3, C4, F4
      notes: [174.61, 220.00, 261.63, 349.23],
      types: ['triangle', 'sine', 'sine', 'triangle'],
      volumes: [0.07, 0.05, 0.04, 0.03],
      lfoRate: 0.1,
      lfoDepth: 0.3,
      masterVol: 0.14,
    },
    quiz: {
      // Thinking Bb major: Bb2, D3, F3, Bb3
      notes: [116.54, 146.83, 174.61, 233.08],
      types: ['triangle', 'sine', 'triangle', 'sine'],
      volumes: [0.07, 0.06, 0.05, 0.04],
      lfoRate: 0.18,
      lfoDepth: 0.3,
      masterVol: 0.16,
    },
    prayer: {
      // Sacred Ab major: Ab2, C3, Eb3, Ab3 — meditative
      notes: [103.83, 130.81, 155.56, 207.65],
      types: ['sine', 'sine', 'triangle', 'sine'],
      volumes: [0.06, 0.05, 0.04, 0.03],
      lfoRate: 0.06,
      lfoDepth: 0.2,
      masterVol: 0.12,
    },
    campaign_map: {
      // Adventure G major: G2, B2, D3, G3
      notes: [98.00, 123.47, 146.83, 196.00],
      types: ['triangle', 'sine', 'sine', 'triangle'],
      volumes: [0.08, 0.06, 0.05, 0.04],
      lfoRate: 0.1,
      lfoDepth: 0.3,
      masterVol: 0.18,
    },
  };

  /** Start oscillator-based BGM. Returns cleanup function. */
  static startBgm(
    ctx: AudioContext,
    dest: AudioNode,
    preset: string,
    volumeMultiplier: number,
  ): { stop: () => void } {
    const config = FallbackSynth.BGM_PRESETS[preset];
    if (!config) return { stop: () => {} };

    const masterGain = ctx.createGain();
    masterGain.gain.value = config.masterVol * volumeMultiplier;
    masterGain.connect(dest);

    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.value = config.lfoRate;
    lfoGain.gain.value = config.lfoDepth * config.masterVol * volumeMultiplier;
    lfo.connect(lfoGain);
    lfoGain.connect(masterGain.gain);
    lfo.start();

    const oscs: OscillatorNode[] = [];
    const gains: GainNode[] = [];

    config.notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = config.types[i] || 'sine';
      osc.frequency.value = freq;
      osc.detune.value = (i - 1.5) * 3;
      gain.gain.value = config.volumes[i] * volumeMultiplier;
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start();
      oscs.push(osc);
      gains.push(gain);
    });

    return {
      stop: () => {
        const now = ctx.currentTime;
        masterGain.gain.setValueAtTime(masterGain.gain.value, now);
        masterGain.gain.linearRampToValueAtTime(0, now + 0.5);
        setTimeout(() => {
          oscs.forEach(o => { try { o.stop(); o.disconnect(); } catch {} });
          gains.forEach(g => { try { g.disconnect(); } catch {} });
          try { lfo.stop(); lfo.disconnect(); } catch {}
          try { lfoGain.disconnect(); } catch {}
          try { masterGain.disconnect(); } catch {}
        }, 600);
      },
    };
  }
}
