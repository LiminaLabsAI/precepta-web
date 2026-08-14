/**
 * Verify a Google Identity Services ID token (the `credential` from Sign in with
 * Google) using Google's published JWKS — no npm dependency, just Node crypto + fetch.
 *
 * Returns the token payload {sub, email, email_verified, name, picture, ...} or throws.
 */
import { createPublicKey, verify } from "node:crypto";

const CERTS_URL = "https://www.googleapis.com/oauth2/v3/certs";
const VALID_ISS = ["https://accounts.google.com", "accounts.google.com"];

let _certsCache = { at: 0, keys: [] };

async function googleKeys() {
  // JWKS rotates slowly; cache for 1h to avoid a fetch per sign-in.
  if (Date.now() - _certsCache.at < 3600_000 && _certsCache.keys.length) return _certsCache.keys;
  const res = await fetch(CERTS_URL);
  if (!res.ok) throw new Error("could not fetch Google certs");
  const { keys } = await res.json();
  _certsCache = { at: Date.now(), keys };
  return keys;
}

const b64urlJson = (s) => JSON.parse(Buffer.from(s, "base64url").toString("utf8"));

export async function verifyGoogleIdToken(idToken, clientId) {
  const parts = String(idToken || "").split(".");
  if (parts.length !== 3) throw new Error("malformed id token");
  const [h, p, s] = parts;
  const header = b64urlJson(h);

  const jwk = (await googleKeys()).find((k) => k.kid === header.kid);
  if (!jwk) throw new Error("unknown signing key");

  const pub = createPublicKey({ key: jwk, format: "jwk" });
  const okSig = verify("RSA-SHA256", Buffer.from(`${h}.${p}`), pub, Buffer.from(s, "base64url"));
  if (!okSig) throw new Error("bad token signature");

  const payload = b64urlJson(p);
  if (clientId && payload.aud !== clientId) throw new Error("audience mismatch");
  if (!VALID_ISS.includes(payload.iss)) throw new Error("issuer mismatch");
  if (typeof payload.exp === "number" && payload.exp * 1000 < Date.now()) throw new Error("id token expired");
  return payload;
}
