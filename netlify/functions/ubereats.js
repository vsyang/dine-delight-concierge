const KEY = process.env.RAPIDAPI_KEY;

export async function handler(event) {
  try {
    const key = process.env.RAPIDAPI_KEY;
    if (!key) return { statusCode: 500, body: JSON.stringify({ error: "Missing RAPIDAPI_KEY" }) };

    const qp = new URLSearchParams(event.queryStringParameters || {});
    const address = qp.get("address") || "80233";
    const resName = qp.get("resName") || "Thai";
    const country = "United States";

    const url = "https://eater_ubereats.p.rapidapi.com/getUberEats";
    const params = new URLSearchParams({ address, resName, country });

    const r = await fetch(`${url}?${params}`, {
      headers: {
        "x-rapidapi-key": key,
        "x-rapidapi-host": "eater_ubereats.p.rapidapi.com",
        accept: "application/json",
      },
    });

    const text = await r.text();
    if (!r.ok) {
      return { statusCode: r.status, headers: { "content-type": "application/json" },
        body: JSON.stringify({ error: "Upstream error", body: text }) };
    }

    let data; try { data = JSON.parse(text); } catch { data = text; }
    const items = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
    const top5 = items.slice(0, 5);

    return {
      statusCode: 200,
      headers: {
        "content-type": "application/json",
        "cache-control": "public, max-age=300" // 5 min CDN cache
      },
      body: JSON.stringify({ items: top5 }),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
