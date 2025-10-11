// netlify/functions/moviesSearch.js
const HOST = "moviedatabase8.p.rapidapi.com";
const BASE_URL = `https://${HOST}/Filter`;

export async function handler(event) {
  try {
    const key = process.env.RAPIDAPI_KEY;
    if (!key) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Missing RAPIDAPI_KEY" }),
      };
    }

    // Read query params (provide sensible defaults like your UberEats fn)
    const qp = new URLSearchParams(event.queryStringParameters || {});
    const MinYear = qp.get("MinYear") || "2020";
    const Genre = qp.get("Genre") || "Action";
    const Limit = "5"; // hard cap at 5

    const params = new URLSearchParams({ MinYear, Genre, Limit });
    const url = `${BASE_URL}?${params}`;

    const r = await fetch(url, {
      method: "GET",
      headers: {
        "x-rapidapi-key": key,
        "x-rapidapi-host": HOST,
        accept: "application/json",
      },
    });

    const text = await r.text();
    if (!r.ok) {
      return {
        statusCode: r.status,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ error: "Upstream error", body: text }),
      };
    }

    let data;
    try { data = JSON.parse(text); } catch { data = text; }

    // Normalize to an array no matter the upstream shape
    const arr = Array.isArray(data)
      ? data
      : (Array.isArray(data?.results) ? data.results
        : (Array.isArray(data?.data) ? data.data : []));

    const items = arr.slice(0, 5);

    return {
      statusCode: 200,
      headers: {
        "content-type": "application/json",
        "cache-control": "public, max-age=300", // 5 min CDN cache
      },
      body: JSON.stringify({ items }),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
