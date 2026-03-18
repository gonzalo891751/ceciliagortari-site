/**
 * Biografía v2 — JavaScript
 * Timeline rendering, TOC scroll-spy, reveal animations
 * Cecilia Gortari — Sitio Oficial
 */
(function () {
  'use strict';

  // ========================================================================
  // TIMELINE DATA (editable)
  // ========================================================================
  var timelineData = [
    {
      year: '2025–Actualidad',
      title: 'Diputada Provincial de Corrientes (2do mandato)',
      desc: 'Electa por ECO con el 16,69% de los votos. Agenda legislativa centrada en desarrollo productivo, educación y transparencia.',
      color: 'magenta'
    },
    {
      year: '2024',
      title: 'Escuela de Oficios / Emprendedores',
      desc: 'Capacitación técnica con salida laboral junto al diputado Germán Braillard.',
      color: 'blue'
    },
    {
      year: '2023–2025',
      title: 'Concejala de Goya',
      desc: 'Trabajo legislativo local: agua potable, escuelas rurales, caminos vecinales, seguridad.',
      color: 'blue'
    },
    {
      year: '2020–2023',
      title: 'Delegada Min. Desarrollo Social (Goya)',
      desc: 'Programas Mi Pieza, Mi Baño, Banco de Herramientas. Articulación territorial con barrios populares.',
      color: 'turquoise'
    },
    {
      year: '2017',
      title: 'Incorporación al Frente Renovador',
      desc: 'Reconfiguración política tras alejarse de la UCR. Alianza electoral UNA/1País.',
      color: 'gray'
    },
    {
      year: '2008–2011',
      title: 'Diputada Provincial (1er mandato)',
      desc: 'Expediente 4044 (reforma Tribunal de Cuentas), proyecto zona portuaria Lavalle.',
      color: 'blue'
    },
    {
      year: '2006–2008',
      title: 'Subsecretaria de Seguridad de Corrientes',
      desc: 'Seguridad en transporte público, protocolo de búsqueda de menores (precursor de Alerta Sofía).',
      color: 'turquoise'
    },
    {
      year: '2000–2001',
      title: 'Asesora Ministerio del Interior (Nación)',
      desc: 'Primeros pasos en la función pública junto al ministro Federico Storani.',
      color: 'gray'
    },
    {
      year: '2000',
      title: 'Graduación UBA',
      desc: 'Licenciada en Ciencias Políticas, Universidad de Buenos Aires.',
      color: 'gray'
    }
  ];

  // ========================================================================
  // TIMELINE RENDER
  // ========================================================================
  function initTimeline() {
    var container = document.getElementById('bio-timeline-v2');
    if (!container) return;

    container.innerHTML = timelineData.map(function (item) {
      var colorClass = item.color ? 'bio-tl-item--' + item.color : '';
      return '<div class="bio-tl-item ' + colorClass + '">' +
        '<div class="bio-tl-item__marker"></div>' +
        '<span class="bio-tl-item__year">' + item.year + '</span>' +
        '<h4 class="bio-tl-item__title">' + item.title + '</h4>' +
        '<p class="bio-tl-item__desc">' + item.desc + '</p>' +
        '</div>';
    }).join('');

    // Animate timeline items on scroll
    var items = container.querySelectorAll('.bio-tl-item');
    if (!items.length) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -40px 0px', threshold: 0.1 });

    items.forEach(function (item) {
      observer.observe(item);
    });
  }

  // ========================================================================
  // TOC SCROLL-SPY
  // ========================================================================
  function initTocScrollSpy() {
    var links = document.querySelectorAll('.bio-toc__link');
    if (!links.length) return;

    var sections = [];
    links.forEach(function (link) {
      var id = link.getAttribute('data-section');
      var el = document.getElementById(id);
      if (el) sections.push({ id: id, el: el });
    });

    if (!sections.length) return;

    var headerH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h') || '80', 10);

    function updateActive() {
      var scrollY = window.scrollY || window.pageYOffset;
      var current = '';

      sections.forEach(function (sec) {
        var top = sec.el.offsetTop - headerH - 100;
        if (scrollY >= top) {
          current = sec.id;
        }
      });

      links.forEach(function (link) {
        var isActive = link.getAttribute('data-section') === current;
        link.classList.toggle('bio-toc__link--active', isActive);
      });
    }

    var ticking = false;
    window.addEventListener('scroll', function () {
      if (!ticking) {
        requestAnimationFrame(function () {
          updateActive();
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });

    updateActive();
  }

  // ========================================================================
  // REVEAL ON SCROLL
  // ========================================================================
  function initRevealAnimations() {
    var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var revealEls = document.querySelectorAll('.bio-reveal');

    if (!revealEls.length) return;

    if (prefersReducedMotion) {
      revealEls.forEach(function (el) {
        el.classList.add('is-visible');
      });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -60px 0px', threshold: 0.1 });

    revealEls.forEach(function (el) {
      observer.observe(el);
    });
  }

  // ========================================================================
  // LIGHTBOX
  // ========================================================================
  function initLightbox() {
    var images = document.querySelectorAll('.bio-photo img');
    if (!images.length) return;

    // Build flat array of { src, caption } for navigation
    var items = [];
    images.forEach(function (img) {
      var captionEl = img.closest('.bio-photo').querySelector('.bio-photo__caption');
      items.push({
        src: img.src,
        caption: captionEl ? captionEl.textContent : ''
      });
    });

    // Create lightbox DOM
    var lightbox = document.createElement('div');
    lightbox.className = 'bio-lightbox';
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-modal', 'true');
    lightbox.setAttribute('aria-label', 'Imagen ampliada');
    lightbox.innerHTML =
      '<div class="bio-lightbox__overlay"></div>' +
      '<div class="bio-lightbox__inner">' +
        '<img class="bio-lightbox__img" src="" alt="">' +
        '<div class="bio-lightbox__caption"></div>' +
        '<button class="bio-lightbox__close" aria-label="Cerrar">&times;</button>' +
        '<button class="bio-lightbox__prev" aria-label="Anterior">&#8249;</button>' +
        '<button class="bio-lightbox__next" aria-label="Siguiente">&#8250;</button>' +
        '<div class="bio-lightbox__counter"></div>' +
      '</div>';
    document.body.appendChild(lightbox);

    var lbImg = lightbox.querySelector('.bio-lightbox__img');
    var lbCaption = lightbox.querySelector('.bio-lightbox__caption');
    var lbClose = lightbox.querySelector('.bio-lightbox__close');
    var lbPrev = lightbox.querySelector('.bio-lightbox__prev');
    var lbNext = lightbox.querySelector('.bio-lightbox__next');
    var lbCounter = lightbox.querySelector('.bio-lightbox__counter');
    var lbOverlay = lightbox.querySelector('.bio-lightbox__overlay');
    var currentIndex = 0;

    function showImage(index) {
      if (index < 0) index = items.length - 1;
      if (index >= items.length) index = 0;
      currentIndex = index;

      lbImg.src = items[index].src;
      lbImg.alt = items[index].caption || '';
      lbCaption.textContent = items[index].caption || '';
      lbCaption.style.display = items[index].caption ? '' : 'none';
      lbCounter.textContent = (index + 1) + ' / ' + items.length;

      // Show/hide nav if only one image
      var hasMultiple = items.length > 1;
      lbPrev.style.display = hasMultiple ? '' : 'none';
      lbNext.style.display = hasMultiple ? '' : 'none';
      lbCounter.style.display = hasMultiple ? '' : 'none';
    }

    function openLightbox(index) {
      showImage(index);
      lightbox.classList.add('is-active');
      document.body.classList.add('bio-lightbox-open');
    }

    function closeLightbox() {
      lightbox.classList.remove('is-active');
      document.body.classList.remove('bio-lightbox-open');
    }

    // Click on images to open
    images.forEach(function (img, i) {
      img.style.cursor = 'zoom-in';
      img.addEventListener('click', function () {
        openLightbox(i);
      });
    });

    // Close handlers
    lbClose.addEventListener('click', closeLightbox);
    lbOverlay.addEventListener('click', closeLightbox);

    // Navigation
    lbPrev.addEventListener('click', function (e) {
      e.stopPropagation();
      showImage(currentIndex - 1);
    });
    lbNext.addEventListener('click', function (e) {
      e.stopPropagation();
      showImage(currentIndex + 1);
    });

    // Keyboard
    document.addEventListener('keydown', function (e) {
      if (!lightbox.classList.contains('is-active')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') showImage(currentIndex - 1);
      if (e.key === 'ArrowRight') showImage(currentIndex + 1);
    });

    // Swipe support for mobile
    var touchStartX = 0;
    lightbox.addEventListener('touchstart', function (e) {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    lightbox.addEventListener('touchend', function (e) {
      var diff = e.changedTouches[0].screenX - touchStartX;
      if (Math.abs(diff) > 50) {
        if (diff > 0) showImage(currentIndex - 1);
        else showImage(currentIndex + 1);
      }
    }, { passive: true });
  }

  // ========================================================================
  // SMOOTH SCROLL FOR TOC LINKS
  // ========================================================================
  function initSmoothTocScroll() {
    var links = document.querySelectorAll('.bio-toc__link');
    if (!links.length) return;

    var headerH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h') || '80', 10);

    links.forEach(function (link) {
      link.addEventListener('click', function (e) {
        var href = link.getAttribute('href');
        if (!href || href.charAt(0) !== '#') return;

        var target = document.getElementById(href.substring(1));
        if (!target) return;

        e.preventDefault();
        var top = target.offsetTop - headerH - 20;
        window.scrollTo({ top: top, behavior: 'smooth' });
      });
    });
  }

  // ========================================================================
  // FLOATING TOC PANEL
  // ========================================================================
  function initTocPanel() {
    var fab = document.getElementById('bio-toc-toggle');
    var panel = document.getElementById('bio-toc-panel');
    var overlay = document.getElementById('bio-toc-overlay');
    var closeBtn = document.getElementById('bio-toc-close');

    if (!fab || !panel) return;

    function openPanel() {
      panel.classList.add('is-open');
      if (overlay) overlay.classList.add('is-open');
    }

    function closePanel() {
      panel.classList.remove('is-open');
      if (overlay) overlay.classList.remove('is-open');
    }

    fab.addEventListener('click', openPanel);
    if (closeBtn) closeBtn.addEventListener('click', closePanel);
    if (overlay) overlay.addEventListener('click', closePanel);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('is-open')) {
        closePanel();
      }
    });

    // Close panel after clicking a TOC link (smooth scroll happens first)
    var links = panel.querySelectorAll('.bio-toc__link');
    links.forEach(function (link) {
      link.addEventListener('click', function () {
        setTimeout(closePanel, 150);
      });
    });
  }

  // ========================================================================
  // INIT
  // ========================================================================
  function init() {
    initTimeline();
    initTocScrollSpy();
    initRevealAnimations();
    initSmoothTocScroll();
    initLightbox();
    initTocPanel();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
