// randomGenerator.js
import { getUberEats } from "./restaurant.js";

const DEFAULTS = { zip: "80233", category: "Pizza" };

function readPrefs() {
  const saved = (() => { try { return JSON.parse(localStorage.getItem("ddc:prefs") || "{}"); } catch { return {}; } })();
  const category = document.getElementById("foodCategory")?.value?.trim() || saved.category || DEFAULTS.category;
  const zip = document.getElementById("zip")?.value?.trim() || saved.zip || DEFAULTS.zip;
  return { category, zip };
}
function savePrefs(p) { localStorage.setItem("ddc:prefs", JSON.stringify(p)); }

function loadCachedItems() {
  try {
    const obj = JSON.parse(localStorage.getItem("ddc:last"));
    return Array.isArray(obj?.items) ? obj.items : [];
  } catch { return []; }
}
function saveCache(items) {
  localStorage.setItem("ddc:last", JSON.stringify({ ts: Date.now(), items }));
}
function uniqByName(arr) {
  const seen = new Set();
  return arr.filter(it => {
    const key = (it?.name || "").toLowerCase().trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
function sample(arr) { return arr.length ? arr[Math.floor(Math.random() * arr.length)] : null; }
function renderStatus(msg) {
  const res = document.getElementById("results");
  if (res) res.innerHTML = `<p>${msg}</p>`;
}

async function ensureItems() {
  // 1) try cache
  let items = uniqByName(loadCachedItems());
  if (items.length) return items;

  // 2) fetch using current (or default) prefs
  const { category, zip } = readPrefs();
  savePrefs({ category, zip });
  renderStatus(`Searching for ${category} near ${zip}…`);

  try {
    const data = await getUberEats({ address: zip, resName: category });
    const list = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
    items = uniqByName(list);
    if (items.length) saveCache(items);
    return items;
  } catch (err) {
    console.error("SurpriseMe fetch failed:", err);
    throw new Error("We couldn’t reach the food service right now. Please try again shortly.");
  }
}

export async function chooseAndPersist() {
  const btn = document.getElementById("surpriseBtn");
  if (btn) { btn.disabled = true; btn.textContent = "Choosing…"; }

  try {
    const items = await ensureItems();
    const pick = sample(items);
    if (!pick) {
      renderStatus("No results yet. Try a different category or ZIP.");
      return;
    }

    localStorage.setItem("ddc:pick", JSON.stringify(pick));

    // if on result.html, render immediately; otherwise navigate there
    if (document.getElementById("randomCard")) {
      renderPick(pick);
    } else {
      window.location.href = "/result.html";
    }
  } catch (e) {
    renderStatus(e.message || "Something went wrong.");
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = "Surprise me"; }
  }
}

// ---------- result.html support ----------
function loadPick() {
  try { return JSON.parse(localStorage.getItem("ddc:pick")); } catch { return null; }
}

export function renderPick(pick) {
  const el = document.getElementById("randomCard");
  if (!el) return;

  if (!pick) {
    el.innerHTML = `<p class="muted">No pick yet. Go back and hit “Surprise me”.</p>`;
    return;
  }

  const name = pick?.name || "Unnamed";
  const price = pick?.price || "";
  const rating = pick?.rating || "";
  const img = pick?.imageUrl ? `<img src="${pick.imageUrl}" alt="" onerror="this.style.display='none'">` : "";

  el.innerHTML = `
    <article class="card">
      ${img}
      <h2>${name}</h2>
      <p>${[price, rating].filter(Boolean).join(" · ")}</p>
      <div style="margin-top:.5rem">
        <button id="rollAgain" type="button">Roll again</button>
      </div>
    </article>
  `;

  document.getElementById("rollAgain")?.addEventListener("click", async () => {
    try {
      const items = await ensureItems();
      const next = sample(items);
      if (next) {
        localStorage.setItem("ddc:pick", JSON.stringify(next));
        renderPick(next);
      }
    } catch (e) {
      renderStatus(e.message || "Couldn't roll again.");
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  // wire up the Surprise button on preferences.html
  document.getElementById("surpriseBtn")?.addEventListener("click", chooseAndPersist);

  // if we’re already on result.html, show any existing pick
  if (document.getElementById("randomCard")) {
    const pick = loadPick();
    if (pick) renderPick(pick);
  }
});
