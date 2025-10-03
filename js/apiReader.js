// When site + functions are both on Netlify, relative paths just work.
export async function searchMovie(q) {
  const res = await fetch(`/.netlify/functions/movies-search?q=${encodeURIComponent(q)}`);
  if (!res.ok) throw new Error('Movie API error');
  return res.json();
}

export async function getUberEats(params) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`/.netlify/functions/ubereats?${qs}`);
  if (!res.ok) throw new Error('UberEats API error');
  return res.json();
}

// Example quick test:
searchMovie('Incep').then(console.log).catch(console.error);
