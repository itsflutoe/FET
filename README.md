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

- Companion profile, local metrics, and the Gemini API key are stored in browser localStorage in this prototype.
- The Gemini key is never intended to be committed to Git or stored in Supabase.
- The companion energy meter is an FLPT UX abstraction, not Gemini's actual remaining quota.
- Gemini model configuration is in `src/data/companionData.js`.
