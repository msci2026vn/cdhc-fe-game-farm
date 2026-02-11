import { useMutation, useQueryClient } from '@tanstack/react-query';
import { gameApi } from '../api/game-api';
import { useUIStore } from '../stores/uiStore';

export function useQuizAnswer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { sessionId: string; questionIndex: number; answer: string }) =>
      gameApi.answerQuiz(data),
    retry: false, // DON'T retry — avoid double answer
    onSuccess: (data) => {
      console.log('[FARM-DEBUG] useQuizAnswer.onSuccess:', data);

      // Toast notification
      if (data.correct) {
        useUIStore.getState().addToast(
          `Chính xác! +${data.ognGain || 0} OGN +${data.xpGain || 0} XP`,
          'success',
          '✅'
        );
      } else {
        useUIStore.getState().addToast(
          `Sai rồi! Đáp án đúng: ${data.correctAnswer || '...'}`,
          'warning',
          '❌'
        );
      }

      // Invalidate profile queries to update OGN/XP
      queryClient.invalidateQueries({ queryKey: ['game', 'profile'] });
    },
    onError: (error: Error) => {
      console.error('[FARM-DEBUG] useQuizAnswer.onError:', error.message);
      useUIStore.getState().addToast(
        'Không thể trả lời câu hỏi.',
        'error'
      );
    },
  });
}
