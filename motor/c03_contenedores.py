# 03 · Cápsulas, etiquetas y contenedores (vacíos, con lugar para escribir desde Instagram).
from nucleo import *
from base import grupo, recurso, REC_B, REC_N


def _rec(tono):
    return REC_N if tono in ('claro', 'rosa') else REC_B


def capsula(tono, modo_base='original', W=2048, H=640):
    def fn(modo):
        ids = Ids('c')
        m = H * .13
        w, h = W - 2 * m, H - 2 * m
        sh = rrect(m, m, w, h, h / 2)
        mm = modo if modo == 'recorte' else modo_base
        d, b = vidrio(sh, (m, m, w, h), tono, mm, ids, cuerpo=1.1)
        return svg_doc(W, H, d, b)
    return fn


def capsula_contorno(color, W=2048, H=640):
    def fn(modo):
        ids = Ids('cc'); fid = ids('sh')
        m = H * .14; sw = H * .028
        defs = sombra_filtro(fid, 10, 6, NOCHE, .3 if color == BLANCO else .2)
        b = (f'<g filter="url(#{fid})"><rect x="{fm(m)}" y="{fm(m)}" width="{fm(W - 2 * m)}" height="{fm(H - 2 * m)}" '
             f'rx="{fm((H - 2 * m) / 2)}" fill="none" stroke="{color}" stroke-width="{fm(sw)}"/></g>')
        return svg_doc(W, H, defs, b)
    return fn


def placa(tono, W, H):
    def fn(modo):
        ids = Ids('p')
        m = min(W, H) * .10        # deja lugar a la sombra dentro del lienzo
        w, h = W - 2 * m, H - 2 * m
        sh = rrect(m, m, w, h, min(w, h) * .085)
        d, b = vidrio(sh, (m, m, w, h), tono, modo, ids, cuerpo=1.12)
        return svg_doc(W, H, d, b)
    return fn


def con_pestana(tono, W=2048, H=1408):
    def fn(modo):
        ids = Ids('t')
        m = W * .07
        top = m + 130
        w, h = W - 2 * m, H - top - m
        sh = rrect(m, top, w, h, w * .055)
        d, b = vidrio(sh, (m, top, w, h), tono, modo, ids, cuerpo=1.12)
        # pestaña magenta para el título
        tw, th = W * .36, 220
        tx, ty = m + w * .06, top - th / 2
        d2, b2 = vidrio(rrect(tx, ty, tw, th, th / 2), (tx, ty, tw, th), 'magenta', 'solido' if modo == 'original' else modo, ids,
                        sombra_k=.6)
        return svg_doc(W, H, d + d2, b + b2)
    return fn


def barra(tipo, W=2048, H=320):
    def fn(modo):
        ids = Ids('b')
        m = H * .3
        h = H - 2 * m
        sh = rrect(m, m, W - 2 * m, h, h / 2)
        if tipo == 'degrade':
            gid, fid = ids('g'), ids('s')
            d = (f'<linearGradient id="{gid}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="{MAGENTA}"/>'
                 f'<stop offset=".55" stop-color="{ROSA}"/><stop offset="1" stop-color="{NARANJA}"/></linearGradient>')
            d += sombra_filtro(fid, 9, 5, NOCHE, .22 if modo == 'original' else 0)
            gs = ids('sh')
            d += (f'<linearGradient id="{gs}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".45"/>'
                  f'<stop offset=".5" stop-color="#fff" stop-opacity="0"/></linearGradient>')
            b = f'<g filter="url(#{fid})" fill="url(#{gid})">{sh}</g><g fill="url(#{gs})">{sh}</g>'
            return svg_doc(W, H, d, b)
        tono = {'magenta': 'magenta', 'azul-noche': 'oscuro', 'turquesa': 'turquesa'}[tipo]
        if tono == 'turquesa':
            gid, fid, gs = ids('g'), ids('s'), ids('sh')
            d = (f'<linearGradient id="{gid}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="{TURQUESA}"/>'
                 f'<stop offset="1" stop-color="{TURQUESA_CL}"/></linearGradient>')
            d += sombra_filtro(fid, 9, 5, NOCHE, .22 if modo == 'original' else 0)
            d += (f'<linearGradient id="{gs}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".45"/>'
                  f'<stop offset=".5" stop-color="#fff" stop-opacity="0"/></linearGradient>')
            b = f'<g filter="url(#{fid})" fill="url(#{gid})">{sh}</g><g fill="url(#{gs})">{sh}</g>'
            return svg_doc(W, H, d, b)
        d, b = vidrio(sh, (m, m, W - 2 * m, h), tono, 'solido' if modo == 'original' else modo, ids, sombra_k=.5, reflejo=False)
        return svg_doc(W, H, d, b)
    return fn


def chip(color, W=1024, H=384):
    def fn(modo):
        ids = Ids('ch')
        m = H * .15
        w, h = W - 2 * m, H - 2 * m
        sh = rrect(m, m, w, h, h * .32)
        tono = {'magenta': 'magenta', 'azul-noche': 'oscuro', 'blanco': 'claro', 'rosa': 'rosa'}.get(color)
        if tono:
            d, b = vidrio(sh, (m, m, w, h), tono, 'solido' if modo == 'original' else modo, ids, sombra_k=.6, reflejo=False)
        else:
            col = {'naranja': (NARANJA, NARANJA_CL), 'turquesa': (TURQUESA, TURQUESA_CL)}[color]
            gid, fid, gs = ids('g'), ids('s'), ids('sh')
            d = (f'<linearGradient id="{gid}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{col[1]}"/>'
                 f'<stop offset="1" stop-color="{col[0]}"/></linearGradient>')
            d += sombra_filtro(fid, 10, 6, NOCHE, .22 if modo == 'original' else 0)
            d += (f'<linearGradient id="{gs}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".4"/>'
                  f'<stop offset=".5" stop-color="#fff" stop-opacity="0"/></linearGradient>')
            b = f'<g filter="url(#{fid})" fill="url(#{gid})">{sh}</g><g fill="url(#{gs})">{sh}</g>'
        punto = {'blanco': MAGENTA, 'rosa': MAGENTA}.get(color, BLANCO)
        b += f'<circle cx="{fm(m + h * .55)}" cy="{fm(H / 2)}" r="{fm(h * .13)}" fill="{punto}"/>'
        return svg_doc(W, H, d, b)
    return fn


def marco_cifra(tono, L=1024):
    def fn(modo):
        ids = Ids('mc')
        m = L * .10
        s = L - 2 * m
        sh = rrect(m, m, s, s, s * .14)
        d, b = vidrio(sh, (m, m, s, s), tono, modo, ids, cuerpo=1.12)
        acc = MAGENTA if tono == 'claro' else ROSA
        k, q, sw = s * .17, s * .085, L * .022
        x0, y0, x1, y1 = m + q, m + q, L - m - q, L - m - q
        st = f'fill="none" stroke="{acc}" stroke-width="{fm(sw)}" stroke-linecap="round" stroke-linejoin="round"'
        for (x, y, dx, dy) in ((x0, y0, 1, 1), (x1, y0, -1, 1), (x0, y1, 1, -1), (x1, y1, -1, -1)):
            b += f'<path {st} d="M{fm(x)} {fm(y + dy * k)} V{fm(y + dy * sw)} Q{fm(x)} {fm(y)} {fm(x + dx * sw)} {fm(y)} H{fm(x + dx * k)}"/>'
        # línea fina para la leyenda (la cifra va arriba, la leyenda abajo)
        b += (f'<line x1="{fm(L / 2 - s * .16)}" y1="{fm(m + s * .70)}" x2="{fm(L / 2 + s * .16)}" y2="{fm(m + s * .70)}" '
              f'stroke="{acc}" stroke-width="{fm(L * .012)}" stroke-linecap="round" opacity=".9"/>')
        return svg_doc(L, L, d, b)
    return fn


def circulo_cifra(tono, L=1024):
    import math
    def fn(modo):
        ids = Ids('cf')
        c, R = L / 2, L * .40
        d, b = vidrio(circle(c, c, R), (c - R, c - R, 2 * R, 2 * R), tono, modo, ids, cuerpo=1.12)
        acc = MAGENTA if tono == 'claro' else ROSA
        r = R * .86
        a0, a1 = math.radians(130), math.radians(130 + 300)
        p0 = (c + r * math.cos(a0), c + r * math.sin(a0)); p1 = (c + r * math.cos(a1), c + r * math.sin(a1))
        b += (f'<path d="M{fm(p0[0])} {fm(p0[1])} A{fm(r)} {fm(r)} 0 1 1 {fm(p1[0])} {fm(p1[1])}" fill="none" stroke="{acc}" '
              f'stroke-width="{fm(L * .022)}" stroke-linecap="round"/>')
        b += f'<circle cx="{fm(p0[0])}" cy="{fm(p0[1])}" r="{fm(L * .026)}" fill="{NARANJA}"/>'
        return svg_doc(L, L, d, b)
    return fn


def registrar():
    g = grupo('03', 1, 'capsula-vidrio', 'Cápsula de vidrio (vacía)',
              'Cápsula translúcida para escribir encima con el texto de Instagram. Clara sobre fotos medias u oscuras; oscura sobre fotos claras.',
              tags='capsula pildora vidrio texto')
    for t in ('claro', 'oscuro', 'rosa'):
        recurso(g, f'vidrio-{t}', 2048, 640, capsula(t), _rec(t))
    g = grupo('03', 2, 'capsula-solida', 'Cápsula sólida (vacía)',
              'Cápsula opaca con brillo suave. Máxima legibilidad para títulos cortos. Al ser opaca, Recortes la detecta bien con el PNG original; '
              'la versión troquelada de la blanca y de la azul noche es la misma que la de la cápsula de vidrio (03-01 _RECORTE).', tags='capsula solida texto')
    # la blanca y la azul noche troqueladas serían idénticas a 03-01 _RECORTE: no se duplican
    for v, t in (('magenta', 'magenta'), ('azul-noche', 'oscuro'), ('blanca', 'claro')):
        recurso(g, v, 2048, 640, capsula(t, 'solido'), _rec(t) if v == 'magenta' else None)
    g = grupo('03', 3, 'capsula-contorno', 'Cápsula de contorno',
              'Solo el borde, para enmarcar un texto sin tapar la foto. Es un anillo: conviene pegarlo en lugar de usar Recortes.',
              metodo='pegar', tags='capsula contorno borde')
    for v, c in (('blanca', BLANCO), ('magenta', MAGENTA), ('azul-noche', NOCHE)):
        recurso(g, v, 2048, 640, capsula_contorno(c), None)
    g = grupo('03', 4, 'placa-vidrio', 'Placa de vidrio (vacía)',
              'Placa translúcida con esquinas redondeadas para párrafos, listas o citas. Tres proporciones: horizontal, cuadrada y vertical 4:5.',
              tags='placa vidrio texto contenedor')
    for prop, (W, H) in (('horizontal', (2048, 1280)), ('cuadrada', (1536, 1536)), ('vertical', (1536, 1920))):
        for t in ('claro', 'oscuro'):
            recurso(g, f'{prop}_vidrio-{t}', W, H, placa(t, W, H), _rec(t))
    g = grupo('03', 5, 'contenedor-con-pestana', 'Contenedor con pestaña',
              'Placa de vidrio con una pestaña magenta arriba: el título va en la pestaña y el desarrollo en la placa.',
              tags='contenedor pestaña titulo')
    for t in ('claro', 'oscuro'):
        recurso(g, f'vidrio-{t}', 2048, 1408, con_pestana(t), _rec(t))
    g = grupo('03', 6, 'barra-de-color', 'Barra de color',
              'Barra fina para separar bloques, subrayar un título o apoyar un zócalo.', tags='barra linea separador')
    for v in ('magenta', 'degrade-magenta-naranja', 'azul-noche', 'turquesa'):
        recurso(g, v, 2048, 320, barra('degrade' if v.startswith('degrade') else v), REC_B)
    g = grupo('03', 7, 'etiqueta-chip', 'Etiqueta chica (chip)',
              'Etiqueta compacta con un punto, para categorías o fechas cortas («HOY», «SALUD», «GOYA»…).', tags='etiqueta chip tag')
    for v in ('magenta', 'naranja', 'turquesa', 'azul-noche', 'blanco'):
        recurso(g, v, 1024, 384, chip(v), REC_N if v == 'blanco' else REC_B)
    g = grupo('03', 8, 'marco-para-cifra', 'Marco para cifra',
              'Placa cuadrada con esquinas de foco: la cifra va grande arriba y la leyenda abajo de la línea.', tags='cifra numero dato marco')
    for t in ('claro', 'oscuro'):
        recurso(g, f'vidrio-{t}', 1024, 1024, marco_cifra(t), _rec(t))
    g = grupo('03', 9, 'circulo-para-cifra', 'Círculo para cifra',
              'Círculo de vidrio con un arco de acento, para porcentajes, fechas o números destacados. El arco es decorativo: no representa un valor.',
              tags='cifra numero circulo')
    for t in ('claro', 'oscuro'):
        recurso(g, f'vidrio-{t}', 1024, 1024, circulo_cifra(t), _rec(t))
