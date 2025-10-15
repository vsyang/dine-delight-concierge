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

function uniqId(it) {
  return it?.id || it?.imdbID || it?.tconst || it?.const || `${it?.title ?? ""}-${getYear(it) ?? ""}`;
}

// Fisher–Yates
function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function fetchPage({ key, Genre, Type, Rows, page }) {
  const params = new URLSearchParams({
    type: Type,
    genre: Genre,
    rows: String(Rows),
    sortOrder: "DESC",
    sortField: "startYear",
    page: String(page)            // <- many RapidAPI search endpoints support page
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
  if (!r.ok) {
    if (r.status === 404) return [];
    throw new Error(`Upstream error ${r.status}: ${text?.slice?.(0, 300)}`);
  }

  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  const arr = toArray(data);

  // sort newest -> oldest within page to be consistent
  arr.sort((a, b) => (getYear(b) || 0) - (getYear(a) || 0));
  return arr;
}

export async function handler(event) {
  try {
    const key = process.env.RAPIDAPI_KEY;
    if (!key) {
      return { statusCode: 500, body: JSON.stringify({ error: "Missing RAPIDAPI_KEY" }) };
    }

    const qp = new URLSearchParams(event.queryStringParameters || {});
    const nowYear = new Date().getFullYear();
    const MinYear = Number(qp.get("MinYear") || "2020");
    const MaxYear = Number(qp.get("MaxYear") || String(nowYear));
    const Genre   = qp.get("Genres") || "Drama";
    const Type    = qp.get("Type") || "movie";
    const Limit   = Math.max(1, Number(qp.get("Limit") || 5));

    // paging knobs
    const Rows      = Math.min(100, Math.max(25, Number(qp.get("Rows") || 100)));
    const PageLimit = Math.min(10, Math.max(1, Number(qp.get("PageLimit") || 5)));

    const seen = new Set();
    const pooled = [];

    for (let page = 1; page <= PageLimit; page++) {
      const pageItems = await fetchPage({ key, Genre, Type, Rows, page });

      for (const it of pageItems) {
        const id = uniqId(it);
        if (!id || seen.has(id)) continue;
        seen.add(id);
        pooled.push(it);
      }

      // cheap short-circuit: if we already have far more than we need pre-filter, stop early
      if (pooled.length >= Limit * 20) break;
    }

    // filter by year bounds
    const inWindow = pooled.filter((it) => {
      const y = getYear(it);
      return Number.isFinite(y) ? (y >= MinYear && y <= MaxYear) : false;
    });

    // diversify a bit so the same head rows don’t always dominate
    shuffleInPlace(inWindow);

    const items = inWindow.slice(0, Limit).map(it => ({
      id: it.id || it.imdbID,
      title: it.primaryTitle || it.originalTitle || it.Title || it.title,
      year: getYear(it),
      runtime: it.runtimeMinutes || it.RuntimeMinutes || it.runtime || null,
      description: it.description || it.plot || it.overview || it.storyline || "",
      imageUrl:
        (it.primaryImage && it.primaryImage.url) ||
        it.primaryImage ||
        (it.thumbnails && it.thumbnails[0]?.url) ||
        null,
    }));

    return {
      statusCode: 200,
      headers: {
        "content-type": "application/json",
        "cache-control": "public, max-age=300"
      },
      body: JSON.stringify({ items, meta: { pooled: pooled.length, inWindow: inWindow.length } })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
