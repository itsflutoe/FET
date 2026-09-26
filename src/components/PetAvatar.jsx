import React from 'react';
import { SPECIES_DATA } from '../data/companionData';

const SIZE_CLASS = {
  sm: 'pet-sm',
  md: 'pet-md',
  lg: 'pet-lg',
  xl: 'pet-xl',
};

export default function PetAvatar({ species = 'fox', mood = 'happy', size = 'lg' }) {
  const pet = SPECIES_DATA[species] || SPECIES_DATA.fox;
  const anim =
    mood === 'sleepy'
      ? 'pet-sleepy'
      : mood === 'thinking'
        ? 'pet-thinking'
        : mood === 'excited'
          ? 'pet-excited'
          : 'pet-idle';

  return (
    <div
      className={`pet-avatar ${SIZE_CLASS[size] || SIZE_CLASS.lg} ${anim}`}
      role="img"
      aria-label={pet.name}
    >
      <span>{pet.emoji}</span>
      {mood === 'sleepy' && <span className="sleep-bubble">💤</span>}
    </div>
  );
}
