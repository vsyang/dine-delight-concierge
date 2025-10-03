// // // src/restaurant.js
// // import { callFn } from "./apiReader.js";

// export function getUberEats(params = {}) {
//   return callFn("getUberEats", params);
// }
// const key = process.env.RAPIDAPI_KEY; // secret lives on server
// const url = 'https://eater-ubereats.p.rapidapi.com/';
// const options = {
// 	method: 'GET',
// 	headers: {
// 		'x-rapidapi-key': 'fb24daa4c6msha6df40407c42d23p1aaad1jsn13da9abc02b5',
// 		'x-rapidapi-host': 'eater-ubereats.p.rapidapi.com'
// 	}
// };

// try {
// 	const response = await fetch(url, options);
// 	const result = await response.text();
// 	console.log(result);
// } catch (error) {
// 	console.error(error);
// }