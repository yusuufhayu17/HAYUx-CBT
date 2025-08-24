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

    // Animated counter for hero stats
    function animateCounter() {
      const counters = document.querySelectorAll('.stat-number[data-count]');
      const speed = 200;
      
      counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-count'));
        const count = parseInt(counter.innerText);
        const increment = Math.ceil(target / speed);
        
        if (count < target) {
          counter.innerText = count + increment;
          setTimeout(() => animateCounter(counter), 1);
        } else {
          counter.innerText = target;
        }
      });
    }

    // Manual visitor count functionality
    function updateVisitorCount() {
      // MANUALLY SET YOUR VISITOR COUNT HERE
      // Change this number to update the visitor count
      const manualCount = 2847; // <-- EDIT THIS NUMBER
      
      // Update the display
      document.getElementById('student-counter').textContent = manualCount.toLocaleString();
      document.getElementById('student-counter').setAttribute('data-count', manualCount);
    }

    // Initialize when page loads
    window.addEventListener('load', function() {
      animateCounter();
      updateVisitorCount();
    });
