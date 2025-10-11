import { getUberEats } from "./restaurant.js";

const CATEGORIES = [
  "Pizza","Burgers","Sushi","Tacos","Thai","Indian",
  "Chinese","BBQ","Vegan","Desserts","Breakfast"
];

const btn = document.getElementById("surpriseBtn");
const statusEl = document.getElementById("results");   // optional status area
const cardEl = document.getElementById("randomCard");  // result.html target

function sample(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function parseItems(data) {
  // API sometimes returns raw array, sometimes { data: [...] }
  return Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
}

function getZip() {
  const zEl = document.getElementById("zip");
  const z = zEl?.value?.trim();
  if (z) localStorage.setItem("ddc:lastZip", z);
  return z || localStorage.getItem("ddc:lastZip") || "80233";
}

function showStatus(msg) {
  if (statusEl) statusEl.innerHTML = `<p>${msg}</p>`;
}

function savePick(pick) {
  localStorage.setItem("ddc:pick", JSON.stringify(pick));
}

function renderPick(pick) {
  if (!cardEl) return;
  const { name, price = "", rating = "", imageUrl = "", category, zip } = pick;
  const img = imageUrl ? `<img src="${imageUrl}" alt="" onerror="this.style.display='none'">` : "";
  cardEl.innerHTML = `
    <article class="card">
      ${img}
      <h3>${name}</h3>
      <p>${price}${rating ? ` · ${rating}` : ""}</p>
      <p class="muted">Category: ${category} · ZIP: ${zip}</p>
    </article>
  `;
}

async function surpriseMe() {
  if (btn) btn.disabled = true;

  const zip = getZip();
  const tried = new Set();
  let lastErr = null;

  // Try up to 3 random categories in case a category returns nothing
  for (let i = 0; i < 3; i++) {
    const remaining = CATEGORIES.filter(c => !tried.has(c));
    if (!remaining.length) break;

    const category = sample(remaining);
    tried.add(category);

    showStatus(`Choosing a random category… <strong>${category}</strong> near ${zip}…`);

    try {
      const data = await getUberEats({ address: zip, resName: category });
      const items = parseItems(data);
      if (!items.length) {
        continue; // try another category
      }

      const picked = sample(items);
      const pick = {
        name: picked?.name || "Unnamed item",
        price: picked?.price || "",
        rating: picked?.rating || "",
        imageUrl: picked?.imageUrl || "",
        category,
        zip,
        ts: Date.now(),
      };

      savePick(pick);

      // If we're already on result.html (has #randomCard), render now.
      if (cardEl) {
        renderPick(pick);
        showStatus(`Here’s your surprise pick!`);
      } else {
        // Otherwise go to result page to display it.
        window.location.href = "/result.html";
      }
      return;
    } catch (e) {
      lastErr = e;
      // try next category
    }
  }

  const msg = lastErr?.message || "No results found after several tries.";
  showStatus(`Couldn’t find a pick right now. ${msg}`);
  if (btn) btn.disabled = false;
}

// If there’s a saved pick and the result card is present, render it immediately
(function boot() {
  if (cardEl) {
    try {
      const saved = JSON.parse(localStorage.getItem("ddc:pick") || "null");
      if (saved) renderPick(saved);
    } catch {}
  }
  if (btn) btn.addEventListener("click", (e) => {
    e.preventDefault();
    surpriseMe();
  });
})();
