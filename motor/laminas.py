# 09 · Láminas JPG para recorrer la colección (también desde el teléfono) + historias de ejemplo.
import os, json
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageOps, ImageFilter
from base import CATS, CAT_TITULO
from vista import FOTOS

BASE = os.path.dirname(os.path.abspath(__file__))
SAL = os.path.join(BASE, 'salida')
G09 = os.path.join(SAL, '09_CATALOGOS_Y_GUIAS')
MIN = os.path.join(G09, '_recursos', 'miniaturas')
LAM = os.path.join(G09, 'LAMINAS')

GRAFITO, NOCHE, MAGENTA, ROSA = (44, 44, 49), (17, 16, 59), (192, 107, 202), (229, 186, 229)
PAGINA, CELDA_CLARA, CELDA_OSCURA = (240, 239, 245), (255, 255, 255), (44, 44, 49)
_F = {}


def F(peso, size):
    k = (peso, size)
    if k not in _F:
        _F[k] = ImageFont.truetype(os.path.join(BASE, 'fonts', f'Outfit-{peso}.ttf'), size)
    return _F[k]


def cargar():
    m = json.load(open(os.path.join(SAL, 'manifiesto.json'), encoding='utf-8'))
    return m['grupos'], m['archivos']


_fotos = {}


def foto(i, w, h):
    k = (i, w, h)
    if k not in _fotos:
        _fotos[k] = ImageOps.fit(Image.open(FOTOS[i]).convert('RGB'), (w, h), Image.LANCZOS)
    return _fotos[k].copy()


def luminancia(im):
    a = np.asarray(im).astype(np.float32) / 255
    al = a[..., 3]
    if al.sum() < 1:
        return 0
    lum = .2126 * a[..., 0] + .7152 * a[..., 1] + .0722 * a[..., 2]
    return float((lum * al).sum() / al.sum())


def fondo_para(nombre, metodo, im):
    """fondo de celda que mejor muestra el elemento: vidrio y semitransparentes sobre foto; el resto según su luminancia"""
    if 'vidrio' in nombre or metodo == 'pegar':
        return 'foto0' if 'oscuro' in nombre or 'azul-noche' in nombre else 'foto1'
    return 'oscura' if luminancia(im) > .70 else 'clara'


def redondear(im, r):
    m = Image.new('L', im.size, 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, im.width - 1, im.height - 1], r, fill=255)
    out = Image.new('RGBA', im.size, (0, 0, 0, 0))
    out.paste(im, (0, 0), m)
    return out


def celda(img, tipo, cw, ch):
    if tipo == 'clara': c = Image.new('RGBA', (cw, ch), CELDA_CLARA + (255,))
    elif tipo == 'oscura': c = Image.new('RGBA', (cw, ch), CELDA_OSCURA + (255,))
    else: c = foto(int(tipo[-1]), cw, ch).convert('RGBA')
    e = img.copy()
    e.thumbnail((int(cw * .84), int(ch * .80)), Image.LANCZOS)
    c.alpha_composite(e, ((cw - e.width) // 2, (ch - e.height) // 2))
    return redondear(c, 18)


def ajustar(d, txt, fnt_peso, size, ancho, minimo=12):
    while size > minimo and d.textlength(txt, font=F(fnt_peso, size)) > ancho:
        size -= 1
    return F(fnt_peso, size)


def encabezado(W, titulo, sub, logo=True):
    H = 250
    im = Image.new('RGB', (W, H), GRAFITO)
    # brillo magenta suave a la derecha
    g = Image.new('L', (W, H), 0)
    ImageDraw.Draw(g).ellipse([W - 620, -380, W + 260, 420], fill=70)
    g = g.filter(ImageFilter.GaussianBlur(150))
    im.paste(Image.new('RGB', (W, H), MAGENTA), (0, 0), g)
    d = ImageDraw.Draw(im)
    x = 70
    if logo:
        lg = Image.open(os.path.join(MIN, '01-01_imagotipo-oficial_blanco.webp')).convert('RGBA')
        lg = lg.crop(lg.getbbox())
        lg.thumbnail((330, 70), Image.LANCZOS)
        im.paste(lg, (W - 70 - lg.width, 52), lg)
    d.text((x, 62), titulo, font=F('Bold', 60), fill='white')
    d.text((x, 150), sub, font=F('Regular', 26), fill=ROSA)
    d.rounded_rectangle([x, 206, x + 90, 212], 3, fill=MAGENTA)
    return im


def lamina(titulo, sub, items, ruta, cols, alto_k=.74, W=2000, pie=True):
    """items: lista de (miniatura_png, linea1, linea2, tipo_fondo)"""
    m, gap = 70, 26
    cw = (W - 2 * m - (cols - 1) * gap) // cols
    ch = int(cw * alto_k)
    cap = 74
    filas = (len(items) + cols - 1) // cols
    head = encabezado(W, titulo, sub)
    H = head.height + 50 + filas * (ch + cap + gap) + 90
    im = Image.new('RGB', (W, H), PAGINA)
    im.paste(head, (0, 0))
    d = ImageDraw.Draw(im)
    for k, (src, l1, l2, tipo) in enumerate(items):
        r, c = divmod(k, cols)
        x = m + c * (cw + gap)
        y = head.height + 50 + r * (ch + cap + gap)
        cel = celda(Image.open(src).convert('RGBA'), tipo, cw, ch)
        im.paste(cel, (x, y), cel)
        d.text((x + 4, y + ch + 10), l1, font=ajustar(d, l1, 'Medium', 22, cw - 8), fill=NOCHE)
        d.text((x + 4, y + ch + 42), l2, font=ajustar(d, l2, 'Regular', 17, cw - 8, 11), fill=(78, 78, 84))
    if pie:
        d.text((m, H - 60), 'Biblioteca de stickers para historias de Instagram · Cecilia Gortari · Paleta y logo del manual de marca',
               font=F('Regular', 20), fill=(110, 110, 120))
    im.save(ruta, quality=88, optimize=True, progressive=True)
    return ruta


def miniatura(nombre, rec=False):
    return os.path.join(MIN, nombre + ('_RECORTE' if rec else '') + '.webp')


def todas(grupos, arch):
    os.makedirs(LAM, exist_ok=True)
    hechas = []
    # 00 · índice: una pieza por recurso
    vistos, items = set(), []
    for n, a in arch.items():
        if a['gid'] in vistos:
            continue
        vistos.add(a['gid'])
        g = grupos[a['gid']]
        nv = sum(1 for b in arch.values() if b['gid'] == a['gid'])
        im = Image.open(miniatura(n))
        items.append((miniatura(n), f"{a['gid']} · {g['titulo']}", f'{nv} variante' + ('s' if nv > 1 else ''),
                      fondo_para(n, g['metodo'], im)))
    items.sort(key=lambda t: t[1])
    hechas.append(lamina('Índice general', f'{len(items)} recursos · {len(arch)} archivos PNG · una muestra por recurso',
                         items, os.path.join(LAM, 'LAMINA_00_INDICE_GENERAL.jpg'), 6, .80))
    # 01-06 · una lámina por categoría con todas las variantes
    cols = {'01': 4, '02': 5, '03': 4, '04': 6, '05': 4, '06': 4}
    for c in sorted(CATS):
        items = []
        for n, a in arch.items():
            if a['cat'] != c:
                continue
            g = grupos[a['gid']]
            im = Image.open(miniatura(n))
            items.append((miniatura(n), g['titulo'], n, fondo_para(n, g['metodo'], im)))
        items.sort(key=lambda t: t[2])
        hechas.append(lamina(f'{c} · {CAT_TITULO[c]}', f'{len(items)} archivos · carpeta {CATS[c]}', items,
                             os.path.join(LAM, f'LAMINA_{CATS[c]}.jpg'), cols[c]))
    # 07 · versiones para Recortes, sobre foto (como se verán en la historia)
    recs = sorted(n for n, a in arch.items() if a['recorte'])
    mitad = [r for r in recs if r[:2] in ('01', '02', '03')], [r for r in recs if r[:2] in ('04', '05', '06')]
    for i, parte in enumerate(mitad):
        items = [(miniatura(n, True), grupos[arch[n]['gid']]['titulo'], n + '_RECORTE', f'foto{k % 2}')
                 for k, n in enumerate(parte)]
        tramo = 'categorías 01 a 03' if i == 0 else 'categorías 04 a 06'
        hechas.append(lamina(f'07 · Versiones para Recortes ({"AB"[i]})',
                             f'{len(items)} archivos · {tramo} · borde troquelado para que Instagram detecte la silueta completa',
                             items, os.path.join(LAM, f'LAMINA_07_VERSIONES_PARA_RECORTES_{"AB"[i]}.jpg'), 6))
    return hechas


# ---------------- historias de ejemplo (1080 × 1920) ----------------
def png(nombre):
    for c in CATS.values():
        p = os.path.join(SAL, c, nombre + '.png')
        if os.path.exists(p):
            return Image.open(p).convert('RGBA')
    raise FileNotFoundError(nombre)


def poner(lienzo, nombre, x, y, ancho, centro=False):
    """pega el PNG recortado a su contenido visible, con ancho dado; devuelve (x0, y0, escala, bbox)"""
    im = png(nombre)
    bb = im.getbbox()
    k = ancho / (bb[2] - bb[0])
    e = im.crop(bb).resize((round((bb[2] - bb[0]) * k), round((bb[3] - bb[1]) * k)), Image.LANCZOS)
    if centro:
        x = x - e.width // 2
    lienzo.alpha_composite(e, (int(x), int(y)))
    return int(x), int(y), k, bb, e.size


def zona_opaca(nombre, umbral=200):
    a = np.asarray(png(nombre))[..., 3]
    ys, xs = np.where(a > umbral)
    return xs.min(), ys.min(), xs.max(), ys.max()


def texto_c(d, cx, y, s, peso, size, color):
    f = F(peso, size)
    d.text((cx - d.textlength(s, font=f) / 2, y), s, font=f, fill=color)


def historia_sesion():
    W, H = 1080, 1920
    bg = foto(0, W, H).convert('RGBA')
    sombra = Image.new('L', (W, H), 0)
    ImageDraw.Draw(sombra).rectangle([0, H * .45, W, H], fill=150)
    bg.paste(Image.new('RGBA', (W, H), (20, 20, 26, 255)), (0, 0), sombra.filter(ImageFilter.GaussianBlur(260)))
    d = ImageDraw.Draw(bg)
    poner(bg, '01-06_logo-en-capsula-vidrio_vidrio-claro', W / 2, 205, 560, centro=True)
    poner(bg, '05-03_etiqueta-EN-SESION_blanco', 90, 770, 400)
    x0, y0, k, bb, sz = poner(bg, '03-04_placa-vidrio_horizontal_vidrio-oscuro', W / 2, 900, 860, centro=True)
    cy = y0 + sz[1] / 2
    texto_c(d, W / 2, cy - 74, 'Sesión ordinaria', 'Bold', 62, 'white')
    texto_c(d, W / 2, cy + 8, 'en la Cámara de Diputados', 'Medium', 44, (229, 186, 229))
    poner(bg, '02-03_flecha-curva_izquierda_blanco', 770, 600, 210)
    x0, y0, k, bb, sz = poner(bg, '05-02_etiqueta-CONOCE-MAS_vidrio-claro', W / 2, 1410, 440, centro=True)
    # lugar del sticker de enlace real (no se simula un enlace)
    yl = y0 + sz[1] + 18
    d.rounded_rectangle([W / 2 - 240, yl, W / 2 + 240, yl + 84], 40, outline=(255, 255, 255), width=3)
    texto_c(d, W / 2, yl + 25, 'acá va el sticker «Enlace» de Instagram', 'Regular', 27, 'white')
    return bg.convert('RGB')


def historia_agenda():
    W, H = 1080, 1920
    bg = Image.new('RGBA', (W, H), (35, 35, 40, 255))
    g = Image.new('L', (W, H), 0)
    ImageDraw.Draw(g).ellipse([-300, 1100, 900, 2300], fill=90)
    bg.paste(Image.new('RGBA', (W, H), (60, 60, 68, 255)), (0, 0), g.filter(ImageFilter.GaussianBlur(220)))
    poner(bg, '01-08_marca-de-agua_flor-blanca-24', 520, 1240, 760)
    d = ImageDraw.Draw(bg)
    poner(bg, '05-04_etiqueta-EN-AGENDA_magenta', W / 2, 250, 540, centro=True)
    # placa de fecha con mes y día escritos
    x0, y0, k, bb, sz = poner(bg, '06-07_placa-de-fecha_claro', 80, 470, 440)
    L = 1024; m = L * .12; w = L - 2 * m; bh = w * .30
    fx = lambda v: x0 + (v - bb[0]) * k
    fy = lambda v: y0 + (v - bb[1]) * k
    texto_c(d, fx(L / 2), fy(m + bh / 2) - 34, 'OCT', 'Bold', 60, 'white')
    texto_c(d, fx(L / 2), fy(m + bh + (w - bh) / 2) - 128, '28', 'Bold', 210, (17, 16, 59))
    poner(bg, '06-10_mapa-corrientes-goya_claro', 560, 455, 450)
    poner(bg, '05-16_etiqueta-GOYA_blanco', 785, 905, 260, centro=True)
    # zócalo con nombre y cargo
    x0, y0, k, bb, sz = poner(bg, '06-03_zocalo-nombre-y-cargo_vidrio-claro', W / 2, 1120, 960, centro=True)
    Hz = 640; mz = Hz * .13; zx, zy, zh = mz + 40, mz, Hz - 2 * mz
    fx = lambda v: x0 + (v - bb[0]) * k
    fy = lambda v: y0 + (v - bb[1]) * k
    d.text((fx(zx + zh * .30), fy(zy + zh * .14)), 'Cecilia Gortari', font=F('Bold', 64), fill=(17, 16, 59))
    d.text((fx(zx + zh * .30), fy(zy + zh * .66)), 'Diputada provincial', font=F('Medium', 40), fill=(78, 78, 84))
    poner(bg, '05-14_etiqueta-PARTICIPA_noche', W / 2, 1450, 420, centro=True)
    return bg.convert('RGB')


def ejemplos():
    a, b = historia_sesion(), historia_agenda()
    a.save(os.path.join(LAM, 'EJEMPLO_HISTORIA_1_SESION.jpg'), quality=90)
    b.save(os.path.join(LAM, 'EJEMPLO_HISTORIA_2_AGENDA.jpg'), quality=90)
    W = 2000
    head = encabezado(W, 'Ejemplos de historias', 'Armadas solo con piezas de la biblioteca · los textos se escriben en Instagram')
    esc = .78
    a2, b2 = [x.resize((int(1080 * esc), int(1920 * esc)), Image.LANCZOS) for x in (a, b)]
    H = head.height + 60 + a2.height + 130
    im = Image.new('RGB', (W, H), PAGINA)
    im.paste(head, (0, 0))
    d = ImageDraw.Draw(im)
    gap = (W - 2 * a2.width) // 3
    for i, (x, t) in enumerate(((a2, '1 · Desde la Cámara: logo en cápsula, etiqueta, placa de vidrio y llamado a la acción'),
                                (b2, '2 · Agenda: placa de fecha, mapa con Goya, zócalo y etiqueta de participación'))):
        px = gap + i * (a2.width + gap)
        im.paste(redondear(x.convert('RGBA'), 34), (px, head.height + 60), redondear(x.convert('RGBA'), 34))
        f = ajustar(d, t, 'Medium', 24, a2.width)
        d.text((px, head.height + 60 + a2.height + 22), t, font=f, fill=NOCHE)
    im.save(os.path.join(LAM, 'LAMINA_08_EJEMPLOS_DE_HISTORIAS.jpg'), quality=88, optimize=True)


if __name__ == '__main__':
    grupos, arch = cargar()
    for r in todas(grupos, arch):
        print(os.path.basename(r))
    ejemplos()
    print('ejemplos listos')
