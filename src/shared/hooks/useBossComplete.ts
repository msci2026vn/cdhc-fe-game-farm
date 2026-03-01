import { useMutation, useQueryClient } from '@tanstack/react-query';
import { gameApi } from '../api/game-api';
import { PLAYER_PROFILE_KEY } from './usePlayerProfile';
import { BossFightInput, BossCompleteResult } from '../types/game-api.types';
import { useUIStore } from '../stores/uiStore';

export function useBossComplete() {
    const queryClient = useQueryClient();

    return useMutation<BossCompleteResult, Error, BossFightInput>({
        mutationFn: (data) => {
            console.log('[FARM-DEBUG] useBossComplete.mutationFn:', data);
            return gameApi.completeBoss(data);
        },
        retry: false,
        onSuccess: (data) => {
            console.log('[FARM-DEBUG] useBossComplete.onSuccess:', data);

            // Toast notification — trust server won flag
            // If wasAdjusted, damage was adjusted but won is still from FE
            if (data.won) {
              useUIStore.getState().addToast(
                `Đánh bại Boss! +${data.ognReward || 0} OGN +${data.xpGained || 0} XP`,
                'success',
                '⚔️'
              );
            } else if (!data.wasAdjusted) {
              // Only show loss toast if result was NOT adjusted by server
              useUIStore.getState().addToast(
                'Thua trận! Thử lại nhé.',
                'warning',
                '💔'
              );
            }

            // Invalidate boss progress + status (cooldown, daily fights)
            queryClient.invalidateQueries({ queryKey: ['game', 'boss', 'progress'] });
            queryClient.invalidateQueries({ queryKey: ['game', 'boss', 'status'] });

            // Invalidate player profile + daily status (for OGN/XP/daily cap)
            queryClient.invalidateQueries({ queryKey: PLAYER_PROFILE_KEY });
            queryClient.invalidateQueries({ queryKey: ['game', 'daily-status'] });
            queryClient.invalidateQueries({ queryKey: ['game', 'level-info'] });

            // Invalidate campaign data (zone progress refreshes when player navigates back)
            queryClient.invalidateQueries({ queryKey: ['game', 'campaign'] });
        },
        onError: (error) => {
            console.error('[FARM-DEBUG] useBossComplete.onError:', error);
            const code = (error as any)?.code || '';

            const ERROR_MAP: Record<string, { msg: string; type: 'warning' | 'error'; icon?: string }> = {
              // Rate limiting / Cooldown
              CONCURRENT_BATTLE:    { msg: 'Trận đấu trước chưa xong. Thử lại sau vài giây.', type: 'warning', icon: '⏳' },
              RATE_LIMIT_EXCEEDED:  { msg: 'Thao tác quá nhanh. Đợi vài giây rồi thử lại.', type: 'warning', icon: '⏳' },
              BOSS_COOLDOWN:        { msg: 'Boss đang hồi phục. Vui lòng đợi hết thời gian chờ.', type: 'warning', icon: '⏱️' },
              BOSS_DAILY_LIMIT:     { msg: 'Đã hết lượt đánh boss hôm nay. Quay lại ngày mai!', type: 'warning', icon: '🌅' },
              CAMPAIGN_DAILY_LIMIT: { msg: 'Hết lượt campaign hôm nay! Quay lại ngày mai.', type: 'warning', icon: '🌅' },
              CAMPAIGN_COOLDOWN:    { msg: 'Đợi chút rồi đánh tiếp nhé!', type: 'warning', icon: '⏱️' },
              DAILY_WIN_LIMIT:      { msg: 'Đã đạt giới hạn chiến thắng hôm nay!', type: 'warning', icon: '🏆' },
              // Session
              NO_ACTIVE_SESSION:    { msg: 'Phiên trận đấu hết hạn. Thử đánh lại nhé.', type: 'warning', icon: '⏳' },
              // Not found
              BOSS_NOT_FOUND:       { msg: 'Boss không tồn tại. Vui lòng tải lại trang.', type: 'error' },
              PLAYER_NOT_FOUND:     { msg: 'Chưa tạo nhân vật. Vui lòng đăng nhập lại.', type: 'error' },
              // Validation / Anti-cheat
              LEVEL_TOO_LOW:        { msg: 'Level chưa đủ để đánh boss này.', type: 'error' },
              INVALID_BATTLE:       { msg: 'Dữ liệu trận đấu không hợp lệ. Thử lại nhé.', type: 'error' },
              SUSPICIOUS_ACTIVITY:  { msg: 'Phát hiện hoạt động bất thường. Thử lại nhé.', type: 'error' },
              VALIDATION_ERROR:     { msg: 'Dữ liệu gửi lên không đúng định dạng.', type: 'error' },
              // System
              BOSS_COMPLETE_ERROR:  { msg: 'Lỗi hệ thống. Vui lòng thử lại sau.', type: 'error' },
            };

            const matched = ERROR_MAP[code];
            if (matched) {
              useUIStore.getState().addToast(matched.msg, matched.type, matched.icon);
            } else {
              useUIStore.getState().addToast(
                'Không thể hoàn thành trận đấu. Vui lòng thử lại.',
                'error'
              );
            }
        },
    });
}
