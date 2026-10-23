# Ampliación de la biblioteca (oct-2026): títulos de sesión, etiquetas de medios, íconos de medios,
# pin de ubicación, tilde y cruz de color, separador institucional, subrayado formal y emojis.
# Mismo sistema: paleta y Outfit del manual (Regular, Medium y Bold), vidrio y sombras de nucleo.
import math, re
import numpy as np
from nucleo import *
from base import grupo, recurso, REC_B, REC_N
import c04_iconos as IC
import c05_etiquetas as ET

# Colores de convención (no son de la paleta: se usan porque así se reconocen al instante)
ROJO, ROJO_OSC = '#FF4D5E', '#D91E36'
VERDE, VERDE_OSC = '#3DD68C', '#14A35B'
AMARILLO, AMARILLO_CL = '#FFC64F', '#FFE08A'


# ---------------- utilidades de forma sólida con brillo ----------------
def solido(shape, box, c_top, c_bot, modo, ids, sombra=True, sombra_k=1.0, brillo=True, rim=True):
    """forma rellena con degradé, brillo superior y canto claro (la estética de los vidrios sólidos)."""
    x, y, w, h = box
    m = min(w, h)
    gid, cid, sid, bid = ids('g'), ids('c'), ids('s'), ids('b')
    defs = (f'<linearGradient id="{gid}" x1="0" y1="0" x2=".25" y2="1"><stop offset="0" stop-color="{c_top}"/>'
            f'<stop offset="1" stop-color="{c_bot}"/></linearGradient><clipPath id="{cid}">{shape}</clipPath>'
            f'<linearGradient id="{sid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".42"/>'
            f'<stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>'
            f'<filter id="{bid}" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="{fm(m * .012)}"/></filter>')
    body = ''
    if sombra and modo == 'original':
        fso = ids('so')
        defs += (f'<filter id="{fso}" x="-40%" y="-40%" width="180%" height="180%" color-interpolation-filters="sRGB">'
                 f'<feGaussianBlur in="SourceAlpha" stdDeviation="{fm(m * .045 * sombra_k)}"/><feOffset dy="{fm(m * .035 * sombra_k)}" result="b"/>'
                 f'<feFlood flood-color="{NOCHE}" flood-opacity=".32"/><feComposite in2="b" operator="in" result="s"/>'
                 f'<feComposite in="s" in2="SourceAlpha" operator="out"/></filter>')
        body += f'<g filter="url(#{fso})" fill="#000">{shape}</g>'
    body += f'<g fill="url(#{gid})">{shape}</g><g clip-path="url(#{cid})">'
    if brillo:
        body += f'<rect x="{fm(x)}" y="{fm(y)}" width="{fm(w)}" height="{fm(h * .5)}" fill="url(#{sid})"/>'
    if rim:
        body += (f'<g fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="{fm(m * .05)}" filter="url(#{bid})">{shape}</g>')
    body += '</g>'
    return defs, body


def con_sombra(defs, body, modo, ids, blur=10, dy=7, op=.30):
    if modo != 'original':
        return defs, body
    fid = ids('sh')
    return defs + sombra_filtro(fid, blur, dy, NOCHE, op), f'<g filter="url(#{fid})">{body}</g>'


# ---------------- 04 · íconos de medios (misma grilla de 96 y mismo trazo) ----------------
NUEVOS_ICONOS = {
    'radio': dict(
        t='Radio',
        l=['<rect x="10" y="36" width="76" height="47" rx="10"/>', '<path d="M24 36 L64 13"/>',
           '<path d="M60 52 H74"/>', '<path d="M60 62 H74"/>', '<path d="M60 72 H69"/>'],
        f=['<circle cx="34" cy="60" r="11.5"/>']),
    'television': dict(
        t='Televisión',
        l=['<rect x="9" y="26" width="78" height="52" rx="10"/>', '<path d="M35 10 L48 24 L61 10"/>',
           '<path d="M48 78 V86"/>', '<path d="M33 86 H63"/>'],
        f=['<path d="M42 40 L60 52 L42 64 Z"/>']),
    'camara-de-video': dict(
        t='Cámara de video',
        l=['<rect x="8" y="28" width="56" height="42" rx="9"/>', '<path d="M64 43 L86 30 V68 L64 55"/>'],
        f=['<circle cx="22" cy="41" r="5.5"/>']),
    'voz-y-audio': dict(
        t='Voz y audio',
        l=['<path d="M14 40 V56"/>', '<path d="M31 28 V68"/>', '<path d="M65 28 V68"/>', '<path d="M82 40 V56"/>'],
        a=['<path d="M48 14 V82"/>']),
    'auriculares': dict(
        t='Auriculares y podcast',
        l=['<path d="M16 62 V48 C16 28 30 14 48 14 C66 14 80 28 80 48 V62"/>'],
        f=['<rect x="9" y="54" width="21" height="31" rx="8"/>', '<rect x="66" y="54" width="21" height="31" rx="8"/>']),
    'transmision-en-vivo': dict(
        t='Transmisión en vivo',
        l=['<path d="M35.3 35.3 A18 18 0 0 0 35.3 60.7"/>', '<path d="M60.7 35.3 A18 18 0 0 1 60.7 60.7"/>'],
        a=['<path d="M25.4 25.4 A32 32 0 0 0 25.4 70.6"/>', '<path d="M70.6 25.4 A32 32 0 0 1 70.6 70.6"/>'],
        f=['<circle cx="48" cy="48" r="8"/>']),
}
IC.I.update(NUEVOS_ICONOS)


# ---------------- 05 · títulos de sesión con lugar para el número ----------------
def titulo_sesion(tipo, color, centrado, MARG=96):
    l1 = f'SESIÓN {tipo.upper()}'
    l2 = 'CÁMARA DE DIPUTADOS · CORRIENTES'
    S1, S2 = 150, 60
    T1, T2 = .03, .26
    cap1, cap2 = S1 * .706, S2 * .706
    ch, cw = 186, 250               # lugar para el número (dos o tres cifras)
    w_deg = ancho_texto('°', S1, 700)
    gap_deg, gap_txt = 10, S1 * .30
    w_l1 = ancho_texto(l1, S1, 700, T1)
    w1 = cw + gap_deg + w_deg + gap_txt + w_l1
    bar, gap_bar = 78, 26
    w_l2 = ancho_texto(l2, S2, 500, T2)
    w2 = (bar + gap_bar) * (2 if centrado else 1) + w_l2
    cont_w = max(w1, w2)
    sep = 54
    W = math.ceil(cont_w + 2 * MARG)
    H = math.ceil(MARG + ch + sep + cap2 + MARG)
    c_txt = BLANCO if color == 'blanco' else NOCHE
    c_l2 = ROSA_PALIDO if color == 'blanco' else MAGENTA_OSC
    tono_chip = 'oscuro' if color == 'blanco' else 'claro'

    def fn(modo):
        ids = Ids('ts')
        x1 = MARG + (cont_w - w1) / 2 if centrado else MARG
        y0 = MARG
        base1 = y0 + ch / 2 + cap1 / 2
        mm = 'recorte' if modo == 'recorte' else 'original'
        d, chip = vidrio(rrect(x1, y0, cw, ch, 46), (x1, y0, cw, ch), tono_chip, mm, ids,
                         cuerpo=1.6 if tono_chip == 'claro' else 1.25, sombra_k=.6)
        txt = texto(x1 + cw + gap_deg, base1, '°', S1, c_txt, 700, 'start')
        txt += texto(x1 + cw + gap_deg + w_deg + gap_txt, base1, l1, S1, c_txt, 700, 'start', T1)
        base2 = y0 + ch + sep + cap2
        ym = base2 - cap2 / 2
        x2 = MARG + (cont_w - w2) / 2 if centrado else MARG
        barra = lambda bx: f'<rect x="{fm(bx)}" y="{fm(ym - 5)}" width="{bar}" height="10" rx="5" fill="{MAGENTA}"/>'
        txt += barra(x2)
        txt += texto(x2 + bar + gap_bar, base2, l2, S2, c_l2, 500, 'start', T2)
        if centrado:
            txt += barra(x2 + bar + gap_bar + w_l2 + gap_bar)
        if modo == 'original':
            fid = ids('sh')
            d += sombra_filtro(fid, 12 if color == 'blanco' else 9, 7, NOCHE, .55 if color == 'blanco' else .16)
            txt = f'<g filter="url(#{fid})">{txt}</g>'
        return svg_doc(W, H, d, chip + txt, f'{l1} · {l2}')
    return fn, W, H


# ---------------- 05 · EN VIVO y AL AIRE (rojo de transmisión) ----------------
def en_vivo(fondo):
    txt, S, PH, M = 'EN VIVO', 168, 300, 84
    tw = ancho_texto(txt, S, 700, .05)
    ico = PH * .58
    padx = PH * .44
    pw = padx * 2 + ico + S * .34 + tw
    W, H = math.ceil(pw + 2 * M), math.ceil(PH + 2 * M)

    def fn(modo):
        ids = Ids('ev')
        x, y = M, M
        shp = rrect(x, y, pw, PH, PH / 2)
        if fondo == 'rojo':
            d, b = solido(shp, (x, y, pw, PH), ROJO, ROJO_OSC, modo, ids, sombra_k=.7)
            c_dot, c_halo, c_txt = BLANCO, '#FFFFFF', BLANCO
        else:
            d, b = ET._caja('oscuro', modo, 'original', x, y, pw, PH, PH / 2, ids)
            c_dot, c_halo, c_txt = ROJO, ROJO, BLANCO
        cx, cy = x + padx + ico / 2, y + PH / 2
        r = ico * .26
        b += f'<circle cx="{fm(cx)}" cy="{fm(cy)}" r="{fm(r * 1.8)}" fill="{c_halo}" opacity="{.32 if modo != "recorte" else .5}"/>'
        b += f'<circle cx="{fm(cx)}" cy="{fm(cy)}" r="{fm(r)}" fill="{c_dot}"/>'
        b += texto(x + padx + ico + S * .34, cy + S * .706 / 2, txt, S, c_txt, 700, 'start', .05)
        return svg_doc(W, H, d, b, txt)
    return fn, W, H


def al_aire():
    txt, S, M = 'AL AIRE', 176, 110
    tw = ancho_texto(txt, S, 700, .14)
    bw, bh = tw + 2 * 120, 330
    W, H = math.ceil(bw + 2 * M), math.ceil(bh + 2 * M)

    def fn(modo):
        ids = Ids('aa')
        x, y = M, M
        shp = rrect(x, y, bw, bh, 54)
        d, b = solido(shp, (x, y, bw, bh), '#FF5A68', '#C8102E', modo, ids, sombra_k=.6)
        if modo == 'original':
            gid = ids('glow')
            d += (f'<filter id="{gid}" x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur stdDeviation="38"/></filter>')
            b = f'<g filter="url(#{gid})" opacity=".55"><rect x="{fm(x)}" y="{fm(y)}" width="{fm(bw)}" height="{fm(bh)}" rx="54" fill="{ROJO}"/></g>' + b
        b += (f'<rect x="{fm(x + 24)}" y="{fm(y + 24)}" width="{fm(bw - 48)}" height="{fm(bh - 48)}" rx="34" fill="none" '
              f'stroke="#FFFFFF" stroke-opacity=".7" stroke-width="7"/>')
        b += texto(x + bw / 2, y + bh / 2 + S * .706 / 2, txt, S, BLANCO, 700, 'middle', .14)
        return svg_doc(W, H, d, b, txt)
    return fn, W, H


# ---------------- 06 · pin de ubicación ----------------
def pin(color, L=1024):
    def fn(modo):
        ids = Ids('pn')
        cx, cy, R = L / 2, L * .40, L * .25
        tip = L * .90
        shp = (f'<path d="M{fm(cx)} {fm(tip)} C{fm(cx - R * .32)} {fm(tip - R * .45)} {fm(cx - R)} {fm(cy + R * .95)} {fm(cx - R)} {fm(cy)} '
               f'A{fm(R)} {fm(R)} 0 1 1 {fm(cx + R)} {fm(cy)} C{fm(cx + R)} {fm(cy + R * .95)} {fm(cx + R * .32)} {fm(tip - R * .45)} {fm(cx)} {fm(tip)} Z"/>')
        defs, body = '', ''
        if modo == 'original':
            fb = ids('pb')
            defs += f'<filter id="{fb}" x="-50%" y="-200%" width="200%" height="500%"><feGaussianBlur stdDeviation="16"/></filter>'
            body += f'<ellipse cx="{fm(cx)}" cy="{fm(tip + 6)}" rx="{fm(R * .62)}" ry="{fm(R * .16)}" fill="{NOCHE}" opacity=".30" filter="url(#{fb})"/>'
        if color == 'rojo':
            d, b = solido(shp, (cx - R, cy - R, 2 * R, tip - cy + R), ROJO, ROJO_OSC, modo, ids, sombra_k=.8)
            c_in = BLANCO
        else:
            d, b = solido(shp, (cx - R, cy - R, 2 * R, tip - cy + R), '#FFFFFF', '#E6E3EE', modo, ids, sombra_k=.8)
            c_in = ROJO
        defs += d
        body += b
        ri = R * .40
        if color == 'rojo':
            body += f'<circle cx="{fm(cx)}" cy="{fm(cy)}" r="{fm(ri)}" fill="{c_in}"/>'
        else:
            d2, b2 = solido(circle(cx, cy, ri), (cx - ri, cy - ri, 2 * ri, 2 * ri), ROJO, ROJO_OSC, modo, ids, sombra=False, rim=False)
            defs += d2
            body += b2
        return svg_doc(L, L, defs, body, 'Pin de ubicación')
    return fn


# ---------------- 06 · tilde verde y cruz roja ----------------
def marca_color(tipo, suelta, L=1024):
    def fn(modo):
        ids = Ids('mc')
        c = L / 2
        verde = tipo == 'tilde'
        if verde:
            p = f'M{fm(c - L * .17)} {fm(c + L * .01)} L{fm(c - L * .04)} {fm(c + L * .14)} L{fm(c + L * .19)} {fm(c - L * .13)}'
        else:
            k = L * .135
            p = f'M{fm(c - k)} {fm(c - k)} L{fm(c + k)} {fm(c + k)} M{fm(c + k)} {fm(c - k)} L{fm(c - k)} {fm(c + k)}'
        if not suelta:
            R = L * .36
            d, b = solido(circle(c, c, R), (c - R, c - R, 2 * R, 2 * R), VERDE if verde else ROJO,
                          VERDE_OSC if verde else ROJO_OSC, modo, ids)
            b += f'<path d="{p}" fill="none" stroke="{BLANCO}" stroke-width="{fm(L * .075)}" stroke-linecap="round" stroke-linejoin="round"/>'
            return svg_doc(L, L, d, b, 'Tilde' if verde else 'Cruz')
        # suelta: trazo de color con contorno blanco, para apoyarla directo sobre una foto
        if verde:
            p = f'M{fm(c - L * .30)} {fm(c + L * .02)} L{fm(c - L * .08)} {fm(c + L * .24)} L{fm(c + L * .32)} {fm(c - L * .22)}'
        else:
            k = L * .24
            p = f'M{fm(c - k)} {fm(c - k)} L{fm(c + k)} {fm(c + k)} M{fm(c + k)} {fm(c - k)} L{fm(c - k)} {fm(c + k)}'
        gid = ids('g')
        d = (f'<linearGradient id="{gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{VERDE if verde else ROJO}"/>'
             f'<stop offset="1" stop-color="{VERDE_OSC if verde else ROJO_OSC}"/></linearGradient>')
        b = (f'<path d="{p}" fill="none" stroke="{BLANCO}" stroke-width="{fm(L * .19)}" stroke-linecap="round" stroke-linejoin="round"/>'
             f'<path d="{p}" fill="none" stroke="url(#{gid})" stroke-width="{fm(L * .12)}" stroke-linecap="round" stroke-linejoin="round"/>')
        d, b = con_sombra(d, b, modo, ids, 14, 9, .30)
        return svg_doc(L, L, d, b, 'Tilde' if verde else 'Cruz')
    return fn


# ---------------- 06 · separador institucional ----------------
def separador_inst(estilo, color, W=2048, H=320):
    def fn(modo):
        ids = Ids('si')
        cx, cy = W / 2, H / 2
        col = NOCHE if color == 'azul-noche' else BLANCO
        acc = MAGENTA if color == 'azul-noche' else BLANCO
        lw = 8
        b = ''
        if estilo == 'flor':
            R = H * .30
            b += f'<circle cx="{fm(cx)}" cy="{fm(cy)}" r="{fm(R)}" fill="none" stroke="{col}" stroke-width="{lw}"/>'
            fh = R * 1.16
            fr = (V['flor']['bbox'][2] - V['flor']['bbox'][0]) / (V['flor']['bbox'][3] - V['flor']['bbox'][1])
            fw = fh * fr
            b += logo_g('isotipo', cx - fw / 2, cy - fh / 2, fh, flor=acc)
            ini = R + 34
        else:
            R = H * .17
            dia = lambda r, extra: (f'<path d="M{fm(cx)} {fm(cy - r)} L{fm(cx + r)} {fm(cy)} L{fm(cx)} {fm(cy + r)} '
                                   f'L{fm(cx - r)} {fm(cy)} Z" {extra}/>')
            b += dia(R, f'fill="none" stroke="{col}" stroke-width="{lw}" stroke-linejoin="round"')
            b += dia(R * .42, f'fill="{acc}"')
            ini = R + 34
        fin = W / 2 - 110
        for s in (-1, 1):
            gid = ids('lg')
            x0, x1 = cx + s * ini, cx + s * fin
            b = (f'<linearGradient id="{gid}" gradientUnits="userSpaceOnUse" x1="{fm(x0)}" y1="0" x2="{fm(x1)}" y2="0">'
                 f'<stop offset="0" stop-color="{col}"/><stop offset=".75" stop-color="{col}"/>'
                 f'<stop offset="1" stop-color="{col}" stop-opacity="0"/></linearGradient>') + b
            if estilo == 'flor':
                b += f'<line x1="{fm(x0)}" y1="{fm(cy)}" x2="{fm(x1)}" y2="{fm(cy)}" stroke="url(#{gid})" stroke-width="{lw}"/>'
                r = 14
                dx = x0 + s * 6
                b += (f'<path d="M{fm(dx)} {fm(cy - r)} L{fm(dx + s * r)} {fm(cy)} L{fm(dx)} {fm(cy + r)} L{fm(dx - s * r)} {fm(cy)} Z" fill="{acc}"/>')
            else:
                for dy in (-11, 11):
                    b += f'<line x1="{fm(x0)}" y1="{fm(cy + dy)}" x2="{fm(x1)}" y2="{fm(cy + dy)}" stroke="url(#{gid})" stroke-width="{lw - 1}"/>'
        # los degradados quedan dentro del cuerpo: se pasan a defs
        defs = ''.join(re.findall(r'<linearGradient.*?</linearGradient>', b))
        b = re.sub(r'<linearGradient.*?</linearGradient>', '', b)
        defs, b = con_sombra(defs, b, modo, ids, 7, 4, .32 if color == 'blanco' else .14)
        return svg_doc(W, H, defs, b, 'Separador institucional')
    return fn



# ---------------- 02 · subrayado formal para títulos ----------------
def subrayado_formal(layout, color, W=2048, H=256):
    def fn(modo):
        ids = Ids('sf')
        acc = {'azul-noche': MAGENTA, 'blanco': BLANCO, 'magenta': MAGENTA}[color]
        lin = {'azul-noche': NOCHE, 'blanco': BLANCO, 'magenta': MAGENTA}[color]
        cy = H / 2
        m = 100
        barra = lambda x0, x1, g, c: (f'<rect x="{fm(x0)}" y="{fm(cy - g / 2)}" width="{fm(x1 - x0)}" height="{fm(g)}" '
                                      f'rx="{fm(g / 2)}" fill="{c}"/>')
        if layout == 'izquierda':
            b = barra(m, m + 520, 28, acc) + barra(m + 560, W - m, 8, lin)
        else:
            a0, a1 = W / 2 - 230, W / 2 + 230
            b = barra(a0, a1, 28, acc) + barra(m, a0 - 40, 8, lin) + barra(a1 + 40, W - m, 8, lin)
        d, b = con_sombra('', b, modo, ids, 6, 4, .34 if color == 'blanco' else .18)
        return svg_doc(W, H, d, b, 'Subrayado formal')
    return fn


# ---------------- 09 · emojis ----------------
L_E = 1024


def _cara(ids, modo, rasgos, tono=(AMARILLO_CL, AMARILLO, NARANJA)):
    c, cy, R = L_E / 2, L_E * .5, L_E * .40
    g, gl, fb = ids('cara'), ids('glo'), ids('fb')
    defs = (f'<radialGradient id="{g}" cx=".36" cy=".30" r=".85"><stop offset="0" stop-color="{tono[0]}"/>'
            f'<stop offset=".55" stop-color="{tono[1]}"/><stop offset="1" stop-color="{tono[2]}"/></radialGradient>'
            f'<radialGradient id="{gl}" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff" stop-opacity=".75"/>'
            f'<stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>'
            f'<filter id="{fb}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="6"/></filter>')
    body = f'<circle cx="{fm(c)}" cy="{fm(cy)}" r="{fm(R)}" fill="url(#{g})"/>'
    body += (f'<circle cx="{fm(c)}" cy="{fm(cy)}" r="{fm(R - 6)}" fill="none" stroke="#FFFFFF" stroke-opacity=".35" '
             f'stroke-width="10" filter="url(#{fb})"/>')
    body += f'<ellipse cx="{fm(c - R * .38)}" cy="{fm(cy - R * .52)}" rx="{fm(R * .36)}" ry="{fm(R * .20)}" fill="url(#{gl})" transform="rotate(-28 {fm(c - R * .38)} {fm(cy - R * .52)})"/>'
    body += rasgos
    return con_sombra(defs, body, modo, ids, 16, 12, .26)


def _cachetes(op=.55):
    return (f'<ellipse cx="300" cy="600" rx="62" ry="36" fill="{MAGENTA}" opacity="{op * .6}"/>'
            f'<ellipse cx="724" cy="600" rx="62" ry="36" fill="{MAGENTA}" opacity="{op * .6}"/>')


def _corazon(cx, cy, s, fill=None):
    # el corazón de la grilla 96 del ícono «Salud», centrado en (cx, cy) con ancho ~ s
    # se escalan las coordenadas (y no con transform) para que el canto y la sombra mantengan su grosor
    k = s / 72
    color = f' fill="{fill}"' if fill else ''
    d = ('M48 82 C22 64 11 51 12.5 35.5 C14 23.5 23.5 15.5 33.5 15.5 C40.5 15.5 45.5 19.5 48 24.5 '
         'C50.5 19.5 55.5 15.5 62.5 15.5 C72.5 15.5 82 23.5 83.5 35.5 C85 51 74 64 48 82 Z')
    num = iter(float(v) for v in re.findall(r'-?\d+\.?\d*', d))
    pares = []
    for v in num:
        pares.append((cx + (v - 48) * k, cy + (next(num) - 49) * k))
    it = iter(pares)
    out = re.sub(r'-?\d+\.?\d* -?\d+\.?\d*', lambda m: (lambda p: f'{fm(p[0])} {fm(p[1])}')(next(it)), d)
    return f'<path{color} d="{out}"/>'
    return (f'<path transform="translate({fm(cx - 48 * k)} {fm(cy - 49 * k)}) scale({k:.4f})"{color} '
            'd="M48 82 C22 64 11 51 12.5 35.5 C14 23.5 23.5 15.5 33.5 15.5 C40.5 15.5 45.5 19.5 48 24.5 '
            'C50.5 19.5 55.5 15.5 62.5 15.5 C72.5 15.5 82 23.5 83.5 35.5 C85 51 74 64 48 82 Z"/>')


def _estrella(cx, cy, R, r, fill, rot=-90):
    pts = []
    for i in range(10):
        a = math.radians(rot + i * 36)
        rr = R if i % 2 == 0 else r
        pts.append(f'{fm(cx + rr * math.cos(a))} {fm(cy + rr * math.sin(a))}')
    return f'<path d="M{" L".join(pts)} Z" fill="{fill}" stroke="{fill}" stroke-width="{fm(R * .18)}" stroke-linejoin="round"/>'


def _estrella4(cx, cy, R, fill):
    k = R * .16
    return (f'<path d="M{fm(cx)} {fm(cy - R)} Q{fm(cx + k)} {fm(cy - k)} {fm(cx + R)} {fm(cy)} Q{fm(cx + k)} {fm(cy + k)} '
            f'{fm(cx)} {fm(cy + R)} Q{fm(cx - k)} {fm(cy + k)} {fm(cx - R)} {fm(cy)} Q{fm(cx - k)} {fm(cy - k)} {fm(cx)} {fm(cy - R)} Z" fill="{fill}"/>')


N = NOCHE
ST = f'fill="none" stroke="{N}" stroke-linecap="round" stroke-linejoin="round"'


def emoji(nombre):
    def fn(modo):
        ids = Ids('em' + nombre[:3])
        if nombre == 'sonrisa':
            r = (f'<path d="M352 470 Q392 405 432 470" {ST} stroke-width="36"/><path d="M592 470 Q632 405 672 470" {ST} stroke-width="36"/>'
                 f'<path d="M318 575 Q512 820 706 575 Q512 650 318 575 Z" fill="{N}" stroke="{N}" stroke-width="22" stroke-linejoin="round"/>'
                 f'<path d="M400 690 Q512 640 624 690 Q570 742 512 744 Q454 742 400 690 Z" fill="{MAGENTA}"/>' + _cachetes())
            d, b = _cara(ids, modo, r)
        elif nombre == 'carcajada':
            mid = ids('m')
            boca = 'M290 560 H734 Q724 820 512 820 Q300 820 290 560 Z'
            r = (f'<path d="M342 395 L432 440 L342 485" {ST} stroke-width="36"/><path d="M682 395 L592 440 L682 485" {ST} stroke-width="36"/>'
                 f'<clipPath id="{mid}"><path d="{boca}"/></clipPath><path d="{boca}" fill="{N}"/>'
                 f'<g clip-path="url(#{mid})"><rect x="280" y="548" width="464" height="62" fill="#FFFFFF"/>'
                 f'<ellipse cx="512" cy="830" rx="170" ry="110" fill="{MAGENTA}"/></g>'
                 f'<path d="M262 470 C230 520 236 570 268 582 C300 594 316 556 300 520 Z" fill="{TURQUESA_CL}"/>'
                 f'<path d="M762 470 C794 520 788 570 756 582 C724 594 708 556 724 520 Z" fill="{TURQUESA_CL}"/>')
            d, b = _cara(ids, modo, r)
        elif nombre == 'enamorada':
            r = (_corazon(392, 440, 170, MAGENTA) + _corazon(632, 440, 170, MAGENTA) +
                 '<ellipse cx="362" cy="408" rx="22" ry="14" fill="#fff" opacity=".6" transform="rotate(-30 362 408)"/>'
                 '<ellipse cx="602" cy="408" rx="22" ry="14" fill="#fff" opacity=".6" transform="rotate(-30 602 408)"/>'
                 f'<path d="M350 618 Q512 760 674 618" {ST} stroke-width="38"/>' + _cachetes(.4))
            d, b = _cara(ids, modo, r)
        elif nombre == 'guino':
            r = (f'<path d="M346 450 Q392 410 438 450" {ST} stroke-width="36"/>'
                 f'<ellipse cx="632" cy="440" rx="44" ry="58" fill="{N}"/><circle cx="648" cy="418" r="15" fill="#fff"/>'
                 f'<path d="M350 610 Q512 760 674 610" {ST} stroke-width="38"/>'
                 f'<path d="M560 668 Q620 652 650 640 Q668 720 610 742 Q560 752 560 668 Z" fill="{MAGENTA}" stroke="{N}" stroke-width="14" stroke-linejoin="round"/>'
                 + _cachetes(.45))
            d, b = _cara(ids, modo, r)
        elif nombre == 'canchera':
            lg = ids('len')
            lente = lambda x: f'<path d="M{x} 380 H{x + 196} Q{x + 206} 380 {x + 204} 392 L{x + 190} 470 Q{x + 182} 512 {x + 140} 512 H{x + 60} Q{x + 18} 512 {x + 10} 470 L{x - 4} 392 Q{x - 6} 380 {x} 380 Z" fill="url(#{lg})"/>'
            r = (f'<linearGradient id="{lg}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{NOCHE2}"/><stop offset="1" stop-color="{N}"/></linearGradient>'
                 f'<path d="M214 392 H810" {ST} stroke-width="26"/>' + lente(254) + lente(574) +
                 '<path d="M290 400 L330 400 L300 490 L262 490 Z" fill="#fff" opacity=".28"/>'
                 '<path d="M610 400 L650 400 L620 490 L582 490 Z" fill="#fff" opacity=".28"/>'
                 f'<path d="M400 650 Q540 720 664 610" {ST} stroke-width="38"/>')
            d, b = _cara(ids, modo, r)
        elif nombre == 'asombro':
            r = (f'<path d="M318 330 Q382 290 440 318" {ST} stroke-width="30"/><path d="M584 318 Q642 290 706 330" {ST} stroke-width="30"/>'
                 f'<ellipse cx="392" cy="440" rx="50" ry="66" fill="{N}"/><ellipse cx="632" cy="440" rx="50" ry="66" fill="{N}"/>'
                 '<circle cx="410" cy="414" r="17" fill="#fff"/><circle cx="650" cy="414" r="17" fill="#fff"/>'
                 f'<ellipse cx="512" cy="650" rx="78" ry="98" fill="{N}"/><ellipse cx="512" cy="700" rx="46" ry="32" fill="{MAGENTA}"/>')
            d, b = _cara(ids, modo, r)
        elif nombre == 'estrellas':
            mid = ids('m')
            boca = 'M318 575 Q512 840 706 575 Q512 640 318 575 Z'
            r = (_estrella(392, 440, 92, 40, MAGENTA) + _estrella(632, 440, 92, 40, MAGENTA) +
                 f'<clipPath id="{mid}"><path d="{boca}"/></clipPath><path d="{boca}" fill="{N}" stroke="{N}" stroke-width="20" stroke-linejoin="round"/>'
                 f'<g clip-path="url(#{mid})"><rect x="300" y="560" width="424" height="52" fill="#fff"/></g>')
            d, b = _cara(ids, modo, r)
        elif nombre == 'ojos':
            def ojo(cx):
                return (f'<ellipse cx="{cx}" cy="512" rx="170" ry="236" fill="#FFFFFF" stroke="{N}" stroke-width="26"/>'
                        f'<ellipse cx="{cx + 70}" cy="540" rx="80" ry="102" fill="{N}"/>'
                        f'<circle cx="{cx + 96}" cy="502" r="26" fill="#fff"/>')
            d, b = con_sombra('', ojo(318) + ojo(706), modo, ids, 14, 10, .26)
        elif nombre == 'corazon':
            shp = _corazon(512, 520, 760)
            d, b = solido(shp, (132, 160, 760, 700), '#E08BE8', MAGENTA_OSC, modo, ids)
            b += '<ellipse cx="345" cy="352" rx="80" ry="44" fill="#fff" opacity=".45" transform="rotate(-38 345 352)"/>'
        elif nombre == 'fuego':
            g1, g2 = ids('f1'), ids('f2')
            ext = ('M512 110 C566 260 724 336 724 566 C724 754 626 900 512 900 C398 900 300 754 300 584 C300 470 354 408 398 354 '
                   'C410 438 438 482 472 504 C468 382 488 248 512 110 Z')
            inte = ('M512 480 C542 570 622 612 622 716 C622 806 572 860 512 860 C452 860 402 806 402 726 C402 654 450 622 472 592 '
                    'C482 632 496 654 512 664 C506 602 504 540 512 480 Z')
            d = (f'<linearGradient id="{g1}" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="{MAGENTA_OSC}"/>'
                 f'<stop offset=".55" stop-color="#FF6B57"/><stop offset="1" stop-color="{NARANJA}"/></linearGradient>'
                 f'<linearGradient id="{g2}" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="{AMARILLO}"/>'
                 f'<stop offset="1" stop-color="{AMARILLO_CL}"/></linearGradient>')
            b = f'<path d="{ext}" fill="url(#{g1})"/><path d="{inte}" fill="url(#{g2})"/>'
            d, b = con_sombra(d, b, modo, ids, 16, 12, .26)
        elif nombre == 'brillos':
            b = (_estrella4(430, 560, 300, NARANJA) + _estrella4(740, 300, 150, MAGENTA) + _estrella4(760, 760, 96, TURQUESA))
            d, b = con_sombra('', b, modo, ids, 12, 9, .24)
        elif nombre == 'cien':
            b = (f'<g transform="translate(512 470) skewX(-10)">'
                 + texto(0, 130, '100', 400, MAGENTA, 700, 'middle', -.02) + '</g>')
            p1 = poli_bezier([((210, 700), (420, 670), (640, 662), (820, 676))], 120)
            p2 = poli_bezier([((300, 790), (480, 766), (640, 762), (760, 772))], 120)
            b += f'<g fill="{MAGENTA}"><path d="{trazo(p1, perfil_pincel(44, .5, .2, .3, 1))}"/><path d="{trazo(p2, perfil_pincel(34, .5, .2, .3, 1))}"/></g>'
            d, b = con_sombra('', b, modo, ids, 12, 9, .22)
        elif nombre == 'fiesta':
            gc = ids('cono')
            cono = 'M210 860 L392 380 L690 678 Z'
            b = (f'<linearGradient id="{gc}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{AMARILLO_CL}"/>'
                 f'<stop offset="1" stop-color="{NARANJA}"/></linearGradient>'
                 f'<path d="{cono}" fill="url(#{gc})" stroke="{NARANJA}" stroke-width="18" stroke-linejoin="round"/>'
                 f'<path d="M318 576 L494 752" stroke="{MAGENTA}" stroke-width="44" stroke-linecap="round"/>'
                 f'<path d="M262 712 L360 810" stroke="{TURQUESA}" stroke-width="40" stroke-linecap="round"/>'
                 f'<ellipse cx="541" cy="529" rx="210" ry="58" transform="rotate(45 541 529)" fill="{NARANJA}"/>'
                 f'<path d="M520 300 Q560 230 520 170" fill="none" stroke="{MAGENTA}" stroke-width="30" stroke-linecap="round"/>'
                 f'<path d="M640 360 Q720 300 790 330" fill="none" stroke="{TURQUESA}" stroke-width="30" stroke-linecap="round"/>'
                 f'<path d="M700 520 Q780 520 840 470" fill="none" stroke="{AZUL}" stroke-width="30" stroke-linecap="round"/>'
                 f'<rect x="610" y="150" width="46" height="46" rx="8" fill="{AZUL}" transform="rotate(20 633 173)"/>'
                 f'<rect x="800" y="610" width="44" height="44" rx="8" fill="{MAGENTA}" transform="rotate(-15 822 632)"/>'
                 f'<circle cx="430" cy="210" r="26" fill="{TURQUESA}"/><circle cx="860" cy="220" r="22" fill="{NARANJA}"/>'
                 f'<circle cx="760" cy="430" r="18" fill="{MAGENTA}"/>')
            d, b = con_sombra('', b, modo, ids, 12, 9, .24)
        elif nombre == 'mate':
            gm, gv, gy = ids('mt'), ids('vi'), ids('ye')
            cuerpo = ('M300 470 C300 420 360 392 512 392 C664 392 724 420 724 470 C780 560 790 700 720 800 '
                      'C672 870 600 900 512 900 C424 900 352 870 304 800 C234 700 244 560 300 470 Z')
            b = (f'<linearGradient id="{gm}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#B07444"/>'
                 f'<stop offset="1" stop-color="#6B3F1E"/></linearGradient>'
                 f'<linearGradient id="{gv}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#C9CAD6"/>'
                 f'<stop offset=".45" stop-color="#FFFFFF"/><stop offset="1" stop-color="#9FA0B0"/></linearGradient>'
                 f'<linearGradient id="{gy}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9BC45A"/>'
                 f'<stop offset="1" stop-color="#5E8A2E"/></linearGradient>'
                 f'<path d="M640 120 L700 128 L586 560 L548 552 Z" fill="url(#{gv})" stroke="#8E8FA0" stroke-width="8" stroke-linejoin="round"/>'
                 f'<rect x="628" y="96" width="92" height="46" rx="18" fill="url(#{gv})" stroke="#8E8FA0" stroke-width="8" transform="rotate(8 674 119)"/>'
                 f'<path d="{cuerpo}" fill="url(#{gm})"/>'
                 f'<ellipse cx="512" cy="436" rx="212" ry="58" fill="url(#{gy})"/>'
                 f'<path d="M300 436 A212 58 0 0 0 724 436" fill="none" stroke="url(#{gv})" stroke-width="40"/>'
                 f'<ellipse cx="512" cy="436" rx="212" ry="58" fill="none" stroke="url(#{gv})" stroke-width="22"/>'
                 '<path d="M372 540 C340 610 342 700 380 770" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width="34" stroke-linecap="round"/>'
                 + f'<g transform="translate(512 690) scale(.6)">{_corazon(0, 0, 220, ROSA)}</g>')
            d, b = con_sombra('', b, modo, ids, 14, 10, .26)
        elif nombre == 'megafono':
            gm = ids('mg')
            b = (f'<linearGradient id="{gm}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E08BE8"/>'
                 f'<stop offset="1" stop-color="{MAGENTA_OSC}"/></linearGradient>'
                 f'<path d="M332 640 L392 800 Q402 826 430 818 L474 804 Q500 794 492 768 L446 640 Z" fill="{N}"/>'
                 f'<path d="M190 430 Q170 470 190 650 Q200 690 240 680 L340 650 L760 830 Q810 850 820 800 L820 300 Q810 250 760 270 L340 450 L240 420 Q200 410 190 430 Z" fill="url(#{gm})"/>'
                 f'<rect x="250" y="440" width="96" height="216" rx="22" fill="{N}"/>'
                 '<path d="M380 470 L760 310" stroke="#fff" stroke-opacity=".35" stroke-width="26" stroke-linecap="round"/>'
                 f'<path d="M880 420 Q910 550 880 680" fill="none" stroke="{NARANJA}" stroke-width="34" stroke-linecap="round"/>'
                 f'<path d="M950 360 Q1000 550 950 740" fill="none" stroke="{NARANJA}" stroke-width="30" stroke-linecap="round" opacity=".75"/>')
            b = f'<g transform="translate(-40 0)">{b}</g>'
            d, b = con_sombra('', b, modo, ids, 14, 10, .26)
        elif nombre == 'idea':
            gb = ids('bu')
            b = (f'<radialGradient id="{gb}" cx=".4" cy=".35" r=".75"><stop offset="0" stop-color="#FFF4C7"/>'
                 f'<stop offset=".55" stop-color="{AMARILLO}"/><stop offset="1" stop-color="{NARANJA}"/></radialGradient>'
                 f'<path d="M512 200 C672 200 770 320 770 450 C770 560 700 620 664 680 C648 706 644 730 644 760 H380 C380 730 376 706 360 680 '
                 f'C324 620 254 560 254 450 C254 320 352 200 512 200 Z" fill="url(#{gb})"/>'
                 '<ellipse cx="420" cy="330" rx="70" ry="40" fill="#fff" opacity=".6" transform="rotate(-35 420 330)"/>'
                 f'<path d="M452 740 V600 Q452 560 482 560 Q512 560 512 600 Q512 560 542 560 Q572 560 572 600 V740" fill="none" stroke="{NARANJA}" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" opacity=".8"/>'
                 f'<rect x="380" y="760" width="264" height="56" rx="22" fill="{N}"/>'
                 f'<rect x="396" y="822" width="232" height="50" rx="22" fill="{NOCHE2}"/>'
                 f'<path d="M462 878 H562 Q552 920 512 920 Q472 920 462 878 Z" fill="{N}"/>'
                 + ''.join(f'<line x1="{fm(512 + 330 * math.cos(math.radians(a)))}" y1="{fm(450 + 330 * math.sin(math.radians(a)))}" '
                           f'x2="{fm(512 + 410 * math.cos(math.radians(a)))}" y2="{fm(450 + 410 * math.sin(math.radians(a)))}" '
                           f'stroke="{NARANJA}" stroke-width="30" stroke-linecap="round"/>' for a in (-160, -125, -90, -55, -20)))
            d, b = con_sombra('', b, modo, ids, 14, 10, .26)
        elif nombre == 'calendario':
            gc = ids('ca')
            b = (f'<linearGradient id="{gc}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E08BE8"/>'
                 f'<stop offset="1" stop-color="{MAGENTA_OSC}"/></linearGradient>'
                 f'<g transform="rotate(-6 512 540)">'
                 f'<rect x="210" y="230" width="604" height="640" rx="70" fill="#FFFFFF"/>'
                 f'<path d="M210 300 Q210 230 280 230 H744 Q814 230 814 300 V420 H210 Z" fill="url(#{gc})"/>'
                 f'<rect x="210" y="230" width="604" height="640" rx="70" fill="none" stroke="{GRIS_EC}" stroke-width="10"/>'
                 f'<rect x="352" y="170" width="44" height="140" rx="22" fill="{N}"/><rect x="628" y="170" width="44" height="140" rx="22" fill="{N}"/>'
                 + ''.join(f'<circle cx="{300 + 106 * i}" cy="{790}" r="14" fill="{GRIS_CA}"/>' for i in range(5)) +
                 '</g>')
            d, b = con_sombra('', b, modo, ids, 14, 10, .26)
        elif nombre == 'pulgar':
            gp = ids('pu')
            b = (f'<linearGradient id="{gp}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{AMARILLO_CL}"/>'
                 f'<stop offset="1" stop-color="{NARANJA}"/></linearGradient>'
                 f'<path d="M402 470 C430 400 452 330 452 250 C452 196 492 172 528 186 C574 204 584 262 568 330 C560 366 548 400 540 430 '
                 f'H760 C810 430 840 470 832 516 C828 540 816 556 800 566 C826 580 840 606 834 636 C830 660 812 678 792 686 '
                 f'C812 700 822 726 814 752 C806 778 784 794 760 798 C774 814 780 838 770 860 C760 884 734 898 706 898 '
                 f'H520 C470 898 430 884 402 860 Z" fill="url(#{gp})"/>'
                 f'<path d="M660 566 H800 M660 686 H792 M650 798 H760" fill="none" stroke="#E08A3C" stroke-width="18" stroke-linecap="round"/>'
                 f'<rect x="190" y="450" width="212" height="470" rx="40" fill="{MAGENTA}"/>'
                 f'<rect x="190" y="450" width="212" height="470" rx="40" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="16"/>'
                 f'<circle cx="296" cy="840" r="22" fill="#fff" opacity=".8"/>')
            d, b = con_sombra('', b, modo, ids, 14, 10, .26)
        elif nombre == 'rayo':
            shp = '<path d="M590 110 L250 590 H480 L420 914 L790 400 H556 L640 110 Z"/>'
            d, b = solido(shp, (250, 110, 540, 804), AMARILLO, '#F59A3C', modo, ids, rim=False)
        else:
            raise ValueError(nombre)
        return svg_doc(L_E, L_E, d, b, nombre)
    return fn


EMOJIS = [
    ('sonrisa', 'Sonrisa', 'cara feliz contenta alegria'),
    ('carcajada', 'Carcajada', 'risa reir jaja cara'),
    ('enamorada', 'Enamorada', 'amor corazones ojos cara'),
    ('guino', 'Guiño', 'guiño lengua cara divertido'),
    ('canchera', 'Canchera', 'anteojos de sol lentes cool cara'),
    ('asombro', 'Asombro', 'wow sorpresa cara'),
    ('estrellas', 'Ojos de estrella', 'estrellas emocion cara'),
    ('ojos', 'Ojos', 'mirar mirando atencion'),
    ('corazon', 'Corazón', 'amor corazon'),
    ('fuego', 'Fuego', 'fuego llama tendencia'),
    ('brillos', 'Brillos', 'brillo estrellas destello magia'),
    ('cien', 'Cien', '100 cien puntos'),
    ('fiesta', 'Festejo', 'fiesta festejo confeti celebracion'),
    ('mate', 'Mate', 'mate yerba bombilla argentina'),
    ('megafono', 'Megáfono', 'megafono anuncio aviso'),
    ('idea', 'Idea', 'idea lamparita foco'),
    ('calendario', 'Calendario', 'calendario fecha agenda dia'),
    ('pulgar', 'Pulgar arriba', 'pulgar me gusta ok bien'),
    ('rayo', 'Rayo', 'rayo energia urgente'),
]


def registrar():
    # 02 · subrayado formal
    g = grupo('02', 16, 'subrayado-formal', 'Subrayado formal para títulos',
              'Barra de acento y línea fina, para títulos institucionales.', tags='subrayado titulo linea formal guion')
    for lay in ('izquierda', 'centrado'):
        for col in ('azul-noche', 'blanco', 'magenta'):
            recurso(g, f'{lay}_{col}', 2048, 256, subrayado_formal(lay, col), dict(REC_N if col == 'blanco' else REC_B, grosor=20))

    # 04 · íconos de medios (los tres estilos de la serie)
    for i, n in enumerate(NUEVOS_ICONOS, 24):
        g = grupo('04', i, f'icono-{n}', NUEVOS_ICONOS[n]['t'], 'Ícono de trazo grueso y redondeado.',
                  tags='icono medios prensa entrevista ' + n.replace('-', ' '))
        recurso(g, 'insignia-clara', 1024, 1024, IC.insignia(n, 'claro'), REC_N)
        recurso(g, 'insignia-oscura', 1024, 1024, IC.insignia(n, 'oscuro'), REC_B)
        recurso(g, 'trazo-blanco', 1024, 1024, IC.trazo_solo(n, BLANCO), dict(borde='noche', grosor=26))

    # 05 · títulos de sesión
    for n, tipo in ((17, 'ordinaria'), (18, 'extraordinaria')):
        g = grupo('05', n, f'titulo-sesion-{tipo}', f'Título «Sesión {tipo}»',
                  'Título de sesión de la Cámara con el lugar del número vacío, para completarlo en la historia.',
                  tags=f'titulo sesion {tipo} camara diputados corrientes numero')
        for col in ('blanco', 'azul-noche'):
            for lay in ('izquierda', 'centrado'):
                fn, W, H = titulo_sesion(tipo, col, lay == 'centrado')
                recurso(g, f'{lay}_{col}', W, H, fn, dict(REC_N if col == 'blanco' else REC_B, grosor=22))

    # 05 · etiquetas de medios
    medios = [(19, 'ENTREVISTA', 'entrevista', 'entrevista-microfono'), (20, 'EN LA RADIO', 'en-la-radio', 'radio'),
              (21, 'EN LA TELE', 'en-la-tele', 'television')]
    for n, txt, slug, ico in medios:
        g = grupo('05', n, f'etiqueta-{slug}', txt, 'Etiqueta con ícono para entrevistas y notas en medios.',
                  tags=f'etiqueta texto medios entrevista {txt.lower()}')
        for est in ('magenta', 'vidrio-oscuro', 'blanco'):
            fn, W, H = ET.una_linea(txt, est, icono=ico)
            recurso(g, est, W, H, fn, ET.rec(est))
    g = grupo('05', 22, 'etiqueta-EN-VIVO', 'EN VIVO', 'Etiqueta de transmisión en vivo.', tags='etiqueta texto en vivo transmision directo')
    for f in ('rojo', 'vidrio-oscuro'):
        fn, W, H = en_vivo(f)
        recurso(g, f, W, H, fn, REC_B)
    g = grupo('05', 23, 'cartel-AL-AIRE', 'AL AIRE', 'Cartel luminoso de estudio para radio o televisión.', tags='al aire radio tele estudio cartel')
    fn, W, H = al_aire()
    recurso(g, 'rojo', W, H, fn, REC_B)

    # 06 · pin, tilde y cruz, separador institucional
    g = grupo('06', 12, 'pin-de-ubicacion', 'Pin de ubicación', 'Marcador de lugar para escribir al lado dónde estás.',
              tags='pin ubicacion lugar mapa donde')
    recurso(g, 'rojo', 1024, 1024, pin('rojo'), REC_B)
    recurso(g, 'blanco', 1024, 1024, pin('blanco'), REC_N)
    g = grupo('06', 13, 'tilde-verde-y-cruz-roja', 'Tilde verde y cruz roja', 'Sí / no, correcto / incorrecto.',
              tags='tilde check cruz bien mal correcto incorrecto verde rojo')
    for tipo in ('tilde', 'cruz'):
        nom = 'tilde-verde' if tipo == 'tilde' else 'cruz-roja'
        recurso(g, nom, 1024, 1024, marca_color(tipo, False), REC_B)
        recurso(g, f'{nom}-suelta', 1024, 1024, marca_color(tipo, True), REC_N)
    g = grupo('06', 14, 'separador-institucional', 'Separador institucional', 'Separador sobrio para contenidos de la Cámara.',
              tags='separador divisor institucional camara formal solemne')
    for est in ('flor', 'rombo'):
        for col in ('azul-noche', 'blanco'):
            recurso(g, f'{est}_{col}', 2048, 320, separador_inst(est, col), dict(REC_N if col == 'blanco' else REC_B, grosor=20))

    # 09 · emojis
    for i, (n, t, tags) in enumerate(EMOJIS, 1):
        g = grupo('09', i, f'emoji-{n}', t, 'Emoji de la marca para historias distendidas.', tags='emoji ' + tags)
        recurso(g, '', L_E, L_E, emoji(n), REC_B)
