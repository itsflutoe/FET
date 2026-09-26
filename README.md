# Future LPT Companion

Standalone React + Vite prototype.

**Live:** https://itsflutoe.github.io/FET/

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## GitHub Pages

This repo deploys via GitHub Actions (`.github/workflows/deploy.yml`).

1. Repo **Settings → Pages**
2. Under **Build and deployment**, set **Source** to **GitHub Actions**
3. Push to `main` (or run the workflow manually under the Actions tab)

Vite `base` is set to `/FET/` so assets load correctly on the project site.

## Notes

- Companion profile, conversation history, local metrics, and the Gemini API key are stored in browser `localStorage`.
- The Gemini key is never sent to a Future LPT server.
- Companion energy is an FLPT UX abstraction, not Gemini quota.
- Model: `gemini-3.5-flash-lite` (see `src/data/companionData.js`).
