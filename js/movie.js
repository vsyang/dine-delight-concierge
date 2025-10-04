const FN = '/.netlify/functions';

export async function filterMovies(filters = {}) {
  const qString = new URLSearchParams(filters).toString();
  const results = await fetch(`${FN}/moviesFilter?${qString}`, { headers: { Accept: 'application/json' } });
  if (!results.ok) throw new Error(`HTTP ${results.status}`);
  return results.json();
}
