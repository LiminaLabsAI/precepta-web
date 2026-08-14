/**
 * POST /api/trial/start   { credential: <google-id-token> }
 *
 * Verifies the Google sign-in, mints a 15-day Ed25519 license, emails it
 * (best-effort), and returns the license for the welcome screen.
 *
 * Env: GOOGLE_CLIENT_ID, LICENSE_SIGNING_KEY (PEM), RESEND_API_KEY (optional),
 *      TRIAL_FROM (optional, default "Precepta <trial@precepta.ai>").
 */
import { verifyGoogleIdToken } from "../../lib/google.mjs";
import { mintLicense, TRIAL_DAYS } from "../../lib/license.mjs";

export default async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "method not allowed" });

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const signingKey = process.env.LICENSE_SIGNING_KEY;
  if (!clientId || !signingKey) return json(res, 500, { error: "trial signup is not configured yet" });

  let body;
  try { body = await readJson(req); } catch { return json(res, 400, { error: "invalid JSON body" }); }
  const credential = body && body.credential;
  if (!credential) return json(res, 400, { error: "missing Google credential" });

  let g;
  try { g = await verifyGoogleIdToken(credential, clientId); }
  catch (e) { return json(res, 401, { error: "Google sign-in could not be verified", detail: String(e.message || e) }); }
  if (!g.email_verified) return json(res, 403, { error: "your Google email is not verified" });

  const now = Math.floor(Date.now() / 1000);
  const exp = now + TRIAL_DAYS * 24 * 3600;
  const license = mintLicense(
    { sub: g.sub, email: g.email, name: g.name || "", plan: "trial", iat: now, exp },
    signingKey
  );
  const expiresAt = new Date(exp * 1000).toISOString();

  let emailed = false;
  if (process.env.RESEND_API_KEY) {
    emailed = await sendTrialEmail(g.email, g.name || "there", license, expiresAt).catch(() => false);
  }

  return json(res, 200, {
    ok: true, email: g.email, name: g.name || "", license, expiresAt, trialDays: TRIAL_DAYS, emailed,
  });
}

/* ---------- helpers ---------- */
function json(res, code, obj) {
  res.statusCode = code;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(obj));
}

async function readJson(req) {
  if (req.body) return typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

async function sendTrialEmail(to, name, license, expiresAt) {
  const from = process.env.TRIAL_FROM || "Precepta <trial@precepta.ai>";
  const html = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;color:#0b1220">
      <h2 style="margin:0 0 6px">Your Precepta 15-day trial</h2>
      <p style="color:#54637d;margin:0 0 18px">Hi ${escapeHtml(name)}, your sovereign AI gateway is ready to run — in your own boundary.</p>
      <p style="margin:0 0 6px;font-weight:600">Your trial license key</p>
      <pre style="background:#0b1220;color:#c9d6ee;padding:14px 16px;border-radius:10px;overflow-x:auto;font-size:12px">${escapeHtml(license)}</pre>
      <p style="color:#54637d;font-size:13px">Valid until <b>${escapeHtml(expiresAt)}</b>.</p>
      <p style="margin:18px 0 6px;font-weight:600">Run it</p>
      <pre style="background:#f5f8fc;border:1px solid #e5eaf2;padding:14px 16px;border-radius:10px;overflow-x:auto;font-size:12px">git clone https://github.com/LiminaLabsAI/precepta && cd precepta/deploy
export PRECEPTA_LICENSE="&lt;your key above&gt;"
./up.sh</pre>
      <p style="color:#8695ac;font-size:12px;margin-top:22px">Precepta — sovereign, governed AI. Nothing leaves your boundary.</p>
    </div>`;
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, subject: "Your Precepta 15-day trial license", html }),
  });
  return r.ok;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
