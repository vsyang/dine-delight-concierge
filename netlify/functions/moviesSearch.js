// // netlify/functions/moviesSearch.js
// // Example RapidAPI movie search via server function.
// // Uses Movies Database (RapidAPI) as a demo; adjust as needed.

// export async function handler(event) {
//   try {
//     const key = import.meta.env.RAPIDAPI_KEY;

//     const qp = new URLSearchParams(event.queryStringParameters || {});
//     const q = (qp.get("q") || "").trim();
//     if (!q) {
//       return { statusCode: 400, body: JSON.stringify({ error: "Missing q" }) };
//     }

//     // Movies Database API: https://moviesdatabase.p.rapidapi.com/
//     // Title search endpoint pattern:
//     // /titles/search/title/{title}?exact=false&titleType=movie
//     const upstream = new URL(
//       `https://moviesdatabase.p.rapidapi.com/titles/search/title/${encodeURIComponent(q)}`
//     );
//     upstream.searchParams.set("exact", "false");
//     upstream.searchParams.set("titleType", "movie");

//     const response = await fetch(upstream, {
//       method: "GET",
//       headers: {
//         "x-rapidapi-key": key,
//         "x-rapidapi-host": "moviesdatabase.p.rapidapi.com",
//       },
//     });

//     const text = await response.text();
//     if (!response.ok) {
//       return {
//         statusCode: response.status,
//         body: JSON.stringify({ error: "Upstream error", upstream: text }),
//         headers: { "Content-Type": "application/json" },
//       };
//     }

//     let body;
//     try { body = JSON.parse(text); } catch { body = text; }

//     return {
//       statusCode: 200,
//       body: JSON.stringify(body),
//       headers: { "Content-Type": "application/json" },
//     };
//   } catch (err) {
//     return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
//   }
// }
