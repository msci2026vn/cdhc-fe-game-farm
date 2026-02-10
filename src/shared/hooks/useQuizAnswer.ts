import { useMutation, useQueryClient } from '@tanstack/react-query';
import { gameApi } from '../api/game-api';

export function useQuizAnswer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { sessionId: string; questionIndex: number; answer: string }) =>
      gameApi.answerQuiz(data),
    retry: false, // DON'T retry — avoid double answer
    onSuccess: (data) => {
      console.log('[FARM-DEBUG] useQuizAnswer.onSuccess:', data);
      // Invalidate profile queries to update OGN/XP
      queryClient.invalidateQueries({ queryKey: ['game', 'profile'] });
    },
    onError: (error: Error) => {
      console.error('[FARM-DEBUG] useQuizAnswer.onError:', error.message);
    },
  });
}
