// movie.js

async function getMoviesViaFunction({ MinYear, Genre, Limit = 5 }, { signal } = {}) {
  const qs = new URLSearchParams();
  if (MinYear != null) qs.set('MinYear', String(MinYear));
  if (Genre) qs.set('Genre', Genre);
  qs.set('Limit', String(Limit ?? 5));

  // helper to fetch a specific function path and run ensureOk
  const tryPath = async (path) => {
    const resp = await fetch(`${path}?${qs}`, {
      signal,
      headers: { accept: 'application/json' }
    });
    return ensureOk(resp); // will throw HttpError if not ok
  };

  // 1) moviesSearch (what preferences.js already uses)
  try {
    return await tryPath('/.netlify/functions/moviesSearch');
  } catch (err) {
    if (err?.status !== 404) throw err;
  }

  // 2) moviesFilter (legacy/alt name)
  try {
    return await tryPath('/.netlify/functions/moviesFilter');
  } catch (err) {
    if (err?.status !== 404) throw err;
  }

  // 3) fallback to direct RapidAPI if both functions are missing
  return getMoviesDirect({ MinYear, Genre, Limit }, { signal });
}

export async function getMoviesByFilter(params, { direct = MOVIES_DIRECT_DEFAULT, signal } = {}) {
  if (!params || !params.Genre) throw new Error('Genre is required');
  if (params.MinYear == null) throw new Error('MinYear is required');

  if (direct) return getMoviesDirect(params, { signal });
  return getMoviesViaFunction(params, { signal });
}
