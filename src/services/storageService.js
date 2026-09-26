const PET_KEY = 'flpt_companion_profile';
const API_KEY = 'flpt_gemini_key';
const STATS_KEY = 'flpt_debug_stats';
const MESSAGES_KEY = 'flpt_companion_messages';

const defaultStats = () => ({
  totalInputTokens: 0,
  totalOutputTokens: 0,
  totalTokens: 0,
  requestCount: 0,
  lastError: null,
  lastStatus: null,
});

export const storageService = {
  getProfile() {
    try {
      return JSON.parse(localStorage.getItem(PET_KEY) || 'null');
    } catch {
      return null;
    }
  },

  saveProfile(p) {
    localStorage.setItem(PET_KEY, JSON.stringify(p));
  },

  getApiKey() {
    try {
      return localStorage.getItem(API_KEY) || '';
    } catch {
      return '';
    }
  },

  saveApiKey(k) {
    localStorage.setItem(API_KEY, k.trim());
  },

  removeApiKey() {
    localStorage.removeItem(API_KEY);
  },

  getStats() {
    try {
      return { ...defaultStats(), ...JSON.parse(localStorage.getItem(STATS_KEY) || '{}') };
    } catch {
      return defaultStats();
    }
  },

  saveStats(s) {
    localStorage.setItem(STATS_KEY, JSON.stringify(s));
  },

  getMessages() {
    try {
      const raw = JSON.parse(localStorage.getItem(MESSAGES_KEY) || '[]');
      return Array.isArray(raw) ? raw : [];
    } catch {
      return [];
    }
  },

  saveMessages(messages) {
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
  },

  clearMessages() {
    localStorage.removeItem(MESSAGES_KEY);
  },

  clearAll() {
    localStorage.removeItem(PET_KEY);
    localStorage.removeItem(API_KEY);
    localStorage.removeItem(STATS_KEY);
    localStorage.removeItem(MESSAGES_KEY);
  },
};
