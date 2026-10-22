/* Portada: cifras y últimos expedientes de la sección "Proyectos legislativos". */
(function () {
  'use strict';

  var L = window.CGLegis;
  var section = document.getElementById('proyectos-legislativos');
  if (!L || !section) return;

  var cards = section.querySelector('[data-home-cards]');
  var heroNote = document.querySelector('[data-hero-proyectos]');

  function kpi(key, value) {
    L.animarNumero(section.querySelector('[data-home-kpi="' + key + '"]'), value);
  }

  function animarAlVer(callback) {
    if (!('IntersectionObserver' in window)) { callback(); return; }
    var obs = new IntersectionObserver(function (entries) {
      if (entries.some(function (e) { return e.isIntersecting; })) { obs.disconnect(); callback(); }
    }, { rootMargin: '0px 0px -10% 0px' });
    obs.observe(section);
  }

  L.cargar().then(function (projects) {
    var t = L.totales(projects);
    if (heroNote && t.total) heroNote.textContent = t.total + ' expedientes para consultar y descargar';

    var noteTotal = section.querySelector('[data-home-note="total"]');
    if (noteTotal) noteTotal.textContent = t.comisiones + ' comisiones con expedientes · última sesión ' + L.fecha(t.ultimaSesion);
    var noteComision = section.querySelector('[data-home-note="comision"]');
    if (noteComision) noteComision.textContent = 'El ' + t.porcentajeEnComision + ' % de lo que presentamos sigue sin tratamiento';
    animarAlVer(function () {
      kpi('total', t.total);
      kpi('autoria', t.autoria);
      kpi('comision', t.enComision);
    });

    cards.innerHTML = '';
    projects.slice().sort(L.ordenarRecientes).slice(0, 3).forEach(function (p) {
      cards.appendChild(L.tarjeta(p, { heading: 'h4', compact: true }));
    });
  }).catch(function () {
    cards.innerHTML = '<p class="lg-home__error">No pudimos cargar los últimos expedientes. <a href="/proyectos/">Ir a Proyectos legislativos</a>.</p>';
  });
})();
