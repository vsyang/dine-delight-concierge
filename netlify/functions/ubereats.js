exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeaders(event) };

  try {
    const qs = event.queryStringParameters || {};
    const address = qs.address || '';
    const resName = qs.resName || '';
    const country = qs.country || '';
    const city    = qs.city || '';

    const target = `https://eater_ubereats.p.rapidapi.com/getUberEats` +
                   `?address=${encodeURIComponent(address)}` +
                   `&resName=${encodeURIComponent(resName)}` +
                   `&country=${encodeURIComponent(country)}` +
                   `&city=${encodeURIComponent(city)}`;

    const upstream = await fetch(target, {
      headers: {
        'x-rapidapi-key': process.env.RAPIDAPI_KEY,
        'x-rapidapi-host': 'eater_ubereats.p.rapidapi.com'
      }
    });

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
