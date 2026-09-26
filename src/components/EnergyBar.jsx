import React from 'react';
import { ENERGY_CONFIG } from '../data/companionData';

/** Compact energy readout for the pet hero (not a heavy dashboard widget). */
export default function EnergyBar({
  energy,
  maxEnergy = ENERGY_CONFIG.MAX_ENERGY,
  nextRegenMs,
  compact = false,
}) {
  const pct = Math.min(100, (energy / Math.max(1, maxEnergy)) * 100);

  const format = (ms) => {
    if (!ms) return 'Full';
    const s = Math.ceil(ms / 1000);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  if (compact) {
    return (
      <div className="energy-compact" title={energy >= maxEnergy ? 'Fully rested' : `Next +1 in ${format(nextRegenMs)}`}>
        <span className="energy-compact-label">⚡</span>
        <div className="energy-compact-track">
          <div className="energy-compact-fill" style={{ width: `${pct}%` }} />
        </div>
        <span className="energy-compact-count">
          {energy}/{maxEnergy}
        </span>
      </div>
    );
  }

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
      <small>{energy >= maxEnergy ? 'Fully rested!' : `Next energy in ${format(nextRegenMs)}`}</small>
    </div>
  );
}
