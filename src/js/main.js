document.addEventListener("DOMContentLoaded", () => {
    const favoritesList = JSON.parse(localStorage.getItem("favoriteList")) || [];
    const favorites = document.getElementById("favorites");
    
    if (!favoritesList.length) {
        favorites.style.display = "none";
    }
});