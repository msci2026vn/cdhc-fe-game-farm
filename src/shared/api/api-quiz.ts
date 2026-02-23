// ═══════════════════════════════════════════════════════════════
// API QUIZ — Start quiz, answer questions
// ═══════════════════════════════════════════════════════════════

import { handleUnauthorized, handleApiError, API_BASE_URL } from './api-utils';
import type { QuizStartResult, QuizAnswerInput, QuizAnswerResult } from '../types/game-api.types';

export const quizApi = {
  /**
   * Start a quiz session (bước 18 — real API)
   * Server returns 5 random questions WITHOUT correctAnswer
   */
  startQuiz: async (): Promise<QuizStartResult> => {
    const url = API_BASE_URL + '/api/game/quiz/start';
    console.log('[FARM-DEBUG] gameApi.startQuiz():', url);

    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });

    console.log('[FARM-DEBUG] gameApi.startQuiz() status:', response.status);

    if (response.status === 401) {
      handleUnauthorized('startQuiz');
      throw new Error('Session expired');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('[FARM-DEBUG] gameApi.startQuiz() ERROR:', error);
      throw new Error(error?.error?.message || `Failed to start quiz: ${response.status}`);
    }

    const json = await response.json();
    console.log('[FARM-DEBUG] gameApi.startQuiz() SUCCESS:', json);
    return json.data;
  },

  /**
   * Answer a quiz question (bước 18 — real API)
   * Server validates answer and returns rewards
   */
  answerQuiz: async (input: QuizAnswerInput): Promise<QuizAnswerResult> => {
    const url = API_BASE_URL + '/api/game/quiz/answer';
    console.log('[FARM-DEBUG] gameApi.answerQuiz():', { url, ...input });

    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    console.log('[FARM-DEBUG] gameApi.answerQuiz() status:', response.status);

    if (response.status === 401) {
      handleUnauthorized('answerQuiz');
      throw new Error('Session expired');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('[FARM-DEBUG] gameApi.answerQuiz() ERROR:', error);
      throw new Error(error?.error?.message || `Failed to submit answer: ${response.status}`);
    }

    const json = await response.json();
    console.log('[FARM-DEBUG] gameApi.answerQuiz() SUCCESS:', json);
    return json.data;
  },
};
