/**
 * Generate the Ed25519 keypair for signing trial licenses.
 *   node scripts/gen-keys.mjs
 *
 * - LICENSE_SIGNING_KEY  (private, PEM) → set on the website backend (Vercel env).
 * - LICENSE_PUBLIC_KEY   (public,  PEM) → ship with the Precepta product to verify.
 * Keep the private key secret. Anyone with it can mint trials.
 */
import { generateKeyPairSync } from "node:crypto";

const { publicKey, privateKey } = generateKeyPairSync("ed25519");
const priv = privateKey.export({ type: "pkcs8", format: "pem" }).toString();
const pub = publicKey.export({ type: "spki", format: "pem" }).toString();

console.log("── LICENSE_SIGNING_KEY (private — website backend only) ──\n");
console.log(priv);
console.log("── LICENSE_PUBLIC_KEY (public — ship with the product) ──\n");
console.log(pub);
console.log("Tip: for a single-line env var, replace newlines with \\n.");
