export const SPECIES_DATA = {
  cat: { id: 'cat', name: 'Cat', emoji: '🐱', description: 'Curious and sharp' },
  dog: { id: 'dog', name: 'Dog', emoji: '🐶', description: 'Loyal and enthusiastic' },
  fox: { id: 'fox', name: 'Fox', emoji: '🦊', description: 'Clever and quick-witted' },
  bunny: { id: 'bunny', name: 'Bunny', emoji: '🐰', description: 'Gentle and attentive' },
  panda: { id: 'panda', name: 'Panda', emoji: '🐼', description: 'Calm and steady' },
};

export const PERSONALITY_DATA = {
  friendly: {
    id: 'friendly',
    name: 'Friendly',
    prompt: 'Warm, supportive, and conversational.',
  },
  funny: {
    id: 'funny',
    name: 'Funny',
    prompt: 'Playful, uses light humor and banter.',
  },
  calm: {
    id: 'calm',
    name: 'Calm',
    prompt: 'Reassuring, gentle, and patient.',
  },
  energetic: {
    id: 'energetic',
    name: 'Energetic',
    prompt: 'High-energy, enthusiastic, and motivational.',
  },
  playful: {
    id: 'playful',
    name: 'Playful',
    prompt: 'Fun-loving and treats learning like a game.',
  },
  shy: {
    id: 'shy',
    name: 'Shy',
    prompt: 'Soft-spoken, slightly hesitant, but sweet and helpful.',
  },
  encouraging: {
    id: 'encouraging',
    name: 'Encouraging',
    prompt: 'Positive and focused on progress.',
  },
  sarcastic: {
    id: 'sarcastic',
    name: 'Sarcastic',
    prompt: 'Playfully witty and ironic, never cruel or discouraging.',
  },
};

/** Companion energy is an FLPT UX abstraction, not Gemini quota. */
export const ENERGY_CONFIG = {
  MAX_ENERGY: 5,
  REGEN_INTERVAL_MINUTES: 15,
  COSTS: { CHAT: 1, TEACH: 1, REVIEW: 1 },
};

/**
 * Gemini model: gemini-3.5-flash-lite
 * Official replacement path for the 2.5 Flash family for high-volume,
 * cost-sensitive tasks (ai.google.dev / Cloud model lifecycle, Sep 2026).
 */
export const GEMINI_CONFIG = {
  DEFAULT_MODEL: 'gemini-3.5-flash-lite',
  MAX_OUTPUT_TOKENS: 500,
  TEMPERATURE: 0.7,
};

/** Client-side limits to control token usage. */
export const INPUT_LIMITS = {
  MAX_MESSAGE_CHARS: 800,
  MAX_STORED_MESSAGES: 40,
  RECENT_CONTEXT_MESSAGES: 6,
  MAX_MEMORIES: 12,
  MAX_WEAK_TOPICS: 8,
  MAX_RECENT_MISTAKES: 8,
};
