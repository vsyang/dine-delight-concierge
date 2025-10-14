import { getUberEats } from "./restaurant.js";
import { getMoviesByFilter } from "./movie.js";

// ----- helpers --------------------------------------------------------------

function randomPick(arr) {
  if (!Array.isArray(arr) || arr.length === 0) {
    throw new Error("No items available to pick from.");
  }
  const i = Math.floor(Math.random() * arr.length);
  return arr[i];
}

// Try common API shapes and return an array
function toArray(data) {
  if (Array.isArray(data)) return data;

  // Common container keys we might see
  const candidates = ["results", "items", "data", "restaurants", "stores", "list"];
  for (const key of candidates) {
    if (Array.isArray(data?.[key])) return data[key];
  }
  return [];
}

// ----- FOOD: select one -----------------------------------------------------

/**
 * Select exactly ONE restaurant by fetching from your UberEats fetcher.
 * @param {{ params?: Record<string, any>, direct?: boolean, signal?: AbortSignal }} [opts]
 *   Example: { params: { query: "sushi", limit: 30 } }
 */
export async function selectOneFood(opts = {}) {
  const { params = {}, direct, signal } = opts;
  const data = await getUberEats(params, { direct, signal });
  const arr = toArray(data);
  return randomPick(arr);
}

// ----- MOVIE: select one ----------------------------------------------------

/**
 * Select exactly ONE movie using getMoviesByFilter (requires MinYear & Genre).
 * @param {{ Genre?: string, MinYear?: number|string, Limit?: number, direct?: boolean, signal?: AbortSignal }} [opts]
 */
export async function selectOneMovie(opts = {}) {
  const {
    Genre = "Action",
    MinYear = 2020,
    Limit = 30,
    direct,
    signal,
  } = opts;

  const data = await getMoviesByFilter({ Genre, MinYear, Limit }, { direct, signal });
  const arr = toArray(data);
  return randomPick(arr);
}
