// export async function handler(event) {
//   try {
//     const key = process.env.RAPIDAPI_KEY; // secret lives on server
//     if (!key) {
//       return { statusCode: 500, body: JSON.stringify({ error: "Missing RAPIDAPI_KEY" }) };
//     }

//     // Read incoming query params from the browser request
//     const qp = new URLSearchParams(event.queryStringParameters || {});
//     const address = qp.get("address");
//     const resName = qp.get("resName");
//     const country = qp.get("country");
//     const city = qp.get("city");

//     // Build upstream UberEats RapidAPI URL
//     const upstreamUrl = `https://eater-ubereats.p.rapidapi.com/getUberEats?${new URLSearchParams({
//       address,
//       resName,
//       country,
//       city,
//     }).toString()}`;

//     const response = await fetch(upstreamUrl, {
//       method: "GET",
//       headers: {
//         "x-rapidapi-key": key,
//         "x-rapidapi-host": "eater-ubereats.p.rapidapi.com",
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

//     // Try to parse JSON; if not JSON, return raw text
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
