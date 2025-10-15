const KEY = import.meta.env.VITE_RAPIDAPI_KEY;  
const BASE_URL = "https://imdb236.p.rapidapi.com/api/imdb/search";

const headers = {
  "x-rapidapi-key": KEY,
  "x-rapidapi-host": "imdb236.p.rapidapi.com",
};

export async function searchMovies(query, year) {
  if (!KEY) throw new Error("Missing VITE_RAPIDAPI_KEY in .env");

  const params = new URLSearchParams({
    type: "movie",
    startYearFrom: year || "1900",
    sortOrder: "ASC",
    sortField: "id",
    query, 
  });

  const url = `${BASE_URL}?${params.toString()}`;
  console.log("Fetching:", url);

  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`RapidAPI error ${res.status}`);
  const data = await res.json();

  const list = data.results || data.data || [];
  return list.map((m) => ({
    id: m.id,
    title: m.title || m.name || "Untitled",
    year: m.year || (m.releaseDate ? m.releaseDate.slice(0, 4) : "—"),
    releaseDate: m.releaseDate || "",
    description: m.plot || m.description || "",
    image: m.imageUrl || m.poster || "",
  }));
}


export function pickBestMatch(results, query, year) {
  if (!Array.isArray(results) || !results.length) return null;
  const q = query.trim().toLowerCase();

  const exact = results.find(
    (r) => r.title.toLowerCase() === q && (!year || String(r.year) === String(year))
  );
  if (exact) return exact;

  const byTitle = results.find((r) =>
    r.title.toLowerCase().includes(q)
  );
  return byTitle || results[0];
}
