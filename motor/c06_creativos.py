# 06 · Elementos creativos adicionales.
import json, math, os, re
import numpy as np
from nucleo import *
from base import grupo, recurso, REC_B, REC_N
import c05_etiquetas as ET


def _rec(t):
    return REC_N if t in ('claro', 'blanco', 'rosa') else REC_B


# ---------------- comillas ----------------
def _coma(x, y, R):
    """una comilla de apertura: bola abajo y cola que sube"""
    pts = poli_bezier([((x + R * 1.05, y - R * 2.7), (x + R * .1, y - R * 2.2), (x - R * .75, y - R * 1.3), (x - R * .55, y - R * .1))], 60)
    tail = trazo(pts, lambda t: R * (.22 + 1.2 * t ** 1.6), n=60)
    return f'<path d="{tail}"/><circle cx="{fm(x)}" cy="{fm(y)}" r="{fm(R)}"/>'


def comillas(tono, L=1024):
    def fn(modo):
        ids = Ids('q')
        R = L * .12
        shp = _coma(L * .36, L * .66, R) + _coma(L * .70, L * .66, R)
        if tono in ('claro', 'oscuro'):
            d, b = vidrio(f'<g>{shp}</g>', (L * .2, L * .3, L * .62, L * .5), tono, modo, ids, cuerpo=1.5 if tono == 'claro' else 1.2,
                          rim=L * .006, sombra_k=.5)
            return svg_doc(L, L, d, b)
        col = {'magenta': MAGENTA, 'naranja': NARANJA}[tono]
        d, b = vidrio(f'<g>{shp}</g>', (L * .2, L * .3, L * .62, L * .5), 'magenta' if tono == 'magenta' else 'rosa',
                      'recorte' if modo == 'recorte' else 'solido', ids, rim=L * .006, sombra_k=.5, reflejo=False)
        if tono == 'naranja':
            b = f'<g fill="{NARANJA}">{shp}</g>'
            fid = ids('s'); d = sombra_filtro(fid, 10, 6, NOCHE, .22 if modo == 'original' else 0)
            b = f'<g filter="url(#{fid})">{b}</g>'
        return svg_doc(L, L, d, b)
    return fn


# ---------------- globo de diálogo vacío ----------------
def globo(tono, W=1536, H=1280):
    def fn(modo):
        ids = Ids('g')
        m = W * .08
        bw, bh = W - 2 * m, H - 2 * m - 160
        x, y, r = m, m, bh * .2
        tx0 = x + bw * .18
        shp = (f'<path d="M{fm(x + r)} {fm(y)} H{fm(x + bw - r)} A{fm(r)} {fm(r)} 0 0 1 {fm(x + bw)} {fm(y + r)} '
               f'V{fm(y + bh - r)} A{fm(r)} {fm(r)} 0 0 1 {fm(x + bw - r)} {fm(y + bh)} H{fm(tx0 + 210)} '
               f'L{fm(tx0 - 20)} {fm(y + bh + 170)} L{fm(tx0 + 40)} {fm(y + bh)} H{fm(x + r)} '
               f'A{fm(r)} {fm(r)} 0 0 1 {fm(x)} {fm(y + bh - r)} V{fm(y + r)} A{fm(r)} {fm(r)} 0 0 1 {fm(x + r)} {fm(y)} Z"/>')
        d, b = vidrio(shp, (x, y, bw, bh + 170), tono, modo, ids, cuerpo=1.15)
        return svg_doc(W, H, d, b)
    return fn


# ---------------- zócalo para nombre y cargo ----------------
def zocalo(tono, W=2048, H=640):
    def fn(modo):
        ids = Ids('z')
        m = H * .13
        x, y, w, h = m + 40, m, W - 2 * m - 40, H - 2 * m
        d, b = vidrio(rrect(x, y, w, h, h * .16), (x, y, w, h), tono, modo, ids, cuerpo=1.25)
        # barra de acento vertical magenta
        bwid = h * .13
        d2, b2 = vidrio(rrect(x - bwid * .45, y + h * .12, bwid, h * .76, bwid / 2), (x - bwid * .45, y + h * .12, bwid, h * .76),
                        'magenta', 'recorte' if modo == 'recorte' else 'solido', ids, sombra_k=.4, reflejo=False)
        acc = MAGENTA if tono == 'claro' else ROSA
        b2 += (f'<line x1="{fm(x + h * .30)}" y1="{fm(y + h * .60)}" x2="{fm(x + w * .55)}" y2="{fm(y + h * .60)}" '
               f'stroke="{acc}" stroke-width="{fm(H * .012)}" stroke-linecap="round" opacity=".85"/>')
        return svg_doc(W, H, d + d2, b + b2)
    return fn


# ---------------- numeradores ----------------
def numero(n, L=1024):
    def fn(modo):
        ids = Ids('n')
        c, R = L / 2, L * .38
        d, b = vidrio(circle(c, c, R), (c - R, c - R, 2 * R, 2 * R), 'magenta', 'recorte' if modo == 'recorte' else 'solido', ids)
        size = R * 1.25
        b += texto(c, c + size * .706 / 2, str(n), size, BLANCO, 700, 'middle')
        return svg_doc(L, L, d, b, f'Paso {n}')
    return fn


# ---------------- separador floral ----------------
def separador(col_l, col_f, W=2048, H=384):
    def fn(modo):
        ids = Ids('s'); fid = ids('sh')
        fh = H * .68
        fr = (V['flor']['bbox'][2] - V['flor']['bbox'][0]) / (V['flor']['bbox'][3] - V['flor']['bbox'][1])
        fw = fh * fr
        cx, cy = W / 2, H / 2
        g = logo_g('isotipo', cx - fw / 2, cy - fh / 2, fh, flor=col_f)
        gap = fw * .62
        lw = H * .034
        for s in (-1, 1):
            x0, x1 = cx + s * gap, cx + s * (W / 2 - H * .3)
            g += (f'<line x1="{fm(x0)}" y1="{fm(cy)}" x2="{fm(x1)}" y2="{fm(cy)}" stroke="{col_l}" stroke-width="{fm(lw)}" '
                  f'stroke-linecap="round"/>')
            g += f'<circle cx="{fm(x1 + s * H * .09)}" cy="{fm(cy)}" r="{fm(lw * .9)}" fill="{col_l}"/>'
        defs = sombra_filtro(fid, 8, 4, NOCHE, .3 if col_l == BLANCO else .15) if modo == 'original' else ''
        return svg_doc(W, H, defs, f'<g filter="url(#{fid})">{g}</g>' if modo == 'original' else g)
    return fn


# ---------------- marco de vidrio para foto ----------------
def marco_foto(forma, W, H):
    def fn(modo):
        ids = Ids('f')
        m = min(W, H) * .07
        t = min(W, H) * .075
        if forma == 'circular':
            c, R = W / 2, W / 2 - m
            shp = (f'<path fill-rule="evenodd" clip-rule="evenodd" d="M{fm(c - R)} {fm(c)} a{fm(R)} {fm(R)} 0 1 0 {fm(2 * R)} 0 '
                   f'a{fm(R)} {fm(R)} 0 1 0 {fm(-2 * R)} 0 Z M{fm(c - R + t)} {fm(c)} a{fm(R - t)} {fm(R - t)} 0 1 1 {fm(2 * (R - t))} 0 '
                   f'a{fm(R - t)} {fm(R - t)} 0 1 1 {fm(-2 * (R - t))} 0 Z"/>')
            box = (c - R, c - R, 2 * R, 2 * R)
        else:
            w, h = W - 2 * m, H - 2 * m
            r = min(w, h) * .07
            ri = r * .55
            shp = (f'<path fill-rule="evenodd" clip-rule="evenodd" d="'
                   f'M{fm(m + r)} {fm(m)} H{fm(m + w - r)} A{fm(r)} {fm(r)} 0 0 1 {fm(m + w)} {fm(m + r)} V{fm(m + h - r)} '
                   f'A{fm(r)} {fm(r)} 0 0 1 {fm(m + w - r)} {fm(m + h)} H{fm(m + r)} A{fm(r)} {fm(r)} 0 0 1 {fm(m)} {fm(m + h - r)} '
                   f'V{fm(m + r)} A{fm(r)} {fm(r)} 0 0 1 {fm(m + r)} {fm(m)} Z '
                   f'M{fm(m + t + ri)} {fm(m + t)} A{fm(ri)} {fm(ri)} 0 0 0 {fm(m + t)} {fm(m + t + ri)} V{fm(m + h - t - ri)} '
                   f'A{fm(ri)} {fm(ri)} 0 0 0 {fm(m + t + ri)} {fm(m + h - t)} H{fm(m + w - t - ri)} A{fm(ri)} {fm(ri)} 0 0 0 {fm(m + w - t)} {fm(m + h - t - ri)} '
                   f'V{fm(m + t + ri)} A{fm(ri)} {fm(ri)} 0 0 0 {fm(m + w - t - ri)} {fm(m + t)} Z"/>')
            box = (m, m, w, h)
        d, b = vidrio(shp, box, 'claro', modo, ids, cuerpo=1.3, rim=min(W, H) * .006, sombra_k=.6)
        # detalle: punto magenta en una esquina
        if forma != 'circular':
            b += f'<circle cx="{fm(m + t / 2)}" cy="{fm(m + t / 2)}" r="{fm(t * .16)}" fill="{MAGENTA}"/>'
        return svg_doc(W, H, d, b)
    return fn


# ---------------- placa de fecha ----------------
def placa_fecha(tono, L=1024):
    def fn(modo):
        ids = Ids('pf')
        m = L * .12
        w, h = L - 2 * m, L - 2 * m
        r = w * .14
        d, b = vidrio(rrect(m, m, w, h, r), (m, m, w, h), tono, 'solido' if (tono == 'claro' and modo == 'original') else modo, ids,
                      cuerpo=1.3)
        # banda superior magenta (para el mes)
        bh = h * .30
        cid = ids('c')
        d += f'<clipPath id="{cid}">{rrect(m, m, w, h, r)}</clipPath>'
        gm = ids('gm')
        d += (f'<linearGradient id="{gm}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{MAGENTA}"/>'
              f'<stop offset="1" stop-color="{MAGENTA_MED}"/></linearGradient>')
        b += f'<g clip-path="url(#{cid})"><rect x="{fm(m)}" y="{fm(m)}" width="{fm(w)}" height="{fm(bh)}" fill="url(#{gm})"/></g>'
        # anillas
        for sx in (.30, .70):
            b += (f'<rect x="{fm(m + w * sx - w * .025)}" y="{fm(m - h * .05)}" width="{fm(w * .05)}" height="{fm(h * .13)}" '
                  f'rx="{fm(w * .025)}" fill="{NOCHE}"/>')
        return svg_doc(L, L, d, b)
    return fn


# ---------------- lupa ----------------
def lupa(mango, L=1024):
    def fn(modo):
        ids = Ids('l')
        c, R = L * .43, L * .30
        col = {'azul-noche': NOCHE, 'blanco': BLANCO}[mango]
        fid = ids('s')
        defs = sombra_filtro(fid, 12, 8, NOCHE, .3) if modo == 'original' else ''
        f = f' filter="url(#{fid})"' if modo == 'original' else ''
        # mango
        a = math.radians(45)
        p0 = (c + R * 1.02 * math.cos(a), c + R * 1.02 * math.sin(a))
        p1 = (c + R * 1.95 * math.cos(a), c + R * 1.95 * math.sin(a))
        body = (f'<g{f}><line x1="{fm(p0[0])}" y1="{fm(p0[1])}" x2="{fm(p1[0])}" y2="{fm(p1[1])}" stroke="{col}" '
                f'stroke-width="{fm(L * .085)}" stroke-linecap="round"/>')
        q0 = (c + R * 1.30 * math.cos(a), c + R * 1.30 * math.sin(a)); q1 = (c + R * 1.42 * math.cos(a), c + R * 1.42 * math.sin(a))
        body += (f'<line x1="{fm(q0[0])}" y1="{fm(q0[1])}" x2="{fm(q1[0])}" y2="{fm(q1[1])}" stroke="{MAGENTA}" '
                 f'stroke-width="{fm(L * .086)}"/></g>')
        d, b = vidrio(circle(c, c, R), (c - R, c - R, 2 * R, 2 * R), 'claro', modo, ids, cuerpo=.75, sombra=False)
        b += f'<circle cx="{fm(c)}" cy="{fm(c)}" r="{fm(R)}" fill="none" stroke="{col}" stroke-width="{fm(L * .045)}"/>'
        return svg_doc(L, L, defs + d, body + b)
    return fn


# ---------------- golondrinas en vuelo ----------------
def golondrinas(color, W=2048, H=1024):
    def fn(modo):
        ids = Ids('go'); fid = ids('s')
        r = icono_manual_ratio('ico_golondrina')
        g = ''
        for (x, y, h, rot) in ((300, 470, 420, -6), (1000, 300, 300, -14), (1520, 210, 210, -20)):
            g += (f'<g transform="rotate({rot} {x + h * r / 2} {y + h / 2})">{icono_manual("ico_golondrina", x, y, h, color)}</g>')
        defs = sombra_filtro(fid, 9, 6, NOCHE, .3 if color == BLANCO else .18) if modo == 'original' else ''
        return svg_doc(W, H, defs, f'<g filter="url(#{fid})">{g}</g>' if modo == 'original' else g)
    return fn


# ---------------- mapa de Corrientes con Goya ----------------
SIL = json.load(open(os.path.join(BASE, 'vectores', 'corrientes_silueta.json'), encoding='utf-8'))


def _bbox(d):
    nums = [float(v) for v in re.findall(r'-?\d+\.?\d*', d)]
    return min(nums[0::2]), min(nums[1::2]), max(nums[0::2]), max(nums[1::2])


def mapa(estilo, L=1536):
    def fn(modo):
        ids = Ids('mp')
        x0, y0, x1, y1 = _bbox(SIL['silueta'])
        m = L * .1
        s = (L - 2 * m) / max(x1 - x0, y1 - y0)
        ox = (L - (x1 - x0) * s) / 2 - x0 * s
        oy = (L - (y1 - y0) * s) / 2 - y0 * s + L * .03
        tr = f'transform="translate({fm(ox)} {fm(oy)}) scale({s:.5f})"'
        sil = f'<g {tr}><path d="{SIL["silueta"]}"/></g>'
        box = (ox + x0 * s, oy + y0 * s, (x1 - x0) * s, (y1 - y0) * s)
        if estilo == 'vidrio':
            d, b = vidrio(sil, box, 'claro', modo, ids, cuerpo=1.5, rim=L * .004, sombra_k=.5)
        else:
            fondo = BLANCO if estilo == 'claro' else NOCHE
            fid = ids('s')
            d = sombra_filtro(fid, 14, 9, NOCHE, .28) if modo == 'original' else ''
            f = f' filter="url(#{fid})"' if modo == 'original' else ''
            b = f'<g{f} fill="{fondo}">{sil}</g>'
        # Goya destacado
        gx0, gy0, gx1, gy1 = _bbox(SIL['goya'])
        b += f'<g {tr} fill="{MAGENTA}" stroke="{MAGENTA}" stroke-width="{fm(1.2)}" stroke-linejoin="round"><path d="{SIL["goya"]}"/></g>'
        # marcador sobre Goya
        px, py = ox + (gx0 + (gx1 - gx0) * .22) * s, oy + (gy0 + (gy1 - gy0) * .40) * s
        ps = L * .11
        col_pin = NOCHE if estilo != 'oscuro' else BLANCO
        pin = (f'<path d="M48 87 C40 77 19 58 19 38 C19 22 32 9.5 48 9.5 C64 9.5 77 22 77 38 C77 58 56 77 48 87 Z" fill="{col_pin}"/>'
               f'<circle cx="48" cy="38" r="12" fill="{MAGENTA}"/>')
        fp = ids('p')
        d += sombra_filtro(fp, 8, 5, NOCHE, .3) if modo == 'original' else ''
        fpa = f' filter="url(#{fp})"' if modo == 'original' else ''
        b += f'<g{fpa}><g transform="translate({fm(px - ps / 2)} {fm(py - ps * .9)}) scale({ps / 96:.5f})">{pin}</g></g>'
        return svg_doc(L, L, d, b, 'Corrientes con Goya destacado')
    return fn


# ---------------- tilde y cruz ----------------
def marca(tipo, L=1024):
    def fn(modo):
        ids = Ids('t')
        c, R = L / 2, L * .36
        tono = 'magenta' if tipo == 'tilde' else 'oscuro'
        d, b = vidrio(circle(c, c, R), (c - R, c - R, 2 * R, 2 * R), tono, 'recorte' if modo == 'recorte' else 'solido', ids)
        sw = L * .07
        if tipo == 'tilde':
            p = f'M{fm(c - R * .42)} {fm(c + R * .02)} L{fm(c - R * .1)} {fm(c + R * .34)} L{fm(c + R * .46)} {fm(c - R * .3)}'
        else:
            k = R * .34
            p = f'M{fm(c - k)} {fm(c - k)} L{fm(c + k)} {fm(c + k)} M{fm(c + k)} {fm(c - k)} L{fm(c - k)} {fm(c + k)}'
        b += f'<path d="{p}" fill="none" stroke="{BLANCO}" stroke-width="{fm(sw)}" stroke-linecap="round" stroke-linejoin="round"/>'
        return svg_doc(L, L, d, b)
    return fn


def registrar():
    g = grupo('06', 1, 'comillas', 'Comillas',
              'Para citar una frase de Cecilia o de un vecino. Escribí la cita al lado con el texto de Instagram.', tags='comillas cita frase')
    for t in ('magenta', 'claro', 'oscuro', 'naranja'):
        recurso(g, t if t in ('magenta', 'naranja') else f'vidrio-{t}', 1024, 1024, comillas(t), _rec(t))
    g = grupo('06', 2, 'globo-de-dialogo', 'Globo de diálogo (vacío)',
              'Globo translúcido para preguntas, opiniones o testimonios.', tags='globo dialogo pregunta')
    for t in ('claro', 'oscuro'):
        recurso(g, f'vidrio-{t}', 1536, 1280, globo(t), _rec(t))
    g = grupo('06', 3, 'zocalo-nombre-y-cargo', 'Zócalo para nombre y cargo',
              'Placa baja para presentar a quien habla: nombre arriba de la línea, cargo o institución debajo.', tags='zocalo nombre cargo')
    for t in ('claro', 'oscuro'):
        recurso(g, f'vidrio-{t}', 2048, 640, zocalo(t), _rec(t))
    g = grupo('06', 4, 'numerador', 'Numeradores 1 a 5',
              'Para listas, pasos o puntos de un proyecto.', tags='numero paso lista')
    for n in range(1, 6):
        recurso(g, f'{n}', 1024, 1024, numero(n), REC_B)
    g = grupo('06', 5, 'separador-floral', 'Separador con flor',
              'Línea con el isotipo al centro para dividir bloques de texto o cerrar una historia.', tags='separador divisor flor')
    for v, cl, cf in (('azul-noche', NOCHE, MAGENTA), ('blanco', BLANCO, BLANCO), ('magenta', MAGENTA, MAGENTA)):
        recurso(g, v, 2048, 384, separador(cl, cf), REC_N if v == 'blanco' else REC_B)
    g = grupo('06', 6, 'marco-de-vidrio-para-foto', 'Marco de vidrio para foto',
              'Marco translúcido para encuadrar una zona de la foto de fondo. Tiene el centro vacío: conviene pegarlo.',
              metodo='pegar', tags='marco foto vidrio')
    recurso(g, 'vertical-4x5', 1536, 1920, marco_foto('rect', 1536, 1920), None)
    recurso(g, 'circular', 1024, 1024, marco_foto('circular', 1024, 1024), None)
    g = grupo('06', 7, 'placa-de-fecha', 'Placa de fecha (calendario)',
              'Hoja de calendario vacía: el mes va en la banda magenta y el día, grande, abajo.', tags='fecha calendario dia')
    for t in ('claro', 'oscuro'):
        recurso(g, t, 1024, 1024, placa_fecha(t), _rec(t))
    g = grupo('06', 8, 'lupa', 'Lupa de vidrio',
              'Para hacer foco en un detalle de un documento o una foto (el vidrio deja ver lo que hay debajo).', metodo='pegar', tags='lupa detalle')
    for v in ('azul-noche', 'blanco'):
        recurso(g, v, 1024, 1024, lupa(v), REC_B if v == 'azul-noche' else REC_N)
    g = grupo('06', 9, 'golondrinas-en-vuelo', 'Golondrinas en vuelo',
              'Tres golondrinas del manual de marca en vuelo ascendente. Acento de identidad para saludos y fechas especiales.',
              tags='golondrina aves identidad')
    for v, c in (('azul-noche', NOCHE), ('blanco', BLANCO), ('magenta', MAGENTA)):
        recurso(g, v, 2048, 1024, golondrinas(c), dict(REC_N if v == 'blanco' else REC_B, grosor=30))
    g = grupo('06', 10, 'mapa-corrientes-goya', 'Mapa de Corrientes con Goya',
              'Silueta de la provincia (mapa de dominio público de la biblioteca) con el departamento Goya en magenta y un marcador.',
              tags='mapa corrientes goya provincia')
    for v in ('claro', 'oscuro', 'vidrio'):
        recurso(g, v, 1536, 1536, mapa(v), _rec(v if v != 'vidrio' else 'claro'))
    g = grupo('06', 11, 'tilde-y-cruz', 'Tilde y cruz',
              'Para comparar «sí / no», «mito / realidad» o tildar una lista. Usalos con datos verificables.', tags='tilde check cruz')
    for t in ('tilde', 'cruz'):
        recurso(g, t, 1024, 1024, marca(t), REC_B)
