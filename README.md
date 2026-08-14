# Precepta — Website

Marketing site + docs for **Precepta**, the sovereign, governed AI control plane.

- **Front-end:** static HTML/CSS/JS (no build step) — "Sovereign Perimeter" visual direction.
- **Backend:** Vercel serverless functions (`/api/*`) for the **15-day trial** signup.
- **Trial model:** Google sign-in → a signed **15-day self-host license key** + the Docker bundle.

## Structure
| Path | Purpose |
|------|---------|
| `index.html` | Landing page |
| `start.html` | Start a 15-day trial (Sign in with Google) |
| `welcome.html` | Post-signup — shows the license key + run commands |
| `docs.html` | Documentation (quickstart + API reference) |
| `assets/styles.css`, `assets/app.js` | Design system + interactions |
| `lib/license.mjs` | Ed25519 license mint/verify (offline-verifiable) |
| `lib/google.mjs` | Google ID-token verification (Node crypto + JWKS, no deps) |
| `api/trial/start.mjs` | POST — verify sign-in, mint license, email it |
| `api/config.mjs` | GET — public Google client id for the front-end |
| `scripts/gen-keys.mjs` | Generate the license signing keypair |
| `scripts/test-license.mjs` | Offline test for the license logic |

## Local preview (static pages only)
```bash
npm run dev          # python3 -m http.server 4010  → http://127.0.0.1:4010
```
The `/api/*` functions run under Vercel; use `vercel dev` to exercise the trial flow locally.

## Test
```bash
npm test             # offline license mint/verify/tamper/expiry checks
```

## Deploy (Vercel)
1. Generate the signing keypair (once): `npm run gen-keys`
2. Import the repo in Vercel (framework preset: **Other** — it's static + functions).
3. Set environment variables:

| Env var | Where | Notes |
|---------|-------|-------|
| `GOOGLE_CLIENT_ID` | website | OAuth 2.0 Web client id (Google Cloud console). Add your domain to Authorized JavaScript origins. |
| `LICENSE_SIGNING_KEY` | website | The **private** Ed25519 PEM from `gen-keys` (single-line `\n`-escaped is fine). Keep secret. |
| `RESEND_API_KEY` | website | *(optional)* enables the trial email. Without it, the key is shown on-screen only. |
| `TRIAL_FROM` | website | *(optional)* email From, e.g. `Precepta <trial@yourdomain>`. |
| `LICENSE_PUBLIC_KEY` | **product** | The **public** PEM — ships with Precepta to verify trial keys. |

The front-end degrades gracefully until `GOOGLE_CLIENT_ID` is set (the button
explains sign-in isn't connected yet), so the static site previews fine anywhere.

## How the trial works
1. **start.html** loads Sign in with Google (client id from `/api/config`).
2. On sign-in, the browser posts the Google **ID token** to **`/api/trial/start`**.
3. The function verifies the token against Google's JWKS, then mints a compact
   **Ed25519-signed license** — `PZ1.<payload>.<sig>` — carrying `{sub, email, plan:"trial", exp = now+15d}`.
4. The key is emailed (if Resend is set) and stashed for **welcome.html**, which
   shows it plus the three commands to self-host.
5. The **Precepta product** verifies the key offline with `LICENSE_PUBLIC_KEY`
   and enforces the 15-day expiry — no call home. *(Product-side verification is
   the next piece to wire in the `precepta` repo.)*

The license is **stateless and forgery-proof**: tampering with the payload or
faking the signature fails verification, and an expired `exp` is rejected — all
provable offline (`npm test`).
