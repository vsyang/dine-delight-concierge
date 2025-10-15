// src/js/movie.js
import { searchMovies, pickBestMatch } from "/moviesSearch.js";

function $(id) { return document.getElementById(id); }

async function handleSearch() {
  const title = $("movieTitle")?.value.trim();
  const year = $("movieYear")?.value.trim();
  const resultBox = $("movieResult");

  if (!title) {
    resultBox.textContent = "Please enter a movie title.";
    return;
  }

  resultBox.textContent = "Searching...";
  try {
    const movies = await searchMovies(title, year);
    const best = pickBestMatch(movies, title, year);

    if (!best) {
      resultBox.textContent = "No results found.";
      return;
    }

    resultBox.innerHTML = `
      <div style="display:flex;gap:12px;align-items:flex-start;">
        ${best.image ? `<img src="${best.image}" alt="${best.title}" style="width:120px;border-radius:8px;">` : ""}
        <div>
          <h3 style="margin:0 0 4px 0;">${best.title} (${best.year})</h3>
          <p style="margin:0 0 6px 0;"><small>Release: ${best.releaseDate || "N/A"}</small></p>
          <p style="margin:0;max-width:60ch;">${best.description || "No description."}</p>
        </div>
      </div>
    `;
    console.log("🎬 Best match:", best);
  } catch (err) {
    console.error(err);
    resultBox.textContent = "Error fetching movies. Check console.";
  }
}

window.addEventListener("DOMContentLoaded", () => {
  $("movieSearchBtn")?.addEventListener("click", handleSearch);
});
