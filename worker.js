// Cloudflare Worker proxy — cho phép app gọi API OpenAI-compatible (b.ai) từ trình duyệt
// Cách dùng: paste toàn bộ file này vào Cloudflare Workers → Deploy → được URL https://<tên>.workers.dev
export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }
    try {
      const body = await request.json();
      // body: { endpoint, model, apiKey, messages }
      const r = await fetch(body.endpoint + '/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + body.apiKey,
        },
        body: JSON.stringify({
          model: body.model,
          messages: body.messages,
          temperature: 0.2,
        }),
      });
      const data = await r.json();
      return new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }
  },
};
