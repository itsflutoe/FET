import { ENERGY_CONFIG } from '../data/companionData';
export function calculateCurrentEnergy(profile){
  if(!profile) return {energy:ENERGY_CONFIG.MAX_ENERGY,lastEnergyUpdate:Date.now(),nextRegenMs:0};
  const max=profile.maxEnergy??ENERGY_CONFIG.MAX_ENERGY, interval=ENERGY_CONFIG.REGEN_INTERVAL_MINUTES*60000, now=Date.now();
  let energy=profile.energy??max, last=profile.lastEnergyUpdate||now;
  if(energy>=max) return {energy:max,lastEnergyUpdate:now,nextRegenMs:0};
  const units=Math.floor(Math.max(0,now-last)/interval);
  if(units>0){energy=Math.min(max,energy+units);last=last+units*interval;}
  return {energy,lastEnergyUpdate:last,nextRegenMs:energy>=max?0:interval-((now-last)%interval)};
}
