// ═══════════════════════════════════════════
// FOLLOWER — keys.js
// LOCAL ONLY — nunca subir a GitHub
// Este archivo está en .gitignore
//
// Desde la migración a Cloudflare Worker (DA-11),
// las keys de Claude y OpenWeatherMap viven como
// Secrets en el Worker (followernarration.jaimeand.workers.dev),
// nunca en el repo. Este archivo ya no se carga en
// index.html — queda vacío intencionalmente.
// ═══════════════════════════════════════════

const KEYS = {
  openWeatherMap: '',
  gemini:         ''
};
