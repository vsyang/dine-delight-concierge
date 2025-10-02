// Fetch information from MovieDatabase
async function searchMovie(q) {
  const res = await fetch(`/api/movies/search?q=${encodeURIComponent(q)}`);
  if (!res.ok) throw new Error('Movie API error');
  return res.json();
}

// Fetch information from UberEats
async function getUberEats(params) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`/api/ubereats?${qs}`);
  if (!res.ok) throw new Error('UberEats API error');
  return res.json();
}

// Examples:
searchMovie('Incep').then(console.log).catch(console.error);

getUberEats({
  address: '1401 Alberni Street',
  resName: 'LE COQ FRIT',
  country: 'Canada',
  city: 'Vancouver'
}).then(console.log).catch(console.error);
