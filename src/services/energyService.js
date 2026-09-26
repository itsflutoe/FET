import { ENERGY_CONFIG } from '../data/companionData';

/**
 * Pure calculation of current companion energy from a profile snapshot.
 * Energy is an FLPT Companion UX abstraction — not Gemini API quota.
 */
export function calculateCurrentEnergy(profile) {
  if (!profile) {
    return {
      energy: ENERGY_CONFIG.MAX_ENERGY,
      lastEnergyUpdate: Date.now(),
      nextRegenMs: 0,
    };
  }

  const max = profile.maxEnergy ?? ENERGY_CONFIG.MAX_ENERGY;
  const interval = ENERGY_CONFIG.REGEN_INTERVAL_MINUTES * 60_000;
  const now = Date.now();
  let energy = profile.energy ?? max;
  let last = profile.lastEnergyUpdate || now;

  if (energy >= max) {
    return { energy: max, lastEnergyUpdate: now, nextRegenMs: 0 };
  }

  const units = Math.floor(Math.max(0, now - last) / interval);
  if (units > 0) {
    energy = Math.min(max, energy + units);
    last = last + units * interval;
  }

  return {
    energy,
    lastEnergyUpdate: last,
    nextRegenMs: energy >= max ? 0 : interval - ((now - last) % interval),
  };
}
