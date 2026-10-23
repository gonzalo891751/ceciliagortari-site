/* Recursos gráficos (/prensa/recursos-graficos/).
   Pinta la biblioteca desde #rg-datos con filtros combinables (tipo, color, fondo,
   versión y búsqueda), visor, descargas, copiar imagen, guardar en el teléfono y
   ZIP de lo filtrado. Los filtros quedan en la URL para poder compartir el enlace. */
(function () {
  'use strict';

  const BASE = '/prensa/recursos-graficos/archivos/';
  const ZIP_JS = '/assets/js/vendor/jszip-3.10.1.min.js';
  const ZIP_MAX = 60e6;
  const raiz = document.getElementById('rg');
  const datos = document.getElementById('rg-datos');
  if (!raiz || !datos) return;

  const D = JSON.parse(datos.textContent);
  const FONDOS = [
    ['ajedrez', 'Transparente', 'linear-gradient(45deg,#ddd 50%,#fff 50%)'],
    ['blanco', 'Blanco', '#fff'],
    ['oscuro', 'Grafito', '#2C2C31'],
    ['negro', 'Negro', '#0d0d10'],
    ['foto1', 'Foto 1', `url(${BASE}fondos/foto-1.jpg) center/cover`],
    ['foto2', 'Foto 2', `url(${BASE}fondos/foto-2.jpg) center/cover`],
    ['foto3', 'Foto 3', `url(${BASE}fondos/foto-3.jpg) center/cover`]
  ];
  const TIPOS = { '01': 'Logos y marca', '02': 'Flechas y marcadores', '03': 'Cápsulas y contenedores', '04': 'Íconos', '05': 'Etiquetas con texto', '06': 'Elementos creativos' };
  const COLORES = [
    ['azul-noche', 'Azul noche', '#11103B'],
    ['azul', 'Azul', '#265EEC'],
    ['magenta', 'Magenta', '#C06BCA'],
    ['naranja', 'Naranja', '#FBA85F'],
    ['turquesa', 'Turquesa', '#24BCDE'],
    ['blanco', 'Blanco', '#fff'],
    ['vidrio', 'Vidrio', 'linear-gradient(135deg,#f4eef7 0%,#d9cfe0 55%,#fff 100%)']
  ];
  const FONDO_USO = [['claro', 'Fondo claro'], ['oscuro', 'Fondo oscuro o foto']];
  const VERSIONES = [['orig', 'Original'], ['borde', 'Con borde']];

  // Variante del nombre de archivo → color y fondo para el que está pensada.
  // «claro»/«oscuro» describen la pieza: una pieza clara va sobre fondo oscuro.
  const OSCUROS = ['azul-noche', 'noche', 'azul-noche-26', 'oscuro'];
  const BLANCOS = ['blanco', 'blanca', 'blanca-38', 'flor-blanca-24', 'trazo-blanco', 'claro'];
  const TOKEN = {};
  OSCUROS.forEach(t => { TOKEN[t] = { color: ['azul-noche'], fondo: 'claro' }; });
  BLANCOS.forEach(t => { TOKEN[t] = { color: ['blanco'], fondo: 'oscuro' }; });
  ['azul', 'magenta', 'naranja', 'turquesa'].forEach(t => { TOKEN[t] = { color: [t], fondo: 'claro' }; });
  TOKEN['degrade-magenta-naranja'] = { color: ['magenta', 'naranja'], fondo: 'claro' };
  TOKEN['vidrio-oscuro'] = { color: ['vidrio'], fondo: 'claro' };
  // Las insignias son esferas de vidrio: la oscura lleva el ícono blanco sobre azul noche.
  TOKEN['insignia-oscura'] = { color: ['vidrio', 'azul-noche'], fondo: 'claro' };
  TOKEN['insignia-clara'] = { color: ['vidrio'], fondo: 'oscuro' };
  ['vidrio-claro', 'vidrio-rosa', 'vidrio'].forEach(t => { TOKEN[t] = { color: ['vidrio'], fondo: 'oscuro' }; });
  // Recursos cuyo nombre no trae color.
  const GRUPO = { '06-04': { color: ['magenta'] }, '06-06': { color: ['vidrio'], fondo: 'oscuro' } };
  const ETQ = {
    'noche': 'Azul noche', 'azul-noche-26': 'Azul noche, 26 %', 'blanca-38': 'Blanca, 38 %', 'flor-blanca-24': 'Flor blanca, 24 %',
    'degrade-magenta-naranja': 'Degradé magenta y naranja', 'vertical-4x5': 'Vertical 4:5', 'claro': 'Tono claro', 'oscuro': 'Tono oscuro'
  };
  const etiqueta = t => ETQ[t] || (/^\d$/.test(t) ? 'Número ' + t : t.charAt(0).toUpperCase() + t.slice(1).replace(/-/g, ' '));
  const normal = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  const ITEMS = [];
  D.forEach(c => c.grupos.forEach(g => g.items.forEach(i => {
    const tokens = i.v.split('_');
    const colores = new Set(), fondos = new Set();
    tokens.forEach(t => {
      const m = TOKEN[t];
      if (!m) return;
      m.color.forEach(x => colores.add(x));
      fondos.add(m.fondo);
    });
    const extra = GRUPO[g.id];
    if (extra) {
      (extra.color || []).forEach(x => colores.add(x));
      if (extra.fondo) fondos.add(extra.fondo);
    }
    // Sin un color que lo ate a un fondo, sirve para los dos.
    if (!fondos.size) { fondos.add('claro'); fondos.add('oscuro'); }
    const nombre = tokens.map(etiqueta).join(' · ');
    ITEMS.push(Object.assign(i, {
      c, g, colores, fondos, nombre,
      q: normal([TIPOS[c.id], c.t, g.t, g.tags, nombre, i.a].join(' '))
    }));
  })));
  const IDX = {};
  ITEMS.forEach(i => { IDX[i.a] = i; });

  const esIOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const puedeCompartir = (() => {
    try {
      return !!(navigator.canShare && navigator.canShare({ files: [new File([new Blob(['x'], { type: 'image/png' })], 'x.png', { type: 'image/png' })] }));
    } catch (e) { return false; }
  })();
  const puedeCopiar = !!(navigator.clipboard && navigator.clipboard.write && window.ClipboardItem && window.isSecureContext);

  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const base = rel => rel.split('/').pop();
  const peso = b => b >= 1e6 ? (b / 1e6).toFixed(1).replace('.', ',') + ' MB' : Math.max(1, Math.round(b / 1e3)) + ' KB';
  const plural = (n, uno, varios) => n + ' ' + (n === 1 ? uno : varios);

  // --- Estado de los filtros (y su reflejo en la URL) ---
  const F = { tipo: new Set(), color: new Set(), fondo: new Set() };
  let ver = 'orig';
  let fondoVista = 'ajedrez';
  let fondoElegido = false;
  let actual = null;

  function leerURL() {
    const p = new URLSearchParams(location.search);
    const lista = (k, validos) => (p.get(k) || '').split(',').filter(x => validos.includes(x));
    lista('tipo', Object.keys(TIPOS)).forEach(x => F.tipo.add(x));
    lista('color', COLORES.map(c => c[0])).forEach(x => F.color.add(x));
    lista('fondo', FONDO_USO.map(c => c[0])).forEach(x => F.fondo.add(x));
    if (p.get('version') === 'borde') ver = 'borde';
    $('#rg-buscar').value = p.get('q') || '';
  }
  function escribirURL() {
    const p = new URLSearchParams();
    ['tipo', 'color', 'fondo'].forEach(k => { if (F[k].size) p.set(k, [...F[k]].join(',')); });
    if (ver === 'borde') p.set('version', 'borde');
    const q = $('#rg-buscar').value.trim();
    if (q) p.set('q', q);
    const s = p.toString();
    history.replaceState(null, '', location.pathname + (s ? '?' + s : '') + location.hash);
  }

  function coincide(i, ignorar) {
    if (ignorar !== 'tipo' && F.tipo.size && !F.tipo.has(i.c.id)) return false;
    if (ignorar !== 'color' && F.color.size && ![...F.color].some(x => i.colores.has(x))) return false;
    if (ignorar !== 'fondo' && F.fondo.size && ![...F.fondo].some(x => i.fondos.has(x))) return false;
    if (ignorar !== 'ver' && ver === 'borde' && !i.rec) return false;
    const palabras = normal($('#rg-buscar').value.trim()).split(/\s+/).filter(Boolean);
    return palabras.every(w => i.q.includes(w));
  }
  const archivo = i => (ver === 'borde' && i.rec ? { rel: i.rec, s: i.rs } : { rel: i.png, s: i.ps });
  const miniatura = i => `${BASE}miniaturas/${i.a}${ver === 'borde' && i.rec ? '_RECORTE' : ''}.webp`;
  const cantidadFiltros = () => F.tipo.size + F.color.size + F.fondo.size + (ver === 'borde' ? 1 : 0);

  // --- Navbar fijo del sitio: la barra de búsqueda se ubica justo debajo ---
  const navbar = document.querySelector('.navbar');
  function ubicarBarra() {
    if (navbar) raiz.style.setProperty('--rg-top', Math.round(navbar.getBoundingClientRect().height) + 'px');
    raiz.style.setProperty('--rg-barra-h', Math.round($('#rg-barra').getBoundingClientRect().height) + 'px');
  }
  let pendiente = false;
  window.addEventListener('scroll', () => {
    if (pendiente) return;
    pendiente = true;
    requestAnimationFrame(() => { pendiente = false; ubicarBarra(); });
  }, { passive: true });
  window.addEventListener('resize', ubicarBarra);
  if (navbar) navbar.addEventListener('transitionend', ubicarBarra);
  ubicarBarra();

  // --- Pintado ---
  const nGrupos = D.reduce((n, c) => n + c.grupos.length, 0);
  $('#rg-stats').innerHTML = `<span><b>${nGrupos}</b> recursos</span><span><b>${ITEMS.length}</b> PNG</span><span><b>${ITEMS.length}</b> SVG</span>`;
  const chipsFondo = attr => FONDOS.map(f => `<button type="button" class="rg-sw-btn" ${attr}="${f[0]}" title="${f[1]}" aria-label="${f[1]}"><span class="rg-sw" style="background:${f[2]}"></span></button>`).join('');
  $('#rg-fondos').innerHTML = chipsFondo('data-f');
  $('#rg-vfondos').innerHTML = chipsFondo('data-vf');

  function pintarFacetas() {
    const conteo = (faceta, valor) => ITEMS.filter(i => {
      if (!coincide(i, faceta)) return false;
      if (faceta === 'tipo') return i.c.id === valor;
      if (faceta === 'color') return i.colores.has(valor);
      if (faceta === 'fondo') return i.fondos.has(valor);
      return valor === 'orig' || !!i.rec;
    }).length;
    const chip = (faceta, valor, texto, activo, muestra) => {
      const n = conteo(faceta, valor);
      return `<button type="button" class="rg-chip${activo ? ' on' : ''}" data-faceta="${faceta}" data-valor="${valor}" aria-pressed="${activo}"${!n && !activo ? ' disabled' : ''}>` +
        `${muestra ? `<span class="rg-sw" style="background:${muestra}"></span>` : ''}${esc(texto)} <span class="rg-chip__n">${n}</span></button>`;
    };
    const bloque = (titulo, html) => `<fieldset class="rg-faceta"><legend>${titulo}</legend><div class="rg-faceta__chips">${html}</div></fieldset>`;
    $('#rg-facetas').innerHTML =
      bloque('Tipo', Object.keys(TIPOS).map(k => chip('tipo', k, TIPOS[k], F.tipo.has(k))).join('')) +
      bloque('Color', COLORES.map(c => chip('color', c[0], c[1], F.color.has(c[0]), c[2])).join('')) +
      bloque('Para usar sobre', FONDO_USO.map(f => chip('fondo', f[0], f[1], F.fondo.has(f[0]))).join('')) +
      bloque('Versión', VERSIONES.map(v => chip('ver', v[0], v[1], ver === v[0])).join('')) +
      '<p class="rg-faceta__nota">«Con borde»: la misma pieza con un contorno opaco, útil para recortarla o usarla como sticker.</p>';
    // Atajo del celular: los tipos a mano, debajo del buscador.
    $('#rg-rapidos').innerHTML = Object.keys(TIPOS).map(k => {
      const on = F.tipo.has(k);
      return `<button type="button" class="rg-chip${on ? ' on' : ''}" data-faceta="tipo" data-valor="${k}" aria-pressed="${on}"${!conteo('tipo', k) && !on ? ' disabled' : ''}>${esc(TIPOS[k])}</button>`;
    }).join('');
  }

  function acciones(i, enVisor) {
    const f = archivo(i);
    let h = '';
    if (enVisor && puedeCompartir) h += `<button type="button" class="pri" data-share="${esc(f.rel)}">${esIOS ? 'Guardar en Fotos' : 'Guardar o compartir'}</button>`;
    if (puedeCopiar) h += `<button type="button"${enVisor && !puedeCompartir ? ' class="pri"' : ''} data-copy="${esc(f.rel)}">Copiar</button>`;
    if (enVisor) {
      h += `<a href="${BASE}${esc(i.png)}" download="${esc(base(i.png))}">PNG</a>`;
      if (i.rec) h += `<a href="${BASE}${esc(i.rec)}" download="${esc(base(i.rec))}">PNG con borde</a>`;
    } else {
      h += `<a${puedeCopiar ? ' class="pri"' : ''} href="${BASE}${esc(f.rel)}" download="${esc(base(f.rel))}">PNG</a>`;
    }
    h += `<a data-k="svg" href="${BASE}${esc(i.svg)}" download="${esc(base(i.svg))}">SVG</a>`;
    return h;
  }

  function pintarLista(visibles) {
    const porGrupo = new Map();
    visibles.forEach(i => {
      if (!porGrupo.has(i.g)) porGrupo.set(i.g, []);
      porGrupo.get(i.g).push(i);
    });
    $('#rg-lista').innerHTML = D.map(c => {
      const grupos = c.grupos.filter(g => porGrupo.has(g));
      if (!grupos.length) return '';
      return `<section class="rg-cat" id="c${c.id}"><h2>${esc(TIPOS[c.id])} <small>${plural(grupos.length, 'recurso', 'recursos')}</small></h2>` +
        grupos.map(g => `<div class="rg-grupo"><h3>${esc(g.t)}</h3><div class="rg-grid">` + porGrupo.get(g).map(i => {
          const f = archivo(i);
          return `<div class="rg-card"><button type="button" class="rg-prev" data-a="${esc(i.a)}" aria-label="Ver en grande: ${esc(g.t)}, ${esc(i.nombre)}"><img loading="lazy" src="${miniatura(i)}" alt="" width="260" height="${Math.round(260 * i.h / i.w)}"></button>
          <div class="rg-info"><div class="rg-nom">${esc(i.nombre)}</div><div class="rg-dim">${i.w} × ${i.h} px · ${peso(f.s)}</div>
          <div class="rg-acc">${acciones(i, false)}</div></div></div>`;
        }).join('') + '</div></div>').join('') + '</section>';
    }).join('');
  }

  function pintarResumen(visibles) {
    const n = cantidadFiltros() + ($('#rg-buscar').value.trim() ? 1 : 0);
    $('#rg-cuenta').textContent = visibles.length === ITEMS.length
      ? plural(ITEMS.length, 'archivo', 'archivos')
      : `${plural(visibles.length, 'archivo', 'archivos')} de ${ITEMS.length}`;
    const pastilla = (faceta, valor, texto) => `<button type="button" class="rg-activo" data-quitar="${faceta}" data-valor="${valor}" aria-label="Quitar filtro ${esc(texto)}">${esc(texto)} <span aria-hidden="true">×</span></button>`;
    let h = '';
    F.tipo.forEach(k => { h += pastilla('tipo', k, TIPOS[k]); });
    F.color.forEach(k => { h += pastilla('color', k, COLORES.find(c => c[0] === k)[1]); });
    F.fondo.forEach(k => { h += pastilla('fondo', k, FONDO_USO.find(c => c[0] === k)[1]); });
    if (ver === 'borde') h += pastilla('ver', 'borde', 'Con borde');
    const q = $('#rg-buscar').value.trim();
    if (q) h += pastilla('q', '', '«' + q + '»');
    if (n) h += '<button type="button" class="rg-link" data-limpiar>Limpiar filtros</button>';
    $('#rg-activos').innerHTML = h;
    $('#rg-activos').hidden = !n;
    const nf = $('#rg-n-filtros');
    nf.hidden = !cantidadFiltros();
    nf.textContent = cantidadFiltros();
    $('#rg-ver-resultados').textContent = 'Ver ' + plural(visibles.length, 'resultado', 'resultados');
    $('#rg-vacio').hidden = visibles.length > 0;

    const total = visibles.reduce((s, i) => s + archivo(i).s, 0);
    const zip = $('#rg-zip');
    $('#rg-zipbar').hidden = !visibles.length;
    if (!zip.dataset.ocupado) {
      zip.textContent = `Descargar ${visibles.length === 1 ? 'este PNG' : 'estos ' + visibles.length + ' PNG'} en ZIP · ${peso(total)}`;
      zip.disabled = total > ZIP_MAX;
    }
    $('#rg-zip-nota').textContent = total > ZIP_MAX ? `Para bajar en ZIP, filtrá hasta ${peso(ZIP_MAX)}.` : '';
  }

  function aplicar(mover) {
    const visibles = ITEMS.filter(i => coincide(i));
    pintarFacetas();
    pintarLista(visibles);
    pintarResumen(visibles);
    escribirURL();
    if (mover) {
      const destino = $('.rg-resumen');
      if (destino.getBoundingClientRect().top < 0) destino.scrollIntoView({ block: 'start' });
    }
  }

  function ponerFondo(f) {
    fondoVista = f;
    raiz.classList.remove(...FONDOS.map(x => 'f-' + x[0]));
    raiz.classList.add('f-' + f);
    document.querySelectorAll('[data-f]').forEach(b => b.classList.toggle('on', b.dataset.f === f));
  }
  // Al filtrar por fondo, la vista previa lo acompaña mientras no se haya elegido otra a mano.
  function fondoSegunFiltro() {
    if (fondoElegido) return;
    if (F.fondo.size === 1) ponerFondo(F.fondo.has('oscuro') ? 'oscuro' : 'blanco');
    else ponerFondo('ajedrez');
  }

  // --- Archivos: descarga en memoria para copiar, compartir y armar ZIP ---
  const cache = new Map();
  function blobDe(rel) {
    if (!cache.has(rel)) {
      const p = fetch(BASE + rel).then(r => {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.blob();
      }).then(b => (b.type === 'image/png' || !rel.endsWith('.png') ? b : new Blob([b], { type: 'image/png' })));
      p.catch(() => cache.delete(rel));
      cache.set(rel, p);
    }
    return cache.get(rel);
  }

  function toast(t, ms) {
    const e = $('#rg-toast');
    e.textContent = t;
    e.classList.add('on');
    clearTimeout(e._t);
    e._t = setTimeout(() => e.classList.remove('on'), ms || 2200);
  }

  function copiar(rel) {
    try {
      // Safari exige crear el ClipboardItem dentro del toque, con la imagen como promesa.
      const item = new ClipboardItem({ 'image/png': blobDe(rel) });
      navigator.clipboard.write([item]).then(
        () => toast('Imagen copiada'),
        () => toast('No se pudo copiar. Probá descargando el PNG.', 3200)
      );
    } catch (e) {
      toast('No se pudo copiar. Probá descargando el PNG.', 3200);
    }
  }

  async function compartir(rel, boton) {
    const p = blobDe(rel);
    let listo = false;
    p.then(() => { listo = true; }, () => {});
    await Promise.resolve();
    if (!listo) toast('Preparando la imagen…');
    try {
      const b = await p;
      await navigator.share({ files: [new File([b], base(rel), { type: 'image/png' })] });
    } catch (e) {
      if (e && e.name === 'AbortError') return;
      if (e && e.name === 'NotAllowedError') {
        toast('Listo. Tocá otra vez «' + boton.textContent + '».', 3000);
        return;
      }
      toast('No se pudo abrir el menú para guardar. Probá con PNG.', 3200);
    }
  }

  let zipLib = null;
  function cargarZip() {
    if (!zipLib) {
      zipLib = new Promise((ok, mal) => {
        const s = document.createElement('script');
        s.src = ZIP_JS;
        s.onload = () => ok(window.JSZip);
        s.onerror = () => { zipLib = null; mal(new Error('JSZip')); };
        document.head.appendChild(s);
      });
    }
    return zipLib;
  }

  async function descargarZip(boton) {
    // Lo filtrado y la versión se fijan al tocar: si cambian mientras se arma, el ZIP no se mezcla.
    const archivos = ITEMS.filter(i => coincide(i)).map(i => archivo(i).rel);
    if (!archivos.length) return;
    const nombreZip = 'CECILIA_GORTARI_RECURSOS_GRAFICOS' + (ver === 'borde' ? '_CON_BORDE' : '') + '.zip';
    const texto = boton.textContent;
    boton.disabled = true;
    boton.dataset.ocupado = '1';
    try {
      const JSZip = await cargarZip();
      const zip = new JSZip();
      let hechos = 0;
      const cola = archivos.slice();
      // De a cuatro en paralelo para no saturar la conexión del teléfono.
      async function trabajador() {
        while (cola.length) {
          const rel = cola.shift();
          const r = await fetch(BASE + rel);
          if (!r.ok) throw new Error('HTTP ' + r.status);
          zip.file(rel, await r.arrayBuffer(), { binary: true });
          hechos++;
          boton.textContent = `Preparando ZIP… ${hechos} de ${archivos.length}`;
        }
      }
      await Promise.all([trabajador(), trabajador(), trabajador(), trabajador()]);
      const blob = await zip.generateAsync({ type: 'blob', compression: 'STORE' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = nombreZip;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 60000);
      toast('ZIP listo');
    } catch (e) {
      toast('No se pudo armar el ZIP. Revisá la conexión y probá de nuevo.', 3200);
    } finally {
      delete boton.dataset.ocupado;
      boton.textContent = texto;
      boton.disabled = false;
      pintarResumen(ITEMS.filter(i => coincide(i)));
    }
  }

  // --- Panel de filtros en el celular ---
  const panel = $('#rg-filtros');
  const enCelular = () => window.matchMedia('(max-width: 1023px)').matches;
  function abrirFiltros() {
    panel.classList.add('abierto');
    $('#rg-abrir-filtros').setAttribute('aria-expanded', 'true');
    document.documentElement.classList.add('rg-bloqueo');
    $('#rg-cerrar-filtros').focus();
  }
  function cerrarFiltros() {
    if (!panel.classList.contains('abierto')) return;
    panel.classList.remove('abierto');
    $('#rg-abrir-filtros').setAttribute('aria-expanded', 'false');
    document.documentElement.classList.remove('rg-bloqueo');
    $('#rg-abrir-filtros').focus({ preventScroll: true });
  }

  // --- Visor ---
  function abrir(a) {
    const i = IDX[a];
    actual = a;
    const f = archivo(i);
    $('#rg-vimg').src = BASE + f.rel;
    $('#rg-vimg').alt = `${i.g.t} (${i.nombre})`;
    $('#rg-vtit').textContent = i.g.t;
    $('#rg-vinfo').innerHTML = `<div class="rg-visor__var">${esc(i.nombre)}</div><div class="rg-nom">${esc(base(f.rel))}</div><div>${i.w} × ${i.h} px · ${peso(f.s)}</div>`;
    $('#rg-vacc').innerHTML = acciones(i, true);
    $('#rg-vtip').hidden = !('ontouchstart' in window);
    const v = $('#rg-visor');
    v.className = 'rg-visor f-' + fondoVista;
    document.querySelectorAll('[data-vf]').forEach(b => b.classList.toggle('on', b.dataset.vf === fondoVista));
    v.hidden = false;
    document.documentElement.classList.add('rg-bloqueo');
    if (puedeCompartir) blobDe(f.rel); // queda lista para «Guardar en Fotos» sin perder el toque
    $('#rg-vcerrar').focus();
  }
  function cerrar() {
    const v = $('#rg-visor');
    if (v.hidden) return;
    v.hidden = true;
    if (!panel.classList.contains('abierto')) document.documentElement.classList.remove('rg-bloqueo');
    const origen = actual && document.querySelector(`.rg-prev[data-a="${CSS.escape(actual)}"]`);
    if (origen) origen.focus({ preventScroll: true });
    actual = null;
  }

  // Con un panel abierto, Tab y Shift+Tab no salen hacia la página de atrás.
  function atrapar(cont, e) {
    const f = [...cont.querySelectorAll('button:not([disabled]), a[href], input')].filter(x => x.getClientRects().length);
    if (!f.length) return;
    const dentro = cont.contains(document.activeElement);
    if (e.shiftKey && (!dentro || document.activeElement === f[0])) {
      e.preventDefault();
      f[f.length - 1].focus();
    } else if (!e.shiftKey && (!dentro || document.activeElement === f[f.length - 1])) {
      e.preventDefault();
      f[0].focus();
    }
  }

  function limpiar() {
    F.tipo.clear(); F.color.clear(); F.fondo.clear();
    ver = 'orig';
    $('#rg-buscar').value = '';
    fondoSegunFiltro();
    aplicar(true);
  }

  raiz.addEventListener('click', e => {
    const t = e.target.closest('button, #rg-visor');
    if (!t) return;
    const d = t.dataset;
    if (d.faceta) {
      // Los chips se vuelven a pintar: se recuerda dónde estaba el tocado para devolverle el foco.
      const zona = t.closest('#rg-rapidos') ? '#rg-rapidos' : '#rg-facetas';
      if (d.faceta === 'ver') ver = d.valor;
      else if (F[d.faceta].has(d.valor)) F[d.faceta].delete(d.valor);
      else F[d.faceta].add(d.valor);
      if (d.faceta === 'fondo') fondoSegunFiltro();
      aplicar(!enCelular());
      const igual = document.querySelector(`${zona} [data-faceta="${d.faceta}"][data-valor="${d.valor}"]`);
      if (igual) igual.focus({ preventScroll: true });
    } else if (d.quitar) {
      if (d.quitar === 'ver') ver = 'orig';
      else if (d.quitar === 'q') $('#rg-buscar').value = '';
      else F[d.quitar].delete(d.valor);
      if (d.quitar === 'fondo') fondoSegunFiltro();
      aplicar(false);
    } else if ('limpiar' in d) {
      limpiar();
    } else if (d.f) {
      fondoElegido = true;
      ponerFondo(d.f);
    } else if (d.vf) {
      $('#rg-visor').className = 'rg-visor f-' + d.vf;
      document.querySelectorAll('[data-vf]').forEach(b => b.classList.toggle('on', b === t));
    } else if (d.copy) {
      copiar(d.copy);
    } else if (d.share) {
      compartir(d.share, t);
    } else if (t.id === 'rg-zip') {
      descargarZip(t);
    } else if (t.id === 'rg-abrir-filtros') {
      abrirFiltros();
    } else if (t.id === 'rg-cerrar-filtros' || t.id === 'rg-ver-resultados') {
      cerrarFiltros();
      if (t.id === 'rg-ver-resultados') $('.rg-resumen').scrollIntoView({ block: 'start' });
    } else if (t.id === 'rg-vcerrar' || (t.id === 'rg-visor' && e.target === t)) {
      cerrar();
    } else if (d.a) {
      abrir(d.a);
    }
  });
  document.addEventListener('keydown', e => {
    const v = $('#rg-visor');
    const capa = !v.hidden ? v : (panel.classList.contains('abierto') ? panel : null);
    if (!capa) return;
    if (e.key === 'Escape') (capa === v ? cerrar : cerrarFiltros)();
    else if (e.key === 'Tab') atrapar(capa, e);
  });
  let espera;
  $('#rg-buscar').addEventListener('input', () => {
    clearTimeout(espera);
    espera = setTimeout(() => aplicar(false), 120);
  });
  window.matchMedia('(max-width: 1023px)').addEventListener('change', m => { if (!m.matches) cerrarFiltros(); });

  leerURL();
  fondoSegunFiltro();
  aplicar(false);
})();
