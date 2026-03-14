/**
 * Bio Section Entry Animations
 * Uses IntersectionObserver to trigger staggered fade-in animations
 * when the bio chips come into view.
 * 
 * Respects prefers-reduced-motion for accessibility.
 */
(function () {
    'use strict';

    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // If reduced motion is preferred, make chips visible immediately and exit
    if (prefersReducedMotion) {
        document.addEventListener('DOMContentLoaded', function () {
            const chips = document.querySelectorAll('.bio-chip--dynamic');
            chips.forEach(function (chip) {
                chip.classList.add('bio-chip--visible');
            });
        });
        return;
    }

    // Main animation logic
    document.addEventListener('DOMContentLoaded', function () {
        const container = document.getElementById('bio-chips-container');
        if (!container) return;

        const chips = container.querySelectorAll('.bio-chip--dynamic');
        if (!chips.length) return;

        // IntersectionObserver options
        const observerOptions = {
            root: null,
            rootMargin: '0px 0px -50px 0px', // Trigger slightly before fully visible
            threshold: 0.1
        };

        // Callback when section enters viewport
        const handleIntersection = function (entries, observer) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    // Add visible class to each chip
                    chips.forEach(function (chip) {
                        chip.classList.add('bio-chip--visible');
                    });

                    // Stop observing after animation triggered
                    observer.unobserve(entry.target);
                }
            });
        };

        // Create and start observer
        const observer = new IntersectionObserver(handleIntersection, observerOptions);
        observer.observe(container);
    });
})();
