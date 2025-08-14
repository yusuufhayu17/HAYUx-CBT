// Toggle mobile menu
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');

menuToggle.addEventListener('click', () => {
    navLinks.classList.toggle('show');
});

// Live search filter for courses
const searchBar = document.getElementById('search-bar');
const courses = document.querySelectorAll('.course-card');

searchBar.addEventListener('input', () => {
    const searchValue = searchBar.value.toLowerCase();
    courses.forEach(course => {
        const courseTitle = course.querySelector('h3').textContent.toLowerCase();
        if (courseTitle.includes(searchValue)) {
            course.style.display = '';
        } else {
            course.style.display = 'none';
        }
    });
});
