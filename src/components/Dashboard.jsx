import React, { useEffect, useRef, useState } from 'react';
import {
  BookOpen,
  MessageCircle,
  RotateCcw,
  Settings,
  Send,
  Trash2,
} from 'lucide-react';
import { useCompanion } from '../hooks/useCompanion';
import { SPECIES_DATA, PERSONALITY_DATA, INPUT_LIMITS } from '../data/companionData';
import PetAvatar from './PetAvatar';
import EnergyBar from './EnergyBar';
import { reaction } from '../services/personalityService';
import { storageService } from '../services/storageService';

function SettingsPanel({ profile, apiKey, updateProfile, updateApiKey, stats, reset, onClose }) {
  const [name, setName] = useState(profile.name);

  return (
    <section className="settings-panel">
      <div className="settings-panel-head">
        <div>
          <h2>Settings</h2>
          <p className="muted tiny">Identity, connection, and local data</p>
        </div>
        <button type="button" className="ghost-btn" onClick={onClose}>
          Done
        </button>
      </div>

      <div className="settings-stack">
        <div className="settings-block">
          <h3>Identity</h3>
          <label>
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={24} />
          </label>
          <button
            className="primary small"
            type="button"
            onClick={() => updateProfile({ name: name.trim() || profile.name })}
          >
            Save name
          </button>
          <label>
            Personality
            <select
              value={profile.personality}
              onChange={(e) => updateProfile({ personality: e.target.value })}
            >
              {Object.values(PERSONALITY_DATA).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Species
            <select
              value={profile.species}
              onChange={(e) => updateProfile({ species: e.target.value })}
            >
              {Object.values(SPECIES_DATA).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.emoji} {s.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="settings-block">
          <h3>Gemini</h3>
          <p className={`status-pill ${apiKey ? 'ok' : 'off'}`}>
            {apiKey ? 'Connected' : 'Not connected'}
          </p>
          <label>
            API key
            <input
              type="password"
              value={apiKey}
              onChange={(e) => updateApiKey(e.target.value)}
              placeholder="Paste your Gemini key"
              autoComplete="off"
            />
          </label>
          <div className="settings-actions">
            <a
              className="secondary"
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
            >
              Find key ↗
            </a>
            <button className="secondary" type="button" onClick={() => updateApiKey('')}>
              Disconnect
            </button>
          </div>
          <div className="usage-row">
            <span>
              Requests <b>{stats.requestCount}</b>
            </span>
            <span>
              Tokens <b>{stats.totalTokens.toLocaleString()}</b>
            </span>
          </div>
          <p className="tiny">
            Tokens are local usage estimates. Energy is a companion UX meter, not API quota.
          </p>
        </div>

        <div className="settings-block danger">
          <h3>Reset</h3>
          <p className="tiny">
            Clears companion, chat history, stats, and Gemini key from this browser.
          </p>
          <button className="danger-btn" type="button" onClick={reset}>
            <Trash2 size={16} /> Reset everything
          </button>
        </div>
      </div>
    </section>
  );
}

const ACTIONS = [
  { id: 'chat', label: 'Chat', Icon: MessageCircle },
  { id: 'teach', label: 'Teach Me', Icon: BookOpen },
  { id: 'review', label: 'Review', Icon: RotateCcw },
];

export default function Dashboard() {
  const {
    profile,
    apiKey,
    energyState,
    performAction,
    updateProfile,
    updateApiKey,
    resetAll,
  } = useCompanion();

  const [tab, setTab] = useState('chat');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState(() => {
    const stored = storageService.getMessages();
    if (stored.length) return stored;
    return [{ sender: 'pet', text: reaction(profile.personality, 0) }];
  });
  const [mood, setMood] = useState('happy');
  const [stats, setStats] = useState(() => storageService.getStats());
  const [mistakeStreak, setMistakeStreak] = useState(0);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const capped =
      messages.length > INPUT_LIMITS.MAX_STORED_MESSAGES
        ? messages.slice(messages.length - INPUT_LIMITS.MAX_STORED_MESSAGES)
        : messages;
    storageService.saveMessages(capped);
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (loading) return;
    if (energyState.energy <= 0) setMood('sleepy');
  }, [energyState.energy, loading]);

  const send = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    if (text.length > INPUT_LIMITS.MAX_MESSAGE_CHARS) {
      setMessages((m) => [
        ...m,
        {
          sender: 'pet',
          text: `That's a bit long for me (max ${INPUT_LIMITS.MAX_MESSAGE_CHARS} characters). Try a shorter note!`,
        },
      ]);
      return;
    }

    if (!apiKey) {
      setMessages((m) => [
        ...m,
        {
          sender: 'pet',
          text: `${profile.name} needs a Gemini key in Settings before we can talk.`,
        },
      ]);
      setMood('mad');
      setTab('settings');
      return;
    }

    if (energyState.energy <= 0) {
      setMood('sleepy');
      setMessages((m) => [
        ...m,
        {
          sender: 'pet',
          text: `${profile.name} is too sleepy right now. 💤`,
        },
      ]);
      return;
    }

    setInput('');
    setMessages((m) => [...m, { sender: 'user', text }]);
    setLoading(true);
    setMood('thinking');

    const ctx = tab === 'teach' ? 'teach' : tab === 'review' ? 'review' : 'chat';
    let prompt = text;
    let studyContext = null;

    if (tab === 'teach') {
      studyContext = { topic: text.slice(0, 120) };
      prompt = `Teach me about this clearly and helpfully: ${text}. Give a short explanation and one simple way to remember it.`;
    } else if (tab === 'review') {
      studyContext = { topic: text.slice(0, 120) };
      prompt = `I got this wrong or find it confusing: ${text}. Help me understand the mistake and one short way to remember it.`;
    }

    try {
      const answer = await performAction(
        prompt,
        1,
        tab === 'chat' ? 2 : 5,
        ctx,
        studyContext,
        messages
      );
      setMessages((m) => [...m, { sender: 'pet', text: answer }]);

      if (tab === 'review') {
        const nextStreak = mistakeStreak + 1;
        setMistakeStreak(nextStreak);
        setMood(nextStreak >= 2 ? 'mad' : 'happy');
      } else {
        setMistakeStreak(0);
        setMood('happy');
      }
      setStats(storageService.getStats());
    } catch (err) {
      if (err?.type === 'NO_ENERGY') {
        setMood('sleepy');
        setMessages((m) => [
          ...m,
          { sender: 'pet', text: `${profile.name} is too sleepy to study right now. 💤` },
        ]);
      } else if (err?.type === 'MISSING_KEY' || err?.type === 'INVALID_KEY') {
        setMood('mad');
        setMessages((m) => [
          ...m,
          {
            sender: 'pet',
            text: `${profile.name} can't connect right now. Check the Gemini key in Settings.`,
          },
        ]);
        setTab('settings');
      } else if (err?.type === 'RATE_LIMIT') {
        setMood('sleepy');
        setMessages((m) => [
          ...m,
          {
            sender: 'pet',
            text: `${profile.name}'s brain is a little busy. Let's pause a moment. 💤`,
          },
        ]);
      } else {
        setMood('mad');
        setMessages((m) => [
          ...m,
          {
            sender: 'pet',
            text: `${profile.name} can't reach its thoughts right now. Check your connection.`,
          },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    if (
      confirm(
        'Erase your companion, chat history, local study data, and Gemini key from this browser?'
      )
    ) {
      resetAll();
    }
  };

  const energy = energyState.energy;
  const disabled = energy <= 0 || loading;
  const species = SPECIES_DATA[profile.species] || SPECIES_DATA.fox;
  const personality = PERSONALITY_DATA[profile.personality] || PERSONALITY_DATA.friendly;
  const showSettings = tab === 'settings';

  const heading =
    tab === 'teach'
      ? `Teach with ${profile.name}`
      : tab === 'review'
        ? `Review with ${profile.name}`
        : `Talk to ${profile.name}`;

  return (
    <div className="app-shell pet-mode">
      <header className="topbar compact">
        <div className="brand">
          FUTURE <span>LPT</span>
        </div>
        <div className="top-status">
          <span className="top-status-name">{profile.name}</span>
          <span className={`status-dot ${apiKey ? 'on' : 'off'}`} />
        </div>
        <button
          className="icon-btn"
          type="button"
          onClick={() => setTab(showSettings ? 'chat' : 'settings')}
          aria-label="Settings"
        >
          <Settings size={18} />
        </button>
      </header>

      <main className="pet-stage">
        {showSettings ? (
          <SettingsPanel
            profile={profile}
            apiKey={apiKey}
            updateProfile={updateProfile}
            updateApiKey={updateApiKey}
            stats={stats}
            reset={reset}
            onClose={() => setTab('chat')}
          />
        ) : (
          <>
            <section className="pet-hero">
              <PetAvatar species={profile.species} mood={mood} size="hero" />
              <h1 className="pet-name">{profile.name}</h1>
              <p className="pet-meta">
                {personality.name} · {species.name}
              </p>
              <div className="pet-stats">
                <span className="stat-chip">
                  Lv {profile.level}
                  <span className="stat-sub">
                    {profile.xp}/{profile.level * 100} XP
                  </span>
                </span>
                <EnergyBar
                  energy={energy}
                  maxEnergy={profile.maxEnergy ?? 40}
                  nextRegenMs={energyState.nextRegenMs}
                  compact
                />
              </div>
              {energy <= 0 && (
                <p className="pet-resting">Resting… energy refills soon</p>
              )}
            </section>

            <nav className="action-pills" aria-label="Primary actions">
              {ACTIONS.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  type="button"
                  className={`action-pill ${tab === id ? 'active' : ''}`}
                  onClick={() => setTab(id)}
                >
                  <Icon size={16} strokeWidth={2.25} />
                  <span>{label}</span>
                </button>
              ))}
            </nav>

            <section className="chat-panel">
              <h2 className="chat-heading">{heading}</h2>

              {!apiKey && (
                <div className="banner-warn soft">
                  Add a Gemini key in Settings so {profile.name} can reply.
                </div>
              )}

              <div className="messages">
                {messages.map((m, i) => (
                  <div key={i} className={`message-row ${m.sender}`}>
                    {m.sender === 'pet' && (
                      <div className="msg-avatar" aria-hidden>
                        {species.emoji}
                      </div>
                    )}
                    <div className="message-col">
                      {m.sender === 'pet' && (
                        <span className="msg-name">{profile.name}</span>
                      )}
                      <div className="message">{m.text}</div>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="message-row pet">
                    <div className="msg-avatar" aria-hidden>
                      {species.emoji}
                    </div>
                    <div className="message-col">
                      <span className="msg-name">{profile.name}</span>
                      <div className="message thinking">thinking…</div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={send} className="composer sticky">
                <input
                  value={input}
                  onChange={(e) =>
                    setInput(e.target.value.slice(0, INPUT_LIMITS.MAX_MESSAGE_CHARS))
                  }
                  disabled={disabled}
                  maxLength={INPUT_LIMITS.MAX_MESSAGE_CHARS}
                  placeholder={
                    energy <= 0
                      ? `${profile.name} is resting…`
                      : tab === 'teach'
                        ? 'What should we learn?'
                        : tab === 'review'
                          ? 'What went wrong?'
                          : `Message ${profile.name}…`
                  }
                />
                <button
                  className="send-btn"
                  type="submit"
                  disabled={disabled || !input.trim()}
                  aria-label="Send"
                >
                  <Send size={18} />
                </button>
              </form>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
