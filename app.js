// Filter and Search functionality
const searchInput = document.getElementById('searchInput');
const filterButtons = document.querySelectorAll('.filter-btn');
const algoCards = document.querySelectorAll('.algo-card');

let currentFilter = 'all';

// Filter function
function filterAlgorithms(filter) {
    currentFilter = filter;
    applyFilters();
}

// Search function
function searchAlgorithms(query) {
    applyFilters();
}

// Apply both filter and search
function applyFilters() {
    const searchQuery = searchInput.value.toLowerCase();

    algoCards.forEach(card => {
        const category = card.dataset.category;
        const status = card.dataset.status;
        const name = card.dataset.name.toLowerCase();

        // Check filter
        let matchesFilter = false;
        if(currentFilter === 'all') {
            matchesFilter = true;
        } else if(currentFilter === 'supervised') {
            matchesFilter = category === 'supervised';
        } else if(currentFilter === 'unsupervised') {
            matchesFilter = category === 'unsupervised';
        } else if(currentFilter === 'available') {
            matchesFilter = status === 'available';
        } else if(currentFilter === 'coming-soon') {
            matchesFilter = status === 'coming-soon';
        }

        // Check search
        const matchesSearch = name.includes(searchQuery);

        // Show/hide with animation
        if(matchesFilter && matchesSearch) {
            card.style.display = 'block';
            gsap.to(card,{
                duration: 0.3,
                opacity: 1,
                scale: 1,
                ease: 'power2.out'
            });
        } else {
            gsap.to(card,{
                duration: 0.3,
                opacity: 0,
                scale: 0.9,
                ease: 'power2.in',
                onComplete: () => {
                    card.style.display = 'none';
                }
            });
        }
    });
}

// Filter button click handlers
filterButtons.forEach(btn => {
    btn.addEventListener('click',() => {
        // Update active state
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Apply filter
        filterAlgorithms(btn.dataset.filter);
    });
});

// Search input handler
searchInput.addEventListener('input',(e) => {
    searchAlgorithms(e.target.value);
});

// GSAP Animations on page load
window.addEventListener('load',() => {
    // Animate title - simple fade from top
    gsap.from('h1',{
        duration: 0.8,
        y: -30,
        opacity: 0,
        ease: 'power2.out'
    });

    // Animate subtitle
    gsap.from('.hero-gradient p',{
        duration: 0.6,
        opacity: 0,
        delay: 0.2,
        ease: 'power1.out'
    });

    // Animate search and filter controls
    gsap.from('#searchInput',{
        duration: 0.6,
        y: 20,
        opacity: 0,
        delay: 0.3,
        ease: 'power2.out',
        clearProps: 'all'
    });

    gsap.from('.filter-btn',{
        duration: 0.5,
        y: 20,
        opacity: 0,
        stagger: 0.05,
        delay: 0.4,
        ease: 'power2.out',
        clearProps: 'all'
    });

    // Animate algorithm cards - the main issue
    gsap.from('.algo-card',{
        duration: 0.7,
        y: 30,
        opacity: 0,
        stagger: 0.06,
        ease: 'power2.out',
        delay: 0.5,
        onComplete: () => {
            // Clear properties after animation to prevent conflicts
            algoCards.forEach(card => {
                card.style.opacity = '';
                card.style.transform = '';
            });
        }
    });

    // Subtle orb float - minimal movement
    gsap.to('.orb-1',{
        duration: 10,
        x: 15,
        y: -15,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
    });

    gsap.to('.orb-2',{
        duration: 12,
        x: -20,
        y: 20,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
    });

    gsap.to('.orb-3',{
        duration: 11,
        x: 10,
        y: 10,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut'
    });
});

// Simple hover animation for cards - no scale
document.querySelectorAll('.algo-card').forEach(card => {
    card.addEventListener('mouseenter',() => {
        gsap.to(card,{
            duration: 0.3,
            y: -4,
            ease: 'power1.out'
        });
    });
    card.addEventListener('mouseleave',() => {
        gsap.to(card,{
            duration: 0.3,
            y: 0,
            ease: 'power1.out'
        });
    });
});
