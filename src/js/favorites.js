function sortByType(items) {
  const groups = { food: [], movie: [], other: [] };
  for (const x of items || []) {
    const t = (x.type || "").toLowerCase();
    if (t === "food") groups.food.push(x);
    else if (t === "movie") groups.movie.push(x);
    else groups.other.push(x);
  }
  const byName = (a, b) => (a.name || "").localeCompare(b.name || "");
  groups.food.sort(byName);
  groups.movie.sort(byName);
  groups.other.sort(byName);
  return groups;
}

function renderCards(items = []) {
  if (!items.length) return "";
  return items.map(fav => `
    <article class="card">
      ${fav.image ? `<img src="${fav.image}" alt="${fav.name}" onerror="this.style.display='none'">` : ""}
      <div>
        <h3>${fav.name || "Untitled"}</h3>
        ${fav.description ? `<p>${fav.description}</p>` : ""}
        <p class="muted">(${fav.type || "other"})</p>
      </div>
    </article>
  `).join("");
}

document.addEventListener("DOMContentLoaded", () => {
  const foodListEl   = document.querySelector("#foodList");
  const moviesListEl = document.querySelector("#moviesList");

  const favData = JSON.parse(localStorage.getItem("favoriteList") || "[]");
  const { food, movie} = sortByType(favData);

  foodListEl.innerHTML =
    food.length ? `<div class="grid">${renderCards(food)}</div>` :
    `<p class="muted">No food favorites yet.</p>`;

  moviesListEl.innerHTML =
    movie.length ? `<div class="grid">${renderCards(movie)}</div>` :
    `<p class="muted">No movie favorites yet.</p>`;
});

