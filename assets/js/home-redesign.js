/**
 * Home Redesign JavaScript
 * - Scroll reveal animations (IntersectionObserver)
 * - Proyectos switch control
 * - Instagram title animation
 * - Respects prefers-reduced-motion
 */

(function () {
    'use strict';

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // =========================================================================
    // SCROLL REVEAL ANIMATIONS
    // =========================================================================
    function initScrollReveal() {
        const revealElements = document.querySelectorAll('[data-scroll-reveal]');

        if (revealElements.length === 0) return;

        if (prefersReducedMotion) {
            // Show all immediately if reduced motion is preferred
            revealElements.forEach(el => el.classList.add('is-visible'));
            return;
        }

        const observerOptions = {
            root: null,
            rootMargin: '0px 0px -50px 0px',
            threshold: 0.15
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    // Unobserve after revealing to improve performance
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        revealElements.forEach(el => observer.observe(el));
    }

    // =========================================================================
    // PROYECTOS SWITCH CONTROL
    // =========================================================================
    function initProyectosSwitch() {
        const switchContainer = document.querySelector('.proyectos-switch');
        if (!switchContainer) return;

        const switchBtns = switchContainer.querySelectorAll('.proyectos-switch__btn');
        const panels = document.querySelectorAll('.proyectos-panel');

        if (switchBtns.length === 0 || panels.length === 0) return;

        switchBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Update button states
                switchBtns.forEach(b => {
                    b.classList.remove('is-active');
                    b.setAttribute('aria-pressed', 'false');
                });
                btn.classList.add('is-active');
                btn.setAttribute('aria-pressed', 'true');

                // Get target panel ID
                const targetPanelId = btn.dataset.panel;

                // Show/hide panels
                panels.forEach(panel => {
                    if (panel.id === targetPanelId) {
                        panel.classList.add('is-active');
                        // Also add is-visible for panels that might have scroll-reveal
                        panel.classList.add('is-visible');
                    } else {
                        panel.classList.remove('is-active');
                    }
                });
            });

            // Keyboard accessibility
            btn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    btn.click();
                }
            });
        });
    }

    // =========================================================================
    // INSTAGRAM TITLE ANIMATION
    // =========================================================================
    function initInstagramTitleAnimation() {
        const igTitle = document.querySelector('.ig-title--playful');

        if (!igTitle) return;

        if (prefersReducedMotion) {
            igTitle.classList.add('is-visible');
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.5
        });

        observer.observe(igTitle);
    }

    // =========================================================================
    // NOVEDADES CAROUSEL SWIPE HINT (Mobile Only)
    // Shows hint, hides after animation or first scroll
    // =========================================================================
    function initCarouselHint() {
        const carousel = document.querySelector('.prensa-grid--carousel');
        const swipeHint = document.getElementById('cg-news-swipe-hint');

        if (!carousel) return;

        // Only on mobile (≤768px)
        if (window.innerWidth > 768) {
            if (swipeHint) swipeHint.style.display = 'none';
            return;
        }

        // Add initial hint class that fades out after first scroll
        carousel.classList.add('has-scroll-hint');

        const hideHint = () => {
            if (swipeHint) swipeHint.classList.add('is-done');
            carousel.classList.remove('has-scroll-hint');
        };

        // Hide on first scroll (passive listener for performance)
        const removeHintOnScroll = () => {
            hideHint();
            carousel.removeEventListener('scroll', removeHintOnScroll);
        };
        carousel.addEventListener('scroll', removeHintOnScroll, { passive: true });

        // Also hide after animation completes (~6 seconds = 4 cycles of 1.5s)
        if (!prefersReducedMotion && swipeHint) {
            setTimeout(() => {
                hideHint();
            }, 6500);
        }
    }

    // =========================================================================
    // INITIALIZATION
    // =========================================================================
    function init() {
        // Wait for DOM to be fully ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', runInit);
        } else {
            runInit();
        }
    }

    function runInit() {
        initScrollReveal();
        initProyectosSwitch();
        initInstagramTitleAnimation();
        initCarouselHint();

        // Log initialization for debugging (remove in production)
        // console.log('Home redesign JS initialized');
    }

    init();

})();
