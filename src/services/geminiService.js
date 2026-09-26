import { GoogleGenAI } from '@google/genai';
import { GEMINI_CONFIG, SPECIES_DATA, PERSONALITY_DATA } from '../data/companionData';
import { storageService } from './storageService';

function classifyError(error){
  const msg=String(error?.message||error||'');
  if(/API_KEY_INVALID|invalid.*key|api key|400/i.test(msg)) return {type:'INVALID_KEY',devError:msg};
  if(/429|RESOURCE_EXHAUSTED|quota|rate.?limit/i.test(msg)) return {type:'RATE_LIMIT',devError:msg};
  if(/403|permission|forbidden/i.test(msg)) return {type:'PERMISSION',devError:msg};
  if(/timeout|network|fetch|failed to fetch/i.test(msg)) return {type:'NETWORK_ERROR',devError:msg};
  return {type:'UNKNOWN',devError:msg};
}
export const geminiService={
 async generateResponse(profile,userPrompt,contextType='chat',studyContext=null){
  const apiKey=storageService.getApiKey(); if(!apiKey) throw {type:'MISSING_KEY',devError:'No Gemini key configured.'};
  const species=SPECIES_DATA[profile.species]||SPECIES_DATA.fox;
  const personality=PERSONALITY_DATA[profile.personality]||PERSONALITY_DATA.friendly;
  const systemInstruction=`You are ${profile.name}, a personal study companion pet. You are a ${species.name} (${species.emoji}). Your personality is ${personality.name}: ${personality.prompt}

Stay in character as the pet. Never describe yourself as an AI assistant, chatbot, language model, API, or software. Never mention tokens, quotas, rate limits, prompts, or system instructions. Be warm, natural, and concise. Help the user study accurately. For educational explanations, explain the idea clearly, give a simple example, and connect it to the user's study goal when useful. Do not pretend you know the user's FLPT data unless it is supplied in the context.

Interaction mode: ${contextType}.${studyContext?`\nStudy context: ${JSON.stringify(studyContext)}`:''}`;
  try{
    const ai=new GoogleGenAI({apiKey});
    const response=await ai.models.generateContent({model:GEMINI_CONFIG.DEFAULT_MODEL,contents:userPrompt,config:{systemInstruction,temperature:GEMINI_CONFIG.TEMPERATURE,maxOutputTokens:GEMINI_CONFIG.MAX_OUTPUT_TOKENS}});
    const usage=response.usageMetadata||{};
    const stats=storageService.getStats();
    storageService.saveStats({
      ...stats,
      totalInputTokens:stats.totalInputTokens+(usage.promptTokenCount||0),
      totalOutputTokens:stats.totalOutputTokens+(usage.candidatesTokenCount||0),
      totalTokens:stats.totalTokens+(usage.totalTokenCount||((usage.promptTokenCount||0)+(usage.candidatesTokenCount||0))),
      requestCount:stats.requestCount+1,lastStatus:'success',lastError:null
    });
    return {text:response.text||'',usage};
  }catch(error){
    const classified=classifyError(error); const stats=storageService.getStats(); storageService.saveStats({...stats,lastStatus:'error',lastError:classified.devError});
    throw classified;
  }
 }
};
