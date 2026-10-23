# Núcleo del sistema de stickers de Cecilia Gortari:
# paleta oficial, logo vectorial del manual, vidrio, trazos afinados, textos y render.
import json, math, os
import numpy as np

BASE = os.path.dirname(os.path.abspath(__file__))
FONTS = os.path.join(BASE, 'fonts')

# ---------------- paleta del manual (pág. 16-17) ----------------
NOCHE = '#11103B'      # azul noche del logotipo
NOCHE2 = '#2B2970'
MAGENTA = '#C06BCA'
MAGENTA_OSC = '#A52BB3'
MAGENTA_MED = '#B34ABE'
MAGENTA_9F = '#9F57A7'
ROSA = '#E5BAE5'
ROSA_CLARO = '#E4BFE8'
ROSA_PALIDO = '#F4E6F5'
NARANJA = '#FBA85F'
NARANJA_CL = '#FCB679'
TURQUESA = '#24BCDE'
TURQUESA_CL = '#84DEF2'
AZUL = '#265EEC'
BLANCO = '#FFFFFF'
GRAFITO = '#2C2C31'
GRIS_4E = '#4E4E54'
GRIS_CA = '#CACAD1'
GRIS_EC = '#ECECF3'
GRIS_F7 = '#F7F7FD'

V = json.load(open(os.path.join(BASE, 'vectores', 'vectores_manual.json'), encoding='utf-8'))


# ---------------- utilidades ----------------
def fm(v):
    s = f'{v:.2f}'.rstrip('0').rstrip('.')
    return '0' if s in ('-0', '') else s


class Ids:
    """ids únicos dentro de cada SVG"""
    def __init__(self, p='g'):
        self.p, self.n = p, 0

    def __call__(self, base):
        self.n += 1
        return f'{self.p}{base}{self.n}'


def svg_doc(w, h, defs, body, titulo=''):
    t = f'<title>{titulo}</title>' if titulo else ''
    return (f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" '
            f'width="{w}" height="{h}" viewBox="0 0 {w} {h}">{t}<defs>{defs}</defs>{body}</svg>')


# ---------------- logo (vectores originales del manual) ----------------
def _paths(nombre, color, extra=''):
    return ''.join(f'<path d="{p["d"]}" fill="{color}" fill-rule="{"evenodd" if p["evenodd"] else "nonzero"}"{extra}/>'
                   for p in V[nombre]['paths'])


LOGOS = {
    # nombre: (partes, bbox)
    'imagotipo': (['cecilia', 'gortari', 'flor'],),
    'reducido': (['cg_texto', 'cg_flor'],),
    'isotipo': (['flor'],),
    'logotipo': (['cecilia', 'gortari'],),
}
# combinaciones de color autorizadas (manual pág. 20 + logo azul de la biblioteca, pág. 30)
COLORES_LOGO = {
    'azul-noche': {'texto': NOCHE, 'flor': MAGENTA},
    'magenta': {'texto': MAGENTA, 'flor': NOCHE},
    'azul': {'texto': AZUL, 'flor': MAGENTA},
    'blanco': {'texto': BLANCO, 'flor': BLANCO},
}


def logo_bbox(tipo):
    partes = LOGOS[tipo][0]
    bs = [V[p]['bbox'] for p in partes]
    return min(b[0] for b in bs), min(b[1] for b in bs), max(b[2] for b in bs), max(b[3] for b in bs)


def logo_ratio(tipo):
    x0, y0, x1, y1 = logo_bbox(tipo)
    return (x1 - x0) / (y1 - y0)


def logo_g(tipo, x, y, h, colores=None, texto=None, flor=None, extra=''):
    """grupo del logo con su borde superior izquierdo en (x, y) y altura h"""
    c = dict(COLORES_LOGO['azul-noche'] if colores is None else COLORES_LOGO[colores] if isinstance(colores, str) else colores)
    if texto: c['texto'] = texto
    if flor: c['flor'] = flor
    x0, y0, x1, y1 = logo_bbox(tipo)
    s = h / (y1 - y0)
    inner = ''
    for p in LOGOS[tipo][0]:
        col = c['flor'] if 'flor' in p else c['texto']
        inner += _paths(p, col)
    return f'<g transform="translate({fm(x)} {fm(y)}) scale({s:.6f}) translate({fm(-x0)} {fm(-y0)})"{extra}>{inner}</g>'


def logo_paths_raw(tipo, x, y, h):
    """los paths del logo sin color (para máscaras / recortes)"""
    x0, y0, x1, y1 = logo_bbox(tipo)
    s = h / (y1 - y0)
    inner = ''.join(f'<path d="{p["d"]}" fill-rule="{"evenodd" if p["evenodd"] else "nonzero"}"/>'
                    for n in LOGOS[tipo][0] for p in V[n]['paths'])
    return f'<g transform="translate({fm(x)} {fm(y)}) scale({s:.6f}) translate({fm(-x0)} {fm(-y0)})">{inner}</g>'


def icono_manual(nombre, x, y, h, color):
    x0, y0, x1, y1 = V[nombre]['bbox']
    s = h / (y1 - y0)
    return f'<g transform="translate({fm(x)} {fm(y)}) scale({s:.6f}) translate({fm(-x0)} {fm(-y0)})">{_paths(nombre, color)}</g>'


def icono_manual_ratio(nombre):
    x0, y0, x1, y1 = V[nombre]['bbox']
    return (x1 - x0) / (y1 - y0)


# ---------------- vidrio ----------------
def sombra_filtro(fid, blur, dy, color=NOCHE, op=.28):
    return (f'<filter id="{fid}" x="-30%" y="-30%" width="160%" height="160%" color-interpolation-filters="sRGB">'
            f'<feGaussianBlur in="SourceAlpha" stdDeviation="{fm(blur)}"/><feOffset dy="{fm(dy)}" result="b"/>'
            f'<feFlood flood-color="{color}" flood-opacity="{op}"/><feComposite in2="b" operator="in"/>'
            f'<feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>')


def vidrio(shape, box, tono='claro', modo='original', ids=None, rim=None, sombra=True, brillo=True, reflejo=True,
           cuerpo=1.0, sombra_k=1.0, glow=1.0):
    """
    shape: markup SVG de la forma (sin fill), p.ej. '<rect .../>' o un <g> de paths.
    box: (x, y, w, h) de la forma, para ubicar brillos y sombras.
    tono: 'claro' (vidrio blanco esmerilado), 'oscuro' (vidrio ahumado azul noche),
          'magenta' (vidrio tintado), 'rosa'.
    modo: 'original' (translúcido) | 'recorte' (opaco, sin sombras: para Recortes de Instagram).
    Devuelve (defs, body).
    """
    ids = ids or Ids()
    x, y, w, h = box
    m = min(w, h)
    rim = rim if rim is not None else max(2.0, m * .028)
    cid, gb, gt, gs, gr, gi, fsh, fbl = (ids('clip'), ids('body'), ids('tint'), ids('sheen'), ids('rim'), ids('tint2'),
                                         ids('sh'), ids('bl'))
    rec = modo in ('recorte', 'solido')
    defs = f'<clipPath id="{cid}">{shape}</clipPath>'
    # cuerpo
    if tono == 'claro':
        stops = ([(0, '#FFFFFF', 1), (.6, '#FBF8FC', 1), (1, '#F1E4F3', 1)] if rec else
                 [(0, '#FFFFFF', .58), (.5, '#FFFFFF', .30), (1, '#F4E6F5', .36)])
        tint = (ROSA, .55 if rec else .42)
        tint2 = (TURQUESA_CL, .18 if rec else .14)
        rim_st = [(0, '#FFFFFF', 1), (.45, '#FFFFFF', .35), (1, '#FFFFFF', .85)]
        sheen_op = .55 if not rec else .5
        edge_shadow = (NOCHE, .10)
    elif tono == 'oscuro':
        stops = ([(0, '#1E1D4A', 1), (1, NOCHE, 1)] if rec else [(0, NOCHE, .70), (1, GRAFITO, .80)])
        tint = (MAGENTA, .18 if rec else .12)
        tint2 = (TURQUESA, .14 if rec else .10)
        rim_st = [(0, '#FFFFFF', .75), (.45, '#FFFFFF', .14), (1, '#FFFFFF', .45)]
        sheen_op = .20
        edge_shadow = None
    elif tono == 'magenta':
        stops = ([(0, MAGENTA, 1), (1, MAGENTA_MED, 1)] if rec else [(0, MAGENTA, .78), (1, MAGENTA_OSC, .70)])
        tint = (ROSA, .45)
        tint2 = (NARANJA, .18)
        rim_st = [(0, '#FFFFFF', .9), (.45, '#FFFFFF', .2), (1, '#FFFFFF', .55)]
        sheen_op = .32
        edge_shadow = None
    elif tono == 'rosa':
        stops = ([(0, '#F6E8F7', 1), (1, ROSA, 1)] if rec else [(0, '#F6E8F7', .70), (1, ROSA, .55)])
        tint = (MAGENTA, .30)
        tint2 = (NARANJA_CL, .15)
        rim_st = [(0, '#FFFFFF', 1), (.45, '#FFFFFF', .35), (1, '#FFFFFF', .8)]
        sheen_op = .5
        edge_shadow = (NOCHE, .08)
    else:
        raise ValueError(tono)

    def lg(i, st, x1=0, y1=0, x2=1, y2=1):
        s = ''.join(f'<stop offset="{o}" stop-color="{c}" stop-opacity="{a}"/>' for o, c, a in st)
        return f'<linearGradient id="{i}" x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}">{s}</linearGradient>'

    if not rec and cuerpo != 1.0:
        stops = [(o, c, min(1, a * cuerpo)) for o, c, a in stops]
    defs += lg(gb, stops, 0, 0, .35, 1)
    defs += (f'<radialGradient id="{gt}" cx=".92" cy="1" r=".9"><stop offset="0" stop-color="{tint[0]}" stop-opacity="{tint[1]}"/>'
             f'<stop offset="1" stop-color="{tint[0]}" stop-opacity="0"/></radialGradient>')
    defs += (f'<radialGradient id="{gi}" cx=".06" cy="0" r=".8"><stop offset="0" stop-color="{tint2[0]}" stop-opacity="{tint2[1]}"/>'
             f'<stop offset="1" stop-color="{tint2[0]}" stop-opacity="0"/></radialGradient>')
    defs += lg(gs, [(0, '#FFFFFF', sheen_op), (.55, '#FFFFFF', sheen_op * .25), (1, '#FFFFFF', 0)], 0, 0, 0, 1)
    defs += (f'<linearGradient id="{gr}" gradientUnits="userSpaceOnUse" x1="{fm(x)}" y1="{fm(y)}" x2="{fm(x + w)}" y2="{fm(y + h)}">'
             + ''.join(f'<stop offset="{o}" stop-color="{c}" stop-opacity="{a}"/>' for o, c, a in rim_st) + '</linearGradient>')
    defs += sombra_filtro(fsh, m * .045, m * .03, NOCHE, .30 if tono != 'claro' else .22)
    defs += f'<filter id="{fbl}" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="{fm(rim * .9)}"/></filter>'

    body = ''
    if sombra and modo != 'recorte':
        # sombra suave separada (la forma se pinta con opacidad baja y el filtro solo deja la sombra)
        fso = ids('so')
        defs += (f'<filter id="{fso}" x="-40%" y="-40%" width="180%" height="180%" color-interpolation-filters="sRGB">'
                 f'<feGaussianBlur in="SourceAlpha" stdDeviation="{fm(m * .05 * sombra_k)}"/><feOffset dy="{fm(m * .035 * sombra_k)}" result="b"/>'
                 f'<feFlood flood-color="{NOCHE}" flood-opacity="{(.22 if tono in ("claro", "rosa") else .30) * (1.25 if modo == "solido" else 1)}"/><feComposite in2="b" operator="in" result="s"/>'
                 f'<feComposite in="s" in2="SourceAlpha" operator="out"/></filter>')
        body += f'<g filter="url(#{fso})" fill="#000">{shape}</g>'
    body += f'<g fill="url(#{gb})">{shape}</g>'
    body += f'<g clip-path="url(#{cid})">'
    body += f'<rect x="{fm(x)}" y="{fm(y)}" width="{fm(w)}" height="{fm(h)}" fill="url(#{gt})"/>'
    body += f'<rect x="{fm(x)}" y="{fm(y)}" width="{fm(w)}" height="{fm(h)}" fill="url(#{gi})"/>'
    if brillo:
        # brillo superior: banda clara que cae desde arriba
        body += f'<rect x="{fm(x)}" y="{fm(y)}" width="{fm(w)}" height="{fm(h * .52)}" fill="url(#{gs})"/>'
    if reflejo:
        # reflejo diagonal delicado
        a = .13 if tono != 'oscuro' else .07
        px = x + w * .58
        body += (f'<path d="M{fm(px)} {fm(y - h)} l{fm(m * .22)} 0 l{fm(-h * 1.1)} {fm(h * 3)} l{fm(-m * .22)} 0 Z" '
                 f'fill="#FFFFFF" fill-opacity="{a}"/>')
        body += (f'<path d="M{fm(px + m * .30)} {fm(y - h)} l{fm(m * .06)} 0 l{fm(-h * 1.1)} {fm(h * 3)} l{fm(-m * .06)} 0 Z" '
                 f'fill="#FFFFFF" fill-opacity="{a * .8}"/>')
    # brillo interior del canto (espesor del vidrio)
    body += (f'<g fill="none" stroke="#FFFFFF" stroke-opacity="{(.55 if tono != "oscuro" else .22) * glow}" '
             f'stroke-width="{fm(rim * 3.2)}" filter="url(#{fbl})">{shape}</g>')
    if edge_shadow:
        body += (f'<g fill="none" stroke="{edge_shadow[0]}" stroke-opacity="{edge_shadow[1]}" stroke-width="{fm(rim * 2)}" '
                 f'transform="translate(0 {fm(-rim * .8)})" filter="url(#{fbl})">{shape}</g>')
    body += f'<g fill="none" stroke="url(#{gr})" stroke-width="{fm(rim * 2)}">{shape}</g>'
    body += '</g>'
    return defs, body


# ---------------- formas ----------------
def rrect(x, y, w, h, r):
    return f'<rect x="{fm(x)}" y="{fm(y)}" width="{fm(w)}" height="{fm(h)}" rx="{fm(r)}" ry="{fm(r)}"/>'


def circle(cx, cy, r):
    return f'<circle cx="{fm(cx)}" cy="{fm(cy)}" r="{fm(r)}"/>'


# ---------------- trazos afinados (estética editorial) ----------------
def cubic(p0, p1, p2, p3, n=120):
    t = np.linspace(0, 1, n)[:, None]
    p0, p1, p2, p3 = map(np.array, (p0, p1, p2, p3))
    return (1 - t) ** 3 * p0 + 3 * (1 - t) ** 2 * t * p1 + 3 * (1 - t) * t ** 2 * p2 + t ** 3 * p3


def poli_bezier(segs, n=90):
    pts = []
    for i, s in enumerate(segs):
        c = cubic(*s, n=n)
        pts.append(c if i == 0 else c[1:])
    return np.vstack(pts)


def remuestrear(pts, n):
    d = np.r_[0, np.cumsum(np.hypot(*np.diff(pts, axis=0).T))]
    s = np.linspace(0, d[-1], n)
    return np.c_[np.interp(s, d, pts[:, 0]), np.interp(s, d, pts[:, 1])], d[-1]


def _catmull(pts, cerrado=False):
    P = pts
    n = len(P)
    out = f'M{fm(P[0][0])} {fm(P[0][1])}'
    rng = range(n) if cerrado else range(n - 1)
    for i in rng:
        p0 = P[i - 1] if (i > 0 or cerrado) else P[i]
        p1, p2 = P[i], P[(i + 1) % n]
        p3 = P[(i + 2) % n] if (i + 2 < n or cerrado) else P[(i + 1) % n]
        c1 = p1 + (p2 - p0) / 6
        c2 = p2 - (p3 - p1) / 6
        out += f'C{fm(c1[0])} {fm(c1[1])} {fm(c2[0])} {fm(c2[1])} {fm(p2[0])} {fm(p2[1])}'
    return out + ('Z' if cerrado else '')


def trazo(pts, perfil, n=70):
    """contorno relleno de un trazo con ancho variable. perfil(t)->ancho (t en 0..1)."""
    pts, L = remuestrear(np.asarray(pts, float), n)
    t = np.linspace(0, 1, n)
    wv = np.array([perfil(v) for v in t]) / 2
    tg = np.gradient(pts, axis=0)
    tg /= np.linalg.norm(tg, axis=1)[:, None] + 1e-9
    nr = np.c_[-tg[:, 1], tg[:, 0]]
    L_ = pts + nr * wv[:, None]
    R_ = pts - nr * wv[:, None]
    # tapas redondeadas
    def tapa(c, d, r, k=7):
        a0 = math.atan2(d[1], d[0])
        return [c + r * np.array([math.cos(a0 + math.pi / 2 - math.pi * j / k), math.sin(a0 + math.pi / 2 - math.pi * j / k)]) for j in range(1, k)]
    fin = tapa(pts[-1], tg[-1], wv[-1])
    ini = tapa(pts[0], -tg[0], wv[0])
    poly = np.vstack([L_, np.array(fin).reshape(-1, 2) if fin else np.empty((0, 2)), R_[::-1], np.array(ini).reshape(-1, 2) if ini else np.empty((0, 2))])
    return _catmull(poly, cerrado=True)


def perfil_pincel(wmax, w0=.25, w1=.35, pico=.45, exp=.8):
    """grueso al medio, fino en las puntas (como un marcador de punta biselada)"""
    def f(t):
        if t < pico:
            k = (t / pico) ** exp
            return wmax * (w0 + (1 - w0) * math.sin(k * math.pi / 2))
        k = ((t - pico) / (1 - pico)) ** 1.2
        return wmax * (1 - (1 - w1) * (1 - math.cos(k * math.pi / 2)))
    return f


def punta_abierta(tip, direc, largo, ancho, ang=34):
    """dos barbas afinadas que salen de la punta (flecha editorial)"""
    d = np.array(direc, float); d /= np.linalg.norm(d)
    out = ''
    for s in (-1, 1):
        a = math.radians(180 + s * ang)
        rd = np.array([d[0] * math.cos(a) - d[1] * math.sin(a), d[0] * math.sin(a) + d[1] * math.cos(a)])
        p0 = np.array(tip) + d * ancho * .12
        p1 = np.array(tip) + rd * largo
        seg = np.linspace(p0, p1, 20)
        out += f'<path d="{trazo(seg, lambda t: ancho * (1 - .55 * t ** 1.3), n=24)}"/>'
    return out


def punta_solida(tip, direc, largo, ancho):
    """punta triangular con esquinas redondeadas"""
    d = np.array(direc, float); d /= np.linalg.norm(d)
    nrm = np.array([-d[1], d[0]])
    base = np.array(tip) - d * largo
    a = base + nrm * ancho / 2
    b = base - nrm * ancho / 2
    t = np.array(tip)
    # triángulo con curvas suaves
    r = ancho * .1
    pts = [t, a, base - d * largo * .06, b]
    return (f'<path stroke-linejoin="round" d="M{fm(t[0])} {fm(t[1])} L{fm(a[0])} {fm(a[1])} '
            f'Q{fm(base[0] + d[0]*largo*.18)} {fm(base[1] + d[1]*largo*.18)} {fm(b[0])} {fm(b[1])} Z"/>')


# ---------------- texto ----------------
_FONT_CACHE = {}
PESOS = {400: 'Outfit-Regular.ttf', 500: 'Outfit-Medium.ttf', 600: 'Outfit-SemiBold.ttf', 700: 'Outfit-Bold.ttf', 900: 'Outfit-Black.ttf'}


def ancho_texto(texto, size, peso=700, tracking=0.0):
    from PIL import ImageFont
    key = (peso, 400)
    if key not in _FONT_CACHE:
        _FONT_CACHE[key] = ImageFont.truetype(os.path.join(FONTS, PESOS[peso]), 400)
    w = _FONT_CACHE[key].getlength(texto) * size / 400
    return w + tracking * size * max(0, len(texto) - 1)


def texto(x, y, s, size, color, peso=700, anchor='middle', tracking=0.0, extra=''):
    ls = f' letter-spacing="{fm(tracking * size)}"' if tracking else ''
    # el tracking agrega espacio también después de la última letra: se compensa al centrar
    dx = -tracking * size / 2 if (tracking and anchor == 'middle') else 0
    s = s.replace('&', '&amp;')
    return (f'<text x="{fm(x + dx)}" y="{fm(y)}" font-family="Outfit, sans-serif" font-weight="{peso}" '
            f'font-size="{fm(size)}" fill="{color}" text-anchor="{anchor}"{ls}{extra}>{s}</text>')


# altura de mayúsculas de Outfit (cap height / em)
CAP = 0.70
