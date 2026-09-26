# Future LPT Companion

Standalone React + Vite prototype reconstructed from the supplied Gemini-generated project.

## Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Notes

- Companion profile, conversation history, local metrics, and the Gemini API key are stored in browser `localStorage` in this prototype.
- The Gemini key is never intended to be committed to Git or stored on a Future LPT server.
- The companion energy meter is an **FLPT UX abstraction**, not Gemini’s actual remaining quota.
- Gemini model configuration is in `src/data/companionData.js` (currently `gemini-3.5-flash-lite`).
- Chat history is capped; only recent turns and compact study memories are sent to Gemini.
