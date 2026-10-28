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
    link: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
    cajon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2.5" y="3.5" width="19" height="5" rx="1.2"/><path d="M4.5 8.5v10.5a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5V8.5"/><path d="M10 12.5h4"/></svg>',
    reloj: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 22h14"/><path d="M5 2h14"/><path d="M17 22v-4.17a2 2 0 0 0-.59-1.42L12 12l-4.41 4.41A2 2 0 0 0 7 17.83V22"/><path d="M7 2v4.17a2 2 0 0 0 .59 1.42L12 12l4.41-4.41A2 2 0 0 0 17 6.17V2"/></svg>'
  };

  // Un expediente sin tratamiento caduca a los dos años de su presentación.
  var CADUCIDAD_ANIOS = 2;

  // Sesiones ordinarias de 2026 según los informes oficiales de la Cámara ("16/09/26 15ª S.O."; el informe del
  // 28/10 numera la 18.ª y la 17.ª del 14/10). Los proyectos se presentan en sesión: fecha_presentacion es su fecha.
  var SESIONES = {
    '2026-03-11': 1, '2026-03-18': 2, '2026-04-08': 3, '2026-04-15': 4, '2026-04-29': 5, '2026-05-06': 6,
    '2026-05-13': 7, '2026-05-27': 8, '2026-06-03': 9, '2026-06-17': 10, '2026-07-08': 11, '2026-08-05': 12,
    '2026-08-19': 13, '2026-08-26': 14, '2026-09-16': 15, '2026-09-23': 16, '2026-10-14': 17, '2026-10-28': 18
  };

  /** "18.ª sesión" para la fecha de una sesión ordinaria registrada; '' si no corresponde a ninguna. */
  function sesionTexto(iso) {
    return SESIONES[iso] ? SESIONES[iso] + '.ª sesión' : '';
  }

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
    if (p.estado_grupo === 'comision') return 'Mandado a comisiones';
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

  function sumarAnios(iso, anios) {
    var p = partes(iso);
    return p ? (p.y + anios) + '-' + String(p.m + 1).padStart(2, '0') + '-' + String(p.d).padStart(2, '0') : '';
  }

  function mesesEntre(desde, hasta) {
    var a = new Date(desde), b = new Date(hasta);
    var meses = (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + (b.getUTCMonth() - a.getUTCMonth());
    if (b.getUTCDate() < a.getUTCDate()) meses--;
    return meses;
  }

  /** Tiempo de espera y caducidad de un proyecto sin tratamiento. */
  function caducidad(p) {
    var inicio = partes(p.fecha_presentacion);
    if (!inicio) return null;
    var desde = Date.UTC(inicio.y, inicio.m, inicio.d);
    var vence = sumarAnios(p.fecha_presentacion, CADUCIDAD_ANIOS);
    var fin = Date.UTC(inicio.y + CADUCIDAD_ANIOS, inicio.m, inicio.d);
    var hoy = Date.now();
    return {
      vence: vence,
      progreso: Math.min(1, Math.max(0, (hoy - desde) / (fin - desde))),
      mesesEsperando: Math.max(0, mesesEntre(desde, hoy)),
      mesesRestantes: Math.max(0, mesesEntre(hoy, fin)),
      diasRestantes: Math.max(0, Math.ceil((fin - hoy) / DIA))
    };
  }

  function duracion(meses, dias) {
    if (meses >= 1) return meses + ' ' + plural(meses, 'mes', 'meses');
    return dias + ' ' + plural(dias, 'día', 'días');
  }

  function totales(projects) {
    var t = { total: projects.length, conNumero: 0, autoria: 0, bloque: 0, acompanamos: 0, enComision: 0,
      enComisionMas90: 0, enComisionMasAntiguo: '', esperaPorMes: {}, plazoVencido: 0, comisiones: 0, ultimaSesion: '', verificado: '' };
    var comisiones = {};
    projects.forEach(function (p) {
      if (p.numero_expediente) t.conNumero++;
      if (p.impulso === 'cecilia') t.autoria++;
      if (p.grupo === 'bloque') t.bloque++;
      if (p.grupo === 'acompanamos') t.acompanamos++;
      if (p.estado_grupo === 'comision') {
        t.enComision++;
        var cad = caducidad(p);
        if (cad && cad.progreso >= 1) {
          // Superó los dos años sin que se actualice su estado: se cuenta aparte hasta verificarlo en la Cámara.
          t.plazoVencido++;
        } else {
          var mes = String(p.fecha_presentacion).slice(0, 7);
          if (mes) t.esperaPorMes[mes] = (t.esperaPorMes[mes] || 0) + 1;
          if (diasDesde(p.fecha_presentacion) > 90) t.enComisionMas90++;
          if (!t.enComisionMasAntiguo || p.fecha_presentacion < t.enComisionMasAntiguo) t.enComisionMasAntiguo = p.fecha_presentacion;
        }
      }
      (p.comisiones || []).forEach(function (c) { comisiones[c] = true; });
      if (p.fecha_presentacion > t.ultimaSesion) t.ultimaSesion = p.fecha_presentacion;
      if (p.verificado_at > t.verificado) t.verificado = p.verificado_at;
    });
    t.comisiones = Object.keys(comisiones).length;
    t.caducidadMasAntiguo = t.enComisionMasAntiguo ? caducidad({ fecha_presentacion: t.enComisionMasAntiguo }) : null;
    // Un expediente vence el mismo mes de presentación, dos años después.
    t.vencimientos = Object.keys(t.esperaPorMes).sort().map(function (mes) {
      return { mes: mes, vence: (+mes.slice(0, 4) + CADUCIDAD_ANIOS) + mes.slice(4), cantidad: t.esperaPorMes[mes] };
    });
    return t;
  }

  function mesTexto(clave) {
    var p = partes(clave + '-01');
    return p ? MESES_LARGOS[p.m] + ' de ' + p.y : '';
  }

  /**
   * Reloj de caducidad: plegado por defecto. Muestra, sobre el plazo de dos años del expediente en espera
   * más antiguo, cuántos proyectos siguen sin tratar por mes de presentación; cada mes filtra el listado.
   */
  function relojHtml(t) {
    var c = t.caducidadMasAntiguo;
    if (!c) return '';
    var inicio = partes(t.enComisionMasAntiguo);
    var meses = CADUCIDAD_ANIOS * 12;
    var max = Math.max.apply(null, Object.keys(t.esperaPorMes).map(function (k) { return t.esperaPorMes[k]; }).concat([1]));
    var hoy = new Date();
    var idxHoy = (hoy.getFullYear() - inicio.y) * 12 + (hoy.getMonth() - inicio.m);
    var diasMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();
    var posHoy = Math.min(100, Math.max(0, ((idxHoy + (hoy.getDate() - 0.5) / diasMes) / meses) * 100));
    var columnas = [];
    var chips = [];
    for (var i = 0; i < meses; i++) {
      var y = inicio.y + Math.floor((inicio.m + i) / 12);
      var m = (inicio.m + i) % 12;
      var clave = y + '-' + String(m + 1).padStart(2, '0');
      var n = t.esperaPorMes[clave] || 0;
      var nombre = MESES_LARGOS[m] + ' de ' + y;
      var etiqueta = MESES[m] + (m === 0 || i === 0 ? ' ' + y : '');
      var movil = i === 0 || i === meses - 1 || (i === idxHoy && i > 2 && i < meses - 3);
      var clase = 'lg-reloj__mes' + (i < idxHoy ? ' pasado' : i === idxHoy ? ' actual' : '') + (movil ? ' movil' : '');
      var detalle = n + ' ' + plural(n, 'proyecto presentado', 'proyectos presentados') + ' en ' + nombre + ' ' + plural(n, 'sigue', 'siguen') + ' en comisión';
      var columna = n
        ? '<button type="button" class="lg-reloj__col" data-mes="' + clave + '" aria-pressed="false" title="' + esc(detalle) + '" aria-label="' + esc(detalle) + '. Ver ' + plural(n, 'ese proyecto', 'esos proyectos') + '">' +
            '<b aria-hidden="true">' + n + '</b><span class="lg-reloj__barra" style="--h:' + Math.max(12, Math.round((n / max) * 100)) + '%"></span></button>'
        : '<span class="lg-reloj__col" aria-hidden="true"><span class="lg-reloj__barra"></span></span>';
      columnas.push('<div class="' + clase + '">' + columna + '<span class="lg-reloj__etiqueta" aria-hidden="true">' + esc(etiqueta) + '</span></div>');
    }
    t.vencimientos.forEach(function (v) {
      var vm = partes(v.vence + '-01');
      chips.push('<button type="button" class="lg-reloj__chip" data-mes="' + v.mes + '" aria-pressed="false"' +
        ' aria-label="' + esc(v.cantidad + ' ' + plural(v.cantidad, 'proyecto vence', 'proyectos vencen') + ' en ' + mesTexto(v.vence) + '. Ver ' + plural(v.cantidad, 'ese proyecto', 'esos proyectos')) + '">' +
        '<b>' + v.cantidad + '</b><span>' + plural(v.cantidad, 'vence', 'vencen') + ' en <strong>' + esc(MESES[vm.m] + ' ' + vm.y) + '</strong></span></button>');
    });
    var proximo = t.vencimientos[0];
    var resumen = proximo
      ? '<strong>' + proximo.cantidad + ' ' + plural(proximo.cantidad, 'proyecto vence', 'proyectos vencen') + ' en ' + esc(mesTexto(proximo.vence)) + '</strong> si no se tratan · los expedientes caducan a los ' + CADUCIDAD_ANIOS + ' años'
      : 'Los expedientes caducan a los ' + CADUCIDAD_ANIOS + ' años si no se tratan';
    return '<button type="button" class="lg-reloj__toggle" aria-expanded="false" aria-controls="lg-reloj-panel" data-reloj-toggle>' +
        '<span class="lg-reloj__icono">' + ICON.reloj + '</span>' +
        '<span class="lg-reloj__titulo"><strong>Reloj de caducidad</strong><span>' + resumen + '</span></span>' +
        '<span class="lg-reloj__accion"><span data-reloj-accion>Ver cronología</span>' + ICON.chevron + '</span></button>' +
      '<div class="lg-reloj__panel" id="lg-reloj-panel" hidden>' +
        '<div class="lg-reloj__explica"><p><strong>Cada proyecto que presentamos tiene una vida de ' + CADUCIDAD_ANIOS + ' años.</strong> Muchos nacen de urgencias y pedidos de vecinas y vecinos: son propuestas concretas para resolver problemas reales. Pero si la comisión no los trata en ese plazo, vencen y se archivan sin que nadie los haya votado en contra. Es una forma silenciosa de rechazarlos.</p></div>' +
        '<p class="lg-reloj__ayuda">Cada barra suma los proyectos presentados ese mes que siguen en comisión. Tocá un mes, o un vencimiento, para verlos en el listado.</p>' +
        '<div class="lg-reloj__grafico' + (posHoy > 88 ? ' cerca' : '') + '">' +
          '<span class="lg-reloj__transcurrido" style="--p:' + posHoy.toFixed(1) + '%" aria-hidden="true"><span>Hoy</span></span>' +
          '<span class="lg-reloj__vence" aria-hidden="true"><span>Caduca</span></span>' +
          '<div class="lg-reloj__meses" role="group" aria-label="Proyectos que siguen en comisión, por mes de presentación">' + columnas.join('') + '</div>' +
        '</div>' +
        '<div class="lg-reloj__vencimientos"><h3 class="lg-reloj__subtitulo">Próximos vencimientos</h3>' +
          '<div class="lg-reloj__chips" role="group" aria-label="Próximos vencimientos">' + chips.join('') + '</div></div>' +
        '<ul class="lg-reloj__leyenda" aria-hidden="true">' +
          '<li><span class="lg-reloj__clave lg-reloj__clave--barra"></span>Proyectos en comisión, por mes de presentación</li>' +
          '<li><span class="lg-reloj__clave lg-reloj__clave--transcurrido"></span>Tiempo ya transcurrido</li>' +
          '<li><span class="lg-reloj__clave lg-reloj__clave--vence"></span>Caducidad del más antiguo</li>' +
        '</ul>' +
        '<p class="lg-reloj__texto">El proyecto en comisión más antiguo se presentó el <strong>' + esc(fechaLarga(t.enComisionMasAntiguo)) +
          '</strong> y caduca el <strong>' + esc(fechaLarga(c.vence)) + '</strong>: pasaron ' + esc(duracion(c.mesesEsperando, 0)) +
          ' de ' + meses + ' y le quedan <strong>' + esc(duracion(c.mesesRestantes, c.diasRestantes)) + '</strong>.' +
          (t.plazoVencido ? ' Además, ' + t.plazoVencido + ' ' + plural(t.plazoVencido, 'proyecto superó', 'proyectos superaron') + ' los ' + CADUCIDAD_ANIOS + ' años: estamos verificando su estado en la Cámara.' : '') + '</p>' +
      '</div>';
  }

  /** Despliegue del reloj y selección de un mes (onMes recibe 'AAAA-MM'). */
  function activarReloj(contenedor, onMes) {
    contenedor.addEventListener('click', function (e) {
      var toggle = e.target.closest('[data-reloj-toggle]');
      if (toggle) {
        var abrir = toggle.getAttribute('aria-expanded') !== 'true';
        toggle.setAttribute('aria-expanded', String(abrir));
        contenedor.querySelector('#' + toggle.getAttribute('aria-controls')).hidden = !abrir;
        contenedor.classList.toggle('is-open', abrir);
        toggle.querySelector('[data-reloj-accion]').textContent = abrir ? 'Ocultar cronología' : 'Ver cronología';
        return;
      }
      var mes = e.target.closest('[data-mes]');
      if (mes && onMes) onMes(mes.getAttribute('data-mes'));
    });
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

  /**
   * Descarga del PDF: la copia oficial cargada en el sitio; si no está, el PDF que la Cámara publica en la ficha
   * (lo resuelve /api/projects/public/:id/expediente). Sin expediente, el texto del proyecto si existe.
   */
  function descargaHtml(p) {
    var d = p.documento;
    var etiqueta = p.numero_expediente ? 'Descargar expediente' : 'Descargar proyecto';
    if (d && (d.kind === 'expediente' || !p.numero_expediente)) {
      var meta = [d.formato, tamano(d.bytes)].filter(Boolean).join(' · ');
      return '<a class="lg-download" href="' + esc(d.url) + '" download data-download="' + esc(p.id) + '">' + ICON.download +
        '<span>' + etiqueta + '</span><span class="lg-sr-only">: ' + esc(p.titulo) + '</span>' +
        (meta ? '<span class="lg-download__meta">' + esc(meta) + '</span>' : '') + '</a>';
    }
    if (!p.numero_expediente) return '';
    return '<a class="lg-download" href="' + API_URL + '/' + encodeURIComponent(p.id) + '/expediente" target="_blank" rel="noopener" data-download="' + esc(p.id) + '">' +
      ICON.download + '<span>' + etiqueta + '</span><span class="lg-sr-only">: ' + esc(p.titulo) + ' (PDF de la Cámara, se abre en una pestaña nueva)</span>' +
      '<span class="lg-download__meta">PDF</span></a>';
  }

  function accionesHtml(p) {
    var oficial = p.enlace_oficial
      ? '<a class="lg-official lg-official--button" href="' + esc(p.enlace_oficial) + '" target="_blank" rel="noopener">Consultar ficha oficial' +
          '<span class="lg-sr-only"> del expediente ' + esc(numero(p.numero_expediente)) + ' (se abre en una pestaña nueva)</span>' + ICON.external + '</a>'
      : '';
    return (descargaHtml(p) + oficial) || '<span class="lg-nodoc">Documento en preparación</span>';
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
    var cad = p.estado_grupo === 'comision' ? caducidad(p) : null;
    if (cad) fila('Caducidad', 'Caduca el ' + esc(fechaLarga(cad.vence)) + ' si no se trata (faltan ' + esc(duracion(cad.mesesRestantes, cad.diasRestantes)) + ')');
    if (p.fecha_presentacion) {
      fila('Presentación', esc(fechaLarga(p.fecha_presentacion)) +
        (SESIONES[p.fecha_presentacion] ? ', en la ' + SESIONES[p.fecha_presentacion] + '.ª Sesión Ordinaria' : ''));
    }
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

  function esperaHtml(p) {
    if (p.estado_grupo !== 'comision') return '';
    var c = caducidad(p);
    if (!c) return '';
    var espera = c.mesesEsperando >= 1 ? 'Hace ' + duracion(c.mesesEsperando, 0) : 'Desde este mes';
    return '<div class="lg-espera"><div class="lg-espera__texto">' + ICON.cajon + '<span>' + esc(espera) +
      ' · caduca en ' + esc(duracion(c.mesesRestantes, c.diasRestantes)) + '</span></div>' +
      '<span class="lg-espera__track" role="img" aria-label="Pasaron ' + esc(duracion(c.mesesEsperando, 0)) + ' de los ' + (CADUCIDAD_ANIOS * 12) + ' del plazo de caducidad">' +
      '<span class="lg-espera__fill" style="--p:' + (c.progreso * 100).toFixed(1) + '%"></span></span></div>';
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
    if (sesionTexto(p.fecha_presentacion)) meta.push('<span>' + esc(sesionTexto(p.fecha_presentacion)) + '</span>');
    var html =
      '<div class="lg-card__top"><span class="lg-type ' + tipoClase + '">' + esc(p.tipo_corto) + '</span>' +
        '<span class="lg-status lg-status--' + esc(p.estado_grupo) + '">' + (p.estado_grupo === 'comision' ? ICON.cajon : '') + esc(estadoTexto(p)) + '</span></div>' +
      (meta.length ? '<p class="lg-card__meta">' + meta.join('') + '</p>' : '') +
      '<div class="lg-card__body"><' + h + ' class="lg-card__title">' + esc(p.titulo) + '</' + h + '>' +
      (resumenLimpio(p.resumen) ? '<p class="lg-card__summary">' + esc(resumenLimpio(p.resumen)) + '</p>' : '') +
      tagsHtml(p) + '</div>' +
      esperaHtml(p) +
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

  /** Brillo que sigue al cursor sobre las tarjetas (solo con mouse y sin reducción de movimiento). */
  function activarBrillo(root) {
    var fino = global.matchMedia && global.matchMedia('(hover: hover) and (pointer: fine)').matches;
    var reduce = global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!fino || reduce) return;
    root.addEventListener('pointermove', function (e) {
      var card = e.target.closest && e.target.closest('.lg-card');
      if (!card) return;
      var r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
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
    activarBrillo: activarBrillo,
    relojHtml: relojHtml,
    activarReloj: activarReloj,
    mesTexto: mesTexto,
    SESIONES: SESIONES,
    sesionTexto: sesionTexto,
    caducidad: caducidad,
    duracion: duracion,
    ICON: ICON
  };
})(window);
