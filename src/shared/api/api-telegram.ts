// ═══════════════════════════════════════════════════════════════
// API TELEGRAM — webapp login, widget login, link, status
// ═══════════════════════════════════════════════════════════════

import { API_BASE_URL } from './api-utils';

export const telegramApi = {
  // POST /api/auth/telegram/webapp — Mini App initData login
  webAppLogin: async (initData: string) => {
    const res = await fetch(`${API_BASE_URL}/api/auth/telegram/webapp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ initData }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data?.error?.message || 'Đăng nhập Telegram thất bại');
    }
    return data;
  },

  // POST /api/auth/telegram/callback — Login Widget (web ngoài Telegram)
  widgetLogin: async (payload: {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    photo_url?: string;
    auth_date: number;
    hash: string;
  }) => {
    const res = await fetch(`${API_BASE_URL}/api/auth/telegram/callback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data?.error?.message || 'Đăng nhập Telegram thất bại');
    }
    return data;
  },

  // GET /api/auth/telegram/status — Check link status
  getLinkStatus: async () => {
    const res = await fetch(`${API_BASE_URL}/api/auth/telegram/status`, {
      credentials: 'include',
    });
    const data = await res.json();
    if (!res.ok) throw new Error('Không thể kiểm tra trạng thái Telegram');
    return data;
  },

  // POST /api/auth/telegram/link — Link Telegram vào account đang login
  link: async (initData: string) => {
    const res = await fetch(`${API_BASE_URL}/api/auth/telegram/link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ initData }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data?.error?.message || 'Liên kết Telegram thất bại');
    }
    return data;
  },
};
