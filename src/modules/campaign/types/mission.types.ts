// ═══════════════════════════════════════════════════════════════
// Mission types — daily/weekly quests
// ═══════════════════════════════════════════════════════════════

export type MissionType = 'daily' | 'weekly';

export interface PlayerMission {
  missionId: number;
  missionKey: string;
  name: string;
  description: string;
  type: MissionType;
  targetValue: number;
  currentProgress: number;
  rewardOgn: number;
  rewardXp: number;
  rewardFragments?: {
    fragmentKey: string;
    name: string;
    tier: string;
    amount: number;
  };
  isCompleted: boolean;
  isClaimed: boolean;
}

export const MISSION_ICONS: Record<string, string> = {
  harvest: '\ud83c\udf3e',
  boss_win: '\u2694\ufe0f',
  dodge: '\ud83c\udfc3',
  combo_5: '\ud83d\udd25',
  star_3: '\u2b50',
  boss_campaign: '\ud83d\udde1\ufe0f',
  recipe_craft: '\ud83e\uddea',
  fragment_collect: '\ud83e\udde9',
  plant_seed: '\ud83c\udf31',
  quiz_correct: '\ud83d\udcdd',
  sell_item: '\ud83d\udcb0',
  login: '\ud83d\udc4b',
};

export function getMissionIcon(key: string): string {
  // Try exact match first, then prefix match
  if (MISSION_ICONS[key]) return MISSION_ICONS[key];
  for (const [prefix, icon] of Object.entries(MISSION_ICONS)) {
    if (key.startsWith(prefix)) return icon;
  }
  return '\ud83c\udfaf'; // default target icon
}
