import React,{createContext,useContext,useEffect,useMemo,useState} from 'react';
import { storageService } from '../services/storageService';
import { calculateCurrentEnergy } from '../services/energyService';
import { ENERGY_CONFIG } from '../data/companionData';
import { geminiService } from '../services/geminiService';
const C=createContext(null);
export function CompanionProvider({children}){
 const [profile,setProfile]=useState(()=>storageService.getProfile());
 const [apiKey,setApiKey]=useState(()=>storageService.getApiKey());
 const [energyState,setEnergyState]=useState(()=>profile?calculateCurrentEnergy(profile):{energy:5,nextRegenMs:0});
 const [lastError,setLastError]=useState(null);
 useEffect(()=>{if(!profile)return;const update=()=>{const c=calculateCurrentEnergy(profile);if(c.energy!==profile.energy||c.lastEnergyUpdate!==profile.lastEnergyUpdate){const p={...profile,energy:c.energy,lastEnergyUpdate:c.lastEnergyUpdate};setProfile(p);storageService.saveProfile(p)}setEnergyState({energy:c.energy,nextRegenMs:c.nextRegenMs})};update();const id=setInterval(update,1000);return()=>clearInterval(id)},[profile]);
 const createPet=data=>{const p={name:data.name?.trim()||'Lumi',gender:data.gender||'Prefer not to specify',species:data.species||'fox',personality:data.personality||'friendly',level:1,xp:0,energy:5,maxEnergy:5,createdAt:new Date().toISOString(),lastEnergyUpdate:Date.now(),memories:[],studyProfile:{weakTopics:[],recentMistakes:[]}};setProfile(p);storageService.saveProfile(p)};
 const updateProfile=changes=>setProfile(p=>{const n={...p,...changes};storageService.saveProfile(n);return n});
 const updateApiKey=k=>{if(k.trim())storageService.saveApiKey(k);else storageService.removeApiKey();setApiKey(k.trim())};
 const addXp=amount=>setProfile(p=>{if(!p)return p;let xp=p.xp+amount,level=p.level;while(xp>=level*100){xp-=level*100;level++}const n={...p,xp,level};storageService.saveProfile(n);return n});
 const performAction=async(prompt,cost=1,xp=5,contextType='chat',studyContext=null)=>{setLastError(null);const current=calculateCurrentEnergy(profile);if(current.energy<cost)throw {type:'NO_ENERGY'};try{const result=await geminiService.generateResponse(profile,prompt,contextType,studyContext);const c=calculateCurrentEnergy(profile);const p={...profile,energy:Math.max(0,c.energy-cost),lastEnergyUpdate:Date.now()};setProfile(p);storageService.saveProfile(p);setEnergyState({energy:p.energy,nextRegenMs:p.energy>=p.maxEnergy?0:ENERGY_CONFIG.REGEN_INTERVAL_MINUTES*60000});addXp(xp);return result.text}catch(e){setLastError(e);throw e}};
 const resetAll=()=>{storageService.clearAll();setProfile(null);setApiKey('');setLastError(null)};
 const value=useMemo(()=>({profile,apiKey,energyState,lastError,createPet,updateProfile,updateApiKey,performAction,resetAll,setLastError}),[profile,apiKey,energyState,lastError]);
 return <C.Provider value={value}>{children}</C.Provider>
}
export function useCompanion(){const v=useContext(C);if(!v)throw new Error('useCompanion must be used within CompanionProvider');return v}
