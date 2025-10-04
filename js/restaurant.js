const FN = "/.netlify/functions"; // FN for functions in netlify

export async function getUberEats(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const r = await fetch(`${FN}/getUberEats?${qs}`, { headers: { Accept: "application/json" } });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}
