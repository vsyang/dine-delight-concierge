const HOST = "imdb236.p.rapidapi.com";
const SEARCH_BASE = `https://${HOST}/api/imdb/search`;

function toArray(data) {
  return Array.isArray(data) ? data
       : Array.isArray(data?.items) ? data.items
       : Array.isArray(data?.results) ? data.results
       : Array.isArray(data?.data) ? data.data
       : [];
}

const norm = (s)=> (s||"").toString().trim().toLowerCase();
const titleCase = (s)=> (s||"").split(/[\s-_]+/).map(w => w[0]?.toUpperCase()+w.slice(1).toLowerCase()).join(" ");

function getYear(rec) {
  const cands = [rec?.startYear, rec?.year, rec?.Year, rec?.releaseYear, rec?.ReleaseYear,
                 rec?.releaseDate, rec?.release_date, rec?.date,
                 rec?.first_air_date, rec?.title, rec?.primaryTitle, rec?.originalTitle];
  for (const c of cands) {
    if (!c) continue;
    if (typeof c === "number") return c;
    const s = String(c);
    const m = s.match(/\b(18|19|20|21)\d{2}\b/);
    if (m) return Number(m[0]);
    const d = new Date(s);
    if (!isNaN(d)) return d.getFullYear();
  }
  return undefined;
}

function hasGenre(rec, want) {
  const w = norm(want);
  const tags = []
    .concat(rec?.genres || [])
    .concat(rec?.interests || [])
    .map(norm);
  if (tags.includes(w)) return true;
  const hay = [rec?.primaryTitle, rec?.originalTitle, rec?.title, rec?.description, rec?.overview, rec?.storyline]
    .map(norm).join(" ");
  return new RegExp(`\\b${w}\\b`, "i").test(hay);
}

function uniqId(it) {
  return it?.id || it?.imdbID || it?.tconst || `${it?.title ?? it?.primaryTitle ?? ""}-${getYear(it) ?? ""}`;
}

async function fetchCursorPage({ key, Type, Genre, Rows, cursor }) {
  const params = new URLSearchParams({
    rows: String(Rows),
    sortOrder: "DESC",
    sortField: "startYear",
  });
  if (cursor) params.set("cursorMark", cursor);

  // Hints: many variants ignore these, but they won't 4xx.
  if (Genre) {
    params.set("genres", titleCase(Genre));
    params.set("genre", titleCase(Genre));
    params.set("q", Genre);
  }
  if (Type) {
    params.set("type", Type);
    params.set("titleType", Type);
  }

  const url = `${SEARCH_BASE}?${params}`;
  const r = await fetch(url, {
    method: "GET",
    headers: {
      "x-rapidapi-key": key,
      "x-rapidapi-host": HOST,
      "accept": "application/json"
    }
  });

  const text = await r.text();
  let data; try { data = JSON.parse(text); } catch { data = text; }

  if (!r.ok) {
    // Don’t explode the function—return “empty page” so caller can fallback/continue.
    console.error("Upstream error", r.status, text?.slice?.(0,300));
    return { items: [], next: null };
  }

  return { items: toArray(data), next: data?.nextCursorMark || null };
}

export async function handler(event) {
  try {
    const key = process.env.RAPIDAPI_KEY;
    if (!key) {
      return { statusCode: 500, body: JSON.stringify({ error: "Missing RAPIDAPI_KEY" }) };
    }

    const qp = new URLSearchParams(event.queryStringParameters || {});
    const now = new Date().getFullYear();
    const MinYear = Number(qp.get("MinYear") || "2020");
    const MaxYear = Number(qp.get("MaxYear") || String(now));
    const Genre   = qp.get("Genre") || "Action";
    const Type    = qp.get("Type") || "movie";
    const Limit   = Math.max(1, Number(qp.get("Limit") || 5));
    const Rows    = Math.min(100, Math.max(25, Number(qp.get("Rows") || 100)));
    const Hops    = Math.min(10, Math.max(1, Number(qp.get("PageLimit") || 5)));

    const seen = new Set();
    let pooled = [];
    let cursor = null;

    for (let i = 0; i < Hops; i++) {
      const { items, next } = await fetchCursorPage({ key, Type, Genre, Rows, cursor });
      cursor = next;

      for (const it of items) {
        const id = uniqId(it);
        if (!id || seen.has(id)) continue;
        seen.add(id);
        pooled.push(it);
      }
      if (!cursor || pooled.length >= Limit * 40) break;
    }

    // Local filters (year + genre)
    let filtered = pooled.filter(it => {
      const y = getYear(it);
      return Number.isFinite(y) && y >= MinYear && y <= MaxYear && hasGenre(it, Genre);
    });

    // If none, relax genre (providers sometimes mislabel genres)
    if (filtered.length === 0) {
      filtered = pooled.filter(it => {
        const y = getYear(it);
        return Number.isFinite(y) && y >= MinYear && y <= MaxYear;
      });
    }

    filtered.sort((a,b) => (getYear(b)||0) - (getYear(a)||0));

    const items = filtered.slice(0, Limit).map(it => ({
      id: it.id || it.imdbID || it.tconst || null,
      title: it.primaryTitle || it.originalTitle || it.Title || it.title,
      year: getYear(it),
      runtime: it.runtimeMinutes || it.RuntimeMinutes || it.runtime || null,
      description: it.description || it.plot || it.overview || it.storyline || "",
      imageUrl:
        (it.primaryImage && it.primaryImage.url) ||
        it.primaryImage ||
        (it.thumbnails && it.thumbnails[0]?.url) ||
        null,
      genres: it.genres || it.interests || null
    }));

    return {
      statusCode: 200,
      headers: { "content-type": "application/json", "cache-control": "public, max-age=300" },
      body: JSON.stringify({
        items,
        meta: {
          pooled: pooled.length,
          afterFilters: filtered.length,
          usedGenre: titleCase(Genre), MinYear, MaxYear,
          cursorExhausted: !cursor
        }
      })
    };
  } catch (err) {
    console.error("moviesSearch error:", err);
    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ items: [], meta: { error: String(err) } })
    };
  }
}
