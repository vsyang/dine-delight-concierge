const HOST = "imdb236.p.rapidapi.com";
const BASE = `https://${HOST}/api/imdb/search`;

function toArray(data) {
  return Array.isArray(data) ? data
       : Array.isArray(data?.items) ? data.items
       : Array.isArray(data?.results) ? data.results
       : Array.isArray(data?.data) ? data.data
       : [];
}

function getYear(rec) {
  const cands = [
    rec?.startYear,            
    rec?.year, rec?.Year,
    rec?.releaseYear, rec?.ReleaseYear,
    rec?.release_date, rec?.ReleaseDate, rec?.date
  ];
  for (const c of cands) {
    if (!c) continue;
    if (typeof c === "number") return c;
    const s = String(c);
    const m = s.match(/\b(19|20)\d{2}\b/);
    if (m) return Number(m[0]);
    const d = new Date(s);
    if (!isNaN(d)) return d.getFullYear();
  }
  return undefined;
}

export async function handler(event) {
  try {
    const key = process.env.RAPIDAPI_KEY;
    if (!key) {
      return { statusCode: 500, body: JSON.stringify({ error: "Missing RAPIDAPI_KEY" }) };
    }

    const qp = new URLSearchParams(event.queryStringParameters || {});
    const MinYear = qp.get("MinYear") || "2020";
    const Genre   = qp.get("Genre")   || "Drama";
    const Limit   = 5;

    // Pull a bigger pool, then trim by MinYear + Limit
    const rows = String(Math.min(Math.max(Limit * 10, 25), 100));
    const params = new URLSearchParams({
      type: "movie",
      genre: Genre,
      rows,
      sortOrder: "DESC",
      sortField: "startYear"   // <-- changed here
    });

    const url = `${BASE}?${params}`;
    const r = await fetch(url, {
      method: "GET",
      headers: {
        "x-rapidapi-key": key,
        "x-rapidapi-host": HOST,
        "accept": "application/json"
      }
    });

    const text = await r.text();

    // Normalize “no results” to empty list
    if (!r.ok) {
      if (r.status === 404) {
        return {
          statusCode: 200,
          headers: { "content-type": "application/json", "cache-control": "public, max-age=300" },
          body: JSON.stringify({ items: [] })
        };
      }
      return {
        statusCode: r.status,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ error: "Upstream error", body: text })
      };
    }

    let data; try { data = JSON.parse(text); } catch { data = text; }
    const arr = toArray(data);

    // Filter + local sort (desc by year) as a safety net
    const filtered = arr
      .filter(it => {
        const y = getYear(it);
        return !MinYear || (y && y >= Number(MinYear));
      })
      .sort((a, b) => (getYear(b) || 0) - (getYear(a) || 0));

    const items = filtered.slice(0, Limit);

    return {
      statusCode: 200,
      headers: {
        "content-type": "application/json",
        "cache-control": "public, max-age=300"
      },
      body: JSON.stringify({ items })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
