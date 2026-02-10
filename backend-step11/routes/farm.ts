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

export default farm;
