export class HttpError extends Error {
  constructor(status, message, payload) {
    super(message || `HTTP ${status}`);
    this.name = 'HttpError';
    this.status = status;
    this.payload = payload;
  }
}

async function parseMaybeJSON(resp) {
  const text = await resp.text();
  try { return { data: JSON.parse(text), raw: text }; }
  catch { return { data: null, raw: text }; }
}

async function ensureOk(resp) {
  if (!resp.ok) {
    const { data, raw } = await parseMaybeJSON(resp);
    const msg = data?.message || data?.msg || data?.error || resp.statusText;
    throw new HttpError(resp.status, msg, data ?? raw);
  }
  return resp.json();
}

const MOVIES_DIRECT_DEFAULT = import.meta.env.VITE_MOVIES_DIRECT === 'true';
const RAPID_KEY = import.meta.env.VITE_RAPIDAPI_KEY;
const MOVIES_HOST = 'moviedatabase8.p.rapidapi.com';
const MOVIES_URL = `https://${MOVIES_HOST}/Filter`;

/**
 * DIRECT call to RapidAPI
 * @param {{ MinYear: number|string, Genre: string, Limit?: number }} params
 * @param {{ signal?: AbortSignal }} [opts]
 */
async function getMoviesDirect({ MinYear, Genre, Limit = 5 }, { signal } = {}) {
  if (!RAPID_KEY) throw new Error('Missing VITE_RAPIDAPI_KEY');

  const qs = new URLSearchParams();
  if (MinYear != null) qs.set('MinYear', String(MinYear));
  if (Genre) qs.set('Genre', Genre);
  qs.set('Limit', String(Limit ?? 5));

  const resp = await fetch(`${MOVIES_URL}?${qs}`, {
    method: 'GET',
    signal,
    headers: {
      'X-RapidAPI-Key': RAPID_KEY,
      'X-RapidAPI-Host': MOVIES_HOST,
      'accept': 'application/json'
    }
  });

  return ensureOk(resp);
}

/**
 * VIA Netlify function proxy (create /.netlify/functions/moviesFilter)
 * @param {{ MinYear: number|string, Genre: string, Limit?: number }} params
 * @param {{ signal?: AbortSignal }} [opts]
 */
async function getMoviesViaFunction({ MinYear, Genre, Limit = 5 }, { signal } = {}) {
  const qs = new URLSearchParams();
  if (MinYear != null) qs.set('MinYear', String(MinYear));
  if (Genre) qs.set('Genre', Genre);
  qs.set('Limit', String(Limit ?? 5));

  const resp = await fetch(`/.netlify/functions/moviesFilter?${qs}`, {
    signal,
    headers: { accept: 'application/json' }
  });

  return ensureOk(resp);
}

/**
 * Public API
 * @param {{ MinYear: number|string, Genre: string, Limit?: number }} params
 * @param {{ direct?: boolean, signal?: AbortSignal }} [opts]
 */
export async function getMoviesByFilter(params, { direct = MOVIES_DIRECT_DEFAULT, signal } = {}) {
  // minimal guardrails
  if (!params || !params.Genre) throw new Error('Genre is required');
  if (params.MinYear == null) throw new Error('MinYear is required');

  return direct
    ? getMoviesDirect(params, { signal })
    : getMoviesViaFunction(params, { signal });
}

// Example usage:
// const data = await getMoviesByFilter({ MinYear: 2020, Genre: 'Action' }); // Limit defaults to 5
// console.log(data);
