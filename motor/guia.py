# 09 · Guía de uso (HTML + PDF con formato vertical, cómodo para leer en el teléfono).
import os, json, html
from base import CATS, CAT_TITULO

BASE = os.path.dirname(os.path.abspath(__file__))
SAL = os.path.join(BASE, 'salida')
G09 = os.path.join(SAL, '09_CATALOGOS_Y_GUIAS')
E = html.escape

METODO = {'recortes': 'Recortes', 'pegar': 'Copiar y pegar', 'foto': 'Sticker Foto'}

PALETA = [('Magenta', '#C06BCA', 'primario'), ('Naranja', '#FBA85F', 'primario'), ('Azul', '#265EEC', 'primario'),
          ('Rosa', '#E5BAE5', 'primario'), ('Turquesa', '#24BCDE', 'primario'), ('Azul noche', '#11103B', 'logotipo'),
          ('Magenta oscuro', '#A52BB3', 'secundario'), ('Grafito', '#2C2C31', 'grises'), ('Gris claro', '#F7F7FD', 'grises')]

CARPETAS = [
    ('01_LOGOS_Y_MARCA', 'Imagotipo, logo reducido CG, isotipo, firma con cargo, logos de vidrio, marca de agua y sello.'),
    ('02_FLECHAS_Y_MARCADORES', 'Flechas rectas, curvas, semicirculares, onduladas y con bucle; círculos, óvalos, subrayados, resaltador, destellos y corchetes.'),
    ('03_CAPSULAS_Y_CONTENEDORES', 'Cápsulas, placas de vidrio, contenedor con pestaña, barras, chips y marcos para cifras. Vacíos, para escribir encima.'),
    ('04_ICONOS_INSTITUCIONALES', '23 íconos en tres estilos: insignia clara, insignia oscura y trazo blanco.'),
    ('05_ETIQUETAS_Y_TEXTOS', 'Etiquetas con texto en Outfit: llamados a la acción, agenda, sesión, Corrientes, Goya…'),
    ('06_ELEMENTOS_CREATIVOS', 'Comillas, globo de diálogo, zócalo, numeradores, separador, marcos, placa de fecha, lupa, golondrinas, mapa, tilde y cruz.'),
    ('07_VERSIONES_PARA_RECORTES', 'Los mismos diseños con borde troquelado opaco, terminados en _RECORTE.'),
    ('08_EDITABLES', 'Un SVG por cada PNG, ordenado por categoría.'),
    ('09_CATALOGOS_Y_GUIAS', 'Catálogo HTML, esta guía, láminas JPG y el informe de verificación.'),
]

CSS = '''
@font-face{font-family:Outfit;src:url(_recursos/fuentes/Outfit-Regular.ttf);font-weight:400}
@font-face{font-family:Outfit;src:url(_recursos/fuentes/Outfit-Medium.ttf);font-weight:500}
@font-face{font-family:Outfit;src:url(_recursos/fuentes/Outfit-Bold.ttf);font-weight:700}
@page{size:148mm 263mm;margin:14mm 12mm 14mm}
*{box-sizing:border-box}
body{font-family:Outfit,sans-serif;color:#11103B;font-size:10.6pt;line-height:1.48;margin:0;background:#fff}
.web{max-width:720px;margin:0 auto;padding:24px}
h1{font-size:23pt;line-height:1.1;margin:0 0 6px}
h2{font-size:15pt;margin:0 0 8px;padding-top:2px;display:flex;align-items:center;gap:8px;break-after:avoid}
h2::before{content:"";width:6px;height:18px;border-radius:3px;background:linear-gradient(#C06BCA,#FBA85F)}
h3{font-size:11.5pt;margin:12px 0 4px;break-after:avoid}
p{margin:0 0 8px}
section{margin:0 0 18px}
.salto{break-before:page}
.portada{background:#2C2C31;color:#fff;border-radius:18px;padding:22px 20px 20px;margin-bottom:18px;position:relative;overflow:hidden}
.portada::after{content:"";position:absolute;right:-60px;top:-80px;width:240px;height:240px;border-radius:50%;background:radial-gradient(circle,rgba(192,107,202,.30),rgba(192,107,202,0) 65%)}
.portada img{height:78px;margin:-14px 0 4px -10px}
.portada p{color:#E5BAE5;margin:6px 0 0}
.cifras{display:flex;flex-wrap:wrap;gap:6px;margin-top:14px}
.cifras span{border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.08);border-radius:999px;padding:3px 10px;font-size:9pt}
.caja{border:1px solid #ECECF3;background:#F7F7FD;border-radius:12px;padding:10px 12px;margin:8px 0;break-inside:avoid}
.caja.aviso{background:#fff5ec;border-color:#fcd3ad}
.caja.clave{background:#f6ecf7;border-color:#E5BAE5}
ol,ul{margin:0 0 8px;padding-left:18px}
li{margin:0 0 3px}
code{font-family:Consolas,ui-monospace,monospace;font-size:8.6pt;background:#ECECF3;border-radius:4px;padding:1px 4px;word-break:break-all}
table{width:100%;border-collapse:collapse;font-size:8.8pt;margin:4px 0 10px}
th{text-align:left;font-weight:500;color:#4E4E54;border-bottom:1.5px solid #CACAD1;padding:4px 4px}
td{border-bottom:1px solid #ECECF3;padding:4px 4px;vertical-align:top}
tr{break-inside:avoid}
.met{font-weight:500;border-radius:999px;padding:1px 7px;font-size:8.2pt;white-space:nowrap}
.met.recortes{color:#0f6f86;background:#ecf9fc}
.met.pegar{color:#8a4c0e;background:#fff5ec}
.paleta{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:6px 0 10px;break-inside:avoid}
.paleta div{border:1px solid #ECECF3;border-radius:10px;overflow:hidden;font-size:8.6pt;break-inside:avoid}
.paleta i{display:block;height:26px}
.paleta span{display:block;padding:4px 6px}
.ejemplos{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:8px 0;break-inside:avoid}
.ejemplos img{width:100%;border-radius:12px;display:block}
.ejemplos small{display:block;color:#4E4E54;font-size:8.6pt;margin-top:4px}
.pasos li{margin-bottom:5px}
.mini{color:#4E4E54;font-size:9pt}
'''


def cargar():
    m = json.load(open(os.path.join(SAL, 'manifiesto.json'), encoding='utf-8'))
    return m['grupos'], m['archivos']


def tabla_metodos(grupos, arch):
    out = ''
    for c in sorted(CATS):
        filas = ''
        for gid in sorted(g for g in grupos if grupos[g]['cat'] == c):
            g = grupos[gid]
            its = [a for a in arch.values() if a['gid'] == gid]
            rec = sum(1 for a in its if a['recorte'])
            rec_txt = 'Sí' if rec == len(its) else ('No' if rec == 0 else f'{rec} de {len(its)}')
            filas += (f'<tr><td><code>{gid}</code></td><td>{E(g["titulo"])}</td><td>{len(its)}</td>'
                      f'<td><span class="met {g["metodo"]}">{METODO[g["metodo"]]}</span></td><td>{rec_txt}</td></tr>')
        out += (f'<h3>{c} · {E(CAT_TITULO[c])}</h3><table><tr><th>ID</th><th>Recurso</th><th>Arch.</th>'
                f'<th>Método</th><th>_RECORTE</th></tr>{filas}</table>')
    return out


def tabla_conteo(grupos, arch):
    filas, tg, ta, tr = '', 0, 0, 0
    for c in sorted(CATS):
        g = sum(1 for x in grupos.values() if x['cat'] == c)
        a = [x for x in arch.values() if x['cat'] == c]
        r = sum(1 for x in a if x['recorte'])
        tg, ta, tr = tg + g, ta + len(a), tr + r
        filas += f'<tr><td>{c} · {E(CAT_TITULO[c])}</td><td>{g}</td><td>{len(a)}</td><td>{r}</td></tr>'
    filas += f'<tr><td><b>Total</b></td><td><b>{tg}</b></td><td><b>{ta}</b></td><td><b>{tr}</b></td></tr>'
    return f'<table><tr><th>Categoría</th><th>Recursos</th><th>PNG</th><th>_RECORTE</th></tr>{filas}</table>', tg, ta, tr


def documento(grupos, arch):
    conteo, tg, ta, tr = tabla_conteo(grupos, arch)
    pegar = [g['titulo'] for g in grupos.values() if g['metodo'] == 'pegar']
    carpetas = ''.join(f'<li><code>{c}</code> — {E(t)}</li>' for c, t in CARPETAS)
    paleta = ''.join(f'<div><i style="background:{h}"></i><span><b>{n}</b><br>{h} · {t}</span></div>' for n, h, t in PALETA)
    return f'''<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Guía de uso · Stickers Cecilia Gortari</title><style>{CSS}</style></head><body><div class="web">

<div class="portada"><img src="../01_LOGOS_Y_MARCA/01-01_imagotipo-oficial_blanco.png" alt="Cecilia Gortari">
<h1>Biblioteca de stickers para historias de Instagram</h1>
<p>Guía de uso · octubre de 2026</p>
<div class="cifras"><span>{tg} recursos</span><span>{ta} PNG originales</span><span>{tr} versiones para Recortes</span><span>{ta} SVG editables</span></div></div>

<section><h2>Qué incluye</h2>
{conteo}
<ul>{carpetas}</ul>
<h3>Cómo leer los nombres de archivo</h3>
<p><code>02-03_flecha-curva_izquierda_magenta.png</code> → categoría <b>02</b>, recurso <b>03</b>, nombre <b>flecha curva</b> y variante
(<b>izquierda</b>, en <b>magenta</b>). La misma pieza en la carpeta 07 termina en <code>_RECORTE.png</code> y en la carpeta 08 en <code>.svg</code>.</p>
<p>Las variantes de color indican para qué fondo están pensadas: <b>azul noche</b> y <b>magenta</b> para fondos claros; <b>blanco</b> para fotos y
fondos oscuros; <b>vidrio claro</b> sobre fotos medias u oscuras; <b>vidrio oscuro</b> sobre fotos claras.</p>
</section>

<section class="salto"><h2>Pasar la colección al iPhone</h2>
<p>La carpeta está en el Escritorio de la PC, que se sincroniza con OneDrive. Adentro está el archivo
<code>CECILIA_GORTARI_STICKERS_IPHONE.zip</code>, preparado para el teléfono (PNG originales, versiones para Recortes, esta guía y las láminas; sin SVG ni catálogo HTML).</p>
<ol class="pasos">
<li>En el iPhone, abrí la app <b>OneDrive</b> → <b>Escritorio</b> → <b>CECILIA_GORTARI_STICKERS_INSTAGRAM</b>.</li>
<li>Tocá el ZIP y elegí <b>Compartir → Guardar en Archivos</b> (o descargalo).</li>
<li>En la app <b>Archivos</b>, tocá el ZIP: se descomprime en una carpeta.</li>
<li>Entrá a la carpeta, tocá <b>Seleccionar</b>, marcá los PNG que vas a usar y elegí <b>Compartir → Guardar imágenes</b>.</li>
<li>En <b>Fotos</b>, creá un álbum <b>Stickers CG</b> y mové ahí esas imágenes para encontrarlas rápido.</li>
</ol>
<div class="caja aviso"><b>No los mandes por WhatsApp como foto</b>: WhatsApp los comprime y la transparencia se pierde (aparece un fondo).
Si hace falta pasarlos por WhatsApp, enviálos como <b>Documento</b>. Lo mismo vale para capturas de pantalla: siempre usá el PNG.</div>
<p class="mini">No hace falta guardar los {ta + tr} archivos en Fotos. Conviene empezar por los que se usan seguido (logo, firma, flechas,
dos o tres etiquetas) e ir sumando.</p>
</section>

<section><h2>Tres maneras de llevar un sticker a la historia</h2>
<div class="caja clave"><b>Antes de cargar toda la biblioteca, hacé una prueba con tres archivos</b>: un logo plano, una etiqueta de vidrio y su
versión <code>_RECORTE</code>. Instagram cambia estas funciones seguido y el resultado puede variar según la versión de la app.</div>

<h3>1 · Recortes — para guardar el sticker y reutilizarlo</h3>
<ol class="pasos">
<li>Creá la historia y elegí la foto o el fondo.</li>
<li>Tocá el ícono de <b>stickers</b> → <b>Recortes</b> → crear un recorte nuevo.</li>
<li>Elegí el PNG de la galería. Instagram detecta el contenido y lo convierte en sticker.</li>
<li>El recorte queda en tu biblioteca de Recortes: la próxima vez lo encontrás ahí, sin volver a la galería.</li>
</ol>
<p>Ideal para elementos sólidos y de contorno claro: logos planos, firma, flechas, íconos, etiquetas, numeradores, cápsulas sólidas y chips.</p>
<p><b>Si la detección falla</b> (deja afuera una flecha fina, separa las partes de un elemento, o toma el vidrio como si fuera fondo), usá la
versión de la carpeta <code>07_VERSIONES_PARA_RECORTES</code>. Tiene un borde troquelado opaco —blanco en los elementos oscuros o de color,
azul noche en los claros— que une todo en una sola silueta fácil de detectar. Además, sus píxeles transparentes guardan un gris neutro, así que,
si alguna app ignorara la transparencia, el elemento aparece sobre gris y no sobre un negro incrustado.</p>

<h3>2 · Copiar y pegar — para conservar el vidrio y la semitransparencia</h3>
<ol class="pasos">
<li>Abrí el PNG en <b>Fotos</b> o <b>Archivos</b> → <b>Compartir</b> → <b>Copiar</b>.</li>
<li>Abrí la historia en Instagram: suele aparecer abajo la sugerencia de agregar la imagen copiada como sticker.</li>
<li>Si no aparece, tocá la herramienta de texto (<b>Aa</b>), mantené presionado y elegí <b>Pegar</b>.</li>
</ol>
<p>Recomendado para: {E(', '.join(pegar))}. También sirve para cualquier pieza de vidrio cuando querés conservar el efecto translúcido completo.
El sticker pegado no queda en la biblioteca de Recortes: para tenerlo a mano, guardalo en el álbum <b>Stickers CG</b>.</p>

<h3>3 · Sticker Foto — cuándo sí y cuándo no</h3>
<p>El sticker <b>Foto</b> está pensado para fotos: muestra la imagen dentro de un marco (rectángulo, círculo u otras formas que se alternan
tocándola), así que no aprovecha la silueta de estos PNG. No lo recomendamos para los stickers de la biblioteca. Sirve para mostrar una
imagen completa con marco, por ejemplo una de las historias de ejemplo o una lámina.</p>
</section>

<section class="salto"><h2>Qué método conviene para cada recurso</h2>
<p class="mini">Columna <b>_RECORTE</b>: si el recurso tiene versión troquelada en la carpeta 07. Los que no la tienen son anillos, piezas
separadas o semitransparentes: la detección no los mejora, conviene pegarlos.</p>
{tabla_metodos(grupos, arch)}
</section>

<section><h2>Escribir sobre los contenedores</h2>
<p>Cápsulas, placas, contenedor con pestaña, zócalo, placa de fecha, marcos y círculo para cifras, globo de diálogo y comillas vienen
<b>vacíos</b>: agregás el sticker, lo escalás y escribís encima con la herramienta de texto de Instagram.</p>
<ul>
<li>Sobre vidrio claro, blanco o rosa: texto en <b>azul noche</b>. Sobre vidrio oscuro, azul noche o magenta: texto <b>blanco</b>.</li>
<li>Para tomar el color exacto, usá el <b>cuentagotas</b> de la paleta de colores del texto y tocá el logo o la etiqueta.</li>
<li>Instagram no tiene Outfit: elegí una tipografía sans serif limpia, como <b>Clásica</b>, y evitá las decorativas.</li>
<li>Instagram permite rotar y escalar, pero no espejar: por eso las flechas curvas, semicirculares y con bucle vienen hacia la derecha y hacia la izquierda.</li>
<li>Dejá libres unos 250 px arriba y abajo de la historia (sobre 1920 px de alto): ahí Instagram muestra el nombre de la cuenta y la barra de respuesta.</li>
</ul>
<p class="mini">Dos ejemplos armados solo con piezas de la biblioteca (los textos son ilustrativos: en una historia real se escriben en Instagram).</p>
<div class="ejemplos">
<div><img src="LAMINAS/EJEMPLO_HISTORIA_1_SESION.jpg" alt=""><small>Ejemplo 1 · logo en cápsula, «EN SESIÓN», placa de vidrio y «CONOCÉ MÁS» sobre el sticker de enlace real.</small></div>
<div><img src="LAMINAS/EJEMPLO_HISTORIA_2_AGENDA.jpg" alt=""><small>Ejemplo 2 · «EN AGENDA», placa de fecha, mapa con Goya, zócalo y «PARTICIPÁ».</small></div>
</div>
</section>

<section><h2>Reglas de marca</h2>
<ul>
<li><b>Logo</b>: usá los archivos tal cual. No lo deformes, no cambies sus colores, no lo rotes ni le agregues efectos. Respetá el área libre
del manual: alrededor del logo, un espacio igual a la altura del isotipo. Los PNG ya traen ese margen.</li>
<li><b>Colores autorizados del logo</b>: azul noche, magenta y azul sobre fondos claros; blanco sobre fotos o fondos oscuros.</li>
<li><b>Tipografía</b>: Outfit Regular, Medium y Bold. El manual no admite Light, Thin ni Black.</li>
<li><b>Fondos</b>: preferí fondos neutros (grafito o claros) o fotos. Evitá fondos de pantalla completa violetas o en azul saturado.
El magenta y el rosa funcionan como acento.</li>
</ul>
<div class="paleta">{paleta}</div>
<h3>Uso responsable de las etiquetas</h3>
<ul>
<li>«NUEVA INICIATIVA» presenta una propuesta: no indica que haya sido aprobada.</li>
<li>«DATO CLAVE», tilde y cruz, y los marcos para cifras van solo con datos verificables y su fuente.</li>
<li>«INGRESÁ ACÁ», «CONOCÉ MÁS» y «DESCARGÁ EL EXPEDIENTE» no son enlaces: ubicalos junto al sticker <b>Enlace</b> de Instagram, que es el que funciona.</li>
<li>El mapa usa la silueta de Corrientes de la biblioteca (dominio público) con Goya destacado; no reemplaza un mapa oficial.</li>
</ul>
</section>

<section><h2>Editables, catálogo y láminas</h2>
<ul>
<li><b>08_EDITABLES</b>: SVG para Inkscape, Illustrator, Figma o Affinity. Los textos necesitan Outfit instalada. Los logos son los trazos
vectoriales del manual: no los modifiques. Si editás un SVG, exportá el PNG a 1024 px o más y con fondo transparente.</li>
<li><b>CATALOGO_STICKERS.html</b> (en la PC, con Chrome o Edge): todos los stickers por categoría, con buscador; fondos de prueba claro,
oscuro y fotográfico; versión original o para Recortes; botones para abrir el PNG, el SVG o copiar la ruta del archivo.</li>
<li><b>LAMINAS</b>: JPG para recorrer la colección desde el teléfono (índice general, una lámina por categoría, versiones para Recortes y ejemplos).</li>
<li><b>VERIFICACION.txt</b>: el control automático de todos los archivos (transparencia, dimensiones, márgenes, duplicados y nombres).</li>
</ul>
</section>
</div></body></html>'''


def generar():
    grupos, arch = cargar()
    ruta = os.path.join(G09, 'GUIA_DE_USO_INSTAGRAM.html')
    open(ruta, 'w', encoding='utf-8').write(documento(grupos, arch))
    from playwright.sync_api import sync_playwright
    with sync_playwright() as pw:
        try:
            br = pw.chromium.launch()
        except Exception:
            br = pw.chromium.launch(channel='chrome')
        pg = br.new_page()
        pg.goto('file:///' + ruta.replace(os.sep, '/'))
        pg.evaluate('document.fonts.ready.then(()=>1)')
        pg.emulate_media(media='print')
        pg.add_style_tag(content='.web{max-width:none;padding:0}')
        pg.pdf(path=os.path.join(G09, 'GUIA_DE_USO_INSTAGRAM.pdf'), width='148mm', height='263mm', print_background=True,
               margin=dict(top='14mm', bottom='14mm', left='12mm', right='12mm'))
        br.close()
    return ruta


if __name__ == '__main__':
    print(generar())
