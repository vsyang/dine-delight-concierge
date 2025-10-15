async function ensureOk(res) {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const err = new Error(`HTTP ${res.status} ${res.statusText}`);
    err.status = res.status;
    err.body = text;
    throw err;
  } 
  return res.json();
}

async function getMoviesViaFunction({ MinYear, Genre, Limit = 5 }, { signal } = {}) {
  const qs = new URLSearchParams();
  if (MinYear != null) qs.set('MinYear', String(MinYear));
  if (Genre) qs.set('Genre', Genre);
  qs.set('Limit', String(Limit ?? 5));

  const tryPath = async (path) => {
    const resp = await fetch(`${path}?${qs}`, {
      signal,
      headers: { accept: 'application/json' }
    });
    return ensureOk(resp);
  };

  try {
    return await tryPath('/.netlify/functions/moviesSearch');
  } catch (err) {
    if (err?.status !== 404) throw err;
  }

  try {
    return await tryPath('/.netlify/functions/moviesFilter');
  } catch (err) {
    if (err?.status !== 404) throw err;
  }


  return getMoviesDirect({ MinYear, Genre, Limit }, { signal });
}

export async function getMoviesByFilter(params, { direct = MOVIES_DIRECT_DEFAULT, signal } = {}) {
  if (!params || !params.Genre) throw new Error('Genre is required');
  if (params.MinYear == null) throw new Error('MinYear is required');

  if (direct) return getMoviesDirect(params, { signal });
  return getMoviesViaFunction(params, { signal });
}
