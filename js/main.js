const key = 'fb24daa4c6msha6df40407c42d23p1aaad1jsn13da9abc02b5'; // <-- put your real key here

async function restaurantFetch() {
const url = 'https://eater_ubereats.p.rapidapi.com/getUberEats?address=1401%20Alberni%20Street&resName=LE%20COQ%20FRIT&country=Canada&city=Vancouver';
const options = {
	method: 'GET',
	headers: {
		'x-rapidapi-key': 'fb24daa4c6msha6df40407c42d23p1aaad1jsn13da9abc02b5',
		'x-rapidapi-host': 'eater_ubereats.p.rapidapi.com'
	}
};

try {
	const response = await fetch(url, options);
	const result = await response.text();
	console.log(result);
} catch (error) {
	console.error(error);
}

}

restaurantFetch();
