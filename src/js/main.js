document.addEventListener("DOMContentLoaded", () => {
    const favoritesList = JSON.parse(localStorage.getItem("favoriteList")) || [];
    const favorites = document.getElementById("favoritesBtn");
    
    if (!favoritesList.length) {
        favorites.style.display = "none";
    }
});