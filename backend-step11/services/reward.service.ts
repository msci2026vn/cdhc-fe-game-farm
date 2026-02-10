/**
 * reward.service.ts — OGN + XP management with transaction safety
 *
 * FARMVERSE Step 11 — Reward Service
 * Created: 2026-02-09
 */
import { db } from '@/db/connection';
import { playerStats } from '../schema';
import { gameActions } from '../schema';
import { eq, sql } from 'drizzle-orm';

// ============================================================
// CONSTANTS
// ============================================================
const XP_PER_LEVEL = 100; // XP needed per level (simple: level = floor(xp / 100) + 1)
const MAX_LEVEL = 50;
const MAX_OGN = 999_999; // Cap to prevent overflow

// ============================================================
// SERVICE
// ============================================================
export const rewardService = {
  /**
   * addOGN — Thêm OGN cho player (transaction + row lock)
   *
   * @param userId - UUID
   * @param amount - Số OGN cần thêm (positive) hoặc trừ (negative)
   * @param reason - Lý do (cho logging)
   * @returns { ogn: number } — OGN mới sau update
   * @throws Error nếu không đủ OGN (khi amount < 0)
   */
  async addOGN(userId: string, amount: number, reason?: string): Promise<{ ogn: number }> {
    console.log('[FARM-DEBUG] rewardService.addOGN() — START', JSON.stringify({ userId, amount, reason }));

    return await db.transaction(async (tx) => {
      // Row lock: SELECT ... FOR UPDATE
      const [player] = await tx
        .select({ ogn: playerStats.ogn })
        .from(playerStats)
        .where(eq(playerStats.userId, userId))
        .for('update');

      if (!player) {
        throw new Error(`Player not found: ${userId}`);
      }

      console.log('[FARM-DEBUG] rewardService.addOGN() — current OGN:', player.ogn, 'adding:', amount);

      const newOGN = player.ogn + amount;

      // Validate: không cho âm
      if (newOGN < 0) {
        console.log('[FARM-DEBUG] rewardService.addOGN() — INSUFFICIENT OGN');
        throw new Error(`Insufficient OGN: have ${player.ogn}, need ${Math.abs(amount)}`);
      }

      // Cap max
      const finalOGN = Math.min(newOGN, MAX_OGN);

      // Update
      await tx
        .update(playerStats)
        .set({
          ogn: finalOGN,
          updatedAt: new Date(),
        })
        .where(eq(playerStats.userId, userId));

      console.log('[FARM-DEBUG] rewardService.addOGN() — DONE, newBalance:', finalOGN);
      return { ogn: finalOGN };
    });
  },

  /**
   * addXP — Thêm XP + tự động level up
   *
   * @param userId - UUID
   * @param amount - Số XP cần thêm (always positive)
   * @returns { xp, level, leveledUp } — Trạng thái mới
   */
  async addXP(userId: string, amount: number): Promise<{ xp: number; level: number; leveledUp: boolean }> {
    if (amount <= 0) return { xp: 0, level: 1, leveledUp: false };

    return await db.transaction(async (tx) => {
      // Row lock
      const [player] = await tx
        .select({ xp: playerStats.xp, level: playerStats.level })
        .from(playerStats)
        .where(eq(playerStats.userId, userId))
        .for('update');

      if (!player) {
        throw new Error(`Player not found: ${userId}`);
      }

      const newXP = player.xp + amount;
      const newLevel = Math.min(Math.floor(newXP / XP_PER_LEVEL) + 1, MAX_LEVEL);
      const leveledUp = newLevel > player.level;

      // Update
      await tx
        .update(playerStats)
        .set({
          xp: newXP,
          level: newLevel,
          updatedAt: new Date(),
        })
        .where(eq(playerStats.userId, userId));

      // Log level up
      if (leveledUp) {
        await tx.insert(gameActions).values({
          userId,
          type: 'level_up',
          data: { fromLevel: player.level, toLevel: newLevel, xp: newXP },
        });
      }

      return { xp: newXP, level: newLevel, leveledUp };
    });
  },
};
