/* /proyectos/: listado, filtros, análisis por comisión y descarga directa. */
(function () {
  'use strict';

  var L = window.CGLegis;
  if (!L) return;

  var PAGE = 12;
  var TABLAS = '__sobre_tablas';
  var GRUPOS = {
    todos: { nombre: 'Todos', nota: 'Todos los proyectos que llevan nuestra firma en la Cámara de Diputados.' },
    autoria: { nombre: 'De autoría', nota: 'Proyectos de nuestra autoría, elaborados por nuestro equipo. En general los presentamos con la firma de los tres integrantes del bloque.' },
    bloque: { nombre: 'Del bloque', nota: 'Proyectos de nuestro bloque, junto a Emiliano Fernández Recalde y Gustavo Canteros. Incluye los de nuestra autoría.' },
    acompanamos: { nombre: 'Acompañamos', nota: 'Iniciativas compartidas con diputados de otros bloques que acompañamos con nuestra firma.' }
  };
  var ALIAS_GRUPO = { cecilia: 'autoria' };
  var ESTADOS = { comision: 'Enviados a comisiones', tramite: 'Con avances en el trámite', aprobado: 'Aprobados', archivado: 'Archivados o retirados' };
  var TIPOS = ['Ley', 'Resolución', 'Declaración'];

  var $ = function (sel) { return document.querySelector(sel); };
  var el = {
    grid: $('[data-grid]'), empty: $('[data-empty]'), error: $('[data-error]'), more: $('[data-more]'),
    moreBtn: $('[data-more-btn]'), moreText: $('[data-more-text]'), results: $('#lg-results'), chips: $('[data-chips]'),
    q: $('#lg-q'), orden: $('#lg-orden'), vista: $('[data-vista]'), sesion: $('#lg-sesion'),
    segment: $('[data-segment]'), scopeNote: $('[data-scope-note]'), estados: $('[data-estados]'), tipos: $('[data-tipos]'),
    badge: $('[data-filtros-activos]'),
    layout: $('[data-layout]'), panelToggle: $('[data-panel-toggle]'), panelToggleLabel: $('[data-panel-toggle-label]'),
    bars: $('[data-bars]'), summary: $('[data-panel-summary]'), spotlight: $('[data-spotlight]'), reloj: $('[data-reloj]')
  };

  var todos = [];
  var comisionesGlobal = [];
  var state = { grupo: 'todos', q: '', comision: '', tipo: '', estado: '', sesion: '', mes: '', orden: 'recientes', vista: 'grilla', visibles: PAGE, spotlight: '' };

  // ---------------------------------------------------------------- filtros
  function enGrupo(p, grupo) {
    if (grupo === 'autoria') return p.impulso === 'cecilia';
    if (grupo === 'bloque' || grupo === 'acompanamos') return p.grupo === grupo;
    return true;
  }

  function textoBusqueda(p) {
    if (!p._busqueda) {
      p._busqueda = L.normalizar([p.titulo, p.titulo_oficial, L.resumenLimpio(p.resumen), p.tipo, p.numero_expediente,
        (p.comisiones || []).join(' '), p.firmantes, p.norma ? L.normaTexto(p.norma) : '', p.estado_tramite].join(' '));
    }
    return p._busqueda;
  }

  function coincideTexto(p, q) {
    if (!q) return true;
    var texto = textoBusqueda(p);
    var digitos = q.replace(/[.\s]/g, '');
    if (/^\d{3,6}$/.test(digitos) && String(p.numero_expediente).indexOf(digitos) !== -1) return true;
    return q.split(/\s+/).every(function (palabra) { return texto.indexOf(palabra) !== -1; });
  }

  function coincideComision(p, comision) {
    if (!comision) return true;
    if (comision === TABLAS) return p.sobre_tablas;
    return (p.comisiones || []).indexOf(comision) !== -1;
  }

  /** Aplica todos los filtros salvo el indicado (para conteos facetados). */
  function filtrar(excepto) {
    var q = L.normalizar(state.q.trim());
    return todos.filter(function (p) {
      return (excepto === 'grupo' || enGrupo(p, state.grupo)) &&
        (excepto === 'q' || coincideTexto(p, q)) &&
        (excepto === 'comision' || coincideComision(p, state.comision)) &&
        (excepto === 'tipo' || !state.tipo || p.tipo_corto === state.tipo) &&
        (excepto === 'estado' || !state.estado || p.estado_grupo === state.estado) &&
        (excepto === 'sesion' || !state.sesion || p.fecha_presentacion === state.sesion) &&
        (!state.mes || String(p.fecha_presentacion).slice(0, 7) === state.mes);
    });
  }

  function ordenar(lista) {
    var copia = lista.slice();
    if (state.orden === 'antiguos') return copia.sort(function (a, b) { return L.ordenarRecientes(b, a); });
    if (state.orden === 'expediente') {
      return copia.sort(function (a, b) { return (+b.numero_expediente || 0) - (+a.numero_expediente || 0); });
    }
    return copia.sort(L.ordenarRecientes);
  }

  // ---------------------------------------------------------------- facetas
  /** Botones de filtro con su cantidad; se ocultan las opciones sin resultados (salvo la elegida). */
  function opciones(cont, attr, items, actual) {
    cont.innerHTML = items.filter(function (item) { return item.n || item.value === actual; }).map(function (item) {
      return '<button type="button" class="lg-opcion' + (item.clase ? ' ' + item.clase : '') + '" ' + attr + '="' + L.esc(item.value) +
        '" aria-pressed="' + (item.value === actual) + '"><span class="lg-opcion__texto">' + L.esc(item.label) + '</span>' +
        '<span class="lg-opcion__n">' + item.n + '</span></button>';
    }).join('') || '<p class="lg-nodoc">Sin opciones para la selección actual.</p>';
  }

  function actualizarFacetas() {
    var porGrupo = filtrar('grupo');
    Object.keys(GRUPOS).forEach(function (g) {
      var n = porGrupo.filter(function (p) { return enGrupo(p, g); }).length;
      var badge = el.segment.querySelector('[data-count="' + g + '"]');
      if (badge) badge.textContent = n;
    });

    var porEstado = filtrar('estado');
    opciones(el.estados, 'data-estado', Object.keys(ESTADOS).map(function (e) {
      return { value: e, label: ESTADOS[e], n: porEstado.filter(function (p) { return p.estado_grupo === e; }).length,
        clase: e === 'comision' ? 'lg-opcion--alerta' : '' };
    }), state.estado);

    var porTipo = filtrar('tipo');
    opciones(el.tipos, 'data-tipo', TIPOS.concat(todos.map(function (p) { return p.tipo_corto; }).filter(function (t, i, arr) {
      return TIPOS.indexOf(t) === -1 && arr.indexOf(t) === i;
    })).map(function (t) {
      return { value: t, label: t, n: porTipo.filter(function (p) { return p.tipo_corto === t; }).length };
    }), state.tipo);

    // Sesiones de la más reciente a la más antigua, con la cantidad de proyectos presentados en cada una.
    var porSesion = filtrar('sesion');
    el.sesion.innerHTML = '<option value="">Todas las sesiones</option>' + Object.keys(L.SESIONES).sort().reverse().map(function (f) {
      var n = porSesion.filter(function (p) { return p.fecha_presentacion === f; }).length;
      return '<option value="' + f + '"' + (n || f === state.sesion ? '' : ' disabled') + '>' +
        L.esc(L.sesionTexto(f) + ' · ' + L.fecha(f) + ' (' + n + ')') + '</option>';
    }).join('');
    el.sesion.value = state.sesion;
  }

  // ---------------------------------------------------------------- análisis
  function renderAnalisis() {
    var base = filtrar('comision');
    var conteo = {};
    var multiples = 0;
    var tablas = 0;
    var dormidos = 0;
    base.forEach(function (p) {
      if (p.comisiones.length > 1) multiples++;
      if (p.estado_grupo === 'comision') dormidos++;
      if (p.sobre_tablas) tablas++;
      p.comisiones.forEach(function (c) { conteo[c] = (conteo[c] || 0) + 1; });
    });
    var filas = Object.keys(conteo).map(function (c) { return [c, conteo[c]]; })
      .sort(function (a, b) { return b[1] - a[1] || a[0].localeCompare(b[0], 'es'); });
    var max = filas.length ? filas[0][1] : 1;

    el.summary.innerHTML =
      '<div class="lg-panel__stat"><strong>' + base.length + '</strong><span>' + L.plural(base.length, 'proyecto analizado', 'proyectos analizados') + '</span></div>' +
      '<div class="lg-panel__stat lg-panel__stat--alerta"><strong>' + dormidos + '</strong><span>' + L.plural(dormidos, 'enviado', 'enviados') + ' a comisiones</span></div>' +
      '<div class="lg-panel__stat"><strong>' + multiples + '</strong><span>' + L.plural(multiples, 'girado a 2 o más', 'girados a 2 o más') + '</span></div>';

    function barra(valor, nombre, n, clase) {
      var pct = base.length ? Math.round((n / base.length) * 100) : 0;
      var activo = state.comision === valor;
      return '<li><button type="button" class="lg-bar ' + (clase || '') + '" data-comision="' + L.esc(valor) + '" aria-pressed="' + activo + '">' +
        '<span class="lg-bar__name">' + L.esc(nombre) + '</span>' +
        '<span class="lg-bar__value">' + n + '<small>' + pct + '%</small></span>' +
        '<span class="lg-bar__meter" aria-hidden="true"><span class="lg-bar__fill" style="--w:' + Math.max(3, Math.round((n / max) * 100)) + '%"></span></span>' +
        '<span class="lg-sr-only">: ' + n + ' ' + L.plural(n, 'expediente', 'expedientes') + ', ' + pct + ' por ciento de los analizados</span>' +
      '</button></li>';
    }

    var html = filas.map(function (f) { return barra(f[0], f[0], f[1]); }).join('');
    if (tablas) {
      html += '<li class="lg-bars__divider" aria-hidden="true">Sin giro a comisión</li>' +
        barra(TABLAS, 'Tratados y aprobados sobre tablas', tablas, 'lg-bar--tablas');
    }
    el.bars.innerHTML = html || '<li class="lg-nodoc">No hay datos para la selección actual.</li>';
  }

  // ---------------------------------------------------------------- listado
  function renderChips() {
    var chips = [];
    function chip(key, texto) {
      chips.push('<button type="button" class="lg-filter-chip" data-clear="' + key + '" aria-label="Quitar filtro: ' + L.esc(texto) + '">' + L.esc(texto) +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg></button>');
    }
    if (state.q) chip('q', '“' + state.q + '”');
    if (state.comision) chip('comision', state.comision === TABLAS ? 'Sobre tablas' : state.comision);
    if (state.tipo) chip('tipo', state.tipo);
    if (state.estado) chip('estado', ESTADOS[state.estado]);
    if (state.sesion) chip('sesion', L.sesionTexto(state.sesion) + ' · ' + L.fecha(state.sesion));
    if (state.mes) chip('mes', 'Presentados en ' + L.mesTexto(state.mes));
    if (chips.length > 1) chips.push('<button type="button" class="lg-link-btn" data-reset>Limpiar filtros</button>');
    el.chips.innerHTML = chips.join('');
  }

  function renderLista() {
    var lista;
    if (state.spotlight) {
      lista = todos.filter(function (p) { return p.id === state.spotlight; });
    } else {
      lista = ordenar(filtrar());
    }
    var total = lista.length;
    var visibles = lista.slice(0, state.spotlight ? 1 : state.visibles);

    el.grid.setAttribute('aria-busy', 'false');
    el.grid.innerHTML = '';
    var frag = document.createDocumentFragment();
    visibles.forEach(function (p, i) {
      var card = L.tarjeta(p, { open: Boolean(state.spotlight), highlighted: Boolean(state.spotlight) });
      card.style.animationDelay = Math.min(i % PAGE, 8) * 35 + 'ms';
      frag.appendChild(card);
    });
    el.grid.appendChild(frag);
    el.grid.hidden = total === 0;
    el.empty.hidden = total !== 0;

    var grupo = GRUPOS[state.grupo].nombre;
    el.results.innerHTML = state.spotlight
      ? 'Mostrando <strong>1</strong> proyecto'
      : '<strong>' + total + '</strong> ' + L.plural(total, 'proyecto', 'proyectos') +
        (state.grupo !== 'todos' ? ' · ' + L.esc(grupo) : '');

    var restantes = total - visibles.length;
    el.more.hidden = restantes <= 0 || Boolean(state.spotlight);
    if (restantes > 0) {
      el.moreBtn.textContent = 'Mostrar ' + Math.min(PAGE, restantes) + ' proyectos más';
      el.moreText.textContent = 'Viendo ' + visibles.length + ' de ' + total;
    }

    if (state.spotlight && visibles[0]) {
      el.spotlight.hidden = false;
      el.spotlight.innerHTML = '<div class="lg-spotlight"><span>Estás viendo el expediente ' +
        L.esc(visibles[0].numero_expediente ? L.numero(visibles[0].numero_expediente) : visibles[0].titulo) +
        '.</span><button type="button" class="lg-link-btn" data-clear="spotlight">Ver todos los proyectos</button></div>';
    } else {
      el.spotlight.hidden = true;
      el.spotlight.innerHTML = '';
    }
  }

  function sincronizarControles() {
    el.segment.querySelectorAll('[data-grupo]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-grupo') === state.grupo));
    });
    el.scopeNote.textContent = GRUPOS[state.grupo].nota;
    var activos = [state.grupo !== 'todos', state.estado, state.tipo, state.sesion, state.comision, state.mes].filter(Boolean).length;
    el.badge.hidden = !activos;
    el.badge.textContent = activos ? activos + ' ' + L.plural(activos, 'activo', 'activos') : '';
    if (el.reloj) {
      el.reloj.querySelectorAll('[data-mes]').forEach(function (b) {
        b.setAttribute('aria-pressed', String(b.getAttribute('data-mes') === state.mes));
      });
    }
    el.orden.value = state.orden;
  }

  function guardarUrl() {
    var params = new URLSearchParams();
    if (state.spotlight) params.set('id', state.spotlight);
    else {
      if (state.grupo !== 'todos') params.set('grupo', state.grupo);
      if (state.q) params.set('q', state.q);
      if (state.comision) params.set('comision', state.comision === TABLAS ? 'sobre-tablas' : state.comision);
      if (state.tipo) params.set('tipo', state.tipo);
      if (state.estado) params.set('estado', state.estado);
      if (state.sesion) params.set('sesion', state.sesion);
      if (state.mes) params.set('mes', state.mes);
      if (state.orden !== 'recientes') params.set('orden', state.orden);
      if (state.vista === 'lista') params.set('vista', 'lista');
    }
    var qs = params.toString();
    try { history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '') + location.hash); } catch (_) {}
  }

  var tq;
  /** opts.syncInputs: el estado manda sobre el buscador (URL, limpiar); si no, manda lo escrito. */
  function render(opts) {
    opts = opts || {};
    clearTimeout(tq);
    if (opts.syncInputs) el.q.value = state.q;
    else state.q = el.q.value.trim();
    if (!opts.keepPage) state.visibles = PAGE;
    sincronizarControles();
    actualizarFacetas();
    renderAnalisis();
    renderChips();
    renderLista();
    guardarUrl();
  }

  // ---------------------------------------------------------------- KPIs
  function renderKpis() {
    var t = L.totales(todos);
    function kpi(key, valor) { L.animarNumero(document.querySelector('[data-kpi="' + key + '"]'), valor); }
    kpi('total', t.total);
    kpi('autoria', t.autoria);
    kpi('comision', t.enComision);
    function nota(key, texto) {
      var el = document.querySelector('[data-kpi-note="' + key + '"]');
      if (el) el.textContent = texto;
    }
    var sinNumero = t.total - t.conNumero;
    nota('total', t.conNumero + ' con número de expediente de la Cámara' +
      (sinNumero ? ' y ' + sinNumero + ' en trámite de identificación' : '') + ', sin duplicados');
    nota('comision', 'El ' + t.porcentajeEnComision + ' % de lo que presentamos fue enviado a comisiones y sigue sin dictamen');
    nota('comision-corta', t.porcentajeEnComision + ' % del total');
    if (el.reloj && t.caducidadMasAntiguo) {
      el.reloj.innerHTML = L.relojHtml(t);
      el.reloj.hidden = false;
    }
    var meta = document.querySelector('[data-kpi-note="meta"]');
    if (meta && t.ultimaSesion) {
      meta.innerHTML = 'Última sesión registrada: ' + L.esc(L.fechaLarga(t.ultimaSesion)) +
        (t.verificado ? ' · Estados verificados al ' + L.esc(L.fechaCorta(t.verificado)) : '') +
        ' · Fuente: <a href="https://hcdcorrientes.gov.ar/" target="_blank" rel="noopener">Cámara de Diputados de Corrientes</a>';
    }
  }

  // ---------------------------------------------------------------- panel y vista
  // En escritorio los filtros quedan siempre a la vista; en pantallas angostas se despliegan con un botón.
  var mqPanel = window.matchMedia('(max-width: 1180px)');

  function setPanel(colapsado) {
    el.layout.classList.toggle('is-panel-collapsed', colapsado);
    el.panelToggle.setAttribute('aria-expanded', String(!colapsado));
    el.panelToggleLabel.textContent = colapsado ? 'Mostrar' : 'Ocultar';
    document.getElementById('lg-panel-body').hidden = colapsado;
  }

  function leerVista() { try { return localStorage.getItem('lg-vista'); } catch (_) { return null; } }

  function setVista(vista, persistir) {
    state.vista = vista === 'lista' ? 'lista' : 'grilla';
    el.grid.classList.toggle('lg-grid--lista', state.vista === 'lista');
    el.vista.querySelectorAll('[data-vista-btn]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-vista-btn') === state.vista));
    });
    if (persistir) { try { localStorage.setItem('lg-vista', state.vista); } catch (_) {} }
  }

  // ---------------------------------------------------------------- eventos
  function setGrupo(g) {
    if (!GRUPOS[g]) return;
    state.grupo = g;
    state.spotlight = '';
    render();
  }

  function limpiar(key) {
    if (key === 'spotlight') state.spotlight = '';
    else if (key) state[key] = '';
    render({ syncInputs: true });
  }

  function resetear() {
    state.grupo = 'todos'; state.q = ''; state.comision = ''; state.tipo = ''; state.estado = ''; state.sesion = ''; state.mes = ''; state.spotlight = '';
    render({ syncInputs: true });
  }

  /** Mes del reloj de caducidad: muestra solo los proyectos de ese mes que siguen en comisión (otro clic lo quita). */
  function verMes(mes) {
    var activo = state.mes === mes && state.estado === 'comision';
    state.grupo = 'todos'; state.q = ''; state.comision = ''; state.tipo = ''; state.sesion = ''; state.spotlight = '';
    state.estado = 'comision';
    state.mes = activo ? '' : mes;
    render({ syncInputs: true });
    if (!activo) document.querySelector('.lg-statusbar').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function enlazar() {
    el.segment.addEventListener('click', function (e) {
      var b = e.target.closest('[data-grupo]');
      if (b) setGrupo(b.getAttribute('data-grupo'));
    });
    el.q.addEventListener('input', function () {
      clearTimeout(tq);
      tq = setTimeout(function () { state.spotlight = ''; render(); }, 160);
    });
    el.estados.addEventListener('click', function (e) {
      var b = e.target.closest('[data-estado]');
      if (!b) return;
      var valor = b.getAttribute('data-estado');
      state.estado = state.estado === valor ? '' : valor;
      state.spotlight = '';
      render();
    });
    el.tipos.addEventListener('click', function (e) {
      var b = e.target.closest('[data-tipo]');
      if (!b) return;
      var valor = b.getAttribute('data-tipo');
      state.tipo = state.tipo === valor ? '' : valor;
      state.spotlight = '';
      render();
    });
    el.vista.addEventListener('click', function (e) {
      var b = e.target.closest('[data-vista-btn]');
      if (!b) return;
      setVista(b.getAttribute('data-vista-btn'), true);
      guardarUrl();
    });
    el.orden.addEventListener('change', function () { state.orden = el.orden.value; render(); });
    el.sesion.addEventListener('change', function () { state.sesion = el.sesion.value; state.spotlight = ''; render(); });
    el.moreBtn.addEventListener('click', function () {
      var antes = state.visibles;
      state.visibles += PAGE;
      render({ keepPage: true });
      var siguiente = el.grid.children[antes];
      if (siguiente) {
        var link = siguiente.querySelector('a, summary, button');
        if (link) link.focus({ preventScroll: true });
      }
    });
    el.bars.addEventListener('click', function (e) {
      var b = e.target.closest('[data-comision]');
      if (!b) return;
      var valor = b.getAttribute('data-comision');
      state.comision = state.comision === valor ? '' : valor;
      state.spotlight = '';
      render();
      if (mqPanel.matches) document.getElementById('lg-list-title').parentNode.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    document.addEventListener('click', function (e) {
      var clear = e.target.closest('[data-clear]');
      if (clear) { limpiar(clear.getAttribute('data-clear')); return; }
      if (e.target.closest('[data-reset]')) resetear();
    });
    document.querySelector('[data-retry]').addEventListener('click', iniciar);
    el.panelToggle.addEventListener('click', function () {
      setPanel(!el.layout.classList.contains('is-panel-collapsed'));
    });
    var cambioMq = function () { setPanel(mqPanel.matches); };
    if (mqPanel.addEventListener) mqPanel.addEventListener('change', cambioMq);
    if (el.reloj) L.activarReloj(el.reloj, verMes);
    L.activarCopiaEnlaces(el.grid);
    L.activarBrillo(el.grid);
  }

  function leerUrl() {
    var params = new URLSearchParams(location.search);
    var id = params.get('id');
    if (id && todos.some(function (p) { return p.id === id; })) state.spotlight = id;
    var grupo = ALIAS_GRUPO[params.get('grupo')] || params.get('grupo');
    if (GRUPOS[grupo]) state.grupo = grupo;
    state.q = (params.get('q') || '').slice(0, 120);
    var comision = params.get('comision') || '';
    state.comision = comision === 'sobre-tablas' ? TABLAS : (comisionesGlobal.indexOf(comision) !== -1 ? comision : '');
    state.tipo = TIPOS.indexOf(params.get('tipo')) !== -1 ? params.get('tipo') : '';
    state.estado = ESTADOS[params.get('estado')] ? params.get('estado') : '';
    state.sesion = L.SESIONES[params.get('sesion')] ? params.get('sesion') : '';
    state.mes = /^\d{4}-(0[1-9]|1[0-2])$/.test(params.get('mes') || '') ? params.get('mes') : '';
    state.orden = ['recientes', 'antiguos', 'expediente'].indexOf(params.get('orden')) !== -1 ? params.get('orden') : 'recientes';
    setVista(params.get('vista') || leerVista(), false);
  }

  function iniciar() {
    el.error.hidden = true;
    el.grid.hidden = false;
    L.cargar().then(function (data) {
      todos = data;
      var set = {};
      todos.forEach(function (p) { (p.comisiones || []).forEach(function (c) { set[c] = true; }); });
      comisionesGlobal = Object.keys(set).sort(function (a, b) { return a.localeCompare(b, 'es'); });
      leerUrl();
      renderKpis();
      render({ syncInputs: true });
      if (state.spotlight) {
        var card = document.getElementById('proyecto-' + state.spotlight);
        if (card) card.scrollIntoView({ block: 'center' });
      }
    }).catch(function () {
      el.grid.hidden = true;
      el.more.hidden = true;
      el.error.hidden = false;
      el.results.textContent = 'No se pudieron cargar los proyectos.';
    });
  }

  enlazar();
  setPanel(mqPanel.matches);
  iniciar();
})();
