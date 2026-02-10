/**
 * farm.service.ts — Core farming mechanics
 *
 * FARMVERSE Step 11 — Farm Service
 * Created: 2026-02-09
 *
 * 3 core functions:
 * - plantSeed: Trồng cây vào slot → trừ OGN → insert farm_plots
 * - waterPlot: Tưới nước → check cooldown Redis → tăng happiness → add XP
 * - harvestPlot: Thu hoạch → check growth ≥ 100% → add OGN + XP → delete plot
 */
import { db } from '@/db/connection';
import { redis } from '@/db/redis';
import { farmPlots, plantTypes, playerStats, gameActions } from '../schema';
import { eq, and, sql } from 'drizzle-orm';
import { rewardService } from './reward.service';

// ============================================================
// CONSTANTS
// ============================================================
const MAX_SLOTS = 6; // Số ô đất tối đa (mở rộng sau)
const WATER_COOLDOWN_SEC = 3600; // 1 hour cooldown (prod)
// const WATER_COOLDOWN_SEC = 15; // 15s for demo/testing
const WATER_HAPPINESS_BOOST = 10; // +10 happiness mỗi lần tưới
const WATER_XP_REWARD = 2; // +2 XP mỗi lần tưới
const MAX_HAPPINESS = 100;

// ============================================================
// HELPERS
// ============================================================

/**
 * calculateGrowth — Tính % trưởng thành của cây
 * @param plantedAt - Unix timestamp ms khi trồng
 * @param growthDurationMs - Thời gian grow đầy đủ (ms)
 * @param now - Current time (ms), default Date.now()
 * @returns number 0-100 (percent)
 */
function calculateGrowth(plantedAt: number, growthDurationMs: number, now?: number): number {
  const currentTime = now ?? Date.now();
  const elapsed = currentTime - plantedAt;
  const percent = Math.floor((elapsed / growthDurationMs) * 100);
  return Math.min(Math.max(percent, 0), 100);
}

/**
 * Redis key for water cooldown
 */
function waterCooldownKey(userId: string, plotId: string): string {
  return `game:water:${userId}:${plotId}`;
}

// ============================================================
// SERVICE
// ============================================================
export const farmService = {
  /**
   * getPlots — Lấy tất cả plots của user (dùng cho step 12)
   */
  async getPlots(userId: string) {
    const plots = await db
      .select({
        id: farmPlots.id,
        slotIndex: farmPlots.slotIndex,
        plantTypeId: farmPlots.plantTypeId,
        plantedAt: farmPlots.plantedAt,
        happiness: farmPlots.happiness,
        lastWateredAt: farmPlots.lastWateredAt,
        isDead: farmPlots.isDead,
      })
      .from(farmPlots)
      .where(and(
        eq(farmPlots.userId, userId),
        eq(farmPlots.isDead, false),
      ))
      .orderBy(farmPlots.slotIndex);

    // Enrich with plant type info + growth %
    const allPlantTypes = await db.select().from(plantTypes);
    const plantTypeMap = new Map(allPlantTypes.map(pt => [pt.id, pt]));

    return plots.map(plot => {
      const pt = plantTypeMap.get(plot.plantTypeId);
      const growth = pt
        ? calculateGrowth(plot.plantedAt, pt.growthDurationMs)
        : 0;

      return {
        ...plot,
        plantName: pt?.name ?? 'Unknown',
        plantEmoji: pt?.emoji ?? '🌱',
        growthPercent: growth,
        isReady: growth >= 100,
      };
    });
  },

  /**
   * plantSeed — Trồng cây vào slot
   *
   * Flow:
   * 1. Validate plantTypeId exists
   * 2. Check slot chưa có cây
   * 3. Check OGN đủ
   * 4. Trừ OGN (via rewardService)
   * 5. Insert farm_plots
   * 6. Log game_actions
   *
   * @returns FarmPlot mới tạo
   * @throws Error nếu invalid input / không đủ OGN / slot đã occupied
   */
  async plantSeed(userId: string, slotIndex: number, plantTypeId: string) {
    console.log('[FARM-DEBUG] farmService.plantSeed() — START', JSON.stringify({ userId, slotIndex, plantTypeId }));

    // 1. Validate slot range
    if (slotIndex < 0 || slotIndex >= MAX_SLOTS) {
      console.log('[FARM-DEBUG] farmService.plantSeed() — slot validation FAILED');
      throw new Error(`Invalid slot index: ${slotIndex}. Must be 0-${MAX_SLOTS - 1}`);
    }
    console.log('[FARM-DEBUG] farmService.plantSeed() — slot validation passed');

    // 2. Validate plant type exists
    const [plantType] = await db
      .select()
      .from(plantTypes)
      .where(eq(plantTypes.id, plantTypeId));

    if (!plantType) {
      console.log('[FARM-DEBUG] farmService.plantSeed() — plantType NOT found:', plantTypeId);
      throw new Error(`Invalid plant type: ${plantTypeId}`);
    }
    console.log('[FARM-DEBUG] farmService.plantSeed() — plantType found:', plantTypeId, 'price:', plantType.shopPrice);

    // 3. Check slot is empty (no active plant)
    const [existingPlot] = await db
      .select({ id: farmPlots.id })
      .from(farmPlots)
      .where(and(
        eq(farmPlots.userId, userId),
        eq(farmPlots.slotIndex, slotIndex),
        eq(farmPlots.isDead, false),
      ));

    if (existingPlot) {
      console.log('[FARM-DEBUG] farmService.plantSeed() — slot already occupied');
      throw new Error(`Slot ${slotIndex} already has a plant`);
    }
    console.log('[FARM-DEBUG] farmService.plantSeed() — slot is empty');

    // 4. Check & deduct OGN
    console.log('[FARM-DEBUG] farmService.plantSeed() — deducting OGN:', plantType.shopPrice);
    const { ogn: newOGN } = await rewardService.addOGN(
      userId,
      -plantType.shopPrice,
      `plant_${plantTypeId}_slot_${slotIndex}`
    );
    console.log('[FARM-DEBUG] farmService.plantSeed() — OGN deducted, remaining:', newOGN);

    // 5. Insert farm_plots
    const now = Date.now();
    const [newPlot] = await db
      .insert(farmPlots)
      .values({
        userId,
        slotIndex,
        plantTypeId,
        plantedAt: now,
        happiness: MAX_HAPPINESS,
        lastWateredAt: now,
      })
      .returning();
    console.log('[FARM-DEBUG] farmService.plantSeed() — plot inserted, id:', newPlot.id);

    // 6. Log action
    await db.insert(gameActions).values({
      userId,
      type: 'plant',
      data: {
        plotId: newPlot.id,
        slotIndex,
        plantTypeId,
        shopPrice: plantType.shopPrice,
        ognAfter: newOGN,
      },
    });
    console.log('[FARM-DEBUG] farmService.plantSeed() — game_action logged');

    console.log('[FARM-DEBUG] farmService.plantSeed() — COMPLETE');
    return {
      plot: newPlot,
      ognRemaining: newOGN,
      plantType: {
        name: plantType.name,
        emoji: plantType.emoji,
        growthDurationMs: plantType.growthDurationMs,
      },
    };
  },

  /**
   * waterPlot — Tưới nước cho cây
   *
   * Flow:
   * 1. Check plot exists & belongs to user & not dead
   * 2. Check Redis cooldown (1h between waters)
   * 3. Update happiness (+10, cap 100)
   * 4. Set Redis cooldown
   * 5. Add XP reward
   * 6. Log action
   *
   * @returns { happiness, wateredAt, xpGained, cooldownSeconds }
   * @throws Error nếu plot not found / cooldown active
   */
  async waterPlot(userId: string, plotId: string) {
    // 1. Check plot exists
    const [plot] = await db
      .select()
      .from(farmPlots)
      .where(and(
        eq(farmPlots.id, plotId),
        eq(farmPlots.userId, userId),
      ));

    if (!plot) {
      throw new Error(`Plot not found: ${plotId}`);
    }

    if (plot.isDead) {
      throw new Error(`Cannot water a dead plant`);
    }

    // 2. Check Redis cooldown
    const cooldownKey = waterCooldownKey(userId, plotId);
    const cooldownActive = await redis.get(cooldownKey);

    if (cooldownActive) {
      const ttl = await redis.ttl(cooldownKey);
      throw new Error(`Water cooldown active. Try again in ${ttl} seconds`);
    }

    // 3. Update happiness
    const newHappiness = Math.min(plot.happiness + WATER_HAPPINESS_BOOST, MAX_HAPPINESS);
    const now = Date.now();

    await db
      .update(farmPlots)
      .set({
        happiness: newHappiness,
        lastWateredAt: now,
        updatedAt: new Date(),
      })
      .where(eq(farmPlots.id, plotId));

    // 4. Set Redis cooldown
    await redis.setex(cooldownKey, WATER_COOLDOWN_SEC, '1');

    // 5. Add XP
    const xpResult = await rewardService.addXP(userId, WATER_XP_REWARD);

    // 6. Log action
    await db.insert(gameActions).values({
      userId,
      type: 'water',
      data: {
        plotId,
        slotIndex: plot.slotIndex,
        happinessBefore: plot.happiness,
        happinessAfter: newHappiness,
        xpGained: WATER_XP_REWARD,
      },
    });

    return {
      happiness: newHappiness,
      wateredAt: now,
      xpGained: WATER_XP_REWARD,
      xpTotal: xpResult.xp,
      level: xpResult.level,
      leveledUp: xpResult.leveledUp,
      cooldownSeconds: WATER_COOLDOWN_SEC,
    };
  },

  /**
   * harvestPlot — Thu hoạch cây
   *
   * Flow:
   * 1. Check plot exists & belongs to user & not dead
   * 2. Get plant type info
   * 3. Calculate growth → must be ≥ 100%
   * 4. Add OGN reward
   * 5. Add XP reward
   * 6. Delete plot (free slot)
   * 7. Update totalHarvests
   * 8. Clean Redis cooldown key
   * 9. Log action
   *
   * @returns { ognEarned, xpEarned, newOGN, newLevel, leveledUp }
   * @throws Error nếu not ready / not found
   */
  async harvestPlot(userId: string, plotId: string) {
    console.log('[FARM-DEBUG] farmService.harvestPlot() — START', JSON.stringify({ userId, plotId }));

    // 1. Check plot
    console.log('[FARM-DEBUG] farmService.harvestPlot() — finding plot');
    const [plot] = await db
      .select()
      .from(farmPlots)
      .where(and(
        eq(farmPlots.id, plotId),
        eq(farmPlots.userId, userId),
      ));

    if (!plot) {
      console.log('[FARM-DEBUG] farmService.harvestPlot() — plot NOT found');
      throw new Error(`Plot not found: ${plotId}`);
    }

    console.log('[FARM-DEBUG] farmService.harvestPlot() — plot found', JSON.stringify({
      plantTypeId: plot.plantTypeId,
      plantedAt: plot.plantedAt,
      happiness: plot.happiness,
      isDead: plot.isDead,
    }));

    if (plot.isDead) {
      console.log('[FARM-DEBUG] farmService.harvestPlot() — plot is DEAD');
      throw new Error(`Cannot harvest a dead plant`);
    }

    // 2. Get plant type
    console.log('[FARM-DEBUG] farmService.harvestPlot() — getting plant type');
    const [plantType] = await db
      .select()
      .from(plantTypes)
      .where(eq(plantTypes.id, plot.plantTypeId));

    if (!plantType) {
      console.log('[FARM-DEBUG] farmService.harvestPlot() — plant type NOT found');
      throw new Error(`Plant type not found: ${plot.plantTypeId}`);
    }

    console.log('[FARM-DEBUG] farmService.harvestPlot() — plantType:', JSON.stringify({
      id: plantType.id,
      name: plantType.name,
      emoji: plantType.emoji,
      rewardOgn: plantType.rewardOGN,
      rewardXp: plantType.rewardXP,
      growthDurationMs: plantType.growthDurationMs,
    }));

    // 3. Check growth
    const now = Date.now();
    const growthMs = now - plot.plantedAt;
    const growth = calculateGrowth(plot.plantedAt, plantType.growthDurationMs);

    console.log('[FARM-DEBUG] farmService.harvestPlot() — growth check', JSON.stringify({
      plantedAt: plot.plantedAt,
      now,
      growthMs,
      growthDurationMs: plantType.growthDurationMs,
      growthPercent: growth,
      isReady: growth >= 100,
    }));

    if (growth < 100) {
      const waitMinutes = Math.ceil((plantType.growthDurationMs - (Date.now() - plot.plantedAt)) / 60000);
      console.log('[FARM-DEBUG] farmService.harvestPlot() — NOT ready, wait:', waitMinutes, 'minutes');
      throw new Error(`Plant not ready: ${growth}% grown (need 100%). Wait ${waitMinutes} more minutes`);
    }

    console.log('[FARM-DEBUG] farmService.harvestPlot() — ✅ READY to harvest');

    // 4. Add OGN reward
    console.log('[FARM-DEBUG] farmService.harvestPlot() — addOGN:', plantType.rewardOGN);
    const ognResult = await rewardService.addOGN(userId, plantType.rewardOGN, `harvest_${plot.plantTypeId}`);
    console.log('[FARM-DEBUG] farmService.harvestPlot() — OGN added, new total:', ognResult.ogn);

    // 5. Add XP reward
    console.log('[FARM-DEBUG] farmService.harvestPlot() — addXP:', plantType.rewardXP);
    const xpResult = await rewardService.addXP(userId, plantType.rewardXP);
    console.log('[FARM-DEBUG] farmService.harvestPlot() — XP added, new total:', xpResult.xp, 'level:', xpResult.level);

    // 6. Delete the plot (free the slot for replanting)
    console.log('[FARM-DEBUG] farmService.harvestPlot() — deleting plot');
    await db
      .delete(farmPlots)
      .where(eq(farmPlots.id, plotId));
    console.log('[FARM-DEBUG] farmService.harvestPlot() — plot deleted');

    // 7. Update totalHarvests
    console.log('[FARM-DEBUG] farmService.harvestPlot() — updating totalHarvests');
    await db
      .update(playerStats)
      .set({
        totalHarvests: sql`${playerStats.totalHarvests} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(playerStats.userId, userId));
    console.log('[FARM-DEBUG] farmService.harvestPlot() — totalHarvests incremented');

    // 8. Clean Redis cooldown
    const cooldownKey = waterCooldownKey(userId, plotId);
    console.log('[FARM-DEBUG] farmService.harvestPlot() — cleaning Redis key:', cooldownKey);
    await redis.del(cooldownKey);

    // 9. Log action
    console.log('[FARM-DEBUG] farmService.harvestPlot() — logging game_action type=harvest');
    await db.insert(gameActions).values({
      userId,
      type: 'harvest',
      data: {
        plotId,
        slotIndex: plot.slotIndex,
        plantTypeId: plot.plantTypeId,
        ognEarned: plantType.rewardOGN,
        xpEarned: plantType.rewardXP,
        growthPercent: growth,
      },
    });

    console.log('[FARM-DEBUG] farmService.harvestPlot() — COMPLETE', JSON.stringify({
      ognEarned: plantType.rewardOGN,
      xpEarned: plantType.rewardXP,
      newOGN: ognResult.ogn,
      newXP: xpResult.xp,
      newLevel: xpResult.level,
      leveledUp: xpResult.leveledUp,
    }));

    return {
      plantType: {
        name: plantType.name,
        emoji: plantType.emoji,
      },
      ognEarned: plantType.rewardOGN,
      xpEarned: plantType.rewardXP,
      newOGN: ognResult.ogn,
      newXP: xpResult.xp,
      newLevel: xpResult.level,
      leveledUp: xpResult.leveledUp,
    };
  },
};
