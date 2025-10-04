const key = "process.env.RAPIDAPI_KEY"; // use to get key from .env

export async function handler(event) {
  try {
    if (!key) {
      return { statusCode: 500, body: JSON.stringify({ error: "Missing RAPIDAPI_KEY" }) };
    }

    // Read query params from the browser request
    const qp = new URLSearchParams(event.queryStringParameters || {});
    const address = qp.get("address") || "1401 Alberni Street";
    const resName = qp.get("resName") || "LE COQ FRIT";
    const country = qp.get("country") || "Canada";
    const city = qp.get("city") || "Vancouver";

    const url = "https://eater_ubereats.p.rapidapi.com/getUberEats"; // keep what worked for you
    const params = new URLSearchParams({ address, resName, country, city });

    const r = await fetch(`${url}?${params}`, {
      method: "GET",
      headers: {
        "x-rapidapi-key": key,
        "x-rapidapi-host": "eater_ubereats.p.rapidapi.com",
        "accept": "application/json",
      },
    });

    const text = await r.text();
    if (!r.ok) {
      return {
        statusCode: r.status,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Upstream error", body: text }),
      };
    }

    // Try JSON; fall back to text
    let data;
    try { data = JSON.parse(text); } catch { data = text; }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
