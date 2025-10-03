// src/movie.js
import { callFn } from "./apiReader.js";

export function searchMovie(q) {
  return callFn("moviesSearch", { q });
}
