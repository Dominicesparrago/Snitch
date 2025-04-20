document.addEventListener('DOMContentLoaded', () => {
    const leftContainer = document.querySelector('.left-container');
    const rightContainer = document.querySelector('.right-container');

    // Track animation states
    const animationStates = new Map();

    function startFillEffect(container) {
        // If animation is already running, don't start a new one
        if (animationStates.get(container)) return;

        let fillSize = parseFloat(container.style.getPropertyValue('--fill-size') || '0');
        const steps = 100;
        const interval = 500 / steps;
        const stepSize = (100 - fillSize) / steps;

        animationStates.set(container, true);

        const fillInterval = setInterval(() => {
            if (fillSize >= 100) {
                clearInterval(fillInterval);
                animationStates.set(container, false);
                return;
            }
            fillSize += stepSize;
            container.style.setProperty('--fill-size', `${fillSize}%`);
        }, interval);
    }

    function reverseFillEffect(container) {
        // If animation is already running, don't start a new one
        if (animationStates.get(container)) return;

        let fillSize = parseFloat(container.style.getPropertyValue('--fill-size') || '100');
        const steps = 100;
        const interval = 500 / steps;
        const stepSize = fillSize / steps;

        animationStates.set(container, true);

        const fillInterval = setInterval(() => {
            if (fillSize <= 0) {
                clearInterval(fillInterval);
                animationStates.set(container, false);
                return;
            }
            fillSize -= stepSize;
            container.style.setProperty('--fill-size', `${fillSize}%`);
        }, interval);
    }

    leftContainer.addEventListener('mouseenter', () => {
        startFillEffect(leftContainer);
    });

    leftContainer.addEventListener('mouseleave', () => {
        reverseFillEffect(leftContainer);
    });

    rightContainer.addEventListener('mouseenter', () => {
        startFillEffect(rightContainer);
    });

    rightContainer.addEventListener('mouseleave', () => {
        reverseFillEffect(rightContainer);
    });

    // Carousel functionality
    const carousel = document.querySelector('.insights-images');
    const track = carousel.querySelector('.carousel-track');
    const images = track.querySelectorAll('img');
    const imageWidth = images[0].offsetWidth + 40; // 40px is the total gap (20px margin on each side)
    let currentIndex = 0;

    // Function to add a new image at the end
    function addNextImage() {
        const newImage = images[currentIndex].cloneNode(true);
        track.appendChild(newImage);
        currentIndex = (currentIndex + 1) % images.length;
    }

    // Function to remove the first image
    function removeFirstImage() {
        if (track.children.length > images.length * 2) {
            track.removeChild(track.firstChild);
        }
    }

    // Initial setup - add enough images to fill the viewport
    const viewportWidth = window.innerWidth;
    const imagesNeeded = Math.ceil(viewportWidth / imageWidth) * 2;
    
    for (let i = 0; i < imagesNeeded; i++) {
        addNextImage();
    }

    // Animation observer to detect when images move out of view
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) {
                removeFirstImage();
                addNextImage();
            }
        });
    }, {
        threshold: 0,
        rootMargin: '-50% 0% -50% 0%'
    });

    // Observe the first image
    if (track.firstChild) {
        observer.observe(track.firstChild);
    }
}); 