// --- START OF FILE script.js ---

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
<<<<<<< HEAD
        const targetElement = document.querySelector(this.getAttribute('href'));
        if (targetElement) {
            // Account for fixed navbar height when scrolling
            const navbarHeight = document.querySelector('.navbar')?.offsetHeight || 0;
            const elementPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
            const offsetPosition = elementPosition - navbarHeight;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
=======
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
>>>>>>> 80e0316312feba4b4f5d2b39c0a1158b7e0c8b43
    });
});

// Navbar scroll effect
const navbar = document.querySelector('.navbar');
let lastScrollTop = 0;

window.addEventListener('scroll', () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

<<<<<<< HEAD
    if (scrollTop > lastScrollTop && scrollTop > (navbar?.offsetHeight || 70)) { // Only hide if scrolled past navbar
=======
    if (scrollTop > lastScrollTop) {
>>>>>>> 80e0316312feba4b4f5d2b39c0a1158b7e0c8b43
        navbar.style.transform = 'translateY(-100%)';
    } else {
        navbar.style.transform = 'translateY(0)';
    }

<<<<<<< HEAD
    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop; // For Mobile or negative scrolling
=======
    lastScrollTop = scrollTop;
>>>>>>> 80e0316312feba4b4f5d2b39c0a1158b7e0c8b43
});

// Animate elements on scroll
const animateOnScroll = () => {
<<<<<<< HEAD
    const elements = document.querySelectorAll('.feature-card');
=======
    const elements = document.querySelectorAll('.feature-card, .version-card');
>>>>>>> 80e0316312feba4b4f5d2b39c0a1158b7e0c8b43

    elements.forEach(element => {
        const elementTop = element.getBoundingClientRect().top;
        const elementBottom = element.getBoundingClientRect().bottom;

        if (elementTop < window.innerHeight && elementBottom > 0) {
<<<<<<< HEAD
            // Check if opacity is not already 1 to avoid re-triggering transition
            if (element.style.opacity !== '1') {
                element.style.opacity = '1';
            }
=======
            element.style.opacity = '1';
>>>>>>> 80e0316312feba4b4f5d2b39c0a1158b7e0c8b43
        }
    });
};

<<<<<<< HEAD
// Set initial styles for animation (if you want them to fade in)
document.querySelectorAll('.feature-card').forEach(element => {
    element.style.opacity = '0'; // Start transparent
    element.style.transition = 'opacity 0.6s ease-out'; // Smooth transition for opacity
});


// Add scroll event listener
window.addEventListener('scroll', animateOnScroll);
window.addEventListener('load', () => {
    animateOnScroll(); // Initial check on load

    // Ensure navbar padding for content sections is correctly calculated after load
    const navbarHeight = document.querySelector('.navbar')?.offsetHeight || 70;
    const sectionsToPad = document.querySelectorAll('.hero, #features, #versions, .team-section');
    sectionsToPad.forEach(section => {
        if (section.classList.contains('hero')) {
            // Hero might have its own larger padding, adjust if necessary or set a base
            section.style.paddingTop = `${navbarHeight + 40}px`; // Example: navbar height + extra space
        } else {
            section.style.paddingTop = `${navbarHeight + 20}px`; // Example: navbar height + some buffer
        }
    });

});


// Button hover effects
document.querySelectorAll('.cta-button, .primary-button, .secondary-button').forEach(button => {
=======
// Set initial styles for animation
// document.querySelectorAll('.feature-card, .version-card').forEach(element => {
//     element.style.opacity = '0';
//     element.style.transition = 'all 0.6s ease-out';
// });

// Add scroll event listener
window.addEventListener('scroll', animateOnScroll);
window.addEventListener('load', animateOnScroll);

// Button hover effects
document.querySelectorAll('.cta-button, .primary-button, .secondary-button, .version-button').forEach(button => {
>>>>>>> 80e0316312feba4b4f5d2b39c0a1158b7e0c8b43
    button.addEventListener('mouseenter', () => {
        button.style.transform = 'translateY(-2px)';
    });

    button.addEventListener('mouseleave', () => {
        button.style.transform = 'translateY(0)';
    });
});

<<<<<<< HEAD
// Click handler for the main "Download XCE" button in the hero section
const heroDownloadButton = document.querySelector('.hero .primary-button');
if (heroDownloadButton) {
    heroDownloadButton.addEventListener('click', () => {
        alert('Thank you for downloading XCE! (This is a demo - no actual download will occur)');
    });
}


// Add parallax effect to hero section (optional, ensure it works with fixed navbar)
const hero = document.querySelector('.hero');
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    // Adjust parallax if needed, or remove if it causes issues with layout
    // hero.style.backgroundPositionY = -(scrolled * 0.3) + 'px'; // Reduced parallax effect
=======
// Add click handlers for version cards
document.querySelectorAll('.comparison-table .version-button').forEach(button => {
    button.addEventListener('click', () => {
        // Find the closest table header (th) containing the button
        const headerCell = button.closest('th');
        if (headerCell) {
            // Find the version title div within that header
            const versionTitleElement = headerCell.querySelector('.version-title');
            if (versionTitleElement) {
                const version = versionTitleElement.textContent;
                alert(`Thank you for your interest in ${version}! This is a demo website.`);
            } else {
                alert(`Thank you for your interest! This is a demo website.`); // Fallback
            }
        } else {
            alert(`Thank you for your interest! This is a demo website.`); // Fallback
        }
    });
});

// Add parallax effect to hero section
const hero = document.querySelector('.hero');
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    hero.style.backgroundPositionY = -(scrolled * 0.5) + 'px';
>>>>>>> 80e0316312feba4b4f5d2b39c0a1158b7e0c8b43
});

function createHeroParticle() {
    const particle = document.createElement('div');
    particle.classList.add('hero-particle');

<<<<<<< HEAD
    const heroWidth = hero.offsetWidth;
    particle.style.left = `${Math.random() * heroWidth}px`;

=======
    // Randomize horizontal position within the hero width
    const heroWidth = hero.offsetWidth;
    particle.style.left = `${Math.random() * heroWidth}px`;

    // Random size between 2px and 12px (for variety)
>>>>>>> 80e0316312feba4b4f5d2b39c0a1158b7e0c8b43
    const size = Math.random() * 10 + 2;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;

<<<<<<< HEAD
    const duration = Math.random() * 10 + 10;
    particle.style.animationDuration = `${duration}s`;

    const blurAmount = Math.random() * 3;
    particle.style.filter = `blur(${blurAmount}px)`;

    const glowIntensity = Math.random() * 10 + 5;
    particle.style.boxShadow = `0 0 ${glowIntensity}px rgba(var(--primary-color-rgb), 0.7)`;

    const heroParticlesContainer = document.querySelector('.hero-particles');
    if (heroParticlesContainer) {
        heroParticlesContainer.appendChild(particle);
    }


=======
    // Randomize animation duration to vary upward speed (shorter duration = faster speed)
    const duration = Math.random() * 10 + 10; // between 10 and 20 seconds
    particle.style.animationDuration = `${duration}s`;

    // Randomize blur amount for varying glow
    const blurAmount = Math.random() * 3;
    particle.style.filter = `blur(${blurAmount}px)`;

    // Randomize box-shadow intensity for extra glow effect
    const glowIntensity = Math.random() * 10 + 5; // between 5px and 15px
    particle.style.boxShadow = `0 0 ${glowIntensity}px rgba(var(--primary-color-rgb), 0.7)`;

    hero.appendChild(particle);

    // Remove the particle after the animation ends
>>>>>>> 80e0316312feba4b4f5d2b39c0a1158b7e0c8b43
    setTimeout(() => {
        particle.remove();
    }, duration * 1000);
}

<<<<<<< HEAD
if (document.querySelector('.hero-particles')) { // Only run if container exists
    setInterval(createHeroParticle, 500);
}


=======

// Spawn new particles every 500ms (adjust as needed)
setInterval(createHeroParticle, 500);

// Chess pieces array
>>>>>>> 80e0316312feba4b4f5d2b39c0a1158b7e0c8b43
const chessPieces = [
    'fa-chess-knight',
    'fa-chess-queen',
    'fa-chess-bishop',
    'fa-chess-rook',
    'fa-chess-pawn',
    'fa-chess-king'
];

<<<<<<< HEAD
let activePieces = [];
let timeElapsed = 0;
const MAX_PIECES = 20;
const BASE_SPAWN_INTERVAL = 3000;
const MIN_SPAWN_INTERVAL = 500;
const TIME_TO_MAX_SPEED = 300000;

=======
// Track active pieces and time
let activePieces = [];
let timeElapsed = 0;
const MAX_PIECES = 20; // Increased max pieces
const BASE_SPAWN_INTERVAL = 3000; // Base spawn interval in ms
const MIN_SPAWN_INTERVAL = 500; // Minimum spawn interval
const TIME_TO_MAX_SPEED = 300000; // 5 minutes to reach max speed

// Function to get random number between min and max
>>>>>>> 80e0316312feba4b4f5d2b39c0a1158b7e0c8b43
function getRandomNumber(min, max) {
    return Math.random() * (max - min) + min;
}

<<<<<<< HEAD
=======
// Function to calculate current spawn interval
>>>>>>> 80e0316312feba4b4f5d2b39c0a1158b7e0c8b43
function getCurrentSpawnInterval() {
    const progress = Math.min(timeElapsed / TIME_TO_MAX_SPEED, 1);
    return BASE_SPAWN_INTERVAL - (progress * (BASE_SPAWN_INTERVAL - MIN_SPAWN_INTERVAL));
}

<<<<<<< HEAD
=======
// Function to check if a position is occupied
>>>>>>> 80e0316312feba4b4f5d2b39c0a1158b7e0c8b43
function isPositionOccupied(x, y, size) {
    return activePieces.some(piece => {
        const distance = Math.sqrt(
            Math.pow(piece.x - x, 2) +
            Math.pow(piece.y - y, 2)
        );
        return distance < (size + piece.size) * 2;
    });
}

<<<<<<< HEAD
function findSafePosition(size) {
    let attempts = 0;
    let x, y;
    const floatingPiecesContainer = document.querySelector('.floating-pieces');
    if (!floatingPiecesContainer) return null;


    do {
        x = getRandomNumber(10, 90);
=======
// Function to find a safe starting position
function findSafePosition(size) {
    let attempts = 0;
    let x, y;

    do {
        x = getRandomNumber(10, 90); // Allow more edge spawning
>>>>>>> 80e0316312feba4b4f5d2b39c0a1158b7e0c8b43
        y = getRandomNumber(10, 90);
        attempts++;

        if (attempts > 30) return null;
    } while (isPositionOccupied(x, y, size));

    return { x, y };
}

<<<<<<< HEAD
=======
// Function to create a random chess piece
>>>>>>> 80e0316312feba4b4f5d2b39c0a1158b7e0c8b43
function createChessPiece() {
    if (activePieces.length >= MAX_PIECES) {
        return null;
    }

    const piece = document.createElement('i');
    const randomPiece = chessPieces[Math.floor(Math.random() * chessPieces.length)];
    piece.className = `fas ${randomPiece}`;

<<<<<<< HEAD
    const size = 2 + Math.random();
    const position = findSafePosition(size);
    if (!position) return null;

    const moveX = getRandomNumber(-150, 150) + 'px';
    const moveY = getRandomNumber(-150, 150) + 'px';
    const rotateDeg = getRandomNumber(-180, 180);
    const duration = getRandomNumber(10, 15);

=======
    // Random size between 2rem and 3rem
    const size = 2 + Math.random();

    // Find a safe starting position
    const position = findSafePosition(size);
    if (!position) return null;

    // Calculate random movement
    const moveX = getRandomNumber(-150, 150) + 'px';
    const moveY = getRandomNumber(-150, 150) + 'px';
    const rotateDeg = getRandomNumber(-180, 180);
    const duration = getRandomNumber(10, 15); // Slightly faster movement

    // Store piece data
>>>>>>> 80e0316312feba4b4f5d2b39c0a1158b7e0c8b43
    const pieceData = {
        element: piece,
        x: position.x,
        y: position.y,
        size: size,
        spawnTime: Date.now()
    };
    activePieces.push(pieceData);

<<<<<<< HEAD
=======
    // Apply styles
>>>>>>> 80e0316312feba4b4f5d2b39c0a1158b7e0c8b43
    piece.style.cssText = `
        position: absolute;
        font-size: ${size}rem;
        color: var(--primary-color);
        opacity: 0.2;
        top: ${position.y}%;
        left: ${position.x}%;
        animation: float ${duration}s linear forwards;
        --move-x: ${moveX};
        --move-y: ${moveY};
        --rotate-deg: ${rotateDeg}deg;
    `;

<<<<<<< HEAD
=======
    // Remove piece after animation ends using the animationend event
>>>>>>> 80e0316312feba4b4f5d2b39c0a1158b7e0c8b43
    piece.addEventListener('animationend', () => {
        piece.remove();
        activePieces = activePieces.filter(p => p.element !== piece);
    });

    return piece;
}

<<<<<<< HEAD
=======

// Function to add new chess pieces periodically
>>>>>>> 80e0316312feba4b4f5d2b39c0a1158b7e0c8b43
function addChessPieces() {
    const container = document.querySelector('.floating-pieces');
    if (!container) return;

<<<<<<< HEAD
=======
    // Try to add one new piece
>>>>>>> 80e0316312feba4b4f5d2b39c0a1158b7e0c8b43
    const piece = createChessPiece();
    if (piece) {
        container.appendChild(piece);
    }
    timeElapsed += getCurrentSpawnInterval();
    setTimeout(addChessPieces, getCurrentSpawnInterval());
}

<<<<<<< HEAD
document.addEventListener('DOMContentLoaded', () => {
    const floatingPiecesContainer = document.querySelector('.floating-pieces');
    if (floatingPiecesContainer) {
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const piece = createChessPiece();
                if (piece) {
                    floatingPiecesContainer.appendChild(piece);
                }
            }, i * 1000);
        }
        setTimeout(addChessPieces, 2000);
    }


    const savedTheme = localStorage.getItem('theme') || 'pink';
    document.documentElement.setAttribute('data-theme', savedTheme);

=======
// Start the process when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Start with a few pieces
    for (let i = 0; i < 3; i++) {
        setTimeout(() => {
            const piece = createChessPiece();
            if (piece) {
                document.querySelector('.floating-pieces').appendChild(piece);
            }
        }, i * 1000);
    }

    // Start the spawn loop
    setTimeout(addChessPieces, 2000);

    // Load saved theme
    const savedTheme = localStorage.getItem('theme') || 'pink';
    document.documentElement.setAttribute('data-theme', savedTheme);

    // Set active class on the saved theme button
>>>>>>> 80e0316312feba4b4f5d2b39c0a1158b7e0c8b43
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.theme === savedTheme) {
            btn.classList.add('active');
        }
    });
});

<<<<<<< HEAD
document.querySelectorAll('.theme-btn').forEach(button => {
    button.addEventListener('click', () => {
        document.querySelectorAll('.theme-btn').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        const theme = button.dataset.theme;
        document.documentElement.setAttribute('data-theme', theme);
=======
// Theme switching
document.querySelectorAll('.theme-btn').forEach(button => {
    button.addEventListener('click', () => {
        // Remove active class from all buttons
        document.querySelectorAll('.theme-btn').forEach(btn => btn.classList.remove('active'));
        // Add active class to clicked button
        button.classList.add('active');
        // Set theme
        const theme = button.dataset.theme;
        document.documentElement.setAttribute('data-theme', theme);
        // Save theme preference
>>>>>>> 80e0316312feba4b4f5d2b39c0a1158b7e0c8b43
        localStorage.setItem('theme', theme);
    });
});

<<<<<<< HEAD
=======
// Hamburger menu
>>>>>>> 80e0316312feba4b4f5d2b39c0a1158b7e0c8b43
const hamburgerMenu = document.querySelector('.hamburger-menu');
const navLinks = document.querySelector('.nav-links');

hamburgerMenu.addEventListener('click', () => {
    navLinks.classList.toggle('active');
});

<<<<<<< HEAD
document.addEventListener('click', (e) => {
    if (navLinks.classList.contains('active') && !hamburgerMenu.contains(e.target) && !navLinks.contains(e.target)) {
=======
// Close menu when clicking outside
document.addEventListener('click', (e) => {
    if (!hamburgerMenu.contains(e.target) && !navLinks.contains(e.target)) {
>>>>>>> 80e0316312feba4b4f5d2b39c0a1158b7e0c8b43
        navLinks.classList.remove('active');
    }
});