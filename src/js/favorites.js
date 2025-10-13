// favorites.js

document.addEventListener("DOMContentLoaded", () => {
  const favoritesContainer = document.querySelector("#favoritesList");
  const favorites = JSON.parse(localStorage.getItem("favoriteList")) || [];

  if (!favorites.length) {
    favoritesContainer.innerHTML = `<p>No favorites yet ❤️</p>`;
    return;
  }

  const cards = favorites.map(fav => `
    <article class="card">
      ${fav.image ? `<img src="${fav.image}" alt="${fav.name}">` : ""}
      <div>
        <h3>${fav.name}</h3>
        ${fav.description ? `<p>${fav.description}</p>` : ""}
        <p class="muted">(${fav.type})</p>
      </div>
    </article>
  `).join("");

  favoritesContainer.innerHTML = `<div class="grid">${cards}</div>`;
});
