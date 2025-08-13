document.addEventListener("DOMContentLoaded", function () {
    const searchInput = document.getElementById("search-bar");
    const courseCards = document.querySelectorAll(".course-card");

    searchInput.addEventListener("input", function () {
        const query = searchInput.value.toLowerCase();

        courseCards.forEach(card => {
            const title = card.querySelector("h3").textContent.toLowerCase();
            card.style.display = title.includes(query) ? "block" : "none";
        });
    });
});
document.querySelector('.menu-toggle').addEventListener('click', function() {
    document.querySelector('.nav-links').classList.toggle('show');
  });