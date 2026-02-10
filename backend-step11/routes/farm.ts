// ═══════════════════════════════════════════════════════════════
// farm.ts — Farm routes (GET /plots, POST /plant)
// FARMVERSE Step 13
// ═══════════════════════════════════════════════════════════════

import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { farmService } from '../services/farm.service';

const farm = new Hono();

// ═══════════════════════════════════════════════════════════════
// SCHEMAS
// ═══════════════════════════════════════════════════════════════

// [FARM-DEBUG] Valid plant type IDs — must match DB plant_types.id
const VALID_PLANT_TYPES = [
  'carrot', 'chili', 'corn', 'cucumber',
  'lettuce', 'sunflower', 'tomato', 'wheat',
] as const;

const plantSchema = z.object({
  slotIndex: z.number().int().min(0).max(5),
  plantTypeId: z.enum(VALID_PLANT_TYPES),
});

const waterSchema = z.object({
  plotId: z.string().uuid('Invalid plot ID format'),
});

const harvestSchema = z.object({
  plotId: z.string().uuid('Invalid plot ID format'),
});

// ═══════════════════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════════════════

/**
 * GET /plots
 * Get all farm plots for current user
 */
farm.get('/plots', async (c) => {
  const user = c.get('user');

  console.log('[FARM-DEBUG] GET /plots — START', JSON.stringify({
    userId: user.id,
    email: user.email,
    timestamp: new Date().toISOString(),
  }));

  try {
    const plots = await farmService.getPlots(user.id);

    console.log('[FARM-DEBUG] GET /plots — SUCCESS', JSON.stringify({
      plotCount: plots.length,
      totalSlots: 6,
    }));

    return c.json({
      success: true,
      data: {
        plots,
        totalSlots: 6,
      },
    });
  } catch (error: any) {
    console.error('[FARM-DEBUG] GET /plots — ERROR', JSON.stringify({
      message: error.message,
      userId: user.id,
    }));

    return c.json({
      success: false,
      error: { code: 'GET_PLOTS_ERROR', message: error.message },
    }, 500);
  }
});

/**
 * POST /plant
 * Trồng cây vào slot trống. Trừ OGN, tạo plot mới.
 */
farm.post('/plant',
  // Zod validation middleware
  zValidator('json', plantSchema, (result, c) => {
    if (!result.success) {
      console.error('[FARM-DEBUG] POST /plant — Zod validation FAILED:', JSON.stringify(result.error.flatten()));
      return c.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Dữ liệu không hợp lệ',
          details: result.error.flatten(),
        },
      }, 400);
    }
    console.log('[FARM-DEBUG] POST /plant — Zod validation PASSED');
  }),
  // Handler
  async (c) => {
    const user = c.get('user');
    const body = c.req.valid('json');

    console.log('[FARM-DEBUG] POST /plant — START', JSON.stringify({
      userId: user.id,
      email: user.email,
      slotIndex: body.slotIndex,
      plantTypeId: body.plantTypeId,
      timestamp: new Date().toISOString(),
    }));

    try {
      // Gọi service
      console.log('[FARM-DEBUG] POST /plant — calling farmService.plantSeed()');
      const result = await farmService.plantSeed(user.id, body.slotIndex, body.plantTypeId);

      console.log('[FARM-DEBUG] POST /plant — SUCCESS', JSON.stringify({
        plotId: result.plot?.id,
        slotIndex: result.plot?.slotIndex,
        plantTypeId: result.plot?.plantTypeId,
        ognRemaining: result.ognRemaining,
        plantName: result.plantType?.name,
        plantEmoji: result.plantType?.emoji,
      }));

      return c.json({ success: true, data: result });
    } catch (error: any) {
      // Map error → status code + error code
      const errorMsg = error.message || 'Unknown error';

      console.error('[FARM-DEBUG] POST /plant — ERROR', JSON.stringify({
        message: errorMsg,
        userId: user.id,
        slotIndex: body.slotIndex,
        plantTypeId: body.plantTypeId,
        stack: error.stack?.split('\n').slice(0, 3).join(' | '),
      }));

      let status = 500;
      let code = 'PLANT_ERROR';

      if (errorMsg.includes('Insufficient') || errorMsg.includes('không đủ')) {
        status = 400; code = 'INSUFFICIENT_OGN';
      } else if (errorMsg.includes('already') || errorMsg.includes('occupied') || errorMsg.includes('đã có')) {
        status = 409; code = 'SLOT_OCCUPIED';
      } else if (errorMsg.includes('Invalid plant') || errorMsg.includes('không tồn tại')) {
        status = 400; code = 'INVALID_PLANT_TYPE';
      } else if (errorMsg.includes('Invalid slot') || errorMsg.includes('slot')) {
        status = 400; code = 'INVALID_SLOT';
      }

      console.error(`[FARM-DEBUG] POST /plant — returning ${status} ${code}`);

      return c.json({
        success: false,
        error: { code, message: errorMsg },
      }, status);
    }
  }
);

/**
 * POST /water
 * Tưới nước cho cây → tăng happiness + cooldown
 */
farm.post('/water',
  // Zod validation middleware
  zValidator('json', waterSchema, (result, c) => {
    if (!result.success) {
      console.error('[FARM-DEBUG] POST /water — Zod validation FAILED:', JSON.stringify(result.error.flatten()));
      return c.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Dữ liệu không hợp lệ',
          details: result.error.flatten(),
        },
      }, 400);
    }
    console.log('[FARM-DEBUG] POST /water — Zod validation PASSED');
  }),
  // Handler
  async (c) => {
    const user = c.get('user');
    const body = c.req.valid('json');

    console.log('[FARM-DEBUG] POST /water — START', JSON.stringify({
      userId: user.id,
      email: user.email,
      plotId: body.plotId,
      timestamp: new Date().toISOString(),
    }));

    try {
      // Gọi service
      console.log('[FARM-DEBUG] POST /water — calling farmService.waterPlot()');
      const result = await farmService.waterPlot(user.id, body.plotId);

      console.log('[FARM-DEBUG] POST /water — SUCCESS', JSON.stringify({
        plotId: body.plotId,
        happiness: result.happiness,
        xpGained: result.xpGained,
        xpTotal: result.xpTotal,
        level: result.level,
        leveledUp: result.leveledUp,
        cooldownSeconds: result.cooldownSeconds,
      }));

      return c.json({ success: true, data: result });
    } catch (error: any) {
      // Map error → status code + error code
      const errorMsg = error.message || 'Unknown error';

      console.error('[FARM-DEBUG] POST /water — ERROR', JSON.stringify({
        message: errorMsg,
        userId: user.id,
        plotId: body.plotId,
        stack: error.stack?.split('\n').slice(0, 3).join(' | '),
      }));

      let status = 500;
      let code = 'WATER_ERROR';
      let cooldownRemaining: number | undefined;

      if (errorMsg.includes('cooldown') || errorMsg.includes('Cooldown')) {
        status = 429; code = 'COOLDOWN_ACTIVE';
        // Extract cooldown remaining from error message if available
        const ttlMatch = errorMsg.match(/(\d+)\s+seconds/);
        if (ttlMatch) {
          cooldownRemaining = parseInt(ttlMatch[1], 10);
        }
      } else if (errorMsg.includes('not found') || errorMsg.includes('Plot not found')) {
        status = 404; code = 'PLOT_NOT_FOUND';
      } else if (errorMsg.includes('dead') || errorMsg.includes('Cannot water')) {
        status = 400; code = 'PLOT_DEAD';
      }

      console.error(`[FARM-DEBUG] POST /water — returning ${status} ${code}`);

      return c.json({
        success: false,
        error: {
          code,
          message: errorMsg,
          ...(cooldownRemaining !== undefined && { cooldownRemaining }),
        },
      }, status);
    }
  }
);

/**
 * POST /harvest
 *
 * Thu hoạch cây đã growth 100%.
 * Transaction: addOGN(reward) + addXP(25) + delete plot + log.
 *
 * Request: { plotId: "uuid" }
 * Response: {
 *   success: true,
 *   data: {
 *     ognReward: 100,
 *     xpGained: 25,
 *     newOgn: 1150,
 *     newXp: 35,
 *     newLevel: 1,
 *     leveledUp: false,
 *     plantName: "Cà Chua",
 *     plantEmoji: "🍅",
 *     message: "Thu hoạch thành công! +100 OGN 🍅"
 *   }
 * }
 */
farm.post('/harvest',
  zValidator('json', harvestSchema, (result, c) => {
    if (!result.success) {
      console.error('[FARM-DEBUG] POST /harvest — Zod validation FAILED:', JSON.stringify(result.error.flatten()));
      return c.json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'plotId không hợp lệ' },
      }, 400);
    }
    console.log('[FARM-DEBUG] POST /harvest — Zod validation PASSED');
  }),
  async (c) => {
    const user = c.get('user');
    const { plotId } = c.req.valid('json');

    console.log('[FARM-DEBUG] POST /harvest — START', JSON.stringify({
      userId: user.id,
      email: user.email,
      plotId,
      timestamp: new Date().toISOString(),
    }));

    try {
      console.log('[FARM-DEBUG] POST /harvest — calling farmService.harvestPlot()');
      const result = await farmService.harvestPlot(user.id, plotId);

      console.log('[FARM-DEBUG] POST /harvest — SUCCESS', JSON.stringify({
        ognEarned: result.ognEarned,
        xpEarned: result.xpEarned,
        newOGN: result.newOGN,
        newLevel: result.newLevel,
        leveledUp: result.leveledUp,
        plantName: result.plantType.name,
      }));

      // Map field names for FE consistency
      return c.json({
        success: true,
        data: {
          ognReward: result.ognEarned,
          xpGained: result.xpEarned,
          newOgn: result.newOGN,
          newXp: result.newXP,
          newLevel: result.newLevel,
          leveledUp: result.leveledUp,
          plantName: result.plantType.name,
          plantEmoji: result.plantType.emoji,
          message: `Thu hoạch thành công! +${result.ognEarned} OGN ${result.plantType.emoji}`,
        },
      });
    } catch (error: any) {
      const errorMsg = error.message || 'Unknown error';

      console.error('[FARM-DEBUG] POST /harvest — ERROR', JSON.stringify({
        message: errorMsg,
        userId: user.id,
        plotId,
      }));

      let status = 500;
      let code = 'HARVEST_ERROR';

      if (errorMsg.includes('not ready') || errorMsg.includes('chưa') || errorMsg.includes('growth') || errorMsg.includes('100%')) {
        status = 400; code = 'NOT_READY';
      } else if (errorMsg.includes('not found') || errorMsg.includes('không tìm')) {
        status = 404; code = 'PLOT_NOT_FOUND';
      } else if (errorMsg.includes('dead') || errorMsg.includes('chết')) {
        status = 400; code = 'PLOT_DEAD';
      } else if (errorMsg.includes('already') || errorMsg.includes('đã thu')) {
        status = 409; code = 'ALREADY_HARVESTED';
      }

      console.error(`[FARM-DEBUG] POST /harvest — returning ${status} ${code}`);

      return c.json({
        success: false,
        error: { code, message: errorMsg },
      }, status);
    }
  }
);

export default farm;
