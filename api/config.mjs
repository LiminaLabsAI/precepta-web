/**
 * GET /api/config — public front-end config. Exposes only the Google client ID
 * (which is public by design) so the static pages can initialize Sign in with
 * Google. Returns configured:false until the env is set, so the UI degrades
 * gracefully instead of erroring.
 */
export default function handler(req, res) {
  const googleClientId = process.env.GOOGLE_CLIENT_ID || "";
  const consoleUrl = process.env.CONSOLE_URL || "https://console.preceptaeai.com";
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "public, max-age=300");
  res.end(JSON.stringify({ googleClientId, consoleUrl, configured: Boolean(googleClientId) }));
}
