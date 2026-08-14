/**
 * Offline test for the license mint/verify logic (no network, no secrets).
 *   node scripts/test-license.mjs
 */
import { generateKeyPairSync } from "node:crypto";
import { mintLicense, verifyLicense, TRIAL_DAYS } from "../lib/license.mjs";

let pass = 0, fail = 0;
const ok = (name, cond) => { if (cond) { pass++; console.log("PASS " + name); }
  else { fail++; console.log("FAIL " + name); } };

const { publicKey, privateKey } = generateKeyPairSync("ed25519");
const priv = privateKey.export({ type: "pkcs8", format: "pem" }).toString();
const pub = publicKey.export({ type: "spki", format: "pem" }).toString();

const now = Math.floor(Date.now() / 1000);
const exp = now + TRIAL_DAYS * 24 * 3600;
const token = mintLicense({ sub: "google-123", email: "a@b.com", plan: "trial", iat: now, exp }, priv);

// 1) a fresh license verifies
const v = verifyLicense(token, pub);
ok("valid license verifies", v.valid === true && v.payload.email === "a@b.com");
ok("15-day expiry carried", v.payload.exp === exp);

// 2) single-line PEM (with literal \n) works — matches how Vercel stores secrets
const privOneLine = priv.replace(/\n/g, "\\n");
ok("single-line env PEM signs", verifyLicense(mintLicense({ plan: "trial", exp }, privOneLine), pub).valid === true);

// 3) tampered payload fails
const [p, body, sig] = token.split(".");
const forgedBody = Buffer.from(JSON.stringify({ plan: "enterprise", exp: exp + 9e9 })).toString("base64url");
ok("tampered payload rejected", verifyLicense(`${p}.${forgedBody}.${sig}`, pub).valid === false);

// 4) wrong public key fails
const other = generateKeyPairSync("ed25519").publicKey.export({ type: "spki", format: "pem" }).toString();
ok("wrong public key rejected", verifyLicense(token, other).valid === false);

// 5) expired license is invalid but readable
const expired = mintLicense({ plan: "trial", iat: now - 20 * 86400, exp: now - 5 * 86400 }, priv);
const ev = verifyLicense(expired, pub);
ok("expired license flagged", ev.valid === false && ev.expired === true);

// 6) malformed token
ok("malformed token rejected", verifyLicense("not-a-token", pub).valid === false);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
