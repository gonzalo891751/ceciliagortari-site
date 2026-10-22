/* Actividad legislativa: utilidades compartidas por la portada y /proyectos/. */
(function (global) {
  'use strict';

  var API_URL = '/api/projects/public';
  var MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  var MESES_LARGOS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre',
    'octubre', 'noviembre', 'diciembre'];

  // La página habla con la voz de Cecilia: sus iniciativas se presentan como "De autoría".
  var IMPULSO = {
    cecilia: 'De autoría',
    emiliano: 'Impulsado por Emiliano Fernández Recalde',
    gustavo: 'Impulsado por Gustavo Canteros',
    otros: 'Iniciativa de otros diputados'
  };

  var ICON = {
    download: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg>',
    external: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7"/><path d="M8 7h9v9"/></svg>',
    commission: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 21h18"/><path d="M5 21V10l7-5 7 5v11"/><path d="M9 21v-6h6v6"/></svg>',
    bolt: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>',
    spark: '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l2.2 6.3L20.5 10l-6.3 2.2L12 18.5l-2.2-6.3L3.5 10l6.3-1.7z"/></svg>',
    people: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    check: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>',
    chevron: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>',
    link: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>'
  };

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function partes(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
    return m ? { y: +m[1], m: +m[2] - 1, d: +m[3] } : null;
  }

  function fecha(iso) {
    var p = partes(iso);
    return p ? p.d + ' ' + MESES[p.m] + ' ' + p.y : '';
  }

  function fechaLarga(iso) {
    var p = partes(iso);
    return p ? p.d + ' de ' + MESES_LARGOS[p.m] + ' de ' + p.y : '';
  }

  function fechaCorta(iso) {
    var p = partes(iso);
    return p ? String(p.d).padStart(2, '0') + '/' + String(p.m + 1).padStart(2, '0') + '/' + p.y : '';
  }

  function tamano(bytes) {
    if (!bytes) return '';
    if (bytes < 1024 * 1024) return Math.max(1, Math.round(bytes / 1024)) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1).replace('.', ',') + ' MB';
  }

  function numero(n) {
    return n ? String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '';
  }

  function plural(n, uno, varios) { return n === 1 ? uno : varios; }

  function normalizar(text) {
    return String(text || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  }

  /** Quita del resumen los datos que ya se muestran estructurados (firmantes y norma). */
  function resumenLimpio(text) {
    return String(text || '')
      .replace(/\s*Autores consignados por la C[aá]mara:\s*(Dips?\.\s*)?[^.]*\.?/gi, '')
      .replace(/\s*Aprobad[oa] como (Ley|Resoluci[oó]n|Declaraci[oó]n)\s+(N[°º.]*\s*)?[\d\/]+\.?/gi, '')
      .trim();
  }

  function normaTexto(norma) {
    if (!norma || !norma.numero) return '';
    return norma.tipo + ' N.º ' + norma.numero;
  }

  function estadoTexto(p) {
    if (p.estado_grupo === 'aprobado') return p.estado_tramite === 'Sancionado' ? 'Sancionado' : 'Aprobado';
    return p.estado_tramite || 'En comisiones';
  }

  /** Etiqueta pública del origen y la autoría, sin exponer clasificaciones internas pendientes. */
  function etiquetaAutoria(p) {
    if (IMPULSO[p.impulso]) {
      return { texto: IMPULSO[p.impulso], clase: p.impulso === 'cecilia' ? 'lg-chip--cecilia' : '', icono: p.impulso === 'cecilia' ? ICON.spark : ICON.bolt };
    }
    if (p.impulso === 'conjunto') {
      return p.grupo === 'acompanamos'
        ? { texto: 'Coautoría con otros bloques', clase: '', icono: ICON.people }
        : { texto: 'Elaboración conjunta del bloque', clase: '', icono: ICON.people };
    }
    if (p.grupo === 'acompanamos') return { texto: 'Acompañamos', clase: 'lg-chip--acompanamos', icono: ICON.people };
    if (p.grupo === 'bloque') return { texto: 'Proyecto del bloque', clase: 'lg-chip--acompanamos', icono: ICON.people };
    return null;
  }

  var cache = null;
  function cargar() {
    if (!cache) {
      cache = fetch(API_URL, { headers: { Accept: 'application/json' } })
        .then(function (res) {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          return res.json();
        })
        .then(function (data) {
          if (!Array.isArray(data)) throw new Error('Formato inesperado');
          return data;
        })
        .catch(function (err) { cache = null; throw err; });
    }
    return cache;
  }

  function ordenarRecientes(a, b) {
    if (a.fecha_presentacion !== b.fecha_presentacion) return a.fecha_presentacion < b.fecha_presentacion ? 1 : -1;
    return (+b.numero_expediente || 0) - (+a.numero_expediente || 0);
  }

  var DIA = 24 * 60 * 60 * 1000;

  /** Días transcurridos desde la presentación hasta hoy. */
  function diasDesde(iso) {
    var p = partes(iso);
    if (!p) return 0;
    return Math.floor((Date.now() - Date.UTC(p.y, p.m, p.d)) / DIA);
  }

  function totales(projects) {
    var t = { total: projects.length, conNumero: 0, autoria: 0, bloque: 0, acompanamos: 0, enComision: 0,
      enComisionMas90: 0, enComisionMasAntiguo: '', comisiones: 0, ultimaSesion: '', verificado: '' };
    var comisiones = {};
    projects.forEach(function (p) {
      if (p.numero_expediente) t.conNumero++;
      if (p.impulso === 'cecilia') t.autoria++;
      if (p.grupo === 'bloque') t.bloque++;
      if (p.grupo === 'acompanamos') t.acompanamos++;
      if (p.estado_grupo === 'comision') {
        t.enComision++;
        if (diasDesde(p.fecha_presentacion) > 90) t.enComisionMas90++;
        if (!t.enComisionMasAntiguo || p.fecha_presentacion < t.enComisionMasAntiguo) t.enComisionMasAntiguo = p.fecha_presentacion;
      }
      (p.comisiones || []).forEach(function (c) { comisiones[c] = true; });
      if (p.fecha_presentacion > t.ultimaSesion) t.ultimaSesion = p.fecha_presentacion;
      if (p.verificado_at > t.verificado) t.verificado = p.verificado_at;
    });
    t.comisiones = Object.keys(comisiones).length;
    t.porcentajeEnComision = t.total ? Math.round((t.enComision / t.total) * 100) : 0;
    return t;
  }

  function animarNumero(el, valor) {
    if (!el) return;
    var reduce = global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !global.requestAnimationFrame || valor < 10) { el.textContent = valor; return; }
    var inicio = null;
    var duracion = 900;
    function paso(ts) {
      if (!inicio) inicio = ts;
      var k = Math.min(1, (ts - inicio) / duracion);
      el.textContent = Math.round(valor * (1 - Math.pow(1 - k, 3)));
      if (k < 1) global.requestAnimationFrame(paso);
    }
    global.requestAnimationFrame(paso);
  }

  function tagsHtml(p) {
    var items = (p.comisiones || []).map(function (c) {
      return '<li class="lg-tag">' + ICON.commission + '<span>' + esc(c) + '</span></li>';
    });
    if (p.sobre_tablas) items.push('<li class="lg-tag lg-tag--tablas">' + ICON.bolt + '<span>Tratado sobre tablas</span></li>');
    if (!items.length) return '';
    return '<ul class="lg-card__tags" aria-label="' + (p.comisiones.length ? 'Comisiones' : 'Tratamiento') + '">' + items.join('') + '</ul>';
  }

  function firmantesHtml(p) {
    if (p.firmantes_lista && p.firmantes_lista.length) {
      return p.firmantes_lista.map(function (f) {
        return f.bloque ? '<span class="is-bloque">' + esc(f.nombre) + '</span>' : esc(f.nombre);
      }).join(', ');
    }
    if (/varios/i.test(p.firmantes || '')) return 'Varios diputados y diputadas (según la ficha oficial)';
    return 'Sin dato en la ficha oficial';
  }

  function accionesHtml(p) {
    var oficial = p.enlace_oficial
      ? '<a class="lg-official' + (p.documento ? '' : ' lg-official--button') + '" href="' + esc(p.enlace_oficial) + '" target="_blank" rel="noopener">' +
          (p.documento ? 'Ficha oficial' : 'Consultar ficha oficial') +
          '<span class="lg-sr-only"> del expediente ' + esc(numero(p.numero_expediente)) + ' (se abre en una pestaña nueva)</span>' + ICON.external + '</a>'
      : '';
    if (p.documento) {
      var d = p.documento;
      var meta = [d.formato, tamano(d.bytes)].filter(Boolean).join(' · ');
      return '<a class="lg-download" href="' + esc(d.url) + '" download data-download="' + esc(p.id) + '">' + ICON.download +
        '<span>Descargar proyecto</span><span class="lg-sr-only">: ' + esc(p.titulo) + '</span>' +
        (meta ? '<span class="lg-download__meta">' + esc(meta) + '</span>' : '') + '</a>' + oficial;
    }
    return oficial || '<span class="lg-nodoc">Documento en preparación</span>';
  }

  function detallesHtml(p) {
    var filas = [];
    function fila(t, d) { filas.push('<div><dt>' + t + '</dt><dd>' + d + '</dd></div>'); }
    var resumen = resumenLimpio(p.resumen);
    if (resumen.length > 150) fila('Resumen', esc(resumen));
    if (p.titulo_oficial && normalizar(p.titulo_oficial) !== normalizar(p.titulo)) fila('Título oficial', esc(p.titulo_oficial));
    fila('Autoría formal (firmantes)', firmantesHtml(p));
    var a = etiquetaAutoria(p);
    if (a) fila('Origen de la iniciativa', esc(a.texto));
    fila(p.comisiones.length ? 'Giro a ' + plural(p.comisiones.length, 'comisión', 'comisiones') : 'Tratamiento',
      p.comisiones.length ? esc(p.comisiones.join(' · ')) + (p.sobre_tablas ? ' · Tratado sobre tablas' : '') : (p.sobre_tablas ? 'Tratado sobre tablas, sin giro a comisión' : 'Sin dato'));
    var estado = esc(estadoTexto(p));
    if (p.norma) estado += ' como <strong>' + esc(normaTexto(p.norma)) + '</strong>' + (p.norma.fecha ? ' el ' + esc(fechaCorta(p.norma.fecha)) : '');
    fila('Estado parlamentario', estado);
    if (p.fecha_presentacion) fila('Presentación', esc(fechaLarga(p.fecha_presentacion)));
    if (p.documentos_adicionales && p.documentos_adicionales.length) {
      fila('Otros documentos', p.documentos_adicionales.map(function (d) {
        return '<a href="' + esc(d.url) + '" download>' + esc(d.etiqueta) + '</a> <span class="lg-nodoc">(' + esc([d.formato, tamano(d.bytes)].filter(Boolean).join(' · ')) + ')</span>';
      }).join('<br>'));
    }
    var fuente = esc(p.fuente || 'Cámara de Diputados de la Provincia de Corrientes');
    if (p.verificado_at) fuente += ' · verificado el ' + esc(fechaCorta(p.verificado_at));
    fila('Fuente', fuente);
    filas.push('<div><dd><button type="button" class="lg-link-btn" data-copy-link="' + esc(p.id) + '">' + ICON.link + ' Copiar enlace a este proyecto</button></dd></div>');
    return '<details class="lg-card__more"><summary>Más información' + ICON.chevron + '</summary><dl class="lg-details">' + filas.join('') + '</dl></details>';
  }

  /** Tarjeta de proyecto. opts: { heading: 'h3', compact: bool, open: bool, highlighted: bool } */
  function tarjeta(p, opts) {
    opts = opts || {};
    var h = opts.heading || 'h3';
    var tipoClase = { 'Resolución': 'lg-type--resolucion', 'Declaración': 'lg-type--declaracion' }[p.tipo_corto] || '';
    var autoria = etiquetaAutoria(p);
    var chips = [];
    if (autoria) chips.push('<span class="lg-chip ' + autoria.clase + '">' + autoria.icono + esc(autoria.texto) + '</span>');
    if (p.norma) chips.push('<span class="lg-chip lg-chip--norma">' + ICON.check + esc(normaTexto(p.norma)) + '</span>');
    var meta = [];
    if (p.numero_expediente) meta.push('<span>Expte. <strong>' + esc(numero(p.numero_expediente)) + '</strong></span>');
    if (p.fecha_presentacion) meta.push('<span><time datetime="' + esc(p.fecha_presentacion) + '">' + esc(fecha(p.fecha_presentacion)) + '</time></span>');
    var html =
      '<div class="lg-card__top"><span class="lg-type ' + tipoClase + '">' + esc(p.tipo_corto) + '</span>' +
        '<span class="lg-status lg-status--' + esc(p.estado_grupo) + '">' + esc(estadoTexto(p)) + '</span></div>' +
      (meta.length ? '<p class="lg-card__meta">' + meta.join('') + '</p>' : '') +
      '<' + h + ' class="lg-card__title">' + esc(p.titulo) + '</' + h + '>' +
      (resumenLimpio(p.resumen) ? '<p class="lg-card__summary">' + esc(resumenLimpio(p.resumen)) + '</p>' : '') +
      tagsHtml(p) +
      (chips.length ? '<div class="lg-authorship">' + chips.join('') + '</div>' : '') +
      (opts.compact ? '' : detallesHtml(p)) +
      '<div class="lg-card__actions">' + accionesHtml(p) + '</div>';
    var article = document.createElement('article');
    article.className = 'lg-card' + (opts.highlighted ? ' is-highlighted' : '');
    article.id = 'proyecto-' + p.id;
    article.setAttribute('data-tipo', p.tipo_corto);
    article.innerHTML = html;
    if (opts.open) {
      var details = article.querySelector('details');
      if (details) details.open = true;
    }
    return article;
  }

  /** Copia enlaces de proyectos de forma accesible (delegación de eventos). */
  function activarCopiaEnlaces(root) {
    root.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-copy-link]');
      if (!btn) return;
      var url = global.location.origin + '/proyectos/?id=' + encodeURIComponent(btn.getAttribute('data-copy-link'));
      var listo = function () {
        var original = btn.innerHTML;
        btn.textContent = 'Enlace copiado';
        setTimeout(function () { btn.innerHTML = original; }, 1800);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(listo, function () { global.prompt('Copiá el enlace:', url); });
      } else {
        global.prompt('Copiá el enlace:', url);
      }
    });
  }

  global.CGLegis = {
    cargar: cargar,
    esc: esc,
    fecha: fecha,
    fechaLarga: fechaLarga,
    numero: numero,
    plural: plural,
    normalizar: normalizar,
    resumenLimpio: resumenLimpio,
    normaTexto: normaTexto,
    totales: totales,
    diasDesde: diasDesde,
    fechaCorta: fechaCorta,
    ordenarRecientes: ordenarRecientes,
    animarNumero: animarNumero,
    tarjeta: tarjeta,
    activarCopiaEnlaces: activarCopiaEnlaces,
    ICON: ICON
  };
})(window);
