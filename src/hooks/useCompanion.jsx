import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { storageService } from '../services/storageService';
import { calculateCurrentEnergy } from '../services/energyService';
import { ENERGY_CONFIG, INPUT_LIMITS } from '../data/companionData';
import { geminiService } from '../services/geminiService';

const CompanionContext = createContext(null);

function pushCapped(list, item, max) {
  const next = [...(list || []), item];
  return next.length > max ? next.slice(next.length - max) : next;
}

export function CompanionProvider({ children }) {
  const [profile, setProfile] = useState(() => {
    const p = storageService.getProfile();
    if (!p) return null;
    // Migrate older pets to the current energy pool (UX meter, not API quota).
    if ((p.maxEnergy ?? 0) < ENERGY_CONFIG.MAX_ENERGY) {
      const migrated = {
        ...p,
        maxEnergy: ENERGY_CONFIG.MAX_ENERGY,
        energy: ENERGY_CONFIG.MAX_ENERGY,
        lastEnergyUpdate: Date.now(),
      };
      storageService.saveProfile(migrated);
      return migrated;
    }
    return p;
  });
  const [apiKey, setApiKey] = useState(() => storageService.getApiKey());
  const [energyState, setEnergyState] = useState(() =>
    profile
      ? (() => {
          const c = calculateCurrentEnergy(profile);
          return { energy: c.energy, nextRegenMs: c.nextRegenMs };
        })()
      : { energy: ENERGY_CONFIG.MAX_ENERGY, nextRegenMs: 0 }
  );
  const [lastError, setLastError] = useState(null);

  const profileRef = useRef(profile);
  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  useEffect(() => {
    if (!profile) return undefined;

    const tick = () => {
      const current = profileRef.current;
      if (!current) return;
      const c = calculateCurrentEnergy(current);
      setEnergyState({ energy: c.energy, nextRegenMs: c.nextRegenMs });

      if (
        c.energy !== current.energy ||
        c.lastEnergyUpdate !== current.lastEnergyUpdate
      ) {
        const next = {
          ...current,
          energy: c.energy,
          lastEnergyUpdate: c.lastEnergyUpdate,
        };
        profileRef.current = next;
        setProfile(next);
        storageService.saveProfile(next);
      }
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [profile?.createdAt]);

  const createPet = useCallback((data) => {
    const p = {
      name: data.name?.trim() || 'Lumi',
      gender: data.gender || 'Prefer not to specify',
      species: data.species || 'fox',
      personality: data.personality || 'friendly',
      level: 1,
      xp: 0,
      energy: ENERGY_CONFIG.MAX_ENERGY,
      maxEnergy: ENERGY_CONFIG.MAX_ENERGY,
      createdAt: new Date().toISOString(),
      lastEnergyUpdate: Date.now(),
      memories: [],
      studyProfile: { weakTopics: [], recentMistakes: [] },
    };
    profileRef.current = p;
    setProfile(p);
    storageService.saveProfile(p);
    setEnergyState({ energy: p.energy, nextRegenMs: 0 });
  }, []);

  const updateProfile = useCallback((changes) => {
    setProfile((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...changes };
      profileRef.current = next;
      storageService.saveProfile(next);
      return next;
    });
  }, []);

  const updateApiKey = useCallback((k) => {
    if (k.trim()) storageService.saveApiKey(k);
    else storageService.removeApiKey();
    setApiKey(k.trim());
  }, []);

  const addXp = useCallback((amount) => {
    setProfile((prev) => {
      if (!prev) return prev;
      let xp = prev.xp + amount;
      let level = prev.level;
      while (xp >= level * 100) {
        xp -= level * 100;
        level += 1;
      }
      const next = { ...prev, xp, level };
      profileRef.current = next;
      storageService.saveProfile(next);
      return next;
    });
  }, []);

  const performAction = useCallback(
    async (prompt, cost = 1, xp = 5, contextType = 'chat', studyContext = null, recentMessages = []) => {
      setLastError(null);
      const current = calculateCurrentEnergy(profileRef.current);
      if (current.energy < cost) {
        const err = { type: 'NO_ENERGY' };
        setLastError(err);
        throw err;
      }

      try {
        const result = await geminiService.generateResponse(
          profileRef.current,
          prompt,
          contextType,
          studyContext,
          recentMessages
        );

        const after = calculateCurrentEnergy(profileRef.current);
        const spentEnergy = Math.max(0, after.energy - cost);
        let next = {
          ...profileRef.current,
          energy: spentEnergy,
          lastEnergyUpdate: Date.now(),
        };

        if (contextType === 'review' && studyContext?.topic) {
          const mistakes = pushCapped(
            next.studyProfile?.recentMistakes,
            studyContext.topic,
            INPUT_LIMITS.MAX_RECENT_MISTAKES
          );
          const weakTopics = pushCapped(
            next.studyProfile?.weakTopics,
            studyContext.topic,
            INPUT_LIMITS.MAX_WEAK_TOPICS
          );
          next = {
            ...next,
            studyProfile: { ...next.studyProfile, recentMistakes: mistakes, weakTopics },
            memories: pushCapped(
              next.memories,
              `Reviewed: ${studyContext.topic}`,
              INPUT_LIMITS.MAX_MEMORIES
            ),
          };
        } else if (contextType === 'teach' && studyContext?.topic) {
          next = {
            ...next,
            memories: pushCapped(
              next.memories,
              `Taught: ${studyContext.topic}`,
              INPUT_LIMITS.MAX_MEMORIES
            ),
          };
        } else if (contextType === 'chat' && prompt) {
          const snippet = prompt.length > 60 ? `${prompt.slice(0, 57)}…` : prompt;
          next = {
            ...next,
            memories: pushCapped(
              next.memories,
              `Chat: ${snippet}`,
              INPUT_LIMITS.MAX_MEMORIES
            ),
          };
        }

        profileRef.current = next;
        setProfile(next);
        storageService.saveProfile(next);
        setEnergyState({
          energy: next.energy,
          nextRegenMs:
            next.energy >= (next.maxEnergy ?? ENERGY_CONFIG.MAX_ENERGY)
              ? 0
              : ENERGY_CONFIG.REGEN_INTERVAL_MINUTES * 60_000,
        });
        addXp(xp);
        return result.text;
      } catch (e) {
        setLastError(e);
        throw e;
      }
    },
    [addXp]
  );

  const resetAll = useCallback(() => {
    storageService.clearAll();
    profileRef.current = null;
    setProfile(null);
    setApiKey('');
    setLastError(null);
    setEnergyState({ energy: ENERGY_CONFIG.MAX_ENERGY, nextRegenMs: 0 });
  }, []);

  const value = useMemo(
    () => ({
      profile,
      apiKey,
      energyState,
      lastError,
      createPet,
      updateProfile,
      updateApiKey,
      performAction,
      resetAll,
      setLastError,
    }),
    [
      profile,
      apiKey,
      energyState,
      lastError,
      createPet,
      updateProfile,
      updateApiKey,
      performAction,
      resetAll,
    ]
  );

  return (
    <CompanionContext.Provider value={value}>{children}</CompanionContext.Provider>
  );
}

export function useCompanion() {
  const v = useContext(CompanionContext);
  if (!v) throw new Error('useCompanion must be used within CompanionProvider');
  return v;
}
