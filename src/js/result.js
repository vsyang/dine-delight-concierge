import { selectOneFood, selectOneMovie } from "./randomGenerator.js";

const PLACEHOLDER_IMG = "/src/public/images/placeholder-generic.jpg";
const LS_FAVORITES_KEY = "favoriteList";

// ---------- favorites helpers ----------
function loadFavorites() {
  try {
    return JSON.parse(localStorage.getItem(LS_FAVORITES_KEY)) ?? [];
  } catch {
    return [];
  }
}
function saveFavorites(list) {
  localStorage.setItem(LS_FAVORITES_KEY, JSON.stringify(list));
}
function keyOf(item) {
  if (item.type === "movie") return `movie::${item.id ?? item.title}`;
  return `food::${item.id ?? item.name}`;
}
function isFav(item, favorites) {
  const k = keyOf(item);
  return favorites.some(f => f._key === k);
}
function toggleFav(item, btn) {
  const favorites = loadFavorites();
  const k = keyOf(item);
  const idx = favorites.findIndex(f => f._key === k);

  if (idx === -1) {
    const payload = {
      _key: k,                 
      type: item.type,         // "food" | "movie"
      name: item.name ?? null, // for food
      title: item.title ?? null, // for movie
      image: item.image || "",
      description: item.description || "",
      category: item.category ?? null,
      genre: item.genre ?? null,
      rating: item.rating ?? null,
      addedAt: new Date().toISOString(),
    };
    favorites.push(payload);
    btn.textContent = "❤️";
    btn.setAttribute("aria-pressed", "true");
  } else {
    favorites.splice(idx, 1);
    btn.textContent = "♡";
    btn.setAttribute("aria-pressed", "false");
  }
  saveFavorites(favorites);
}

// ---------- card templates ----------
function foodCardHTML(food, faved) {
  const name = food.name ?? "Restaurant";
  const category = food.category ?? "";
  const img = food.image || PLACEHOLDER_IMG;
  const desc = food.description || "";
  const heart = faved ? "❤️" : "♡";
  const aria = faved ? "true" : "false";

  return `
    <article class="card" data-type="food" data-name="${name}">
      <img src="${img}" alt="${name}">
      <div class="content">
        <h2>${name}</h2>
        <p class="meta">${category ? `Category: ${category}` : ""}</p>
        <p class="desc">${desc}</p>
        <div class="actions">
          <button class="heart-btn" aria-label="Favorite ${name}" aria-pressed="${aria}">${heart}</button>
        </div>
      </div>
    </article>
  `;
}

function movieCardHTML(movie, faved) {
  const title = movie.title ?? "Movie";
  const genre = movie.genre ?? "";
  const rating = movie.rating != null ? ` · Rating: ${movie.rating}` : "";
  const img = movie.image || PLACEHOLDER_IMG;
  const desc = movie.description || "";
  const heart = faved ? "❤️" : "♡";
  const aria = faved ? "true" : "false";

  return `
    <article class="card" data-type="movie" data-title="${title}">
      <img src="${img}" alt="${title}">
      <div class="content">
        <h2>${title}</h2>
        <p class="meta">${genre ? `Genre: ${genre}` : ""}${rating}</p>
        <p class="desc">${desc}</p>
        <div class="actions">
          <button class="heart-btn" aria-label="Favorite ${title}" aria-pressed="${aria}">${heart}</button>
        </div>
      </div>
    </article>
  `;
}

// ---------- render ----------
async function renderResults() {
  const foodMount = document.getElementById("foodMount");
  const movieMount = document.getElementById("movieMount");

  foodMount.innerHTML = `<p>Loading restaurant...</p>`;
  movieMount.innerHTML = `<p>Loading movie...</p>`;

  try {
    const [food, movie] = await Promise.all([
      selectOneFood({ /* e.g., category: "sushi" */ }),
      selectOneMovie({ /* e.g., genre: "Action" */ }),
    ]);

    const favorites = loadFavorites();

    const foodFaved = isFav(food, favorites);
    const movieFaved = isFav(movie, favorites);

    foodMount.innerHTML = foodCardHTML(food, foodFaved);
    movieMount.innerHTML = movieCardHTML(movie, movieFaved);

    // Wire heart buttons (no saving until clicked)
    const foodHeart = foodMount.querySelector(".heart-btn");
    const movieHeart = movieMount.querySelector(".heart-btn");

    foodHeart.addEventListener("click", () => toggleFav({ ...food, type: "food" }, foodHeart));
    movieHeart.addEventListener("click", () => toggleFav({ ...movie, type: "movie" }, movieHeart));
  } catch (err) {
    console.error(err);
    foodMount.innerHTML = `<p>Could not load restaurant.</p>`;
    movieMount.innerHTML = `<p>Could not load movie.</p>`;
  }
}

window.addEventListener("DOMContentLoaded", renderResults);
