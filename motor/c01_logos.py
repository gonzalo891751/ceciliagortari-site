# 01 · Logos y marca. El logo sale siempre de los vectores del manual, sin deformar ni reordenar.
import math
from nucleo import *
from base import grupo, recurso, REC_B, REC_N

CS = 0.48   # área de resguardo del manual (pág. 21): ~0,48 × la altura del imagotipo


def _lienzo_logo(tipo, ancho, margen_k=CS):
    r = logo_ratio(tipo)
    # alto del logo tal que logo + resguardo entren en "ancho"
    lh = ancho / (r + 2 * margen_k)
    H = lh * (1 + 2 * margen_k)
    return lh, lh * r, math.ceil(H)


def logo_plano(tipo, colores, ancho=2048, alpha=1.0, margen_k=CS, cuadrado=False):
    def fn(modo):
        if cuadrado:
            W = H = ancho
            r = logo_ratio(tipo)
            lado = ancho / (1 + 2 * margen_k)
            lh = lado / max(r, 1); lw = lh * r
        else:
            lh, lw, H = _lienzo_logo(tipo, ancho, margen_k); W = ancho
        x, y = (W - lw) / 2, (H - lh) / 2
        g = logo_g(tipo, x, y, lh, colores, extra=f' opacity="{alpha}"' if alpha < 1 else '')
        return svg_doc(W, H, '', g, f'Cecilia Gortari — {tipo} {colores}')
    if cuadrado:
        return fn, ancho, ancho
    lh, lw, H = _lienzo_logo(tipo, ancho, margen_k)
    return fn, ancho, H


def firma(colores, ancho=2048):
    """imagotipo + 'Diputada provincial' (Outfit Regular), como la firma de las producciones"""
    r = logo_ratio('imagotipo')
    k_sub = .23   # alto de la línea "Diputada provincial" relativo al logo (cap height + descendentes)
    gap = .20
    tot_h = 1 + gap + k_sub
    lh = ancho / (r + 2 * CS * tot_h / 1)
    lh = ancho / (r + 2 * CS)
    lw = lh * r
    H = math.ceil(lh * tot_h + 2 * CS * lh)
    col_txt = {'blanco': BLANCO, 'azul-noche': NOCHE, 'magenta': MAGENTA}[colores]

    def fn(modo):
        x, y = (ancho - lw) / 2, CS * lh
        g = logo_g('imagotipo', x, y, lh, colores)
        # el subtítulo ocupa ~88 % del ancho del logo (proporción de la firma de las producciones)
        size = lw * .885 / (ancho_texto('Diputada provincial', 1, 400))
        base = y + lh + gap * lh + size * CAP
        g += texto(ancho / 2, base, 'Diputada provincial', size, col_txt, 400)
        return svg_doc(ancho, H, '', g, 'Cecilia Gortari — firma Diputada provincial')
    return fn, ancho, H


def logo_vidrio(tono, ancho=2048):
    r = logo_ratio('imagotipo')
    mk = .30
    lh = ancho / (r + 2 * mk); lw = lh * r
    H = math.ceil(lh * (1 + 2 * mk))

    def fn(modo):
        ids = Ids('lv')
        x, y = (ancho - lw) / 2, (H - lh) / 2
        sh = logo_paths_raw('imagotipo', x, y, lh)
        d, b = vidrio(sh, (x, y, lw, lh), tono, modo, ids, rim=lh * .0055,
                      cuerpo=1.75 if tono == 'claro' else 1.15, sombra_k=.45, glow=.8)
        # la flor conserva su color de marca como vidrio tintado
        flor = logo_paths_raw('isotipo', x + (V['flor']['bbox'][0] - logo_bbox('imagotipo')[0]) * lh / (logo_bbox('imagotipo')[3] - logo_bbox('imagotipo')[1]),
                              y + (V['flor']['bbox'][1] - logo_bbox('imagotipo')[1]) * lh / (logo_bbox('imagotipo')[3] - logo_bbox('imagotipo')[1]),
                              lh * (V['flor']['bbox'][3] - V['flor']['bbox'][1]) / (logo_bbox('imagotipo')[3] - logo_bbox('imagotipo')[1]))
        op = (.55 if tono == 'claro' else .70) if modo == 'original' else 1
        b += f'<g fill="{MAGENTA}" fill-opacity="{op if modo == "original" else .9}">{flor}</g>'
        # brillo de borde de la flor
        b += f'<g fill="none" stroke="#FFFFFF" stroke-opacity="{.55 if modo == "original" else .7}" stroke-width="{fm(lh * .006)}">{flor}</g>'
        return svg_doc(ancho, H, d, b, f'Cecilia Gortari — logo de vidrio {tono}')
    return fn, ancho, H


def logo_capsula(tono, ancho=2048):
    r = logo_ratio('imagotipo')
    padx, pady = .62, .40          # resguardo interno (en alturas de logo)
    mx = .07 * ancho
    cw = ancho - 2 * mx
    lh = cw / (r + 2 * padx); lw = lh * r
    ch = lh * (1 + 2 * pady)
    H = math.ceil(ch + 2 * mx)

    def fn(modo):
        ids = Ids('lc')
        x, y = mx, (H - ch) / 2
        sh = rrect(x, y, cw, ch, ch / 2)
        d, b = vidrio(sh, (x, y, cw, ch), tono, modo, ids, cuerpo=1.15 if tono == 'claro' else 1.0)
        cols = 'azul-noche' if tono == 'claro' else {'texto': BLANCO, 'flor': MAGENTA}
        b += logo_g('imagotipo', x + (cw - lw) / 2, y + (ch - lh) / 2, lh, cols)
        return svg_doc(ancho, H, d, b, f'Cecilia Gortari — logo en cápsula de vidrio {tono}')
    return fn, ancho, H


def placa_cg(tono, lado=1024):
    def fn(modo):
        ids = Ids('pc')
        m = lado * .1
        s = lado - 2 * m
        sh = rrect(m, m, s, s, s * .26)
        d, b = vidrio(sh, (m, m, s, s), tono, modo, ids, cuerpo=1.1)
        r = logo_ratio('reducido')
        lw = s * .78; lh = lw / r
        cols = 'azul-noche' if tono == 'claro' else {'texto': BLANCO, 'flor': MAGENTA}
        b += logo_g('reducido', m + (s - lw) / 2 - s * .01, m + (s - lh) / 2, lh, cols)
        return svg_doc(lado, lado, d, b, f'Cecilia Gortari — CG en placa de vidrio {tono}')
    return fn, lado, lado


def sello(tono, lado=1024):
    def fn(modo):
        ids = Ids('se')
        c = lado / 2
        R = lado * .43
        defs, body = '', ''
        if tono == 'claro':
            d, b = vidrio(circle(c, c, R), (c - R, c - R, 2 * R, 2 * R), 'claro', 'solido' if modo == 'original' else modo, ids, cuerpo=1,
                          sombra_k=.6)
            col_t, col_l, cols = NOCHE, MAGENTA, 'azul-noche'
        else:
            d, b = vidrio(circle(c, c, R), (c - R, c - R, 2 * R, 2 * R), 'oscuro', modo, ids, cuerpo=1.15, sombra_k=.6)
            col_t, col_l, cols = BLANCO, ROSA, {'texto': BLANCO, 'flor': MAGENTA}
        defs += d; body += b
        # anillos finos
        body += f'<circle cx="{c}" cy="{c}" r="{fm(R * .90)}" fill="none" stroke="{col_l}" stroke-width="{fm(lado * .006)}"/>'
        body += f'<circle cx="{c}" cy="{c}" r="{fm(R * .585)}" fill="none" stroke="{col_l}" stroke-width="{fm(lado * .006)}"/>'
        # texto en arco: nombre arriba y cargo abajo, ambos legibles al derecho
        size = lado * .062
        banda = R * .75                       # radio medio de la banda de texto
        cap = size * CAP
        p_sup, p_inf = ids('arcA'), ids('arcB')
        rs, ri = banda - cap / 2, banda + cap / 2
        defs += (f'<path id="{p_sup}" d="M{fm(c - rs)} {fm(c)} A{fm(rs)} {fm(rs)} 0 0 1 {fm(c + rs)} {fm(c)}"/>'
                 f'<path id="{p_inf}" d="M{fm(c - ri)} {fm(c)} A{fm(ri)} {fm(ri)} 0 0 0 {fm(c + ri)} {fm(c)}"/>')
        for pid, txt in ((p_sup, 'CECILIA GORTARI'), (p_inf, 'DIPUTADA PROVINCIAL')):
            # el manual solo autoriza Outfit Regular, Medium y Bold
            body += (f'<text font-family="Outfit, sans-serif" font-weight="700" font-size="{fm(size)}" fill="{col_t}" '
                     f'letter-spacing="{fm(size * .16)}" text-anchor="middle"><textPath href="#{pid}" xlink:href="#{pid}" '
                     f'startOffset="50%">{txt}</textPath></text>')
        # separadores a los costados
        for sx in (-1, 1):
            body += f'<circle cx="{fm(c + sx * banda)}" cy="{fm(c)}" r="{fm(size * .16)}" fill="{col_l}"/>'
        # isotipo al centro
        fr = icono_manual_ratio('flor') if False else (V['flor']['bbox'][2] - V['flor']['bbox'][0]) / (V['flor']['bbox'][3] - V['flor']['bbox'][1])
        fh = R * .78
        body += logo_g('isotipo', c - fh * fr / 2, c - fh / 2, fh, flor=MAGENTA if tono == 'claro' else MAGENTA)
        return svg_doc(lado, lado, defs, body, f'Cecilia Gortari — sello circular {tono}')
    return fn, lado, lado


def registrar():
    g = grupo('01', 1, 'imagotipo-oficial', 'Imagotipo oficial',
              'Logo completo tal como figura en el manual. Azul noche y azul para fondos claros; magenta como alternativa; blanco sobre fotos o fondos oscuros. Respetar el área libre que ya trae el archivo.',
              tags='logo marca firma')
    for v in ['azul-noche', 'magenta', 'azul', 'blanco']:
        fn, w, h = logo_plano('imagotipo', v)
        recurso(g, v, w, h, fn, REC_N if v == 'blanco' else REC_B)

    g = grupo('01', 2, 'logo-reducido-CG', 'Logo reducido CG',
              'Versión compacta del manual. Para firmar historias en una esquina o cuando el espacio es chico.', tags='logo cg compacto')
    for v in ['azul-noche', 'magenta', 'blanco']:
        fn, w, h = logo_plano('reducido', v, ancho=2048)
        recurso(g, v, w, h, fn, REC_N if v == 'blanco' else REC_B)

    g = grupo('01', 3, 'isotipo-flor', 'Isotipo (flor)',
              'La flor sola. Como acento de marca o sello pequeño. No reemplaza al logo completo cuando hay que identificar a Cecilia.', tags='flor isotipo')
    for v, col in [('magenta', MAGENTA), ('azul-noche', NOCHE), ('blanco', BLANCO)]:
        fn, w, h = logo_plano('isotipo', {'texto': col, 'flor': col}, ancho=1024, margen_k=.12, cuadrado=True)
        recurso(g, v, w, h, fn, REC_N if v == 'blanco' else REC_B)

    g = grupo('01', 4, 'firma-diputada-provincial', 'Firma «Diputada provincial»',
              'Logo + cargo, igual que el cierre de las producciones audiovisuales. Para cerrar historias institucionales.', tags='firma cargo cierre')
    for v in ['azul-noche', 'blanco']:
        fn, w, h = firma(v)
        recurso(g, v, w, h, fn, REC_N if v == 'blanco' else REC_B)

    g = grupo('01', 5, 'logo-vidrio-premium', 'Logo de vidrio (premium)',
              'El logo convertido en vidrio esmerilado con canto brillante, como en los videos. El claro luce sobre fotos medias u oscuras; el oscuro, sobre fotos claras.',
              metodo='pegar', tags='vidrio glass premium')
    for v in ['claro', 'oscuro']:
        fn, w, h = logo_vidrio(v)
        recurso(g, f'vidrio-{v}', w, h, fn, REC_N if v == 'claro' else REC_B)

    g = grupo('01', 6, 'logo-en-capsula-vidrio', 'Logo en cápsula de vidrio',
              'Cápsula horizontal translúcida con el logo. Funciona como firma visible sobre cualquier foto.', tags='vidrio capsula logo')
    for v in ['claro', 'oscuro']:
        fn, w, h = logo_capsula(v)
        recurso(g, f'vidrio-{v}', w, h, fn, REC_N if v == 'claro' else REC_B)

    g = grupo('01', 7, 'CG-en-placa-vidrio', 'CG en placa de vidrio',
              'Versión compacta y cuadrada (tipo ícono de app) para esquinas de la historia.', tags='cg vidrio compacto')
    for v in ['claro', 'oscuro']:
        fn, w, h = placa_cg(v)
        recurso(g, f'vidrio-{v}', w, h, fn, REC_N if v == 'claro' else REC_B)

    g = grupo('01', 8, 'marca-de-agua', 'Marca de agua',
              'Logo semitransparente para firmar fotos propias sin tapar la imagen. Por la transparencia, conviene pegarlo (no usar Recortes).',
              metodo='pegar', tags='marca agua transparente')
    fn, w, h = logo_plano('imagotipo', 'blanco', alpha=.38)
    recurso(g, 'blanca-38', w, h, fn, None)
    fn, w, h = logo_plano('imagotipo', 'azul-noche', alpha=.26)
    recurso(g, 'azul-noche-26', w, h, fn, None)
    fn, w, h = logo_plano('isotipo', {'texto': BLANCO, 'flor': BLANCO}, ancho=1024, margen_k=.06, cuadrado=True, alpha=.24)
    recurso(g, 'flor-blanca-24', w, h, fn, None)

    g = grupo('01', 9, 'sello-circular', 'Sello circular',
              'Sello con nombre, cargo y provincia alrededor de la flor. Para piezas de cierre, saludos institucionales o fechas especiales.', tags='sello circular')
    for v in ['claro', 'oscuro']:
        fn, w, h = sello(v)
        recurso(g, v, w, h, fn, REC_N if v == 'claro' else REC_B)
