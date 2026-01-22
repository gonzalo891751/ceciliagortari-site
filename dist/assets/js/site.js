/* ==========================================================================
   CECILIA GORTARI - SITIO WEB OFICIAL
   JavaScript Principal
   ========================================================================== */

(function () {
  'use strict';

  // --------------------------------------------------------------------------
  // MOBILE MENU
  // --------------------------------------------------------------------------
  function initMobileMenu() {
    const toggle = document.querySelector('.navbar__toggle');
    const mobileMenu = document.querySelector('.navbar__mobile');

    if (!toggle || !mobileMenu) return;

    toggle.addEventListener('click', function () {
      toggle.classList.toggle('active');
      mobileMenu.classList.toggle('active');

      // Prevent body scroll when menu is open
      document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
    });

    // Close menu when clicking on a link
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', function () {
        toggle.classList.remove('active');
        mobileMenu.classList.remove('active');
        document.body.style.overflow = '';
      });
    });

    // Close menu on escape key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mobileMenu.classList.contains('active')) {
        toggle.classList.remove('active');
        mobileMenu.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  }

  // --------------------------------------------------------------------------
  // SCROLL ANIMATIONS (Fade In & Reveal)
  // --------------------------------------------------------------------------
  function initScrollAnimations() {
    // Legacy fade-in logic
    const fadeElements = document.querySelectorAll('.fade-in');

    // New Reveal logic
    const revealElements = document.querySelectorAll('.reveal');

    if (!fadeElements.length && !revealElements.length) return;

    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Handle .fade-in -> .visible
          if (entry.target.classList.contains('fade-in')) {
            entry.target.classList.add('visible');
          }
          // Handle .reveal -> .is-visible and delays
          if (entry.target.classList.contains('reveal')) {
            const delay = entry.target.dataset.delay;
            if (delay) {
              setTimeout(() => {
                entry.target.classList.add('is-visible');
              }, delay);
            } else {
              entry.target.classList.add('is-visible');
            }
          }
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    fadeElements.forEach(el => observer.observe(el));
    revealElements.forEach(el => observer.observe(el));
  }

  // --------------------------------------------------------------------------
  // STATS COUNTER ANIMATION
  // --------------------------------------------------------------------------
  // --------------------------------------------------------------------------
  // STATS COUNTER ANIMATION
  // --------------------------------------------------------------------------
  function initStats() {
    const stats = document.querySelectorAll('.stat-number');
    if (!stats.length) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateStat(entry.target, prefersReducedMotion);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    stats.forEach(stat => observer.observe(stat));

    function animateStat(el, reducedMotion) {
      const target = parseInt(el.dataset.target, 10);
      if (isNaN(target)) return;

      if (reducedMotion) {
        el.innerText = '+' + target;
        // Even with reduced motion, we might want to show the celebration if it's the big number,
        // but maybe just skip it to be safe or show it statically? 
        // User asked to "respect prefers-reduced-motion" for counters. 
        // For celebration, if reduced motion is on, we skip the popping animation.
        return;
      }

      const duration = 1500; // 1.5s as requested
      let start = null;

      function step(timestamp) {
        if (!start) start = timestamp;
        const progress = Math.min((timestamp - start) / duration, 1);

        // Ease Out Quad: t * (2 - t)
        const ease = t => t * (2 - t);

        const current = Math.floor(ease(progress) * target);
        el.innerText = (current > 0 ? '+' : '') + current;

        if (progress < 1) {
          window.requestAnimationFrame(step);
        } else {
          el.innerText = '+' + target;
          // Trigger celebration if this is the 3000 counter
          if (target === 3000) {
            triggerCelebration(el.closest('.stats-card') || el.parentElement);
          }
        }
      }
      window.requestAnimationFrame(step);
    }

    function triggerCelebration(container) {
      if (!container) return;

      const emojis = ['🎉', '🎓', '🎉', '🎓'];
      const count = 12; // 10-16 range

      for (let i = 0; i < count; i++) {
        const span = document.createElement('span');
        span.classList.add('confetti-emoji');
        span.innerText = emojis[Math.floor(Math.random() * emojis.length)];

        // Random positioning
        // Center horizontal is approx 50%, spread out.
        // We want them to come from "behind" the card.
        const left = 10 + Math.random() * 80; // 10% to 90%
        const delay = Math.random() * 0.5; // 0 to 0.5s delay
        const duration = 1 + Math.random() * 0.5; // 1s to 1.5s

        span.style.left = left + '%';
        span.style.bottom = '10%'; // Start near bottom
        span.style.animationDelay = delay + 's';
        span.style.animationDuration = duration + 's';

        container.appendChild(span);

        // Cleanup
        setTimeout(() => {
          span.remove();
        }, (duration + delay) * 1000 + 100);
      }
    }
  }

  // --------------------------------------------------------------------------
  // NAVBAR SCROLL EFFECT
  // --------------------------------------------------------------------------
  function initNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    window.addEventListener('scroll', function () {
      if (window.scrollY > 10) {
        navbar.classList.add('navbar--scrolled');
      } else {
        navbar.classList.remove('navbar--scrolled');
      }
    }, { passive: true });
  }

  // --------------------------------------------------------------------------
  // LIGHTBOX (Gallery) - Only runs if elements exist
  // --------------------------------------------------------------------------
  function initLightbox() {
    const galleryItems = document.querySelectorAll('.gallery-item');
    const lightbox = document.querySelector('.lightbox');
    if (!galleryItems.length || !lightbox) return;

    // ... existing lightbox logic implied (keeping it short for overwrite if full content needed I should copy exact logic)
    // Actually detailed logic was present. To be safe I will copy the original Logic back.
    const lightboxImg = lightbox.querySelector('.lightbox__img');
    const closeBtn = lightbox.querySelector('.lightbox__close');
    const prevBtn = lightbox.querySelector('.lightbox__nav--prev');
    const nextBtn = lightbox.querySelector('.lightbox__nav--next');
    let currentIndex = 0;
    const images = Array.from(galleryItems).map(item => ({
      src: item.querySelector('img').src, alt: item.querySelector('img').alt
    }));

    function openLightbox(index) {
      currentIndex = index;
      lightboxImg.src = images[currentIndex].src;
      lightboxImg.alt = images[currentIndex].alt;
      lightbox.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
    function closeLightbox() {
      lightbox.classList.remove('active');
      document.body.style.overflow = '';
    }
    function showPrev() {
      currentIndex = (currentIndex - 1 + images.length) % images.length;
      lightboxImg.src = images[currentIndex].src;
      lightboxImg.alt = images[currentIndex].alt;
    }
    function showNext() {
      currentIndex = (currentIndex + 1) % images.length;
      lightboxImg.src = images[currentIndex].src;
      lightboxImg.alt = images[currentIndex].alt;
    }

    galleryItems.forEach((item, index) => item.addEventListener('click', () => openLightbox(index)));
    if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
    if (prevBtn) prevBtn.addEventListener('click', showPrev);
    if (nextBtn) nextBtn.addEventListener('click', showNext);
    lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
    document.addEventListener('keydown', e => {
      if (!lightbox.classList.contains('active')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') showPrev();
      if (e.key === 'ArrowRight') showNext();
    });
  }

  // --------------------------------------------------------------------------
  // PROJECT FILTERS
  // --------------------------------------------------------------------------
  function initProjectFilters() {
    // Retaining existing logic for /proyectos/ page
    const searchInput = document.querySelector('#project-search');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const projectCards = document.querySelectorAll('.project-card');
    if (!projectCards.length) return;
    let activeFilter = 'todos';

    function filterProjects() {
      const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
      projectCards.forEach(card => {
        const title = card.dataset.title?.toLowerCase() || '';
        const category = card.dataset.category || '';
        const year = card.dataset.year || '';
        const matchesSearch = title.includes(searchTerm);
        const matchesFilter = activeFilter === 'todos' || category === activeFilter || year === activeFilter;
        if (matchesSearch && matchesFilter) {
          card.style.display = ''; card.classList.add('fade-in', 'visible');
        } else {
          card.style.display = 'none';
        }
      });
    }
    if (searchInput) searchInput.addEventListener('input', filterProjects);
    filterBtns.forEach(btn => {
      btn.addEventListener('click', function () {
        filterBtns.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        activeFilter = this.dataset.filter || 'todos';
        filterProjects();
      });
    });
  }

  // --------------------------------------------------------------------------
  // CUSTOM FORMS (Google Sheets)
  // --------------------------------------------------------------------------
  function initCustomForms() {
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw2lf7SDxdcwxdGxSxNLxYlQedxKLEeAgzbpQYD9sIAlibafaWL0V7bHc5spf2BWiw8Xg/exec';

    // 1. Preinscripción Alumnos
    const formAlumnos = document.getElementById('preinscripcion-form');
    if (formAlumnos) {
      formAlumnos.addEventListener('submit', function (e) {
        e.preventDefault();
        const btn = document.getElementById('submit-btn');
        const status = document.getElementById('form-status');
        const honeypot = document.getElementById('website').value;

        if (honeypot) return; // Spam check

        // Simple client validation
        if (!formAlumnos.checkValidity()) {
          if (status) {
            status.className = 'preinscripciones__status preinscripciones__status--error';
            status.innerText = 'Por favor, completá todos los campos requeridos.';
          }
          return;
        }

        if (btn.disabled) return;
        btn.disabled = true;
        const originalText = btn.innerText;
        btn.innerText = 'Enviando...';
        if (status) status.innerText = '';

        const formData = new FormData(formAlumnos);

        fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: formData })
          .then(() => {
            if (status) {
              status.className = 'preinscripciones__status preinscripciones__status--success';
              status.innerText = '¡Listo! Ya registramos tu respuesta 🙌';
            }
            formAlumnos.reset();
            setTimeout(() => { if (status) status.innerText = ''; }, 5000);
          })
          .catch(err => {
            console.error(err);
            if (status) {
              status.className = 'preinscripciones__status preinscripciones__status--error';
              status.innerText = 'Ups, no se pudo enviar. Probá de nuevo.';
            }
          })
          .finally(() => {
            btn.disabled = false;
            btn.innerText = originalText;
          });
      });
    }

    // 2. Docentes
    const formDocentes = document.getElementById('docentes-form');
    if (formDocentes) {
      formDocentes.addEventListener('submit', function (e) {
        e.preventDefault();
        const btn = document.getElementById('btn-docente');
        const alertBox = document.getElementById('docentes-alert');
        const honeypot = document.getElementById('website_docente').value;

        if (honeypot) return;

        // Validate
        let isValid = true;
        const requiredIds = ['nombre_docente', 'celular_docente', 'tema_docente'];
        requiredIds.forEach(id => {
          const el = document.getElementById(id);
          el.classList.remove('error'); // clear previous
          if (!el.value.trim()) {
            el.classList.add('error');
            isValid = false;
          }
        });

        if (!isValid) return;

        btn.disabled = true;
        const originalText = btn.innerText;
        btn.innerText = 'Enviando...';

        const formData = new FormData(formDocentes);
        // sheetName is hidden field in HTML

        fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: formData })
          .then(() => {
            formDocentes.style.display = 'none';
            if (alertBox) {
              alertBox.style.display = 'block';
              alertBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          })
          .catch(err => {
            console.error(err);
            btn.disabled = false;
            btn.innerText = originalText;
            alert('Hubo un error al enviar. Por favor intentá nuevamente.');
          });
      });
    }
  }

  // --------------------------------------------------------------------------
  // SMOOTH SCROLL
  // --------------------------------------------------------------------------
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#' || href === '') return;
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          const navbarHeight = document.querySelector('.navbar')?.offsetHeight || 80;
          // Offset for sticky header
          const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - (navbarHeight + 20);
          window.scrollTo({ top: targetPosition, behavior: 'smooth' });
        }
      });
    });
  }

  // --------------------------------------------------------------------------
  // ACTIVE NAV LINK
  // --------------------------------------------------------------------------
  function initActiveNavLink() {
    // ... existing logic
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.navbar__link, .navbar__mobile-menu a');
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href && currentPath.includes(href) && href !== '/') {
        link.classList.add('navbar__link--active');
      } else if (href === '/' && currentPath === '/') {
        link.classList.add('navbar__link--active');
      }
    });
  }

  // --------------------------------------------------------------------------
  // HERO SCROLL EFFECT (Blur + Magenta Overlay) - Scroll-Driven Animation
  // --------------------------------------------------------------------------
  function initHeroScrollEffect() {
    const hero = document.querySelector('.hero-new');
    if (!hero) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const panel = hero.querySelector('.hero-new__panel');

    // ═══════════════════════════════════════════════════════════════════════
    // CONFIGURABLE: Adjust this value to tune how many pixels of scroll
    // are needed to complete the reveal animation (0 → 1).
    // Recommended range: 110–140px. Default: 120px.
    // PIN_RANGE is set in CSS (additions.css) — currently 180px.
    // ═══════════════════════════════════════════════════════════════════════
    const REVEAL_RANGE = 120;

    function updateScrollProgress() {
      const scrollY = window.scrollY;
      const isMobile = window.innerWidth <= 768;

      let progress = 0;

      if (isMobile) {
        // Simple and robust: progress = scrollY / REVEAL_RANGE
        // No wrappers, no tricks, no scroll-jacking
        progress = scrollY / REVEAL_RANGE;
      } else {
        // Desktop Logic (Standard Parallax/Blur - unchanged)
        const heroHeight = hero.offsetHeight;
        progress = scrollY / (heroHeight * 0.8);
      }

      // Clamp 0 to 1
      progress = Math.max(0, Math.min(1, progress));

      // Set CSS custom property for scroll-driven animations
      hero.style.setProperty('--scroll-progress', progress);

      // Toggle pointer-events on panel when animation is nearly complete
      if (panel && isMobile) {
        panel.style.pointerEvents = progress >= 0.95 ? 'auto' : 'none';
      }
    }

    if (!prefersReducedMotion) {
      window.addEventListener('scroll', () => {
        requestAnimationFrame(updateScrollProgress);
      }, { passive: true });

      window.addEventListener('resize', updateScrollProgress, { passive: true });

      // Initial call
      updateScrollProgress();
    } else {
      // For reduced motion, set progress to 1 (final state)
      hero.style.setProperty('--scroll-progress', 1);
      if (panel) panel.style.pointerEvents = 'auto';
    }

  }

  // --------------------------------------------------------------------------
  // HERO SCROLL INDICATOR ("Deslizá") - Mobile only, scroll-based visibility
  // --------------------------------------------------------------------------
  function initScrollIndicator() {
    const indicator = document.querySelector('.hero-scroll-indicator');
    if (!indicator) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.innerWidth <= 768;

    // Only show on mobile, remove if desktop or reduced motion
    if (!isMobile || prefersReducedMotion) {
      indicator.remove();
      return;
    }

    const SCROLL_THRESHOLD = 24; // Hide when scrolled past this (px)

    // Show/hide based on scroll position - no auto-fade
    function onScroll() {
      if (window.scrollY > SCROLL_THRESHOLD) {
        indicator.classList.add('is-hidden');
      } else {
        indicator.classList.remove('is-hidden');
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });

    // Initial check
    onScroll();
  }

  // --------------------------------------------------------------------------
  // IMPACT METRICS (Refined for "No +0" requirement)
  // --------------------------------------------------------------------------
  function initImpactMetrics() {
    // We now have hardcoded values in HTML (Impact Section). 
    // We just need to animate them when they come into view.
    const counters = document.querySelectorAll('.impact-number[data-target]');
    if (!counters.length) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target, prefersReducedMotion);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(counter => observer.observe(counter));

    function animateCounter(el, reducedMotion) {
      const target = parseInt(el.dataset.target, 10);
      // Hardcoded yellow prefix as requested
      const prefixHtml = '<span class="impact-prefix text-brand-yellow">+</span>';

      if (isNaN(target)) return;

      if (reducedMotion) {
        el.innerHTML = prefixHtml + target;
        return;
      }

      // Animation parameters
      const duration = 2000;
      const frameDuration = 1000 / 60;
      const totalFrames = Math.round(duration / frameDuration);
      const ease = t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t); // Exponential Ease Out

      let frame = 0;

      const counter = setInterval(() => {
        frame++;
        const progress = ease(frame / totalFrames);
        // Start from 5% of target to avoid 0, or just Math.max(1, ...)
        let current = Math.round(target * progress);
        if (current < 1) current = 1;

        el.innerHTML = prefixHtml + current;

        if (frame >= totalFrames) {
          clearInterval(counter);
          el.innerHTML = prefixHtml + target;
        }
      }, frameDuration);
    }
  }

  // --------------------------------------------------------------------------
  // SCHOOL CAROUSEL ARROWS
  // --------------------------------------------------------------------------
  // --------------------------------------------------------------------------
  // SCHOOL CAROUSEL (Horizontal Clean + Smooth Autoplay)
  // --------------------------------------------------------------------------
  // --------------------------------------------------------------------------
  // ESCUELA SLIDER (Auto-fade Hotfix)
  // --------------------------------------------------------------------------
  // --------------------------------------------------------------------------
  // ESCUELA SHOWCASE (Modern Carousel)
  // --------------------------------------------------------------------------
  function initEscuelaShowcase() {
    const track = document.getElementById('escuela-track');
    if (!track) return;

    const frame = document.querySelector('.escuela-showcase__frame');
    const slides = Array.from(track.querySelectorAll('.escuela-showcase__slide'));
    const dotsContainer = document.getElementById('escuela-dots');
    const prevBtn = document.querySelector('.escuela-showcase__nav--prev');
    const nextBtn = document.querySelector('.escuela-showcase__nav--next');

    if (slides.length < 1) return;

    let currentIndex = 0;
    let timer = null;
    let isPaused = false;
    const intervalTime = 5000;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // --- DYNAMIC HEIGHT LOGIC ---
    function updateFrameHeight(slideIndex) {
      if (!frame || prefersReducedMotion) return; // Optional: skip height anim on reduced motion or just jump? User said "respetar... NO animar", but layout adjust might still be needed?
      // User said: "si reduced motion... NO animar". 
      // But we probably still want the height to adapt so content isn't cropped/spaced weirdly, just instant.

      const slide = slides[slideIndex];
      const img = slide.querySelector('.escuela-showcase__img');
      if (!img) return;

      const performUpdate = () => {
        const w = img.naturalWidth || 1;
        const h = img.naturalHeight || 1;
        const ratio = w / h;

        const frameWidth = frame.clientWidth;
        const isMobile = window.matchMedia('(max-width: 640px)').matches;

        // Limites
        const minH = isMobile ? 240 : 320;
        const maxH = isMobile ? 400 : 540;

        let targetH = frameWidth / ratio;
        targetH = Math.max(minH, Math.min(maxH, targetH));

        if (!prefersReducedMotion) {
          frame.classList.add('is-resizing');
          setTimeout(() => frame.classList.remove('is-resizing'), 600);
          frame.style.height = Math.round(targetH) + 'px';
        } else {
          // Direct set without animation relies on CSS media query to kill transition, 
          // but we set inline style so it works regardless.
          frame.style.height = Math.round(targetH) + 'px';
        }
      };

      if (img.complete && img.naturalHeight > 0) {
        performUpdate();
      } else {
        img.onload = performUpdate;
      }
    }

    // Create Dots
    if (dotsContainer) {
      dotsContainer.innerHTML = slides.map((_, i) => `
        <button class="escuela-showcase__dot ${i === 0 ? 'is-active' : ''}" 
                aria-label="Ir a imagen ${i + 1}"></button>
      `).join('');
    }
    const dots = Array.from(dotsContainer ? dotsContainer.querySelectorAll('.escuela-showcase__dot') : []);

    function showSlide(index) {
      if (index < 0) index = slides.length - 1;
      if (index >= slides.length) index = 0;

      slides.forEach((slide, i) => {
        if (i === index) {
          slide.classList.add('is-active');
          slide.setAttribute('aria-hidden', 'false');
        } else {
          slide.classList.remove('is-active');
          slide.setAttribute('aria-hidden', 'true');
        }
      });

      dots.forEach((dot, i) => {
        dot.classList.toggle('is-active', i === index);
      });

      currentIndex = index;
      updateFrameHeight(currentIndex);
    }

    function nextSlide() {
      showSlide(currentIndex + 1);
    }

    function prevSlide() {
      showSlide(currentIndex - 1);
    }

    if (prevBtn) prevBtn.addEventListener('click', () => {
      prevSlide();
      resetTimer();
    });

    if (nextBtn) nextBtn.addEventListener('click', () => {
      nextSlide();
      resetTimer();
    });

    dots.forEach((dot, i) => {
      dot.addEventListener('click', () => {
        showSlide(i);
        resetTimer();
      });
    });

    function startTimer() {
      if (prefersReducedMotion) return;
      if (timer) clearInterval(timer);
      timer = setInterval(() => {
        if (!isPaused) nextSlide();
      }, intervalTime);
    }

    function resetTimer() {
      startTimer();
    }

    if (frame) {
      frame.addEventListener('mouseenter', () => isPaused = true);
      frame.addEventListener('mouseleave', () => isPaused = false);
      frame.addEventListener('touchstart', () => {
        isPaused = true;
        setTimeout(() => isPaused = false, 10000);
      }, { passive: true });
    }

    // Resize Listener
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        updateFrameHeight(currentIndex);
      }, 100);
    }, { passive: true });

    // Initial
    showSlide(0);
    startTimer();
  }

  // --------------------------------------------------------------------------
  // INSTAGRAM FALLBACK (Show fallback if embed fails to load)
  // --------------------------------------------------------------------------
  function initInstagramFallback() {
    const items = document.querySelectorAll('.instagram-home__item[data-ig-fallback]');
    if (!items.length) return;

    // Check if Instagram embeds loaded after 5 seconds
    setTimeout(() => {
      items.forEach(item => {
        const iframe = item.querySelector('iframe');
        const blockquote = item.querySelector('.instagram-media');

        // If no iframe was created by Instagram's script, show fallback
        if (!iframe && blockquote) {
          item.classList.add('embed-failed');
        }
      });
    }, 5000);
  }

  // --------------------------------------------------------------------------
  // FEATURED PROJECTS (Rendered from JS array)
  // --------------------------------------------------------------------------
  // EDITABLE: Change this array to update featured projects on home
  const featuredProjects = [
    {
      title: "Impulso Tabacalero Provincial",
      desc: "Beneficios fiscales y tecnología para pequeños productores de Goya."
    },
    {
      title: "Conectividad Rural Educativa",
      desc: "Internet satelital para escuelas de zonas alejadas."
    },
    {
      title: "Fondo Emprendedor Correntino",
      desc: "Microcréditos blandos para nuevos emprendimientos."
    }
  ];

  function initFeaturedProjects() {
    const container = document.getElementById('featured-projects-grid');
    if (!container) return;

    container.innerHTML = featuredProjects.map(project => `
      <article class="proyecto-card fade-in">
        <h4 class="proyecto-card__title">${project.title}</h4>
        <p class="proyecto-card__desc">${project.desc}</p>
      </article>
    `).join('');

    // Re-observe for animations
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    container.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
  }

  // --------------------------------------------------------------------------
  // BIOGRAFÍA PAGE - TIMELINE (Editable Array)
  // --------------------------------------------------------------------------
  // EDITABLE: Agregar o modificar items de la línea de tiempo aquí
  const bioTimelineData = [
    {
      year: '31/08/2025',
      title: 'Electa Diputada Provincial de Corrientes',
      desc: 'Victoria electoral para representar a los correntinos en la Cámara de Diputados.',
      color: 'magenta'
    },
    {
      year: '2025–Actualidad',
      title: 'Diputada Provincial de Corrientes',
      desc: 'Mandato legislativo con foco en desarrollo productivo, educación y cercanía territorial.',
      color: 'magenta'
    },
    {
      year: '2024–Actualidad',
      title: 'Escuela de Oficios / Emprendedores',
      desc: 'Capacitación gratuita con salida laboral junto a Germán Braillard.',
      color: 'blue'
    },
    {
      year: '2023–2025',
      title: 'Concejala de Goya',
      desc: 'Trabajo legislativo local: transparencia, servicios públicos, control institucional.',
      color: 'blue'
    },
    {
      year: '2020–2023',
      title: 'Delegada Ministerio de Desarrollo Social (Goya)',
      desc: 'Gestión de programas Mi Pieza, Mi Baño, Banco de Herramientas.',
      color: 'turquoise'
    },
    {
      year: '2008–2011',
      title: 'Diputada Provincial (1er mandato)',
      desc: 'Modernización (Exp. 4044), zona portuaria Lavalle, cultura y educación.',
      color: 'blue'
    },
    {
      year: '2006–2008',
      title: 'Subsecretaria de Seguridad de Corrientes',
      desc: 'Seguridad en transporte, protocolos de búsqueda de menores.',
      color: 'turquoise'
    },
    {
      year: '2000–2001',
      title: 'Asesora Ministerio del Interior (Nación)',
      desc: 'Seguridad y prevención del delito.',
      color: 'gray'
    },
    {
      year: '2000',
      title: 'Graduación UBA',
      desc: 'Licenciada en Ciencias Políticas.',
      color: 'gray'
    }
  ];

  function initBioTimeline() {
    const container = document.getElementById('bio-timeline');
    if (!container) return;

    container.innerHTML = bioTimelineData.map(item => {
      const colorClass = item.color ? `bio-timeline-item--${item.color}` : '';
      return `
        <div class="bio-timeline-item ${colorClass}">
          <div class="bio-timeline-item__marker"></div>
          <span class="bio-timeline-item__year">${item.year}</span>
          <h4 class="bio-timeline-item__title">${item.title}</h4>
          <p class="bio-timeline-item__desc">${item.desc}</p>
        </div>
      `;
    }).join('');
  }

  // --------------------------------------------------------------------------
  // BIOGRAFÍA PAGE - GESTIONES CAROUSEL (Editable Array)
  // --------------------------------------------------------------------------
  // EDITABLE: Agregar o modificar gestiones aquí
  const gestionesData = [
    {
      name: 'Mi Pieza',
      desc: 'Ampliación y refacción de viviendas para mujeres en barrios populares.',
      image: '/assets/img/gestiones/gestion-1.jpg',
      icon: '🏠'
    },
    {
      name: 'Mi Baño',
      desc: 'Mejoras sanitarias esenciales para familias.',
      image: '/assets/img/gestiones/gestion-2.jpg',
      icon: '🚿'
    },
    {
      name: 'Banco de Herramientas / Maquinarias',
      desc: 'Insumos para emprendimientos locales.',
      image: '/assets/img/gestiones/gestion-3.jpg',
      icon: '🔧'
    },
    {
      name: 'Escuela de Oficios / Emprendedores',
      desc: 'Capacitación gratuita con salida laboral.',
      image: '/assets/img/gestiones/gestion-4.jpg',
      icon: '🎓'
    }
  ];

  function initGestionesCarousel() {
    const track = document.getElementById('gestiones-track');
    const dotsContainer = document.getElementById('gestiones-dots');
    const prevBtn = document.getElementById('gestiones-prev');
    const nextBtn = document.getElementById('gestiones-next');

    if (!track || !dotsContainer) return;

    let currentIndex = 0;

    // Render slides
    track.innerHTML = gestionesData.map((item, index) => `
      <div class="gestiones-carousel__slide ${index === 0 ? 'active' : ''}" data-index="${index}">
        <div class="gestiones-carousel__placeholder">${item.icon}</div>
        <img src="${item.image}" 
             alt="${item.name}" 
             class="gestiones-carousel__image"
             loading="lazy"
             style="display:none;"
             onload="this.style.display='block';this.previousElementSibling.style.display='none';"
             onerror="this.style.display='none';this.previousElementSibling.style.display='flex';">
        <div class="gestiones-carousel__info">
          <h3 class="gestiones-carousel__name">${item.name}</h3>
          <p class="gestiones-carousel__desc">${item.desc}</p>
        </div>
      </div>
    `).join('');

    // Render dots
    dotsContainer.innerHTML = gestionesData.map((_, index) => `
      <button class="gestiones-carousel__dot ${index === 0 ? 'active' : ''}" 
              data-index="${index}" 
              aria-label="Ir a gestión ${index + 1}"></button>
    `).join('');

    const slides = track.querySelectorAll('.gestiones-carousel__slide');
    const dots = dotsContainer.querySelectorAll('.gestiones-carousel__dot');

    function goToSlide(index) {
      if (index < 0) index = slides.length - 1;
      if (index >= slides.length) index = 0;
      currentIndex = index;

      slides.forEach((slide, i) => {
        slide.classList.toggle('active', i === currentIndex);
      });
      dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === currentIndex);
      });
    }

    // Button handlers
    if (prevBtn) prevBtn.addEventListener('click', () => goToSlide(currentIndex - 1));
    if (nextBtn) nextBtn.addEventListener('click', () => goToSlide(currentIndex + 1));

    // Dot handlers
    dots.forEach(dot => {
      dot.addEventListener('click', () => {
        const index = parseInt(dot.dataset.index, 10);
        goToSlide(index);
      });
    });

    // Keyboard navigation
    const carousel = document.getElementById('gestiones-carousel');
    if (carousel) {
      carousel.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') goToSlide(currentIndex - 1);
        if (e.key === 'ArrowRight') goToSlide(currentIndex + 1);
      });
    }

    // Touch/Swipe support
    let touchStartX = 0;
    let touchEndX = 0;

    track.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    track.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    }, { passive: true });

    function handleSwipe() {
      const diff = touchStartX - touchEndX;
      if (Math.abs(diff) > 50) {
        if (diff > 0) {
          goToSlide(currentIndex + 1); // Swipe left -> next
        } else {
          goToSlide(currentIndex - 1); // Swipe right -> prev
        }
      }
    }
  }

  // --------------------------------------------------------------------------
  // PRENSA GRID & CAROUSEL (Uses data from prensa-data.js)
  // --------------------------------------------------------------------------
  function initPrensaGrid() {
    const container = document.getElementById('prensa-grid');
    if (!container) return;

    // Check if PRENSA_ITEMS exists (from prensa-data.js)
    if (typeof PRENSA_ITEMS === 'undefined' || !PRENSA_ITEMS.length) {
      // Show placeholders if no items
      container.innerHTML = Array(3).fill(0).map(() => `
        <div class="prensa-card prensa-card--placeholder">
          <div class="prensa-card__body">
            <span class="prensa-card__placeholder-icon">📰</span>
            <h3 class="prensa-card__title">Próximamente</h3>
            <a href="/prensa/" class="prensa-card__cta">Ver Prensa</a>
          </div>
        </div>
      `).join('');
      return;
    }

    const sortedItems = getSortedPrensaItems();

    container.innerHTML = sortedItems.map(item => {
      const targetAttr = item.external ? 'target="_blank" rel="noopener"' : '';
      const ctaLabel = getCtaLabel(item);
      const formattedDate = formatPrensaDate(item.date);

      return `
        <a href="${item.url}" class="prensa-card" ${targetAttr}>
          <div class="prensa-card__image-container">
            ${item.image ? `
              <img src="${item.image}" 
                   alt="${item.title}" 
                   class="prensa-card__image" 
                   loading="lazy"
                   onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
              <div class="prensa-card__placeholder" style="display:none;">
                <span class="prensa-card__placeholder-icon">📰</span>
              </div>
            ` : `
              <div class="prensa-card__placeholder">
                <span class="prensa-card__placeholder-icon">📰</span>
              </div>
            `}
          </div>
          <div class="prensa-card__body">
            <span class="prensa-card__badge">${item.type}</span>
            <h3 class="prensa-card__title">${item.title}</h3>
            <p class="prensa-card__excerpt">${item.excerpt}</p>
            <span class="prensa-card__date">${formattedDate}</span>
            <span class="prensa-card__cta">${ctaLabel}</span>
          </div>
        </a>
      `;
    }).join('');
  }

  function initPrensaCarousel() {
    const container = document.getElementById('prensa-carousel-track');
    const prevBtn = document.getElementById('prensa-prev');
    const nextBtn = document.getElementById('prensa-next');

    if (!container) return;

    // Check if container already has content (e.g. static HTML placeholders)
    // If so, we skip JS generation and only bind events.
    const hasContent = container.children.length > 0;

    if (!hasContent) {
      // Check if PRENSA_ITEMS exists
      if (typeof PRENSA_ITEMS === 'undefined' || !PRENSA_ITEMS.length) {
        // Show placeholders
        container.innerHTML = Array(3).fill(0).map(() => `
          <div class="prensa-carousel__item">
            <div class="prensa-card prensa-card--placeholder">
              <div class="prensa-card__body">
                <span class="prensa-card__placeholder-icon">📰</span>
                <h3 class="prensa-card__title">Próximamente</h3>
              </div>
            </div>
          </div>
        `).join('');
        return;
      }

      // Get 6 most recent items
      const recentItems = getRecentPrensaItems(6);

      container.innerHTML = recentItems.map(item => {
        const targetAttr = item.external ? 'target="_blank" rel="noopener"' : '';
        const ctaLabel = getCtaLabel(item);
        const formattedDate = formatPrensaDate(item.date);

        return `
          <div class="prensa-carousel__item">
            <a href="${item.url}" class="prensa-card" ${targetAttr}>
              <div class="prensa-card__image-container">
                ${item.image ? `
                  <img src="${item.image}" 
                       alt="${item.title}" 
                       class="prensa-card__image" 
                       loading="lazy"
                       onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
                  <div class="prensa-card__placeholder" style="display:none;">
                    <span class="prensa-card__placeholder-icon">📰</span>
                  </div>
                ` : `
                  <div class="prensa-card__placeholder">
                    <span class="prensa-card__placeholder-icon">📰</span>
                  </div>
                `}
              </div>
              <div class="prensa-card__body">
                <span class="prensa-card__badge">${item.type}</span>
                <h3 class="prensa-card__title">${item.title}</h3>
                <p class="prensa-card__excerpt">${item.excerpt}</p>
                <span class="prensa-card__date">${formattedDate}</span>
                <span class="prensa-card__cta">${ctaLabel}</span>
              </div>
            </a>
          </div>
        `;
      }).join('');
    }

    // Carousel navigation
    if (prevBtn && nextBtn) {
      const scrollAmount = container.querySelector('.prensa-carousel__item')?.offsetWidth + 24 || 300;

      prevBtn.addEventListener('click', () => {
        container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      });

      nextBtn.addEventListener('click', () => {
        container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      });
    }
  }

  // --------------------------------------------------------------------------
  // INIT
  // --------------------------------------------------------------------------
  function init() {
    initMobileMenu();
    initScrollAnimations();
    initStats();
    initNavbarScroll();
    initLightbox();
    initProjectFilters();
    initCustomForms();
    initSmoothScroll();
    initActiveNavLink();
    // New home redesign functions
    initHeroScrollEffect();
    initScrollIndicator(); // Scroll indicator (mobile "Deslizá")
    initImpactMetrics();  // Replaced initImpactCounters
    initFeaturedProjects();
    initInstagramFallback();
    // Biography page functions
    initBioTimeline();
    initGestionesCarousel();
    // Prensa functions
    initPrensaGrid();
    initPrensaCarousel();
    initEscuelaShowcase();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
