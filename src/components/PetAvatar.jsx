import React from 'react';
import { SPECIES_DATA } from '../data/companionData';

const SIZE_CLASS = {
  sm: 'pet-sm',
  md: 'pet-md',
  lg: 'pet-lg',
  xl: 'pet-xl',
  hero: 'pet-hero',
};

export default function PetAvatar({
  species = 'fox',
  mood = 'happy',
  size = 'lg',
  showBubble = true,
}) {
  const pet = SPECIES_DATA[species] || SPECIES_DATA.fox;
  const anim =
    mood === 'sleepy'
      ? 'pet-sleepy'
      : mood === 'thinking'
        ? 'pet-thinking'
        : mood === 'mad'
          ? 'pet-mad'
          : mood === 'excited'
            ? 'pet-excited'
            : 'pet-idle';

  const bubble =
    mood === 'sleepy'
      ? '💤'
      : mood === 'thinking'
        ? '💭'
        : mood === 'mad'
          ? '💢'
          : null;

  return (
    <div
      className={`pet-avatar ${SIZE_CLASS[size] || SIZE_CLASS.lg} ${anim}`}
      role="img"
      aria-label={`${pet.name}, ${mood}`}
    >
      <span className="pet-emoji">{pet.emoji}</span>
      {showBubble && bubble && <span className="mood-bubble">{bubble}</span>}
    </div>
  );
}
