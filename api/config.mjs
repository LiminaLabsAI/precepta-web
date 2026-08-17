/**
 * GET /api/config — public front-end config. Exposes only the Google client ID
 * (which is public by design) so the static pages can initialize Sign in with
 * Google. Returns configured:false until the env is set, so the UI degrades
 * gracefully instead of erroring.
 */
export default function handler(req, res) {
  const googleClientId = process.env.GOOGLE_CLIENT_ID || "";
  // Source of truth for where "Get started" goes. Set CONSOLE_URL per environment
  // in Vercel; empty here means the front-end keeps its local-dev fallback.
  const consoleUrl = process.env.CONSOLE_URL || "";
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "public, max-age=300");
  res.end(JSON.stringify({ googleClientId, consoleUrl, configured: Boolean(googleClientId) }));
}
