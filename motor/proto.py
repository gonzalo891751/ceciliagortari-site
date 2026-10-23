import os
from nucleo import *
from render import Render, troquelar, guardar_png
from vista import hoja

OUT = os.path.join(BASE, 'proto'); os.makedirs(OUT, exist_ok=True)


def cap_vidrio(tono, modo, W=2048, H=640):
    ids = Ids('a')
    m = H * .14
    sh = rrect(m, m, W - 2 * m, H - 2 * m, (H - 2 * m) / 2)
    d, b = vidrio(sh, (m, m, W - 2 * m, H - 2 * m), tono, modo, ids)
    return svg_doc(W, H, d, b), W, H


def logo_en_capsula(tono, modo, W=2048):
    ids = Ids('b')
    lh = 330
    lw = lh * logo_ratio('imagotipo')
    pad = lh * .5
    cw, ch = lw + 2 * pad * 1.25, lh + 2 * pad
    mx = W * .07
    s = (W - 2 * mx) / cw
    cw, ch, lh, lw, pad = cw * s, ch * s, lh * s, lw * s, pad * s
    H = int(ch + 2 * mx)
    x, y = mx, mx
    sh = rrect(x, y, cw, ch, ch / 2)
    d, b = vidrio(sh, (x, y, cw, ch), tono, modo, ids)
    b += logo_g('imagotipo', x + (cw - lw) / 2, y + (ch - lh) / 2, lh, 'azul-noche' if tono == 'claro' else {'texto': BLANCO, 'flor': MAGENTA})
    return svg_doc(W, H, d, b), W, H


def logo_vidrio(modo, W=2048):
    ids = Ids('c')
    lh = W * .34
    lw = lh * logo_ratio('imagotipo')
    s = (W * .84) / lw
    lh, lw = lh * s, lw * s
    H = int(lh + W * .16)
    x, y = (W - lw) / 2, (H - lh) / 2
    texto_sh = logo_paths_raw('logotipo', x, y + (V['cecilia']['bbox'][1] - logo_bbox('imagotipo')[1]) * lh / (logo_bbox('imagotipo')[3] - logo_bbox('imagotipo')[1]), lh * (logo_bbox('logotipo')[3] - logo_bbox('logotipo')[1]) / (logo_bbox('imagotipo')[3] - logo_bbox('imagotipo')[1]))
    all_sh = logo_paths_raw('imagotipo', x, y, lh)
    d, b = vidrio(all_sh, (x, y, lw, lh), 'claro', modo, ids, rim=lh * .006)
    return svg_doc(W, H, d, b), W, H


def flecha_curva(color, W=1024, H=1024):
    pts = poli_bezier([((190, 800), (230, 470), (480, 260), (800, 270))], 200)
    d = trazo(pts, perfil_pincel(46, .18, .55, .5))
    tip = pts[-1]; dirv = pts[-1] - pts[-8]
    head = punta_abierta(tip, dirv, 150, 40, 36)
    ids = Ids('d'); fid = ids('sh')
    defs = sombra_filtro(fid, 10, 6, NOCHE, .25)
    body = f'<g fill="{color}" filter="url(#{fid})"><path d="{d}"/>{head}</g>'
    return svg_doc(W, H, defs, body), W, H


with Render() as R:
    pngs = []
    for nombre, (svg, w, h) in {
        'cap_claro': cap_vidrio('claro', 'original'),
        'cap_oscuro': cap_vidrio('oscuro', 'original'),
        'logo_cap_claro': logo_en_capsula('claro', 'original'),
        'logo_cap_oscuro': logo_en_capsula('oscuro', 'original'),
        'logo_vidrio': logo_vidrio('original'),
        'flecha_magenta': flecha_curva(MAGENTA),
        'flecha_blanca': flecha_curva(BLANCO),
    }.items():
        im = R.png(svg, w, h)
        p = os.path.join(OUT, nombre + '.png'); guardar_png(im, p); pngs.append(p)
        open(os.path.join(OUT, nombre + '.svg'), 'w', encoding='utf-8').write(svg)
    # recortes
    for nombre, (svg, w, h), col in [('rec_cap_claro', cap_vidrio('claro', 'recorte'), (17, 16, 59)),
                                     ('rec_logo_vidrio', logo_vidrio('recorte'), (17, 16, 59)),
                                     ('rec_flecha_blanca', flecha_curva(BLANCO), (17, 16, 59))]:
        im = troquelar(R.png(svg, w, h), 22, col)
        p = os.path.join(OUT, nombre + '.png'); guardar_png(im, p); pngs.append(p)
hoja(pngs, os.path.join(OUT, '_hoja.jpg'), alto=230)
print('ok')
