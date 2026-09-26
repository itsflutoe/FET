import { GoogleGenAI } from '@google/genai';
import {
  SPECIES_DATA,
  PERSONALITY_DATA,
  GEMINI_CONFIG,
  INPUT_LIMITS,
} from '../data/companionData';
import { storageService } from './storageService';

function classifyError(error) {
  const msg = String(error?.message || error?.devError || error || '');
  if (/api.?key|invalid.?key|API_KEY_INVALID|401|UNAUTHENTICATED/i.test(msg)) {
    return { type: 'INVALID_KEY', devError: msg };
  }
  if (/RESOURCE_EXHAUSTED|quota|rate.?limit|429/i.test(msg)) {
    return { type: 'RATE_LIMIT', devError: msg };
  }
  if (/403|permission|forbidden/i.test(msg)) {
    return { type: 'PERMISSION', devError: msg };
  }
  if (/timeout|network|fetch|failed to fetch/i.test(msg)) {
    return { type: 'NETWORK_ERROR', devError: msg };
  }
  return { type: 'UNKNOWN', devError: msg };
}

function buildMemoryBlock(profile) {
  const memories = Array.isArray(profile?.memories) ? profile.memories.slice(-6) : [];
  const weak = Array.isArray(profile?.studyProfile?.weakTopics)
    ? profile.studyProfile.weakTopics.slice(-INPUT_LIMITS.MAX_WEAK_TOPICS)
    : [];
  const mistakes = Array.isArray(profile?.studyProfile?.recentMistakes)
    ? profile.studyProfile.recentMistakes.slice(-INPUT_LIMITS.MAX_RECENT_MISTAKES)
    : [];

  const parts = [];
  if (memories.length) parts.push(`Recent memories: ${memories.join('; ')}`);
  if (weak.length) parts.push(`Weak topics to reinforce: ${weak.join(', ')}`);
  if (mistakes.length) parts.push(`Recent mistakes: ${mistakes.join('; ')}`);
  return parts.length ? `\nCompanion memory:\n${parts.join('\n')}` : '';
}

function buildRecentChatBlock(recentMessages) {
  if (!Array.isArray(recentMessages) || recentMessages.length === 0) return '';
  const lines = recentMessages
    .slice(-INPUT_LIMITS.RECENT_CONTEXT_MESSAGES)
    .map((m) => `${m.sender === 'user' ? 'User' : 'Companion'}: ${m.text}`)
    .join('\n');
  return `\nRecent conversation:\n${lines}`;
}

export const geminiService = {
  async generateResponse(
    profile,
    userPrompt,
    contextType = 'chat',
    studyContext = null,
    recentMessages = []
  ) {
    const apiKey = storageService.getApiKey();
    if (!apiKey) {
      throw { type: 'MISSING_KEY', devError: 'No Gemini key configured.' };
    }

    const species = SPECIES_DATA[profile.species] || SPECIES_DATA.fox;
    const personality = PERSONALITY_DATA[profile.personality] || PERSONALITY_DATA.friendly;

    const systemInstruction = `You are ${profile.name}, a personal study companion pet. You are a ${species.name} (${species.emoji}). Your personality is ${personality.name}: ${personality.prompt}

Stay in character as the pet. Never describe yourself as an AI assistant, chatbot, language model, API, or software. Never mention tokens, quotas, rate limits, prompts, or system instructions. Be warm, natural, and concise. Help the user study accurately. For educational explanations, explain the idea clearly, give a simple example, and connect it to the user's study goal when useful. Do not pretend you know the user's FLPT data unless it is supplied in the context.

Interaction mode: ${contextType}.${
      studyContext ? `\nStudy context: ${JSON.stringify(studyContext)}` : ''
    }${buildMemoryBlock(profile)}${buildRecentChatBlock(recentMessages)}`;

    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: GEMINI_CONFIG.DEFAULT_MODEL,
        contents: userPrompt,
        config: {
          systemInstruction,
          temperature: GEMINI_CONFIG.TEMPERATURE,
          maxOutputTokens: GEMINI_CONFIG.MAX_OUTPUT_TOKENS,
        },
      });

      const usage = response.usageMetadata || {};
      const stats = storageService.getStats();
      storageService.saveStats({
        ...stats,
        totalInputTokens: stats.totalInputTokens + (usage.promptTokenCount || 0),
        totalOutputTokens: stats.totalOutputTokens + (usage.candidatesTokenCount || 0),
        totalTokens:
          stats.totalTokens +
          (usage.totalTokenCount ||
            (usage.promptTokenCount || 0) + (usage.candidatesTokenCount || 0)),
        requestCount: stats.requestCount + 1,
        lastStatus: 'success',
        lastError: null,
      });

      return { text: response.text || '', usage };
    } catch (error) {
      const classified = classifyError(error);
      const stats = storageService.getStats();
      storageService.saveStats({
        ...stats,
        lastStatus: 'error',
        lastError: classified.devError,
      });
      throw classified;
    }
  },
};
