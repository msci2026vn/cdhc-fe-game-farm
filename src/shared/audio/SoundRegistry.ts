/**
 * SoundRegistry — Maps every sound name to its file path + metadata
 *
 * Categories: bgm, sfx, ui, ambient
 * Each entry has a URL (relative to public/), category, and optional volume override.
 */

export type AudioCategory = 'bgm' | 'sfx' | 'ui' | 'ambient';

export type SoundName =
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

interface SoundEntry {
  url: string;
  category: AudioCategory;
  /** Volume override (0-1). Default: 1.0 */
  volume?: number;
}

export const SOUND_REGISTRY: Record<SoundName, SoundEntry> = {
  // ─── MATCH 3 ───
  gem_select: { url: '/audio/sfx/match3/gem-select.mp3', category: 'sfx', volume: 0.3 },
  gem_swap: { url: '/audio/sfx/match3/gem-swap.mp3', category: 'sfx', volume: 0.3 },
  gem_match: { url: '/audio/sfx/match3/gem-match.mp3', category: 'sfx', volume: 0.4 },
  gem_no_match: { url: '/audio/sfx/match3/gem-no-match.mp3', category: 'sfx', volume: 0.25 },
  combo_2: { url: '/audio/sfx/match3/combo-2.mp3', category: 'sfx', volume: 0.35 },
  combo_3: { url: '/audio/sfx/match3/combo-3.mp3', category: 'sfx', volume: 0.4 },
  combo_4: { url: '/audio/sfx/match3/combo-4.mp3', category: 'sfx', volume: 0.45 },
  combo_5: { url: '/audio/sfx/match3/combo-5.mp3', category: 'sfx', volume: 0.5 },
  combo_6: { url: '/audio/sfx/match3/combo-6.mp3', category: 'sfx', volume: 0.5 },
  combo_godlike: { url: '/audio/sfx/match3/combo-godlike.mp3', category: 'sfx', volume: 0.55 },

  // ─── COMBAT ───
  damage_dealt: { url: '/audio/sfx/combat/damage-dealt.mp3', category: 'sfx', volume: 0.35 },
  damage_crit: { url: '/audio/sfx/combat/damage-crit.mp3', category: 'sfx', volume: 0.4 },
  boss_attack: { url: '/audio/sfx/combat/boss-attack.mp3', category: 'sfx', volume: 0.45 },
  boss_skill: { url: '/audio/sfx/combat/boss-skill.mp3', category: 'sfx', volume: 0.45 },
  dodge_success: { url: '/audio/sfx/combat/dodge.mp3', category: 'sfx', volume: 0.35 },
  shield_gain: { url: '/audio/sfx/combat/shield.mp3', category: 'sfx', volume: 0.3 },
  heal: { url: '/audio/sfx/combat/heal.mp3', category: 'sfx', volume: 0.3 },
  ult_charge: { url: '/audio/sfx/combat/ult-charge.mp3', category: 'sfx', volume: 0.2 },
  ult_fire: { url: '/audio/sfx/combat/ult-fire.mp3', category: 'sfx', volume: 0.5 },
  boss_enrage: { url: '/audio/sfx/combat/boss-enrage.mp3', category: 'sfx', volume: 0.4 },
  victory: { url: '/audio/sfx/combat/victory.mp3', category: 'sfx', volume: 0.5 },
  defeat: { url: '/audio/sfx/combat/defeat.mp3', category: 'sfx', volume: 0.4 },

  // ─── FARMING ───
  plant_seed: { url: '/audio/sfx/farming/plant-seed.mp3', category: 'sfx', volume: 0.3 },
  water_plant: { url: '/audio/sfx/farming/water-plant.mp3', category: 'sfx', volume: 0.25 },
  harvest: { url: '/audio/sfx/farming/harvest.mp3', category: 'sfx', volume: 0.45 },
  bug_catch: { url: '/audio/sfx/farming/bug-catch.mp3', category: 'sfx', volume: 0.3 },
  plant_die: { url: '/audio/sfx/farming/plant-die.mp3', category: 'sfx', volume: 0.3 },

  // ─── PRAYER ───
  prayer_submit: { url: '/audio/sfx/prayer/prayer-submit.mp3', category: 'sfx', volume: 0.35 },
  prayer_reward: { url: '/audio/sfx/prayer/prayer-reward.mp3', category: 'sfx', volume: 0.4 },
  prayer_sparkle: { url: '/audio/sfx/prayer/prayer-sparkle.mp3', category: 'sfx', volume: 0.15 },

  // ─── QUIZ ───
  quiz_start: { url: '/audio/sfx/quiz/start.mp3', category: 'sfx', volume: 0.35 },
  quiz_select: { url: '/audio/sfx/quiz/select.mp3', category: 'sfx', volume: 0.25 },
  quiz_correct: { url: '/audio/sfx/quiz/correct.mp3', category: 'sfx', volume: 0.45 },
  quiz_wrong: { url: '/audio/sfx/quiz/wrong.mp3', category: 'sfx', volume: 0.35 },
  quiz_timer_low: { url: '/audio/sfx/quiz/timer-low.mp3', category: 'sfx', volume: 0.3 },
  quiz_complete: { url: '/audio/sfx/quiz/complete.mp3', category: 'sfx', volume: 0.4 },

  // ─── SHOP ───
  shop_buy: { url: '/audio/sfx/shop/buy.mp3', category: 'sfx', volume: 0.3 },
  shop_confirm: { url: '/audio/sfx/shop/confirm.mp3', category: 'sfx', volume: 0.3 },

  // ─── UI ───
  ui_click: { url: '/audio/sfx/ui/click.mp3', category: 'ui', volume: 0.2 },
  ui_tab: { url: '/audio/sfx/ui/tab.mp3', category: 'ui', volume: 0.2 },
  ui_back: { url: '/audio/sfx/ui/back.mp3', category: 'ui', volume: 0.2 },
  ui_modal_open: { url: '/audio/sfx/ui/modal-open.mp3', category: 'ui', volume: 0.2 },
  ui_modal_close: { url: '/audio/sfx/ui/modal-close.mp3', category: 'ui', volume: 0.18 },
  ui_toast: { url: '/audio/sfx/ui/toast.mp3', category: 'ui', volume: 0.2 },
  ui_notification: { url: '/audio/sfx/ui/notification.mp3', category: 'ui', volume: 0.25 },

  // ─── PROGRESSION ───
  level_up: { url: '/audio/sfx/progression/level-up.mp3', category: 'sfx', volume: 0.5 },
  xp_gain: { url: '/audio/sfx/progression/xp-gain.mp3', category: 'sfx', volume: 0.2 },
  ogn_gain: { url: '/audio/sfx/progression/ogn-gain.mp3', category: 'sfx', volume: 0.25 },
  star_earn: { url: '/audio/sfx/progression/star-earn.mp3', category: 'sfx', volume: 0.3 },

  // ─── CAMPAIGN ───
  zone_unlock: { url: '/audio/sfx/campaign/zone-unlock.mp3', category: 'sfx', volume: 0.4 },
  zone_clear: { url: '/audio/sfx/campaign/zone-clear.mp3', category: 'sfx', volume: 0.45 },
  boss_select: { url: '/audio/sfx/campaign/boss-select.mp3', category: 'sfx', volume: 0.3 },
};

export type BgmPreset = 'battle' | 'campaign' | 'boss' | 'farm' | 'shop' | 'quiz' | 'prayer' | 'campaign_map' | 'market';

export const BGM_REGISTRY: Record<string, { url: string; loop: boolean; volume: number }> = {
  battle: { url: '/audio/sfx/nhac-nen/Crimson_Onslaught.mp3', loop: true, volume: 0.25 },
  campaign: { url: '/audio/sfx/nhac-nen/Crimson_Onslaught.mp3', loop: true, volume: 0.22 },
  boss: { url: '/audio/sfx/nhac-nen/Crimson_Onslaught.mp3', loop: true, volume: 0.20 },
  farm: { url: '/audio/sfx/nhac-nen/Verdant_Harvest.mp3', loop: true, volume: 0.15 },
  shop: { url: '/audio/bgm/shop.mp3', loop: true, volume: 0.14 },
  quiz: { url: '/audio/bgm/quiz.mp3', loop: true, volume: 0.16 },
  prayer: { url: '/audio/sfx/nhac-nen/Celestial_Sanctuary.mp3', loop: true, volume: 0.12 },
  campaign_map: { url: '/audio/sfx/nhac-nen/Titan_s_Ascent.mp3', loop: true, volume: 0.18 },
  market: { url: '/audio/sfx/nhac-nen/Ascent_of_the_Dawn.mp3', loop: true, volume: 0.20 },
};

/** Sounds to preload per scene — loaded in parallel at mount time */
export const SCENE_PRELOADS: Record<string, SoundName[]> = {
  ui: [
    'ui_click', 'ui_tab', 'ui_back', 'ui_modal_open', 'ui_modal_close',
    'ui_toast', 'ui_notification',
  ],
  battle: [
    'gem_select', 'gem_swap', 'gem_match', 'gem_no_match',
    'combo_2', 'combo_3', 'combo_4', 'combo_5', 'combo_6', 'combo_godlike',
    'damage_dealt', 'damage_crit', 'boss_attack', 'boss_skill',
    'dodge_success', 'shield_gain', 'heal', 'ult_fire',
    'boss_enrage', 'victory', 'defeat',
  ],
  farming: [
    'plant_seed', 'water_plant', 'harvest', 'bug_catch', 'plant_die',
    'shop_buy', 'shop_confirm',
  ],
  quiz: [
    'quiz_start', 'quiz_select', 'quiz_correct', 'quiz_wrong',
    'quiz_timer_low', 'quiz_complete',
  ],
  prayer: [
    'prayer_submit', 'prayer_reward', 'prayer_sparkle',
  ],
  campaign: [
    'zone_unlock', 'zone_clear', 'boss_select',
  ],
  progression: [
    'level_up', 'xp_gain', 'ogn_gain', 'star_earn',
  ],
};
