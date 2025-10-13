export class HttpError extends Error {
  constructor(status, message, payload) {
    super(message || `HTTP ${status}`);
    this.name = 'HttpError';
    this.status = status;
    this.payload = payload; 
  }
}

const DIRECT_DEFAULT = import.meta.env.VITE_UBEREATS_DIRECT === 'true';
const RAPID_KEY = import.meta.env.VITE_RAPIDAPI_KEY; //Had to do this to get it to work in Netlify

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

async function getDirect({ address, resName, country = 'United States' }, { signal } = {}) {
  if (!RAPID_KEY) throw new Error('Missing VITE_RAPIDAPI_KEY');
  const qs = new URLSearchParams({ address, resName, country });
  const resp = await fetch(`https://eater_ubereats.p.rapidapi.com/getUberEats?${qs}`, {
    method: 'GET',
    signal,
    headers: {
      'X-RapidAPI-Key': RAPID_KEY,
      'X-RapidAPI-Host': 'eater_ubereats.p.rapidapi.com',
      'accept': 'application/json'
    }
  });
  return ensureOk(resp);
}

async function getViaFunction({ address, resName }, { signal } = {}) {
  const qs = new URLSearchParams({ address, resName });
  const resp = await fetch(`/.netlify/functions/ubereats?${qs}`, {
    signal,
    headers: { accept: 'application/json' }
  });
  return ensureOk(resp);
}

export async function getUberEats(params, { direct = DIRECT_DEFAULT, signal } = {}) {
  return direct ? getDirect(params, { signal }) : getViaFunction(params, { signal });
}
