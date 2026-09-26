import React from 'react';
import { ENERGY_CONFIG } from '../data/companionData';

export default function EnergyBar({
  energy,
  maxEnergy = ENERGY_CONFIG.MAX_ENERGY,
  nextRegenMs,
}) {
  const pct = Math.min(100, (energy / maxEnergy) * 100);

  const format = (ms) => {
    if (!ms) return 'Fully rested!';
    const s = Math.ceil(ms / 1000);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `Next energy in ${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <div className="energy-wrap">
      <div className="energy-top">
        <span>⚡ Energy</span>
        <b>
          {energy}/{maxEnergy}
        </b>
      </div>
      <div className="energy-track">
        <div className="energy-fill" style={{ width: `${pct}%` }} />
      </div>
      <small>{energy >= maxEnergy ? 'Fully rested!' : format(nextRegenMs)}</small>
    </div>
  );
}
