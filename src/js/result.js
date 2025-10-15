// /src/js/results.js
import { selectOneFood, selectOneMovie } from "./randomGenerator.js";

const PLACEHOLDER_IMG = "/src/public/images/placeholder-generic.jpg";

function foodCardHTML(food) {
  const name = food.name ?? "Restaurant";
  const img = food.image || PLACEHOLDER_IMG;
  const desc = food.description || "";
  const cat  = food.category ? `Category: ${food.category}` : "";
  return `
    <article class="card" data-type="food" data-name="${name}">
      <button class="heart-btn" aria-pressed="false">♡</button>
      <img src="${img}" alt="${name}">
      <div class="content">
        <h2>${name}</h2>
        <p class="meta">${cat}</p>
        ${desc ? `<p class="desc">${desc}</p>` : ""}
      </div>
    </article>`;
}

function movieCardHTML(movie) {
  const title = movie.title ?? "Movie";
  const img = movie.image || PLACEHOLDER_IMG;
  const desc = movie.description || "";
  const meta = [
    movie.genre ? `Genre: ${movie.genre}` : "",
    movie.rating != null ? `· Rating: ${movie.rating}` : ""
  ].filter(Boolean).join(" ");
  return `
    <article class="card" data-type="movie" data-title="${title}">
      <button class="heart-btn" aria-pressed="false">♡</button>
      <img src="${img}" alt="${title}">
      <div class="content">
        <h2>${title}</h2>
        <p class="meta">${meta}</p>
        ${desc ? `<p class="desc">${desc}</p>` : ""}
      </div>
    </article>`;
}

function attachHeart(container) {
  const btn = container.querySelector(".heart-btn");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const card = btn.closest(".card");
    const type = card.dataset.type;
    const name = type === "movie" ? card.dataset.title : card.dataset.name;
    const image = card.querySelector("img")?.src || "";
    const description = card.querySelector(".desc")?.textContent || "";

    const key = "favoriteList";
    const favs = JSON.parse(localStorage.getItem(key) || "[]");
    const i = favs.findIndex(f => f.type === type && (f.name === name || f.title === name));

    if (i === -1) {
      favs.push({ type, name, title: type === "movie" ? name : undefined, image, description, addedAt: new Date().toISOString() });
      btn.textContent = "❤️";
      btn.setAttribute("aria-pressed", "true");
    } else {
      favs.splice(i, 1);
      btn.textContent = "♡";
      btn.setAttribute("aria-pressed", "false");
    }
    localStorage.setItem(key, JSON.stringify(favs));
  });
}

async function renderResults() {
  const foodMount = document.getElementById("foodMount");
  const movieMount = document.getElementById("movieMount");

  foodMount.innerHTML = `<p>Loading restaurant...</p>`;
  movieMount.innerHTML = `<p>Loading movie...</p>`;

  // Force functions for dev (prevents the RapidAPI 504 you’re seeing)
  const foodPromise  = selectOneFood({
    params: { address: "19122", resName: "sushi", limit: 30 },
    direct: false, // use /.netlify/functions/ubereats if available
  });

  const moviePromise = selectOneMovie({
    Genre: "Action",
    MinYear: 2020,
    Limit: 30,
    direct: false, // use /.netlify/functions/moviesSearch (your working one)
  });

  const [foodRes, movieRes] = await Promise.allSettled([foodPromise, moviePromise]);

  // FOOD
  if (foodRes.status === "fulfilled") {
    foodMount.innerHTML = foodCardHTML({ ...foodRes.value, type: "food" });
    attachHeart(foodMount);
  } else {
    console.error(foodRes.reason);
    foodMount.innerHTML = `<p>Could not load restaurant.</p>`;
  }

  // MOVIE
  if (movieRes.status === "fulfilled") {
    movieMount.innerHTML = movieCardHTML({ ...movieRes.value, type: "movie" });
    attachHeart(movieMount);
  } else {
    console.error(movieRes.reason);
    movieMount.innerHTML = `<p>Could not load movie.</p>`;
  }
}

window.addEventListener("DOMContentLoaded", renderResults);
