// src/apiReader.js
const FN = "/.netlify/functions";

async function fetchJSON(url) {
  const r = await fetch(url, { headers: { Accept: "application/json" } });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

export const callFn = (name, params = {}) =>
  fetchJSON(`${FN}/${name}?${new URLSearchParams(params).toString()}`);

export { FN };
