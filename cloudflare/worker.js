/* ═══════════════════════════════════════════
   FOLLOWER — worker.js
   Cloudflare Worker — proxy para Claude API
   y OpenWeatherMap. Las keys viven como
   Secrets en Cloudflare, nunca en código público.
   DT-6 resuelto.

   Rutas:
   POST /narration  → Claude API
   GET  /weather     → OpenWeatherMap
   ═══════════════════════════════════════════ */

export default {
  async fetch(request, env) {

    const corsHeaders = {
      'Access-Control-Allow-Origin':  '*', // puedes restringir a tu dominio exacto
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);

    /* ── RUTA: NARRACIÓN (Claude API) ── */
    if (url.pathname === '/narration' && request.method === 'POST') {
      try {
        const body = await request.json();

        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type':      'application/json',
            'x-api-key':         env.CLAUDE_API_KEY,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify(body)
        });

        const data = await res.json();

        return new Response(JSON.stringify(data), {
          status:  res.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status:  500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    /* ── RUTA: CLIMA (OpenWeatherMap) ── */
    if (url.pathname === '/weather' && request.method === 'GET') {
      try {
        const lat = url.searchParams.get('lat');
        const lon = url.searchParams.get('lon');

        if (!lat || !lon) {
          return new Response(JSON.stringify({ error: 'lat y lon requeridos' }), {
            status:  400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const owmUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${env.OPENWEATHER_API_KEY}&units=metric`;
        const res    = await fetch(owmUrl);
        const data   = await res.json();

        return new Response(JSON.stringify(data), {
          status:  res.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status:  500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    /* ── RUTA DESCONOCIDA ── */
    return new Response('Not found. Usa /narration o /weather', {
      status:  404,
      headers: corsHeaders
    });
  }
};

