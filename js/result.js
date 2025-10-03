import { searchMovie, getUberEats } from './apiReader.js';

const data = await searchMovie('Inception'); // top-level await works in module scripts
console.log(data);
