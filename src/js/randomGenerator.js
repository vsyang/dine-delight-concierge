import { getUberEats } from "./restaurant.js";
import { getMoviesByFilter } from "./movie.js";

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const log = (...args) => console.info("[randomGenerator]", ...args);

function toArray(data) {
  if (Array.isArray(data)) return data;
  for (const k of ["results", "items", "data", "restaurants", "stores", "list"]) {
    if (Array.isArray(data?.[k])) return data[k];
  }
  return [];
}

function hasHttpImage(url) {
  return typeof url === "string" && /^https?:\/\//i.test(url);
}

// ---------- NORMALIZERS ----------
function normalizeRestaurant(it = {}) {
  const image =
    it.imageUrl || it.image || it.img || it.thumbnail || it.photoUrl || it.photo || "";
  return {
    type: "food",
    id: it.id ?? it.storeId ?? it.slug ?? undefined,
    name: it.name || it.title || "Unnamed restaurant",
    category: it.category || it.cuisine || "",
    description: it.description || it.desc || "",
    image: hasHttpImage(image) ? image : "", 
  };
}

function pickMovieImage(it = {}) {
  const cands = [
    it?.primaryImage?.url,
    typeof it?.primaryImage === "string" ? it.primaryImage : null,
    it?.posterUrl, it?.Poster, it?.poster, it?.imageUrl, it?.image, it?.img, it?.thumbnail,
    ...(Array.isArray(it?.thumbnails) ? it.thumbnails.map(t => t?.url) : []),
    it?.poster_path ? `https://image.tmdb.org/t/p/w500${it.poster_path}` : null,
  ].filter(Boolean);
  return cands.find(u => hasHttpImage(u)) || "";
}

function normalizeMovie(it = {}) {
  const title =
    it.primaryTitle || it.originalTitle || it.Title || it.title || it.name ||
    it.original_title || it?.titleText?.text || "Untitled";
  const description = it.description || it.overview || it.plot || it.synopsis || "";
  const genre = it.genre || it.Genre || (Array.isArray(it.genres) ? it.genres[0] : "");
  const rating = it.Rating ?? it.rating ?? it.vote_average ?? null;

  return {
    type: "movie",
    id: it.id ?? it.tconst ?? undefined,
    title,
    description,
    genre,
    rating,
    image: pickMovieImage(it),
  };
}

// ---------- PICK WITH IMAGE ----------
function pickWithImage(list, normalize) {
  if (!Array.isArray(list) || list.length === 0) {
    throw new Error("No items available to pick from.");
  }
    
  const start = Math.floor(Math.random() * list.length);
  for (let k = 0; k < list.length; k++) {
    const idx = (start + k) % list.length;
    const norm = normalize(list[idx] ?? {});
    if (hasHttpImage(norm.image)) return norm; 
  }

  return normalize(list[start]);
}

// ---------- RETRY + FALLBACK ----------
function isRetryable(err) {
  const s = err?.status;
  return (
    /NetworkError|Failed to fetch|timeout/i.test(err?.message || "") ||
    s === 429 || s === 408 || s === 425 || s === 423 ||
    (s >= 500 && s <= 504)
  );
}

async function fetchWithFallback(callFn, { preferDirect = false, signal, triesPerMode = 2, backoffMs = 700 } = {}) {
  const modes = preferDirect ? [true, false] : [false, true]; // true=direct, false=function

  for (const direct of modes) {
    let attempt = 0;
    while (attempt < triesPerMode) {
      try {
        log(`mode=${direct ? "direct" : "function"} attempt=${attempt + 1}`);
        return await callFn({ direct, signal });
      } catch (err) {
        log(`error in mode=${direct ? "direct" : "function"} attempt=${attempt + 1}`, err);
        attempt++;
        if (!direct && err?.status === 404) break;                        
        if (direct && (err?.status === 401 || err?.status === 403)) break; 
        if (attempt < triesPerMode && isRetryable(err)) {
          await sleep(backoffMs * attempt);
          continue;
        }
        throw err;
      }
    }
  }
  throw new Error("All fetch modes failed.");
}

// ---------- PUBLIC: pick one FOOD (with image) ----------
export async function selectOneFood(opts = {}) {
  const {
    params = { address: "19122", resName: "sushi", limit: 30 },
    // while function returns 500s, prefer direct; flip to false when fixed
    preferDirect = true,
    signal,
  } = opts;

  const data = await fetchWithFallback(
    ({ direct, signal }) => getUberEats(params, { direct, signal }),
    { preferDirect, signal }
  );
  const arr = toArray(data);
  return pickWithImage(arr, normalizeRestaurant);
}

// ---------- PUBLIC: pick one MOVIE (with image) ----------
export async function selectOneMovie(opts = {}) {
  const {
    Genre = "Action",
    MinYear = 2020,
    Limit = 30,
    preferDirect = false, 
    signal,
  } = opts;

  const data = await fetchWithFallback(
    ({ direct, signal }) => getMoviesByFilter({ Genre, MinYear, Limit }, { direct, signal }),
    { preferDirect, signal }
  );
  const arr = toArray(data);
  return pickWithImage(arr, normalizeMovie);
}
