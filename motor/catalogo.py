# 09 · Catálogo HTML local: miniaturas, fondos de prueba y página navegable de toda la biblioteca.
import os, json, shutil, html
from PIL import Image, ImageOps
from base import CATS, CAT_TITULO, METODOS
from vista import FOTOS

BASE = os.path.dirname(os.path.abspath(__file__))
SAL = os.path.join(BASE, 'salida')
G09 = os.path.join(SAL, '09_CATALOGOS_Y_GUIAS')
REC = os.path.join(G09, '_recursos')

METODO_CORTO = {'recortes': 'Recortes', 'pegar': 'Copiar y pegar', 'foto': 'Sticker Foto'}


def cargar():
    m = json.load(open(os.path.join(SAL, 'manifiesto.json'), encoding='utf-8'))
    return m['grupos'], m['archivos']


def miniatura(src, dst, lado=520):
    if os.path.exists(dst) and os.path.getmtime(dst) >= os.path.getmtime(src):
        return
    im = Image.open(src).convert('RGBA')
    im.thumbnail((lado, lado), Image.LANCZOS)
    im.save(dst, 'WEBP', quality=88, method=4)


def recursos(arch):
    os.makedirs(os.path.join(REC, 'miniaturas'), exist_ok=True)
    os.makedirs(os.path.join(REC, 'fondos'), exist_ok=True)
    os.makedirs(os.path.join(REC, 'fuentes'), exist_ok=True)
    for i, f in enumerate(FOTOS, 1):
        dst = os.path.join(REC, 'fondos', f'foto-{i}.jpg')
        if not os.path.exists(dst):
            ImageOps.fit(Image.open(f).convert('RGB'), (900, 900), Image.LANCZOS).save(dst, quality=82)
    for w in ('Regular', 'Medium', 'Bold'):
        shutil.copy2(os.path.join(BASE, 'fonts', f'Outfit-{w}.ttf'), os.path.join(REC, 'fuentes'))
    for nombre, a in arch.items():
        miniatura(os.path.join(SAL, a['png']), os.path.join(REC, 'miniaturas', nombre + '.webp'))
        if a['recorte']:
            miniatura(os.path.join(SAL, a['recorte']), os.path.join(REC, 'miniaturas', nombre + '_RECORTE.webp'))


def datos(grupos, arch):
    cats = []
    for c in sorted(CATS):
        gs = []
        for gid in sorted(g for g in grupos if grupos[g]['cat'] == c):
            g = grupos[gid]
            items = [dict(a=n, v=a['variante'], w=a['w'], h=a['h'], png=a['png'], svg=a['svg'], rec=a['recorte'])
                     for n, a in sorted(arch.items()) if a['gid'] == gid]
            gs.append(dict(id=gid, t=g['titulo'], uso=g['uso'], m=g['metodo'], tags=g['tags'], items=items))
        cats.append(dict(id=c, dir=CATS[c], t=CAT_TITULO[c], grupos=gs))
    return cats


HTML = r'''<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Biblioteca de stickers · Cecilia Gortari</title>
<style>
@font-face{font-family:Outfit;src:url(_recursos/fuentes/Outfit-Regular.ttf);font-weight:400}
@font-face{font-family:Outfit;src:url(_recursos/fuentes/Outfit-Medium.ttf);font-weight:500}
@font-face{font-family:Outfit;src:url(_recursos/fuentes/Outfit-Bold.ttf);font-weight:700}
:root{--noche:#11103B;--magenta:#C06BCA;--magenta-osc:#A52BB3;--rosa:#E5BAE5;--naranja:#FBA85F;--turquesa:#24BCDE;
--grafito:#2C2C31;--g4e:#4E4E54;--gca:#CACAD1;--gec:#ECECF3;--gf7:#F7F7FD}
*{box-sizing:border-box}
body{margin:0;font-family:Outfit,system-ui,sans-serif;background:var(--gf7);color:var(--noche)}
header{background:radial-gradient(120% 140% at 85% 0%,#3a3a42 0%,var(--grafito) 45%,#1c1c21 100%);color:#fff;padding:34px 40px 28px;position:relative;overflow:hidden}
header::after{content:"";position:absolute;right:-80px;top:-120px;width:420px;height:420px;border-radius:50%;
background:radial-gradient(circle,rgba(192,107,202,.22),rgba(192,107,202,0) 65%)}
header .logo{height:84px;display:block;margin:-10px 0 10px -12px;position:relative;z-index:1}
header h1{margin:0;font-weight:700;font-size:34px;letter-spacing:.005em;position:relative;z-index:1}
header p{margin:8px 0 0;color:#d9d6e4;font-size:16px;max-width:880px;line-height:1.45;position:relative;z-index:1}
header .stats{display:flex;gap:10px;margin-top:18px;flex-wrap:wrap;position:relative;z-index:1}
header .stats span{background:rgba(255,255,255,.10);border:1px solid rgba(255,255,255,.22);border-radius:999px;padding:6px 14px;font-size:14px;backdrop-filter:blur(8px)}
header .stats b{color:var(--rosa);font-weight:700}
.barra{position:sticky;top:0;z-index:20;background:rgba(247,247,253,.86);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);
border-bottom:1px solid var(--gec);padding:12px 40px;display:flex;flex-wrap:wrap;gap:14px 22px;align-items:center}
.barra .bloque{display:flex;gap:6px;align-items:center;flex-wrap:wrap}
.barra label{font-size:12px;font-weight:500;color:var(--g4e);text-transform:uppercase;letter-spacing:.08em;margin-right:4px}
.chip{border:1px solid var(--gca);background:#fff;border-radius:999px;padding:6px 13px;font:500 13px Outfit,sans-serif;cursor:pointer;color:var(--noche)}
.chip:hover{border-color:var(--magenta)}
.chip.on{background:var(--noche);color:#fff;border-color:var(--noche)}
.sw{width:18px;height:18px;border-radius:50%;display:inline-block;vertical-align:-4px;margin-right:6px;border:1px solid rgba(0,0,0,.15)}
input[type=search]{font:400 14px Outfit,sans-serif;border:1px solid var(--gca);border-radius:999px;padding:8px 16px;min-width:240px;background:#fff;color:var(--noche)}
input[type=search]:focus{outline:2px solid var(--magenta);border-color:transparent}
nav.cats{display:flex;gap:8px;flex-wrap:wrap;padding:16px 40px 0}
nav.cats a{text-decoration:none;color:var(--noche);background:#fff;border:1px solid var(--gec);border-radius:12px;padding:8px 14px;font-weight:500;font-size:14px}
nav.cats a b{color:var(--magenta);margin-right:6px}
nav.cats a:hover{border-color:var(--magenta)}
main{padding:10px 40px 60px}
.intro{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px;margin:18px 0 8px}
.intro div{background:#fff;border:1px solid var(--gec);border-radius:16px;padding:14px 16px;font-size:14px;line-height:1.45;color:var(--g4e)}
.intro b{color:var(--noche)}
.intro a{color:var(--magenta-osc);font-weight:500}
section.cat{margin-top:34px}
section.cat>h2{font-size:26px;margin:0 0 4px;font-weight:700;display:flex;align-items:baseline;gap:12px}
section.cat>h2 small{font-size:14px;color:var(--g4e);font-weight:400}
section.cat>h2::before{content:"";width:10px;height:26px;border-radius:5px;background:linear-gradient(var(--magenta),var(--naranja));align-self:center}
.ruta{font:400 12.5px ui-monospace,Consolas,monospace;color:var(--g4e);margin:0 0 14px 22px}
.grupo{background:#fff;border:1px solid var(--gec);border-radius:20px;padding:16px 18px 18px;margin:0 0 16px}
.grupo.oculto,.card.oculto{display:none}
.ghead{display:flex;gap:10px 14px;align-items:baseline;flex-wrap:wrap;margin-bottom:4px}
.ghead h3{margin:0;font-size:18px;font-weight:700}
.ghead .gid{font:500 12px ui-monospace,Consolas,monospace;color:var(--magenta-osc);background:#f6ecf7;border-radius:6px;padding:2px 7px}
.met{font-size:12px;font-weight:500;border-radius:999px;padding:3px 10px;border:1px solid}
.met.recortes{color:#0f6f86;border-color:#9fe0ef;background:#ecf9fc}
.met.pegar{color:#8a4c0e;border-color:#fcd3ad;background:#fff5ec}
.met.foto{color:#4E4E54;border-color:#CACAD1;background:#F7F7FD}
.uso{margin:2px 0 12px;color:var(--g4e);font-size:14px;line-height:1.45;max-width:980px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(232px,1fr));gap:12px}
.card{border:1px solid var(--gec);border-radius:14px;overflow:hidden;background:#fff;display:flex;flex-direction:column}
.prev{height:200px;display:flex;align-items:center;justify-content:center;cursor:zoom-in;position:relative}
.prev img{max-width:86%;max-height:84%;display:block}
.prev .sin{font-size:12px;color:#fff;background:rgba(17,16,59,.72);border-radius:999px;padding:4px 10px;position:absolute;bottom:8px}
.info{padding:9px 11px 11px;display:flex;flex-direction:column;gap:6px;flex:1}
.nom{font:500 12px ui-monospace,Consolas,monospace;word-break:break-all;color:var(--noche);line-height:1.35}
.dim{font-size:12px;color:var(--g4e)}
.acc{display:flex;gap:6px;flex-wrap:wrap;margin-top:auto}
.acc a,.acc button{font:500 12px Outfit,sans-serif;text-decoration:none;color:var(--noche);border:1px solid var(--gca);background:#fff;border-radius:8px;padding:4px 8px;cursor:pointer}
.acc a:hover,.acc button:hover{border-color:var(--magenta);color:var(--magenta-osc)}
.acc a.pri{background:var(--noche);color:#fff;border-color:var(--noche)}
/* fondos de prueba */
.f-ajedrez .prev{background-color:#fff;background-image:linear-gradient(45deg,#e4e4ec 25%,transparent 25%),linear-gradient(-45deg,#e4e4ec 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#e4e4ec 75%),linear-gradient(-45deg,transparent 75%,#e4e4ec 75%);background-size:22px 22px;background-position:0 0,0 11px,11px -11px,-11px 0}
.f-claro .prev{background:#F7F7FD}
.f-blanco .prev{background:#FFFFFF}
.f-oscuro .prev{background:#2C2C31}
.f-negro .prev{background:#0d0d10}
.f-foto1 .prev{background:url(_recursos/fondos/foto-1.jpg) center/cover}
.f-foto2 .prev{background:url(_recursos/fondos/foto-2.jpg) center/cover}
.f-foto3 .prev{background:url(_recursos/fondos/foto-3.jpg) center/cover}
/* visor */
#visor{position:fixed;inset:0;background:rgba(18,18,22,.86);backdrop-filter:blur(6px);z-index:50;display:none;align-items:center;justify-content:center;padding:24px}
#visor.on{display:flex}
#visor .caja{background:#fff;border-radius:22px;max-width:min(1200px,96vw);width:100%;max-height:94vh;display:grid;grid-template-columns:1fr 320px;overflow:hidden}
#visor .grande{height:auto;min-height:60vh;display:flex;align-items:center;justify-content:center;cursor:default}
#visor .grande img{max-width:90%;max-height:80vh}
#visor .lado{padding:20px;overflow:auto;display:flex;flex-direction:column;gap:12px;font-size:14px;color:var(--g4e)}
#visor .lado h3{margin:0;color:var(--noche);font-size:19px}
#visor .cerrar{align-self:flex-end;border:0;background:var(--gec);border-radius:999px;width:34px;height:34px;font-size:18px;cursor:pointer}
#toast{position:fixed;bottom:22px;left:50%;transform:translateX(-50%);background:var(--noche);color:#fff;padding:10px 18px;border-radius:999px;font-size:14px;opacity:0;transition:opacity .2s;z-index:60;pointer-events:none}
#toast.on{opacity:1}
footer{padding:20px 40px 40px;color:var(--g4e);font-size:13px}
@media (max-width:760px){header,main,.barra,nav.cats,footer{padding-left:16px;padding-right:16px}#visor .caja{grid-template-columns:1fr}}
</style></head>
<body class="f-ajedrez">
<header>
<img class="logo" src="../01_LOGOS_Y_MARCA/01-01_imagotipo-oficial_blanco.png" alt="Cecilia Gortari">
<h1>Biblioteca de stickers para historias de Instagram</h1>
<p>Recursos gráficos institucionales en PNG con transparencia real, versiones troqueladas para <b>Recortes</b> y editables SVG.
Cambiá el fondo de prueba para ver cómo se comporta cada elemento sobre claro, oscuro o foto.</p>
<div class="stats" id="stats"></div>
</header>
<div class="barra">
 <div class="bloque"><label>Fondo</label><span id="fondos"></span></div>
 <div class="bloque"><label>Versión</label>
  <button class="chip on" data-ver="orig">Original</button><button class="chip" data-ver="rec">Para Recortes</button></div>
 <div class="bloque"><input type="search" id="buscar" placeholder="Buscar: flecha, vidrio, sesión, goya…"></div>
</div>
<nav class="cats" id="nav"></nav>
<main>
<div class="intro">
 <div><b>Original</b> (carpetas 01 a 06): PNG con transparencia real, sombras y vidrio translúcido. Es la versión de máxima calidad.</div>
 <div><b>Para Recortes</b> (carpeta 07): el mismo diseño con un borde troquelado opaco, para que la detección automática de Instagram tome la silueta completa.</div>
 <div><b>Copiar y pegar</b>: los elementos semitransparentes (marca de agua, resaltador, marcos, lupa, logo de vidrio) conservan mejor su efecto si se copian y se pegan en la historia.</div>
 <div>Guía paso a paso: <a href="GUIA_DE_USO_INSTAGRAM.pdf">GUIA_DE_USO_INSTAGRAM.pdf</a> · Láminas para recorrer la colección: <a href="LAMINAS/">carpeta LAMINAS</a></div>
</div>
<div id="lista"></div>
</main>
<footer>Paleta y logotipo tomados del manual de marca de Cecilia Gortari, sin modificar sus proporciones · Tipografía Outfit (Regular, Medium y Bold).</footer>
<div id="visor"><div class="caja"><div class="grande prev" id="vgrande"><img id="vimg" alt=""></div>
<div class="lado"><button class="cerrar" id="vcerrar" title="Cerrar (Esc)">×</button><h3 id="vtit"></h3><div id="vinfo"></div>
<div><label style="font-size:12px;text-transform:uppercase;letter-spacing:.08em">Fondo</label><div id="vfondos" style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px"></div></div>
<div class="acc" id="vacc"></div></div></div></div>
<div id="toast"></div>
<script>
const D = __DATOS__;
const FONDOS=[['ajedrez','Transparencia','linear-gradient(45deg,#ddd 50%,#fff 50%)'],['claro','Claro','#F7F7FD'],['blanco','Blanco','#fff'],
 ['oscuro','Grafito','#2C2C31'],['negro','Negro','#0d0d10'],['foto1','Foto 1','url(_recursos/fondos/foto-1.jpg) center/cover'],
 ['foto2','Foto 2','url(_recursos/fondos/foto-2.jpg) center/cover'],['foto3','Foto 3','url(_recursos/fondos/foto-3.jpg) center/cover']];
const MET={recortes:'Recortes',pegar:'Copiar y pegar',foto:'Sticker Foto'};
let fondo='ajedrez', ver='orig';
const $=s=>document.querySelector(s);
const esc=s=>s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
// carpeta raíz de la biblioteca en este equipo (para copiar rutas)
const raiz=decodeURIComponent(location.pathname).replace(/^\/([A-Za-z]:)/,'$1').replace(/\/09_CATALOGOS_Y_GUIAS\/[^\/]*$/,'');
const win=/^[A-Za-z]:/.test(raiz);
const ruta=rel=>win?(raiz+'/'+rel).replace(/\//g,'\\'):raiz+'/'+rel;
function toast(t){const e=$('#toast');e.textContent=t;e.classList.add('on');clearTimeout(e._t);e._t=setTimeout(()=>e.classList.remove('on'),1800)}
function copiar(t){const ok=()=>toast('Ruta copiada');
 if(navigator.clipboard&&window.isSecureContext!==false){navigator.clipboard.writeText(t).then(ok,()=>viejo(t))}else viejo(t);
 function viejo(t){const a=document.createElement('textarea');a.value=t;document.body.appendChild(a);a.select();document.execCommand('copy');a.remove();ok()}}
let nF=0,nG=0,nR=0;
D.forEach(c=>c.grupos.forEach(g=>{nG++;g.items.forEach(i=>{nF++;if(i.rec)nR++})}));
$('#stats').innerHTML=`<span><b>${nG}</b> recursos</span><span><b>${nF}</b> PNG originales</span><span><b>${nR}</b> versiones para Recortes</span><span><b>${nF}</b> SVG editables</span>`;
$('#fondos').innerHTML=FONDOS.map(f=>`<button class="chip${f[0]==fondo?' on':''}" data-f="${f[0]}"><span class="sw" style="background:${f[2]}"></span>${f[1]}</button>`).join('');
$('#vfondos').innerHTML=FONDOS.map(f=>`<button class="chip" data-vf="${f[0]}"><span class="sw" style="background:${f[2]}"></span>${f[1]}</button>`).join('');
$('#nav').innerHTML=D.map(c=>`<a href="#c${c.id}"><b>${c.id}</b>${esc(c.t)}</a>`).join('');
function thumb(i){return ver==='rec'&&i.rec?`_recursos/miniaturas/${i.a}_RECORTE.webp`:`_recursos/miniaturas/${i.a}.webp`}
function pintar(){
 $('#lista').innerHTML=D.map(c=>`<section class="cat" id="c${c.id}"><h2>${c.id} · ${esc(c.t)} <small>${c.grupos.length} recursos</small></h2>
 <div class="ruta">${esc(c.dir)}/</div>`+c.grupos.map(g=>`<div class="grupo" data-q="${esc((g.id+' '+g.t+' '+g.tags+' '+g.uso+' '+g.items.map(i=>i.a).join(' ')).toLowerCase())}">
 <div class="ghead"><span class="gid">${g.id}</span><h3>${esc(g.t)}</h3><span class="met ${g.m}">${MET[g.m]}</span></div>
 <p class="uso">${esc(g.uso)}</p><div class="grid">`+g.items.map(i=>{
  const sinrec=ver==='rec'&&!i.rec;
  return `<div class="card"><div class="prev" data-a="${i.a}"><img loading="lazy" src="${thumb(i)}" alt="${esc(i.a)}" style="${sinrec?'opacity:.35':''}">${sinrec?'<span class="sin">Sin versión troquelada: pegalo</span>':''}</div>
  <div class="info"><div class="nom">${esc(i.a)}.png</div><div class="dim">${i.w} × ${i.h} px${i.rec?' · tiene versión para Recortes':''}</div>
  <div class="acc"><a class="pri" href="../${i.png}" target="_blank">Abrir PNG</a>${i.rec?`<a href="../${i.rec}" target="_blank">Recorte</a>`:''}<a href="../${i.svg}" target="_blank">SVG</a>
  <button data-cp="${i.png}">Copiar ruta</button></div></div></div>`}).join('')+`</div></div>`).join('')+`</section>`).join('');
 filtrar();
}
function filtrar(){const q=$('#buscar').value.trim().toLowerCase();
 document.querySelectorAll('.grupo').forEach(g=>g.classList.toggle('oculto',!!q&&!q.split(/\s+/).every(w=>g.dataset.q.includes(w))))}
const IDX={};D.forEach(c=>c.grupos.forEach(g=>g.items.forEach(i=>IDX[i.a]=[g,i])));
function abrir(a){const [g,i]=IDX[a];const r=ver==='rec'&&i.rec;
 $('#vimg').src='../'+(r?i.rec:i.png);$('#vtit').textContent=g.t;
 $('#vinfo').innerHTML=`<div class="nom">${esc(r?i.rec.split('/').pop():i.a+'.png')}</div><div>${i.w} × ${i.h} px · ${MET[g.m]}</div><p style="margin:6px 0 0">${esc(g.uso)}</p>`;
 $('#vacc').innerHTML=`<a class="pri" href="../${i.png}" target="_blank">Abrir PNG</a>${i.rec?`<a href="../${i.rec}" target="_blank">Recorte</a>`:''}<a href="../${i.svg}" target="_blank">SVG</a><button data-cp="${r?i.rec:i.png}">Copiar ruta</button>`;
 $('#vgrande').className='grande prev';$('#visor').className='on f-'+fondo;$('#visor').classList.add('on');}
document.addEventListener('click',e=>{const t=e.target.closest('button,.prev,#visor');if(!t)return;
 if(t.dataset.f){fondo=t.dataset.f;document.body.className='f-'+fondo;document.querySelectorAll('[data-f]').forEach(b=>b.classList.toggle('on',b===t))}
 else if(t.dataset.ver){ver=t.dataset.ver;document.querySelectorAll('[data-ver]').forEach(b=>b.classList.toggle('on',b===t));pintar()}
 else if(t.dataset.cp){copiar(ruta(t.dataset.cp))}
 else if(t.dataset.vf){$('#visor').className='on f-'+t.dataset.vf}
 else if(t.id==='vcerrar'||(t.id==='visor'&&e.target===t)){$('#visor').className=''}
 else if(t.dataset.a){abrir(t.dataset.a)}});
document.addEventListener('keydown',e=>{if(e.key==='Escape')$('#visor').className=''});
$('#buscar').addEventListener('input',filtrar);
pintar();
</script>
</body></html>
'''


def html_catalogo(grupos, arch):
    d = json.dumps(datos(grupos, arch), ensure_ascii=False)
    out = HTML.replace('__DATOS__', d)
    open(os.path.join(G09, 'CATALOGO_STICKERS.html'), 'w', encoding='utf-8').write(out)


if __name__ == '__main__':
    grupos, arch = cargar()
    recursos(arch)
    html_catalogo(grupos, arch)
    print('catálogo listo:', len(grupos), 'grupos,', len(arch), 'archivos')
