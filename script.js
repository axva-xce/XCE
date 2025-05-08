
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});
const navbar = document.querySelector('.navbar');
let lastScrollTop = 0;
window.addEventListener('scroll', () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    if (scrollTop > lastScrollTop) {
        navbar.style.transform = 'translateY(-100%)';
    } else {
        navbar.style.transform = 'translateY(0)';
    }
    lastScrollTop = scrollTop;
});
const animateOnScroll = () => {
    const elements = document.querySelectorAll('.feature-card, .version-card');
    elements.forEach(element => {
        const elementTop = element.getBoundingClientRect().top;
        const elementBottom = element.getBoundingClientRect().bottom;
        if (elementTop < window.innerHeight && elementBottom > 0) {
            element.style.opacity = '1';
        }
    });
};

window.addEventListener('scroll', animateOnScroll);
window.addEventListener('load', animateOnScroll);
document.querySelectorAll('.cta-button, .primary-button, .secondary-button, .version-button').forEach(button => {
    button.addEventListener('mouseenter', () => {
        button.style.transform = 'translateY(-2px)';
    });
    button.addEventListener('mouseleave', () => {
        button.style.transform = 'translateY(0)';
    });
});
document.querySelectorAll('.comparison-table .version-button').forEach(button => {
    button.addEventListener('click', () => {
        const headerCell = button.closest('th');
        if (headerCell) {
            const versionTitleElement = headerCell.querySelector('.version-title');
            if (versionTitleElement) {
                const version = versionTitleElement.textContent;
                alert(`Thank you for your interest in ${version}! This is a demo website.`);
            } else {
                alert(`Thank you for your interest! This is a demo website.`);
            }
        } else {
            alert(`Thank you for your interest! This is a demo website.`);
        }
    });
});
const hero = document.querySelector('.hero');
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    hero.style.backgroundPositionY = -(scrolled * 0.5) + 'px';
});
function createHeroParticle() {
    const particle = document.createElement('div');
    particle.classList.add('hero-particle');
    const heroWidth = hero.offsetWidth;
    particle.style.left = `${Math.random() * heroWidth}px`;
    const size = Math.random() * 10 + 2;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    const duration = Math.random() * 10 + 10;
    particle.style.animationDuration = `${duration}s`;
    const blurAmount = Math.random() * 3;
    particle.style.filter = `blur(${blurAmount}px)`;
    const glowIntensity = Math.random() * 10 + 5;
    particle.style.boxShadow = `0 0 ${glowIntensity}px rgba(var(--primary-color-rgb), 0.7)`;
    hero.appendChild(particle);
    setTimeout(() => {
        particle.remove();
    }, duration * 1000);
}
setInterval(createHeroParticle, 500);
const chessPieces = [
    'fa-chess-knight',
    'fa-chess-queen',
    'fa-chess-bishop',
    'fa-chess-rook',
    'fa-chess-pawn',
    'fa-chess-king'
];
let activePieces = [];
let timeElapsed = 0;
const MAX_PIECES = 20;
const BASE_SPAWN_INTERVAL = 3000;
const MIN_SPAWN_INTERVAL = 500;
const TIME_TO_MAX_SPEED = 300000;
function getRandomNumber(min, max) {
    return Math.random() * (max - min) + min;
}
function getCurrentSpawnInterval() {
    const progress = Math.min(timeElapsed / TIME_TO_MAX_SPEED, 1);
    return BASE_SPAWN_INTERVAL - (progress * (BASE_SPAWN_INTERVAL - MIN_SPAWN_INTERVAL));
}
function isPositionOccupied(x, y, size) {
    return activePieces.some(piece => {
        const distance = Math.sqrt(
            Math.pow(piece.x - x, 2) +
            Math.pow(piece.y - y, 2)
        );
        return distance < (size + piece.size) * 2;
    });
}
function findSafePosition(size) {
    let attempts = 0;
    let x, y;
    do {
        x = getRandomNumber(10, 90);
        y = getRandomNumber(10, 90);
        attempts++;
        if (attempts > 30) return null;
    } while (isPositionOccupied(x, y, size));
    return { x, y };
}
function createChessPiece() {
    if (activePieces.length >= MAX_PIECES) {
        return null;
    }
    const piece = document.createElement('i');
    const randomPiece = chessPieces[Math.floor(Math.random() * chessPieces.length)];
    piece.className = `fas ${randomPiece}`;
    const size = 2 + Math.random();
    const position = findSafePosition(size);
    if (!position) return null;
    const moveX = getRandomNumber(-150, 150) + 'px';
    const moveY = getRandomNumber(-150, 150) + 'px';
    const rotateDeg = getRandomNumber(-180, 180);
    const duration = getRandomNumber(10, 15);
    const pieceData = {
        element: piece,
        x: position.x,
        y: position.y,
        size: size,
        spawnTime: Date.now()
    };
    activePieces.push(pieceData);
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
    piece.addEventListener('animationend', () => {
        piece.remove();
        activePieces = activePieces.filter(p => p.element !== piece);
    });
    return piece;
}
function addChessPieces() {
    const container = document.querySelector('.floating-pieces');
    if (!container) return;
    const piece = createChessPiece();
    if (piece) {
        container.appendChild(piece);
    }
    timeElapsed += getCurrentSpawnInterval();
    setTimeout(addChessPieces, getCurrentSpawnInterval());
}
document.addEventListener('DOMContentLoaded', () => {
    for (let i = 0; i < 3; i++) {
        setTimeout(() => {
            const piece = createChessPiece();
            if (piece) {
                document.querySelector('.floating-pieces').appendChild(piece);
            }
        }, i * 1000);
    }
    setTimeout(addChessPieces, 2000);
    const savedTheme = localStorage.getItem('theme') || 'pink';
    document.documentElement.setAttribute('data-theme', savedTheme);
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.theme === savedTheme) {
            btn.classList.add('active');
        }
    });
});
document.querySelectorAll('.theme-btn').forEach(button => {
    button.addEventListener('click', () => {
        document.querySelectorAll('.theme-btn').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        const theme = button.dataset.theme;
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    });
});
const hamburgerMenu = document.querySelector('.hamburger-menu');
const navLinks = document.querySelector('.nav-links');
hamburgerMenu.addEventListener('click', () => {
    navLinks.classList.toggle('active');
});
document.addEventListener('click', (e) => {
    if (!hamburgerMenu.contains(e.target) && !navLinks.contains(e.target)) {
        navLinks.classList.remove('active');
    }
});