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

/**
 * Companion energy is an FLPT UX abstraction — not Gemini API quota.
 * Tuned generously for free-tier Flash-Lite usage (high TPM / large context),
 * while still pacing the experience so the pet feels "alive".
 */
export const ENERGY_CONFIG = {
  MAX_ENERGY: 40,
  REGEN_INTERVAL_MINUTES: 3,
  COSTS: { CHAT: 1, TEACH: 1, REVIEW: 1 },
};

/**
 * Gemini model: gemini-3.5-flash-lite
 * Free tier offers a large context window and high TPM; we use a practical
 * slice of that (recent turns + memory) rather than dumping full history.
 */
export const GEMINI_CONFIG = {
  DEFAULT_MODEL: 'gemini-3.5-flash-lite',
  MAX_OUTPUT_TOKENS: 1024,
  TEMPERATURE: 0.7,
};

/** Client-side limits — use more free-tier capacity without waste. */
export const INPUT_LIMITS = {
  MAX_MESSAGE_CHARS: 2000,
  MAX_STORED_MESSAGES: 80,
  RECENT_CONTEXT_MESSAGES: 16,
  MAX_MEMORIES: 20,
  MAX_WEAK_TOPICS: 12,
  MAX_RECENT_MISTAKES: 12,
};
