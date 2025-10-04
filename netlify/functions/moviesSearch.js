export async function handler(event) {
  const key = process.env.RAPIDAPI_KEY; // set this in Netlify env 
  if (!key) return { statusCode: 500, body: JSON.stringify({ error: 'Missing RAPIDAPI_KEY' }) };

  const q = event.queryStringParameters || {};

  const allowed = [
    'MinRating','MinYear','MaxYear',
    'Genre','OriginalLanguage','SpokenLanguage','Limit'
  ];
  const search = new URLSearchParams();
  for (const k of allowed) if (q[k] != null && String(q[k]).trim() !== '') search.set(k, q[k]);

  const upstream = `https://moviedatabase8.p.rapidapi.com/Filter?${search}`;

  try {
    const resp = await fetch(upstream, {
      headers: {
        'x-rapidapi-key': key,
        'x-rapidapi-host': 'moviedatabase8.p.rapidapi.com',
        'accept': 'application/json'
      }
    });
    const text = await resp.text();
    return {
      statusCode: resp.ok ? 200 : resp.status,
      headers: { 'Content-Type': 'application/json' },
      body: resp.ok ? text : JSON.stringify({ error: 'Upstream error', body: text })
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
}
