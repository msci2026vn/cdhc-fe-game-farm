import { useMutation } from '@tanstack/react-query';
import { gameApi } from '../api/game-api';

export function useQuizStart() {
  return useMutation({
    mutationFn: () => gameApi.startQuiz(),
    retry: false, // Don't retry — user can click Start again if error
    onError: (error: Error) => {
      console.error('[FARM-DEBUG] useQuizStart.onError:', error.message);
    },
  });
}
