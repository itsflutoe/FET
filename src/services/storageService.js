const PET_KEY='flpt_companion_profile';
const API_KEY='flpt_gemini_key';
const STATS_KEY='flpt_debug_stats';
const defaultStats=()=>({totalInputTokens:0,totalOutputTokens:0,totalTokens:0,requestCount:0,lastError:null,lastStatus:null});
export const storageService={
 getProfile(){try{return JSON.parse(localStorage.getItem(PET_KEY)||'null')}catch{return null}},
 saveProfile(p){localStorage.setItem(PET_KEY,JSON.stringify(p))},
 getApiKey(){try{return localStorage.getItem(API_KEY)||''}catch{return ''}},
 saveApiKey(k){localStorage.setItem(API_KEY,k.trim())},
 removeApiKey(){localStorage.removeItem(API_KEY)},
 getStats(){try{return {...defaultStats(),...JSON.parse(localStorage.getItem(STATS_KEY)||'{}')}}catch{return defaultStats()}},
 saveStats(s){localStorage.setItem(STATS_KEY,JSON.stringify(s))},
 clearAll(){localStorage.removeItem(PET_KEY);localStorage.removeItem(API_KEY);localStorage.removeItem(STATS_KEY)}
};
