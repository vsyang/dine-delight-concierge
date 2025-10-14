import { getUberEats, HttpError } from "./restaurant.js";

const $ = (s) => document.querySelector(s);

// ===== FOOD SEARCH =====
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

  // Only show items that have an image
  const cards = items
    .filter(it => {
      const imgSrc =
        it?.imageUrl || it?.image || it?.img || it?.thumbnail || it?.photoUrl || null;
      return !!imgSrc;
    })
    .slice(0, 5)
    .map(it => {
      const name = it?.name || it?.title || "Unnamed item";
      const price = it?.price ? ` · ${it.price}` : "";
      const imgSrc =
        it?.imageUrl || it?.image || it?.img || it?.thumbnail || it?.photoUrl || null;

      const img = `<img src="${imgSrc}" alt="Image of ${name}" onerror="this.style.display='none'">`;

      return `
        <article class="card" data-type="movie" data-title="${title}">
          <button class="heart-btn" aria-label="Add to favorites" data-type="movie">♡</button>
          ${img}
          <div class="card-content">
            <h3>${title}</h3>
            <p class="meta">${meta}</p>
            ${description ? `<p class="desc">${description}</p>` : ""}
          </div>
        </article>
      `;
    })
    .join("");

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
  console.error("Search error:", err);
  if (err.name === "AbortError") return "Search was canceled.";
  if (err instanceof HttpError) {
    const s = err.status;
    if (s === 401 || s === 403) return "Authorization problem with the search service.";
    if (s === 404) return "The search service endpoint was not found.";
    if (s === 400 || s === 422) return "Please pick a category and enter a valid 5-digit ZIP.";
    if (s === 429) return "Too many searches. Wait a minute and try again.";
    if (s >= 500 && s <= 504) return "The food search service had a hiccup. Try again soon.";
    return `Unexpected error (code ${s}).`;
  }
  if (/NetworkError|Failed to fetch/i.test(err.message)) return "Network error — check your connection.";
  if (/Missing VITE_RAPIDAPI_KEY/i.test(err.message)) return "Missing API key (dev-only).";
  return "Something went wrong. Please try again.";
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

  if (!category || !/^\d{5}$/.test(zip || "")) {
    setResults(`<p>Please pick a category and enter a valid 5-digit ZIP.</p>`);
    return;
  }

  btn && (btn.disabled = true);

  const cached = readCache(zip, category);
  if (cached?.items?.length) {
    setResults(`<p class="muted">Showing saved results while fetching fresh data…</p>`);
    render(cached.items);
  } else {
    setResults(`<p>Searching for <strong>${category}</strong> near ${zip}…</p>`);
  }

  currentController?.abort();
  currentController = new AbortController();
  scheduleProgress(zip, category);

  try {
    const data = await getUberEats(
      { address: zip, resName: category },
      { signal: currentController.signal }
    );
    const items = Array.isArray(data)
      ? data
      : Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data?.results)
      ? data.results
      : Array.isArray(data?.items)
      ? data.items
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

// ===== MOVIE SEARCH =====
const movieForm = $("#movieForm");
const movieResultsEl = $("#movieResults");
const movieBtn = $("#movieResultsBtn");
const genreSel = $("#movieGenre");
const yearInput = $("#minYear");

let movieController = null;
const movieProgressTimers = [];

function setMovieResults(html) {
  if (movieResultsEl) movieResultsEl.innerHTML = html;
}

function pickMovieImage(it) {
  const cands = [
    it?.primaryImage?.url,
    typeof it?.primaryImage === "string" ? it.primaryImage : null,
    ...(Array.isArray(it?.thumbnails) ? it.thumbnails.map(t => t?.url) : []),
    it?.posterUrl, it?.Poster, it?.poster, it?.imageUrl, it?.image, it?.img, it?.thumbnail
  ].filter(Boolean);
  return cands.find(u => typeof u === "string" && /^https?:\/\//i.test(u)) || null;
}

function renderMovies(items = []) {
  if (!items?.length) {
    setMovieResults(`<p>No movies found. Try another genre or year.</p>`);
    return;
  }

  // Only show movies that have a poster image
  const cards = items
    .filter(it => !!pickMovieImage(it))
    .slice(0, 5)
    .map(it => {
      const title =
        it?.primaryTitle || it?.originalTitle ||
        it?.Title || it?.title || it?.name || it?.original_title ||
        it?.titleText?.text || "Untitled";

      const year =
        it?.startYear || it?.Year || it?.year ||
        (it?.release_date ? new Date(it.release_date).getFullYear() : "");

      const rating = it?.Rating || it?.rating || it?.vote_average;
      const description = it?.description || it?.plot || it?.synopsis || "";
      const runtime = it?.runtimeMinutes || it?.RuntimeMinutes || it?.runtime || "";

      const poster = pickMovieImage(it);
      const img = `<img src="${poster}" alt="Poster of ${title}" title="${title}" onerror="this.style.display='none'">`;

      const meta = [
        year ? `(${year})` : "",
        rating ? `⭐ ${rating}` : "",
        runtime ? `⏱️ ${runtime} min` : ""
      ].filter(Boolean).join(" ");

      return `
        <article class="card" data-type="movie" data-title="${title}">
          <button class="heart-btn" aria-label="Add to favorites" data-type="movie">♡</button>
          ${img}
          <div class="card-content">
            <h3>${title}</h3>
            <p class="meta">${meta}</p>
            ${description ? `<p class="desc">${description}</p>` : ""}
          </div>
        </article>
      `;

    })
    .join("");

  setMovieResults(`<div class="grid">${cards}</div>`);
}

const moviesCacheKey = (minYear, genre) => `ddc:movies:${minYear}:${genre}`;
function saveMoviesCache(minYear, genre, items) {
  localStorage.setItem(moviesCacheKey(minYear, genre), JSON.stringify({ ts: Date.now(), items }));
}
function readMoviesCache(minYear, genre) {
  try { return JSON.parse(localStorage.getItem(moviesCacheKey(minYear, genre))); }
  catch { return null; }
}

function clearMovieProgress() { movieProgressTimers.splice(0).forEach(clearTimeout); }
function scheduleMovieProgress(minYear, genre) {
  clearMovieProgress();
  movieProgressTimers.push(setTimeout(() => {
    setMovieResults(`<p>Searching for <strong>${genre}</strong> movies since <strong>${minYear}</strong>…</p>`);
  }, 0));
  movieProgressTimers.push(setTimeout(() => {
    setMovieResults(`<p>Still looking… the movie provider can be slow during peak times.</p>`);
  }, 8000));
  movieProgressTimers.push(setTimeout(() => {
    setMovieResults(`<p>Almost there… thanks for your patience.</p>`);
  }, 20000));
}

async function handleMovieSubmit(e) {
  e.preventDefault();

  const genre = genreSel?.value?.trim();
  const minYear = yearInput?.value?.trim();

  if (!genre || !/^\d{4}$/.test(minYear || "")) {
    setMovieResults(`<p>Please pick a genre and enter a 4-digit minimum year (e.g., 2020).</p>`);
    return;
  }

  movieBtn && (movieBtn.disabled = true);

  const cached = readMoviesCache(minYear, genre);
  if (cached?.items?.length) {
    setMovieResults(`<p class="muted">Showing saved results while fetching fresh data…</p>`);
    renderMovies(cached.items);
  } else {
    setMovieResults(`<p>Searching for <strong>${genre}</strong> movies since <strong>${minYear}</strong>…</p>`);
  }

  movieController?.abort();
  movieController = new AbortController();
  scheduleMovieProgress(minYear, genre);

  try {
    const url = `/.netlify/functions/moviesSearch?${new URLSearchParams({ MinYear: minYear, Genre: genre })}`;
    const r = await fetch(url, { signal: movieController.signal, headers: { accept: "application/json" } });
    if (!r.ok) throw new HttpError(r.status, r.statusText);
    const data = await r.json();

    const items = Array.isArray(data)
      ? data
      : Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data?.results)
      ? data.results
      : Array.isArray(data?.data)
      ? data.data
      : [];

    clearMovieProgress();
    renderMovies(items);
    saveMoviesCache(minYear, genre, items);
  } catch (err) {
    clearMovieProgress();
    const msg = friendly(err);
    if (cached?.items?.length) {
      setMovieResults(`<p>${msg} — showing saved results from earlier.</p>`);
      renderMovies(cached.items);
    } else {
      setMovieResults(`<p>${msg}</p>`);
    }
  } finally {
    movieBtn && (movieBtn.disabled = false);
  }
}

// ===== EVENT LISTENERS =====
document.addEventListener("DOMContentLoaded", () => {
  form?.addEventListener("submit", handleSubmit);
  movieForm?.addEventListener("submit", handleMovieSubmit);
});

document.addEventListener("click", (e) => {
  if (e.target.classList.contains("heart-btn")) {
    const btn = e.target;
    const card = btn.closest(".card");
    const type = card.dataset.type; // 'food' or 'movie'

    const name = type === "movie" ? card.dataset.title : card.dataset.name;
    const image = card.querySelector("img")?.src || "";
    const description = card.querySelector(".desc")?.textContent || "";
    const storageKey = "favoriteList";

    const favorites = JSON.parse(localStorage.getItem(storageKey)) || [];

    const index = favorites.findIndex(
      (f) => f.name === name && f.type === type
    );

    if (index === -1) {
      favorites.push({ type, name, image, description });
      btn.textContent = "❤️";
    } else {
      favorites.splice(index, 1);
      btn.textContent = "♡";
    }

    localStorage.setItem(storageKey, JSON.stringify(favorites));
  }
});

