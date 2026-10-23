# 02 · Flechas y marcadores: trazos afinados, de estética editorial (nada de cómic).
import math
import numpy as np
from nucleo import *
from base import grupo, recurso, REC_B, REC_N

COLORES = {'magenta': MAGENTA, 'blanco': BLANCO, 'azul-noche': NOCHE, 'naranja': NARANJA, 'turquesa': TURQUESA}


def rec_de(color, **kw):
    d = dict(REC_N if color == 'blanco' else REC_B); d.update(kw); return d


def _doc(W, H, color, contenido, espejo=False, sombra=True):
    ids = Ids('m')
    fid = ids('sh')
    op = .34 if color == BLANCO else .22
    defs = sombra_filtro(fid, max(W, H) * .008, max(W, H) * .005, NOCHE, op) if sombra else ''
    tr = f' transform="translate({W} 0) scale(-1 1)"' if espejo else ''
    f = f' filter="url(#{fid})"' if sombra else ''
    return svg_doc(W, H, defs, f'<g{tr}><g fill="{color}" color="{color}"{f}>{contenido}</g></g>')


# ---------------- flechas ----------------
def recta_fina(W=2048, H=640):
    pts = np.linspace((190, H / 2), (1840, H / 2), 40)
    body = f'<path d="{trazo(pts, lambda t: 12 + 14 * t)}"/>'
    body += punta_abierta((1858, H / 2), (1, 0), 170, 26, 38)
    return body


def recta_gruesa(W=2048, H=768):
    tip = np.array([1880, H / 2]); L = 300
    pts = np.linspace((170, H / 2), (tip[0] - L * .9, H / 2), 40)
    body = f'<path d="{trazo(pts, lambda t: 46 + 74 * t ** .8)}"/>'
    body += punta_solida(tip, (1, 0), L, 330)
    return body


def curva(W=1024, H=1024):
    pts = poli_bezier([((190, 820), (220, 480), (470, 260), (800, 265))], 200)
    body = f'<path d="{trazo(pts, perfil_pincel(48, .18, .62, .52))}"/>'
    body += punta_abierta(pts[-1], pts[-1] - pts[-10], 165, 42, 37)
    return body


def semicircular(W=1024, H=1024):
    c, r = np.array([512, 600]), 300
    th = np.linspace(math.pi * 1.02, math.pi * 2.0, 200)
    pts = np.c_[c[0] + r * np.cos(th), c[1] + r * np.sin(th) * .95]
    pts = np.vstack([np.linspace((c[0] - r * 1.02, 760), pts[0], 12)[:-1], pts, np.linspace(pts[-1], (c[0] + r, 640), 10)[1:]])
    body = f'<path d="{trazo(pts, perfil_pincel(46, .2, .62, .5))}"/>'
    body += punta_abierta(pts[-1], (0, 1), 160, 40, 37)
    return body


def ondulada(W=2048, H=768):
    x = np.linspace(170, 1780, 260)
    y = H / 2 + 120 * np.sin((x - 170) / 1610 * 2 * math.pi * 1.75) * np.linspace(.85, 1, len(x))
    pts = np.c_[x, y]
    body = f'<path d="{trazo(pts, perfil_pincel(44, .22, .65, .5), n=140)}"/>'
    body += punta_abierta(pts[-1], pts[-1] - pts[-6], 170, 40, 37)
    return body


def bucle(W=1536, H=1024):
    pts = poli_bezier([((150, 780), (430, 820), (720, 600), (700, 410)),
                       ((700, 410), (685, 260), (520, 250), (515, 380)),
                       ((515, 380), (510, 520), (760, 600), (980, 560)),
                       ((980, 560), (1150, 530), (1280, 420), (1370, 300))], 120)
    body = f'<path d="{trazo(pts, perfil_pincel(44, .2, .62, .55), n=150)}"/>'
    body += punta_abierta(pts[-1], pts[-1] - pts[-8], 160, 40, 37)
    return body


def chevrons(W=1024, H=1024, recorte=False):
    body = ''
    for i, op in enumerate((.38, .68, 1)):
        y0 = 300 + i * 150
        pts = np.array([(352, y0), (512, y0 + 130), (672, y0)])
        o = 1 if recorte else op
        body += (f'<path d="M352 {y0} L512 {y0 + 130} L672 {y0}" fill="none" stroke="currentColor" stroke-width="50" '
                 f'stroke-linecap="round" stroke-linejoin="round" opacity="{o}"/>')
    return body


# ---------------- marcadores ----------------
def lazo(cx, cy, rx, ry, rot=-8, vueltas=1.1, w=34, n=260):
    th = np.linspace(-math.pi * .72, -math.pi * .72 + 2 * math.pi * vueltas, n)
    k = np.linspace(0, 1, n)
    r = 1 + .055 * k
    x = rx * r * np.cos(th); y = ry * r * np.sin(th) - ry * .06 * k
    a = math.radians(rot)
    X = cx + x * math.cos(a) - y * math.sin(a); Y = cy + x * math.sin(a) + y * math.cos(a)
    return f'<path d="{trazo(np.c_[X, Y], perfil_pincel(w, .12, .25, .4), n=180)}"/>'


def subrayado(W=2048, H=512, doble=False):
    pts = poli_bezier([((170, 300), (700, 250), (1300, 236), (1880, 262))], 160)
    body = f'<path d="{trazo(pts, perfil_pincel(52, .5, .14, .25, 1))}"/>'
    if doble:
        pts2 = poli_bezier([((420, 372), (850, 336), (1300, 330), (1700, 350))], 160)
        body += f'<path d="{trazo(pts2, perfil_pincel(36, .5, .14, .25, 1))}"/>'
    return body


def resaltador(W=2048, H=512):
    # banda de resaltador con cantos biselados
    x0, x1, y0, y1, k = 150, 1898, 150, 362, 34
    return (f'<path d="M{x0 + k} {y0} L{x1} {y0 + 6} Q{x1 + 6} {y0 + 8} {x1 - k * .4} {y1} L{x0} {y1 - 6} '
            f'Q{x0 - 6} {y1 - 8} {x0 + k} {y0} Z" opacity=".52"/>')


def estrella4(cx, cy, R, k=.0):
    return (f'<path d="M{fm(cx)} {fm(cy - R)} Q{fm(cx + R * k)} {fm(cy - R * k)} {fm(cx + R)} {fm(cy)} '
            f'Q{fm(cx + R * k)} {fm(cy + R * k)} {fm(cx)} {fm(cy + R)} Q{fm(cx - R * k)} {fm(cy + R * k)} {fm(cx - R)} {fm(cy)} '
            f'Q{fm(cx - R * k)} {fm(cy - R * k)} {fm(cx)} {fm(cy - R)} Z"/>')


def destellos(W=1024, H=1024):
    return (estrella4(470, 540, 300, .08) + estrella4(750, 300, 125, .08) + estrella4(760, 720, 78, .08)
            + f'<circle cx="300" cy="250" r="26"/>')


def enfasis(W=1024, H=1024):
    """tres trazos que irradian hacia afuera, como los que se dibujan sobre un título"""
    body = ''
    o = np.array([512, 860])
    for ang, L in ((-138, 230), (-90, 270), (-42, 230)):
        a = math.radians(ang)
        d = np.array([math.cos(a), math.sin(a)])
        pts = np.linspace(o + d * 330, o + d * (330 + L), 30)
        body += f'<path d="{trazo(pts, lambda t: 30 + 26 * t)}"/>'
    return body


def corchetes(W=1024, H=1024):
    m, L, r = 170, 220, 60
    s = f'stroke="currentColor" stroke-width="44" fill="none" stroke-linecap="round" stroke-linejoin="round"'
    body = ''
    for sx, sy in ((0, 0), (1, 0), (0, 1), (1, 1)):
        x = m if sx == 0 else W - m; y = m if sy == 0 else H - m
        dx = 1 if sx == 0 else -1; dy = 1 if sy == 0 else -1
        body += (f'<path {s} d="M{x} {y + dy * L} V{y + dy * r} Q{x} {y} {x + dx * r} {y} H{x + dx * L}"/>')
    return body


def registrar():
    tres = ['magenta', 'blanco', 'azul-noche']

    def reg(gid, nombre_fn, W, H, colores, espejos=(None,), rec_kw=None, recortable=True):
        for esp in espejos:
            for c in colores:
                col = COLORES[c]
                var = (f'{esp}_' if esp else '') + c

                def fn(modo, f=nombre_fn, col=col, esp=esp, W=W, H=H):
                    cont = f(W, H) if f is not chevrons else chevrons(W, H, modo == 'recorte')
                    return _doc(W, H, col, cont, espejo=(esp == 'izquierda'), sombra=(modo == 'original'))
                recurso(gid, var, W, H, fn, rec_de(c, **(rec_kw or {})) if recortable else None)

    g = grupo('02', 1, 'flecha-recta-fina', 'Flecha recta fina',
              'Flecha liviana para señalar un dato sin tapar la imagen. Se puede rotar en cualquier dirección desde Instagram.', tags='flecha recta fina')
    reg(g, recta_fina, 2048, 640, tres)
    g = grupo('02', 2, 'flecha-recta-gruesa', 'Flecha recta gruesa',
              'Flecha de alto impacto para indicar el punto principal de la historia.', tags='flecha recta gruesa')
    reg(g, recta_gruesa, 2048, 768, tres)
    g = grupo('02', 3, 'flecha-curva', 'Flecha curva',
              'Curva elegante de trazo afinado. Hay versión que gira a la derecha y a la izquierda, porque Instagram permite rotar pero no espejar.', tags='flecha curva')
    reg(g, curva, 1024, 1024, tres, espejos=('derecha', 'izquierda'))
    g = grupo('02', 4, 'flecha-semicircular', 'Flecha semicircular',
              'Arco de media vuelta para conectar dos elementos o señalar hacia abajo.', tags='flecha arco semicircular')
    reg(g, semicircular, 1024, 1024, tres, espejos=('derecha', 'izquierda'))
    g = grupo('02', 5, 'flecha-ondulada', 'Flecha ondulada',
              'Trazo ondulado con dirección. Aporta movimiento sin perder sobriedad.', tags='flecha onda')
    reg(g, ondulada, 2048, 768, tres)
    g = grupo('02', 6, 'flecha-bucle', 'Flecha con bucle',
              'Flecha con un rulo, más expresiva. Para destacar un llamado a la acción o un detalle.', tags='flecha bucle loop')
    reg(g, bucle, 1536, 1024, tres, espejos=('derecha', 'izquierda'))
    g = grupo('02', 7, 'chevrons-hacia-abajo', 'Chevrons hacia abajo',
              'Tres ángulos que invitan a mirar hacia abajo (por ejemplo, hacia el sticker de enlace).', tags='chevron abajo mirar')
    reg(g, chevrons, 1024, 1024, tres, rec_kw=dict(grosor=40))

    mk = ['magenta', 'blanco', 'naranja']
    g = grupo('02', 8, 'circulo-marcador', 'Círculo marcador',
              'Círculo trazado a mano alzada, limpio y afinado, para encerrar un rostro, una cifra o un detalle.', tags='circulo marcar encerrar')
    reg(g, lambda W, H: lazo(512, 512, 360, 330, -8), 1024, 1024, mk, rec_kw=dict(huecos=False))
    g = grupo('02', 9, 'ovalo-marcador', 'Óvalo marcador',
              'Óvalo horizontal para encerrar una frase, un titular o una línea de un documento.', tags='ovalo marcar encerrar')
    reg(g, lambda W, H: lazo(1024, 512, 830, 330, -3, w=40), 2048, 1024, mk, rec_kw=dict(huecos=False))
    g = grupo('02', 10, 'subrayado-trazo', 'Subrayado de trazo',
              'Subrayado con forma de marcador para destacar una palabra o una cifra.', tags='subrayado linea')
    reg(g, lambda W, H: subrayado(W, H), 2048, 512, mk)
    g = grupo('02', 11, 'subrayado-doble', 'Subrayado doble',
              'Dos trazos para un énfasis mayor.', tags='subrayado doble')
    reg(g, lambda W, H: subrayado(W, H, True), 2048, 512, mk)
    g = grupo('02', 12, 'resaltador', 'Resaltador translúcido',
              'Banda de resaltador semitransparente para pasar sobre texto de documentos, notas o capturas. Pegalo (no uses Recortes) para conservar la transparencia.',
              metodo='pegar', tags='resaltador destacar documento')
    reg(g, resaltador, 2048, 512, ['magenta', 'naranja', 'turquesa'], recortable=False)
    g = grupo('02', 13, 'destellos', 'Destellos',
              'Brillos de cuatro puntas para anunciar una novedad o subrayar un logro.', tags='destello brillo estrella')
    reg(g, destellos, 1024, 1024, mk, rec_kw=dict(grosor=34))
    g = grupo('02', 14, 'acento-enfasis', 'Acento de énfasis',
              'Tres líneas que irradian desde un punto. Junto a un título o a una persona para dar energía.', tags='enfasis acento lineas')
    reg(g, enfasis, 1024, 1024, mk, rec_kw=dict(grosor=34))
    g = grupo('02', 15, 'corchetes-de-foco', 'Corchetes de foco',
              'Cuatro esquinas que enmarcan algo, como el visor de una cámara. Por ser cuatro piezas separadas, conviene pegarlo.',
              metodo='pegar', tags='corchetes marco foco')
    reg(g, corchetes, 1024, 1024, ['blanco', 'magenta', 'azul-noche'], recortable=False)
