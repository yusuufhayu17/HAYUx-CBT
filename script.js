        // Toggle mobile menu
        document.querySelector('.menu-toggle').addEventListener('click', function () {
            document.querySelector('.nav-links').classList.toggle('show');
        });

        // Search functionality
        const searchBar = document.getElementById('search-bar');
        const courseCards = document.querySelectorAll('.course-card');

        searchBar.addEventListener('input', function () {
            const searchTerm = this.value.toLowerCase();

            courseCards.forEach(card => {
                const courseTitle = card.querySelector('h3').textContent.toLowerCase();
                if (courseTitle.includes(searchTerm)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });

        // Add active class to clicked nav item
        const navItems = document.querySelectorAll('.nav-links a');
        navItems.forEach(item => {
            item.addEventListener('click', function () {
                navItems.forEach(nav => nav.classList.remove('active'));
                this.classList.add('active');

                // Close mobile menu after selection
                if (window.innerWidth <= 768) {
                    document.querySelector('.nav-links').classList.remove('show');
                }
            });
        });
