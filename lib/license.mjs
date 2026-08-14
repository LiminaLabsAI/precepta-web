/**
 * Precepta trial license — a compact, offline-verifiable, Ed25519-signed token.
 *
 * Format:  PZ1.<base64url(json payload)>.<base64url(ed25519 signature)>
 *
 * The token is self-contained: the product verifies it with the PUBLIC key only,
 * so a self-hosted Precepta can check the trial (and its 15-day expiry) with no
 * call home. The website mints it with the PRIVATE key. A tampered payload or a
 * forged signature fails verification; an expired `exp` fails the validity check.
 */
import { createPrivateKey, createPublicKey, sign, verify } from "node:crypto";

const PREFIX = "PZ1";
const b64u = (buf) => Buffer.from(buf).toString("base64url");
const unb64u = (s) => Buffer.from(s, "base64url");

/** Mint a signed license. `payload` is any JSON object (include `exp` as unix seconds). */
export function mintLicense(payload, privateKeyPem) {
  const body = b64u(JSON.stringify(payload));
  const key = createPrivateKey(normalizePem(privateKeyPem));
  const signature = b64u(sign(null, Buffer.from(body), key)); // ed25519 → algorithm must be null
  return `${PREFIX}.${body}.${signature}`;
}

/** Verify a license against the public key. Returns {valid, expired?, payload?, reason?}. */
export function verifyLicense(token, publicKeyPem, now = Date.now()) {
  const parts = String(token || "").split(".");
  if (parts.length !== 3 || parts[0] !== PREFIX) return { valid: false, reason: "malformed" };
  const [, body, signature] = parts;
  let ok;
  try {
    const key = createPublicKey(normalizePem(publicKeyPem));
    ok = verify(null, Buffer.from(body), key, unb64u(signature));
  } catch {
    return { valid: false, reason: "bad_key_or_signature" };
  }
  if (!ok) return { valid: false, reason: "bad_signature" };
  let payload;
  try {
    payload = JSON.parse(unb64u(body).toString("utf8"));
  } catch {
    return { valid: false, reason: "bad_payload" };
  }
  const expired = typeof payload.exp === "number" && now / 1000 > payload.exp;
  return { valid: !expired, expired, payload, reason: expired ? "expired" : undefined };
}

/** Allow PEMs passed via env with literal "\n" (Vercel/Netlify single-line secrets). */
function normalizePem(pem) {
  return String(pem).includes("\\n") ? String(pem).replace(/\\n/g, "\n") : pem;
}

export const TRIAL_DAYS = 15;
