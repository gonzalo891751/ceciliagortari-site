/* Biblioteca de recursos gráficos (/prensa/recursos-graficos/).
   Pinta el catálogo desde #rg-datos y maneja búsqueda, fondos de prueba,
   visor, descargas, copiar imagen, guardar en el teléfono y ZIP por categoría. */
(function () {
  'use strict';

  const BASE = '/prensa/recursos-graficos/archivos/';
  const ZIP_JS = '/assets/js/vendor/jszip-3.10.1.min.js';
  const raiz = document.getElementById('rg');
  const datos = document.getElementById('rg-datos');
  if (!raiz || !datos) return;

  const D = JSON.parse(datos.textContent);
  const FONDOS = [
    ['ajedrez', 'Transparencia', 'linear-gradient(45deg,#ddd 50%,#fff 50%)'],
    ['claro', 'Claro', '#F7F7FD'],
    ['blanco', 'Blanco', '#fff'],
    ['oscuro', 'Grafito', '#2C2C31'],
    ['negro', 'Negro', '#0d0d10'],
    ['foto1', 'Foto 1', `url(${BASE}fondos/foto-1.jpg) center/cover`],
    ['foto2', 'Foto 2', `url(${BASE}fondos/foto-2.jpg) center/cover`],
    ['foto3', 'Foto 3', `url(${BASE}fondos/foto-3.jpg) center/cover`]
  ];
  const MET = { recortes: 'Recortes', pegar: 'Copiar y pegar', foto: 'Sticker Foto' };
  const esIOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const puedeCompartir = (() => {
    try {
      return !!(navigator.canShare && navigator.canShare({ files: [new File([new Blob(['x'], { type: 'image/png' })], 'x.png', { type: 'image/png' })] }));
    } catch (e) { return false; }
  })();
  const puedeCopiar = !!(navigator.clipboard && navigator.clipboard.write && window.ClipboardItem && window.isSecureContext);

  let fondo = 'ajedrez';
  let ver = 'orig';
  let actual = null;

  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const nombre = rel => rel.split('/').pop();
  const peso = b => b >= 1e6 ? (b / 1e6).toFixed(1).replace('.', ',') + ' MB' : Math.max(1, Math.round(b / 1e3)) + ' KB';

  function toast(t, ms) {
    const e = $('#rg-toast');
    e.textContent = t;
    e.classList.add('on');
    clearTimeout(e._t);
    e._t = setTimeout(() => e.classList.remove('on'), ms || 2200);
  }

  // El navbar del sitio cambia de alto al hacer scroll: la barra fija se ubica justo debajo.
  const navbar = document.querySelector('.navbar');
  function ubicarBarra() {
    if (navbar) raiz.style.setProperty('--rg-top', Math.round(navbar.getBoundingClientRect().height) + 'px');
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

  // --- Cabecera, fondos e índice ---
  let nF = 0, nG = 0, nR = 0;
  D.forEach(c => c.grupos.forEach(g => { nG++; g.items.forEach(i => { nF++; if (i.rec) nR++; }); }));
  $('#rg-stats').innerHTML = `<span><b>${nG}</b> recursos</span><span><b>${nF}</b> PNG originales</span><span><b>${nR}</b> versiones para Recortes</span><span><b>${nF}</b> SVG editables</span>`;
  const chipsFondo = attr => FONDOS.map(f => `<button type="button" class="rg-chip${f[0] === fondo ? ' on' : ''}" ${attr}="${f[0]}"><span class="rg-sw" style="background:${f[2]}"></span>${f[1]}</button>`).join('');
  $('#rg-fondos').innerHTML = chipsFondo('data-f');
  $('#rg-vfondos').innerHTML = chipsFondo('data-vf');
  $('#rg-nav').innerHTML = D.map(c => `<a href="#c${c.id}"><b>${c.id}</b>${esc(c.t)}</a>`).join('') +
    '<a href="#como-usarlos">Cómo usarlos</a><a href="#laminas">Láminas</a>';

  const IDX = {};
  D.forEach(c => c.grupos.forEach(g => g.items.forEach(i => { IDX[i.a] = [g, i]; })));

  const thumb = i => `${BASE}miniaturas/${i.a}${ver === 'rec' && i.rec ? '_RECORTE' : ''}.webp`;
  // Archivo que corresponde a la versión elegida (las piezas sin troquelado usan el original).
  const elegido = (i, v = ver) => (v === 'rec' && i.rec ? { rel: i.rec, s: i.rs } : { rel: i.png, s: i.ps });

  function zipInfo(c) {
    let n = 0, s = 0;
    c.grupos.forEach(g => g.items.forEach(i => { n++; s += elegido(i).s; }));
    return { n, s };
  }

  function acciones(i, enVisor) {
    const r = ver === 'rec' && i.rec;
    const principal = r ? i.rec : i.png;
    let h = '';
    if (enVisor && puedeCompartir) h += `<button type="button" class="pri" data-share="${esc(principal)}">${esIOS ? 'Guardar en Fotos' : 'Guardar o compartir'}</button>`;
    if (puedeCopiar) h += `<button type="button"${enVisor && !puedeCompartir ? ' class="pri"' : ''} data-copy="${esc(principal)}">Copiar</button>`;
    // data-k permite ocultar en las tarjetas del celular lo que no corresponde a la versión elegida.
    h += `<a${enVisor || !puedeCopiar ? '' : ' class="pri"'} data-k="png${i.rec ? ' con-rec' : ''}" href="${BASE}${esc(i.png)}" download="${esc(nombre(i.png))}">PNG</a>`;
    if (i.rec) h += `<a data-k="rec"${enVisor || !puedeCopiar ? '' : ' class="pri"'} href="${BASE}${esc(i.rec)}" download="${esc(nombre(i.rec))}">Recorte</a>`;
    h += `<a data-k="svg" href="${BASE}${esc(i.svg)}" download="${esc(nombre(i.svg))}">SVG</a>`;
    return h;
  }

  function pintar() {
    $('#rg-lista').innerHTML = D.map(c => {
      const z = zipInfo(c);
      return `<section class="rg-cat" id="c${c.id}"><h2>${c.id} · ${esc(c.t)} <small>${c.grupos.length} recursos</small>
      <button type="button" class="rg-zip" data-zip="${c.id}" title="Descargar todos los PNG de esta categoría en un ZIP">Descargar ZIP · ${z.n} PNG · ${peso(z.s)}</button></h2>` +
      c.grupos.map(g => `<div class="rg-grupo" data-q="${esc((g.id + ' ' + g.t + ' ' + g.tags + ' ' + g.uso + ' ' + g.items.map(i => i.a).join(' ')).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''))}">
      <div class="rg-ghead"><span class="rg-gid">${g.id}</span><h3>${esc(g.t)}</h3><span class="rg-met ${g.m}">${MET[g.m]}</span></div>
      <p class="rg-uso-txt">${esc(g.uso)}</p><div class="rg-grid">` + g.items.map(i => {
        const sinrec = ver === 'rec' && !i.rec;
        const f = elegido(i);
        return `<div class="rg-card"><button type="button" class="rg-prev" data-a="${esc(i.a)}" aria-label="Ver en grande: ${esc(g.t)} (${esc(i.v)})"><img loading="lazy" src="${thumb(i)}" alt="" width="260" height="${Math.round(260 * i.h / i.w)}" style="${sinrec ? 'opacity:.35' : ''}">${sinrec ? '<span class="rg-sin">Sin versión troquelada: pegalo</span>' : ''}</button>
        <div class="rg-info"><div class="rg-nom">${esc(nombre(f.rel))}</div><div class="rg-dim">${i.w} × ${i.h} px · ${peso(f.s)}${i.rec && ver !== 'rec' ? ' · tiene Recorte' : ''}</div>
        <div class="rg-acc">${acciones(i, false)}</div></div></div>`;
      }).join('') + '</div></div>').join('') + '</section>';
    }).join('');
    filtrar();
  }

  function filtrar() {
    const q = $('#rg-buscar').value.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const palabras = q ? q.split(/\s+/) : [];
    let visibles = 0;
    document.querySelectorAll('#rg-lista .rg-cat').forEach(sec => {
      let n = 0;
      sec.querySelectorAll('.rg-grupo').forEach(g => {
        const ok = palabras.every(w => g.dataset.q.includes(w));
        g.classList.toggle('oculto', !ok);
        if (ok) n++;
      });
      sec.classList.toggle('oculto', n === 0);
      visibles += n;
    });
    $('#rg-vacio').hidden = visibles > 0;
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

  function copiar(rel) {
    try {
      // Safari exige crear el ClipboardItem dentro del toque, con la imagen como promesa.
      const item = new ClipboardItem({ 'image/png': blobDe(rel) });
      navigator.clipboard.write([item]).then(
        () => toast('Imagen copiada: pegala en la historia'),
        () => toast('No se pudo copiar. Mantené presionada la imagen o usá Guardar.', 3200)
      );
    } catch (e) {
      toast('No se pudo copiar. Mantené presionada la imagen o usá Guardar.', 3200);
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
      const archivo = new File([b], nombre(rel), { type: 'image/png' });
      await navigator.share({ files: [archivo] });
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

  async function descargarZip(id, boton) {
    const c = D.find(x => x.id === id);
    // La versión se fija al tocar el botón: si se cambia mientras se arma, el ZIP no se mezcla.
    const v = ver;
    const archivos = [];
    c.grupos.forEach(g => g.items.forEach(i => archivos.push(elegido(i, v).rel)));
    const texto = boton.textContent;
    boton.disabled = true;
    try {
      const JSZip = await cargarZip();
      const zip = new JSZip();
      let hechos = 0;
      // De a cuatro en paralelo para no saturar la conexión del teléfono.
      const cola = archivos.slice();
      async function trabajador() {
        while (cola.length) {
          const rel = cola.shift();
          const r = await fetch(BASE + rel);
          if (!r.ok) throw new Error('HTTP ' + r.status);
          zip.file(nombre(rel), await r.arrayBuffer(), { binary: true });
          hechos++;
          boton.textContent = `Preparando ZIP… ${hechos} de ${archivos.length}`;
        }
      }
      await Promise.all([trabajador(), trabajador(), trabajador(), trabajador()]);
      const blob = await zip.generateAsync({ type: 'blob', compression: 'STORE' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `CECILIA_GORTARI_${c.dir}${v === 'rec' ? '_PARA_RECORTES' : ''}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 60000);
      toast('ZIP listo');
    } catch (e) {
      toast('No se pudo armar el ZIP. Revisá la conexión y probá de nuevo.', 3200);
    } finally {
      boton.disabled = false;
      boton.textContent = texto;
    }
  }

  // --- Visor ---
  function abrir(a) {
    const [g, i] = IDX[a];
    actual = a;
    const f = elegido(i);
    $('#rg-vimg').src = BASE + f.rel;
    $('#rg-vimg').alt = `${g.t} (${i.v})`;
    $('#rg-vtit').textContent = g.t;
    $('#rg-vinfo').innerHTML = `<div class="rg-nom">${esc(nombre(f.rel))}</div><div>${i.w} × ${i.h} px · ${peso(f.s)} · ${MET[g.m]}</div><p style="margin-top:6px">${esc(g.uso)}</p>`;
    $('#rg-vacc').innerHTML = acciones(i, true);
    $('#rg-vtip').hidden = !('ontouchstart' in window);
    const v = $('#rg-visor');
    v.className = 'rg-visor f-' + fondo;
    document.querySelectorAll('[data-vf]').forEach(b => b.classList.toggle('on', b.dataset.vf === fondo));
    v.hidden = false;
    document.documentElement.classList.add('rg-bloqueo');
    if (puedeCompartir) blobDe(f.rel); // queda lista para «Guardar en Fotos» sin perder el toque
    $('#rg-vcerrar').focus();
  }
  function cerrar() {
    const v = $('#rg-visor');
    if (v.hidden) return;
    v.hidden = true;
    document.documentElement.classList.remove('rg-bloqueo');
    const origen = actual && document.querySelector(`.rg-prev[data-a="${CSS.escape(actual)}"]`);
    if (origen) origen.focus({ preventScroll: true });
    actual = null;
  }

  raiz.addEventListener('click', e => {
    const t = e.target.closest('button, #rg-visor');
    if (!t) return;
    if (t.dataset.f) {
      fondo = t.dataset.f;
      raiz.classList.remove(...FONDOS.map(f => 'f-' + f[0]));
      raiz.classList.add('f-' + fondo);
      document.querySelectorAll('[data-f]').forEach(b => b.classList.toggle('on', b === t));
    } else if (t.dataset.ver) {
      ver = t.dataset.ver;
      raiz.classList.toggle('v-rec', ver === 'rec');
      document.querySelectorAll('[data-ver]').forEach(b => {
        b.classList.toggle('on', b === t);
        b.setAttribute('aria-pressed', b === t ? 'true' : 'false');
      });
      pintar();
    } else if (t.dataset.vf) {
      $('#rg-visor').className = 'rg-visor f-' + t.dataset.vf;
      document.querySelectorAll('[data-vf]').forEach(b => b.classList.toggle('on', b === t));
    } else if (t.dataset.copy) {
      copiar(t.dataset.copy);
    } else if (t.dataset.share) {
      compartir(t.dataset.share, t);
    } else if (t.dataset.zip) {
      descargarZip(t.dataset.zip, t);
    } else if (t.id === 'rg-vcerrar' || (t.id === 'rg-visor' && e.target === t)) {
      cerrar();
    } else if (t.dataset.a) {
      abrir(t.dataset.a);
    }
  });
  document.addEventListener('keydown', e => {
    const v = $('#rg-visor');
    if (v.hidden) return;
    if (e.key === 'Escape') {
      cerrar();
    } else if (e.key === 'Tab') {
      // Con el visor abierto, el foco no sale hacia la página de atrás.
      const f = [...v.querySelectorAll('button, a[href]')].filter(x => x.getClientRects().length);
      if (!f.length) return;
      const dentro = v.contains(document.activeElement);
      if (e.shiftKey && (!dentro || document.activeElement === f[0])) {
        e.preventDefault();
        f[f.length - 1].focus();
      } else if (!e.shiftKey && (!dentro || document.activeElement === f[f.length - 1])) {
        e.preventDefault();
        f[0].focus();
      }
    }
  });
  $('#rg-buscar').addEventListener('input', filtrar);

  pintar();
})();
