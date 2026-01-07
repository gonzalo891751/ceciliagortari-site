/* ==========================================================================
   ADDITIONS.JS - Counter Animation for Inline Counters
   ========================================================================== */

(function () {
    'use strict';

    // Initialize inline counters (for new metrics layout with data-target)
    function initInlineCounters() {
        const counters = document.querySelectorAll('.impact-counters .impact-number[data-target]');
        if (!counters.length) return;

        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateInlineCounter(entry.target, prefersReducedMotion);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        counters.forEach(counter => {
            // Set fallback value immediately (in case observer fails)
            const target = parseInt(counter.dataset.target, 10);
            const prefix = counter.dataset.prefix || '';
            if (!isNaN(target)) {
                counter.innerText = prefix + target; // Fallback shows final value
            }
            observer.observe(counter);
        });

        function animateInlineCounter(el, reducedMotion) {
            const target = parseInt(el.dataset.target, 10);
            const prefix = el.dataset.prefix || '';

            if (isNaN(target)) return;

            if (reducedMotion) {
                el.innerHTML = '<span class="prefix">' + prefix + '</span>' + target;
                return;
            }

            // Reset to 0 for animation
            el.innerHTML = '<span class="prefix">' + prefix + '</span>0';

            const duration = 1500;
            let start = null;

            function step(timestamp) {
                if (!start) start = timestamp;
                const progress = Math.min((timestamp - start) / duration, 1);
                const ease = function (t) { return t * (2 - t); }; // Ease Out Quad
                const current = Math.floor(ease(progress) * target);
                el.innerHTML = '<span class="prefix">' + prefix + '</span>' + current;

                if (progress < 1) {
                    window.requestAnimationFrame(step);
                } else {
                    el.innerHTML = '<span class="prefix">' + prefix + '</span>' + target;
                }
            }
            window.requestAnimationFrame(step);
        }
    }

    // Run on DOMContentLoaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initInlineCounters);
    } else {
        initInlineCounters();
    }

})();
