import React, { useEffect, useState } from 'react';
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

function SettingsPanel({ profile, apiKey, updateProfile, updateApiKey, stats, reset }) {
  const [name, setName] = useState(profile.name);

  return (
    <section className="settings-grid">
      <div className="settings-card">
        <span className="eyebrow">COMPANION</span>
        <h2>Identity</h2>
        <label>
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={24} />
        </label>
        <button
          className="primary small"
          type="button"
          onClick={() => updateProfile({ name: name.trim() || profile.name })}
        >
          Save identity
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

      <div className="settings-card">
        <span className="eyebrow">GEMINI CONNECTION</span>
        <h2 className={apiKey ? 'status-connected' : 'status-missing'}>
          {apiKey ? 'Connected' : 'Not connected'}
        </h2>
        <p className="tiny settings-hint">
          {apiKey
            ? 'Your companion can reach Gemini from this browser.'
            : 'Paste a Gemini API key to enable chat, teach, and review.'}
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
        <div className="usage">
          <div>
            <span>Requests</span>
            <b>{stats.requestCount}</b>
          </div>
          <div>
            <span>Tokens used</span>
            <b>{stats.totalTokens.toLocaleString()}</b>
          </div>
        </div>
        <p className="tiny">
          Token counts are local estimates from Gemini usage metadata. Companion energy
          is a separate FLPT UX meter, not API quota.
        </p>
      </div>

      <div className="settings-card danger">
        <span className="eyebrow">LOCAL DATA</span>
        <h2>Reset companion</h2>
        <p>
          This clears the companion profile, chat history, local stats, and Gemini key
          from this browser.
        </p>
        <button className="danger-btn" type="button" onClick={reset}>
          <Trash2 size={16} /> Reset everything
        </button>
      </div>
    </section>
  );
}

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
    return [
      {
        sender: 'pet',
        text: reaction(profile.personality, 0),
      },
    ];
  });
  const [mood, setMood] = useState('happy');
  const [stats, setStats] = useState(() => storageService.getStats());

  useEffect(() => {
    const capped =
      messages.length > INPUT_LIMITS.MAX_STORED_MESSAGES
        ? messages.slice(messages.length - INPUT_LIMITS.MAX_STORED_MESSAGES)
        : messages;
    storageService.saveMessages(capped);
  }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    if (text.length > INPUT_LIMITS.MAX_MESSAGE_CHARS) {
      setMessages((m) => [
        ...m,
        {
          sender: 'pet',
          text: `That message is a bit long for me (max ${INPUT_LIMITS.MAX_MESSAGE_CHARS} characters). Try a shorter question!`,
        },
      ]);
      return;
    }

    if (!apiKey) {
      setMessages((m) => [
        ...m,
        {
          sender: 'pet',
          text: `${profile.name} needs a Gemini key in Settings before we can chat.`,
        },
      ]);
      setMood('sad');
      setTab('settings');
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
      setMood('happy');
      setStats(storageService.getStats());
    } catch (err) {
      const pet =
        err?.type === 'NO_ENERGY'
          ? `${profile.name} is too sleepy to study right now. 💤`
          : err?.type === 'MISSING_KEY' || err?.type === 'INVALID_KEY'
            ? `${profile.name} can't connect to its brain right now. Please check the Gemini key in Settings.`
            : err?.type === 'RATE_LIMIT'
              ? `${profile.name}'s brain is a little busy right now. Let's give it a moment. 💤`
              : `${profile.name} can't reach its thoughts right now. Check your connection.`;
      setMessages((m) => [...m, { sender: 'pet', text: pet }]);
      setMood(err?.type === 'NO_ENERGY' ? 'sleepy' : 'sad');
      if (err?.type === 'MISSING_KEY' || err?.type === 'INVALID_KEY') {
        setTab('settings');
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

  const formatCountdown = (ms) => {
    if (!ms) return 'Fully rested!';
    const s = Math.ceil(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };

  const energy = energyState.energy;
  const disabled = energy <= 0 || loading;

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          FUTURE <span>LPT</span>
        </div>
        <div className="top-pet">
          <span>{SPECIES_DATA[profile.species]?.emoji}</span>
          {profile.name}
          <span className={`conn-dot ${apiKey ? 'on' : 'off'}`} title={apiKey ? 'Gemini connected' : 'Gemini not connected'} />
        </div>
        <button
          className="icon-btn"
          type="button"
          onClick={() => setTab('settings')}
          aria-label="Settings"
        >
          <Settings size={18} />
        </button>
      </header>

      <main className="dashboard">
        <section className="hero-card">
          <div className="hero-pet">
            <PetAvatar species={profile.species} mood={mood} size="xl" />
          </div>
          <div className="hero-copy">
            <div className="eyebrow">YOUR COMPANION</div>
            <h1>{profile.name}</h1>
            <p>
              {PERSONALITY_DATA[profile.personality]?.name}{' '}
              {SPECIES_DATA[profile.species]?.name}
            </p>
            <div className="level-line">
              <span>Level {profile.level}</span>
              <span>
                {profile.xp}/{profile.level * 100} XP
              </span>
            </div>
            <div className="xp-track">
              <div
                style={{
                  width: `${Math.min(100, (profile.xp / (profile.level * 100)) * 100)}%`,
                }}
              />
            </div>
          </div>
          <div className="hero-energy">
            <EnergyBar
              energy={energy}
              maxEnergy={profile.maxEnergy ?? 40}
              nextRegenMs={energyState.nextRegenMs}
            />
          </div>
        </section>

        <nav className="tabs">
          {[
            ['chat', 'Chat', MessageCircle],
            ['teach', 'Teach Me', BookOpen],
            ['review', 'Review', RotateCcw],
            ['settings', 'Settings', Settings],
          ].map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              className={tab === id ? 'active' : ''}
              onClick={() => setTab(id)}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </nav>

        {tab !== 'settings' ? (
          <section className="work-card">
            <div className="work-head">
              <div>
                <span className="eyebrow">
                  {tab === 'chat'
                    ? 'COMPANION CHAT'
                    : tab === 'teach'
                      ? 'LEARN SOMETHING'
                      : 'REVIEW A MISTAKE'}
                </span>
                <h2>
                  {tab === 'chat'
                    ? `Talk to ${profile.name}`
                    : tab === 'teach'
                      ? 'Teach me something'
                      : 'Let’s fix something'}
                </h2>
              </div>
              <span className={`mood-chip ${mood}`}>{mood}</span>
            </div>

            {!apiKey && (
              <div className="banner-warn">
                Gemini is not connected. Add an API key in Settings to enable replies.
              </div>
            )}

            <div className="messages">
              {messages.map((m, i) => (
                <div key={i} className={`message-row ${m.sender}`}>
                  <div className="message">{m.text}</div>
                </div>
              ))}
              {loading && (
                <div className="message-row pet">
                  <div className="message thinking">
                    {profile.name} is thinking... 💭
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={send} className="composer">
              <input
                value={input}
                onChange={(e) =>
                  setInput(e.target.value.slice(0, INPUT_LIMITS.MAX_MESSAGE_CHARS))
                }
                disabled={disabled}
                maxLength={INPUT_LIMITS.MAX_MESSAGE_CHARS}
                placeholder={
                  energy <= 0
                    ? `${profile.name} is resting... 💤`
                    : tab === 'teach'
                      ? 'What do you want to learn?'
                      : tab === 'review'
                        ? 'What did you get wrong?'
                        : `Talk to ${profile.name}...`
                }
              />
              <button
                className="send-btn"
                type="submit"
                disabled={disabled || !input.trim()}
                aria-label="Send"
              >
                <Send size={17} />
              </button>
            </form>
            <div className="composer-meta">
              <span>
                {input.length}/{INPUT_LIMITS.MAX_MESSAGE_CHARS}
              </span>
              {energy <= 0 && (
                <span className="rest-note">
                  ⚡ Next energy in {formatCountdown(energyState.nextRegenMs)}
                </span>
              )}
            </div>
          </section>
        ) : (
          <SettingsPanel
            profile={profile}
            apiKey={apiKey}
            updateProfile={updateProfile}
            updateApiKey={updateApiKey}
            stats={stats}
            reset={reset}
          />
        )}
      </main>
    </div>
  );
}
