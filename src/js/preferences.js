import { getUberEats, HttpError } from "./restaurant.js";

const $ = (s) => document.querySelector(s);
const form = $("#foodForm");
const resultsEl = $("#results");
const btn = $("#resultsBtn");
const categorySel = $("#foodCategory");
const zipInput = $("#zip");

let currentController = null;
const progressTimers = [];

function setResults(html) {
  if (resultsEl) resultsEl.innerHTML = html;
}

function render(items = []) {
  if (!items?.length) {
    setResults(`<p>No results found. Try another category or ZIP.</p>`);
    return;
  }
  const cards = items.slice(0, 5).map(it => {
    const name = it?.name || "Unnamed item";
    const price = it?.price ? ` · ${it.price}` : "";
    const img = it?.imageUrl ? `<img src="${it.imageUrl}" alt="" onerror="this.style.display='none'">` : "";
    return `
      <article class="card">
        ${img}
        <h3>${name}</h3>
        <p>${price}</p>
      </article>
    `;
  }).join("");
  setResults(`<div class="grid">${cards}</div>`);
}

const cacheKey = (zip, cat) => `ddc:cache:${zip}:${cat}`;
function saveCache(zip, cat, items) {
  localStorage.setItem(cacheKey(zip, cat), JSON.stringify({ ts: Date.now(), items }));
}
function readCache(zip, cat) {
  try { return JSON.parse(localStorage.getItem(cacheKey(zip, cat))); }
  catch { return null; }
}

function friendly(err) {
  // Dev details to console
  console.error('Search error:', err);

  if (err.name === 'AbortError') return 'Search was canceled.';
  if (err instanceof HttpError) {
    const s = err.status;
    if (s === 401 || s === 403) return 'Authorization problem with the search service. Please try again shortly.';
    if (s === 404) return 'The search service endpoint was not found.';
    if (s === 400 || s === 422) return 'Please pick a category and enter a valid 5-digit ZIP.';
    if (s === 429) return 'We’re searching a bit too fast. Wait a minute and try again.';
    if (s >= 500 && s <= 504) return 'The food search service had a hiccup. Try again in a moment.';
    return `Unexpected error (code ${s}).`;
  }
  if (/NetworkError|Failed to fetch/i.test(err.message)) return 'Network error — please check your connection.';
  if (/Missing VITE_RAPIDAPI_KEY/i.test(err.message)) return 'Setup issue: missing API key (dev-only).';
  return 'Something went wrong. Please try again.';
}

function clearProgress() { progressTimers.splice(0).forEach(clearTimeout); }
function scheduleProgress(zip, cat) {
  clearProgress();
  progressTimers.push(setTimeout(() => {
    setResults(`<p>Searching for <strong>${cat}</strong> near ${zip}…</p>`);
  }, 0));
  progressTimers.push(setTimeout(() => {
    setResults(`<p>Still looking… the provider can be slow during busy times.</p>`);
  }, 8000));
  progressTimers.push(setTimeout(() => {
    setResults(`<p>Almost there… thanks for your patience.</p>`);
  }, 20000));
}

async function handleSubmit(e) {
  e.preventDefault();

  const category = categorySel?.value?.trim();
  const zip = zipInput?.value?.trim();

  if (!category || !/^\d{5}$/.test(zip || '')) {
    setResults(`<p>Please pick a category and enter a valid 5-digit ZIP.</p>`);
    return;
  }

  btn && (btn.disabled = true);

  // If we have something cached for this exact query, show it immediately as a placeholder
  const cached = readCache(zip, category);
  if (cached?.items?.length) {
    setResults(`<p class="muted">Showing saved results from earlier while we fetch fresh data…</p>`);
    render(cached.items);
  } else {
    setResults(`<p>Searching for <strong>${category}</strong> near ${zip}…</p>`);
  }

  // Make this request cancel previous ones
  currentController?.abort();
  currentController = new AbortController();

  scheduleProgress(zip, category);

  try {
    const data = await getUberEats(
      { address: zip, resName: category },
      { signal: currentController.signal }
    );
    const items = Array.isArray(data) ? data
                : Array.isArray(data?.data) ? data.data
                : Array.isArray(data?.results) ? data.results
                : [];

    clearProgress();
    render(items);
    saveCache(zip, category, items);
  } catch (err) {
    clearProgress();
    const msg = friendly(err);
    if (cached?.items?.length) {
      setResults(`<p>${msg} — showing saved results from earlier.</p>`);
      render(cached.items);
    } else {
      setResults(`<p>${msg}</p>`);
    }
  } finally {
    btn && (btn.disabled = false);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  form?.addEventListener("submit", handleSubmit);
});
