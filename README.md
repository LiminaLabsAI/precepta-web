# Precepta — Website

Marketing site + docs for **Precepta**, the sovereign, governed AI control plane.

- **Static** front-end (plain HTML/CSS/JS, no build step) — deploy to Netlify / Vercel / Cloudflare Pages / any static host.
- **Visual direction:** "Sovereign Perimeter" (dark, governance-forward).

## Structure
| File | Purpose |
|------|---------|
| `index.html` | Landing page |
| `start.html` | Start a 15-day trial (Google sign-in) |
| `docs.html`  | Documentation (quickstart + API reference) |
| `assets/styles.css` | Shared design system |
| `assets/app.js` | Nav + light interactions |

## Local preview
```bash
python3 -m http.server 4000
# open http://127.0.0.1:4000
```

## Trial signup (TODO — needs a small backend)
"Get started" → Google login → **15-day trial**. The static site handles the UI;
a small backend (serverless function) is needed to:
1. verify the Google ID token,
2. create/lookup the account + start the 15-day clock,
3. provision the trial (hosted trial console **or** a 15-day self-host license key + bundle — product decision pending).

Front-end flow is built and stubbed against this interface; see `start.html`.
