// Node 18+ on Netlify has native fetch
exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeaders(event) };

  try {
    const q = (event.queryStringParameters?.q || '').trim();
    const upstream = await fetch(
      `https://moviedatabase8.p.rapidapi.com/Search/${encodeURIComponent(q)}`,
      {
        headers: {
          'x-rapidapi-key': process.env.RAPIDAPI_KEY,
          'x-rapidapi-host': 'moviedatabase8.p.rapidapi.com'
        }
      }
    );

    const body = await upstream.text();
    return {
      statusCode: upstream.status,
      headers: { ...corsHeaders(event), 'content-type': upstream.headers.get('content-type') || 'application/json' },
      body
    };
  } catch (err) {
    return json(500, { error: 'Proxy error' }, event);
  }
};

function corsHeaders(event) {
  // If frontend is same Netlify site, CORS is effectively same-origin.
  const origin = event.headers?.origin || '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400'
  };
}
function json(statusCode, obj, event) {
  return { statusCode, headers: { ...corsHeaders(event), 'content-type': 'application/json' }, body: JSON.stringify(obj) };
}
