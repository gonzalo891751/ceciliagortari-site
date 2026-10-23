# 05 · Etiquetas con textos reutilizables (Outfit Bold/Medium, mayúsculas, paleta oficial).
# Son recursos gráficos: no simulan enlaces ni afirman resultados legislativos.
import math
import numpy as np
from nucleo import *
from base import grupo, recurso, REC_B, REC_N
import c04_iconos as IC

# íconos auxiliares (no forman parte de la serie 04)
IC.I['compartir'] = dict(t='Compartir', l=['<path d="M85 11 L11 43 L40 54 L51 84 Z"/>', '<path d="M85 11 L40 54"/>'])
IC.I['destello'] = dict(t='Destello', l=[], f=['<path d="M48 8 Q52 44 88 48 Q52 52 48 88 Q44 52 8 48 Q44 44 48 8 Z"/>'])

ESTILOS = {
    # tono de vidrio, modo, color de texto, color de ícono
    'magenta': ('magenta', 'solido', BLANCO, BLANCO),
    'vidrio-claro': ('claro', 'original', NOCHE, MAGENTA),
    'vidrio-oscuro': ('oscuro', 'original', BLANCO, ROSA),
    'blanco': ('claro', 'solido', NOCHE, MAGENTA),
    'noche': ('oscuro', 'solido', BLANCO, NARANJA),
}
S = 168            # cuerpo del texto principal (px)
PH = 300           # alto de la cápsula
MARG = 84          # margen del lienzo (sombra + troquel)
TRK = .035


def _caja(tono, modo, base, x, y, w, h, r, ids):
    mm = 'recorte' if modo == 'recorte' else base
    return vidrio(rrect(x, y, w, h, r), (x, y, w, h), tono, mm, ids, cuerpo=1.6 if tono == 'claro' else 1.2, sombra_k=.7)


def _flecha_abajo(x0, y0, escala, color):
    """flecha editorial que sale de la etiqueta y apunta hacia abajo (hacia el sticker de enlace)"""
    p = poli_bezier([((x0, y0), (x0 + 40 * escala, y0 + 120 * escala), (x0 + 10 * escala, y0 + 210 * escala),
                      (x0 - 40 * escala, y0 + 270 * escala))], 120)
    d = trazo(p, perfil_pincel(40 * escala, .3, .75, .5))
    return f'<g fill="{color}"><path d="{d}"/>{punta_abierta(p[-1], p[-1] - p[-8], 105 * escala, 36 * escala, 38)}</g>'


def una_linea(txt, estilo, icono=None, vivo=False, flecha=False, tracking=TRK, kicker=None):
    tono, base, ctxt, cico = ESTILOS[estilo]
    tw = ancho_texto(txt, S, 700, tracking)
    ico = PH * .58 if (icono or vivo) else 0
    gap = S * .34 if ico else 0
    padx = PH * .44
    pw = padx * 2 + ico + gap + tw
    top_extra = 150 if kicker else 0
    flecha_h = 330 if flecha else 0
    W = math.ceil(pw + 2 * MARG)
    H = math.ceil(PH + 2 * MARG + top_extra + flecha_h)

    def fn(modo):
        ids = Ids('e')
        x, y = MARG, MARG + top_extra
        d, b = _caja(tono, modo, base, x, y, pw, PH, PH / 2, ids)
        cx = x + padx
        cy = y + PH / 2
        if vivo:
            r = ico * .26
            halo_op = .45 if modo != 'recorte' else 1
            b += f'<circle cx="{fm(cx + ico / 2)}" cy="{fm(cy)}" r="{fm(r * 1.75)}" fill="{ROSA if estilo != "vidrio-oscuro" else MAGENTA}" opacity="{halo_op if modo != "recorte" else .55}"/>'
            b += f'<circle cx="{fm(cx + ico / 2)}" cy="{fm(cy)}" r="{fm(r)}" fill="{MAGENTA if estilo != "magenta" else BLANCO}"/>'
        elif icono:
            d2, b2 = IC.icono_svg(icono, cx, cy - ico / 2, ico, cico, cico, ids, sw_k=1.55)
            d += d2; b += b2
        tx = cx + ico + gap
        b += texto(tx, cy + S * .706 / 2, txt, S, ctxt, 700, 'start', tracking)
        if kicker:
            ktxt, kest = kicker
            kt, kb, kc, _ = ESTILOS[kest]
            ks = S * .62
            kw = ancho_texto(ktxt, ks, 700, .10) + ks * 1.3
            kh = ks * 1.75
            kx, ky = x + PH * .32, y - kh * .62
            d3, b3 = vidrio(rrect(kx, ky, kw, kh, kh / 2), (kx, ky, kw, kh), kt, 'recorte' if modo == 'recorte' else 'solido', ids, sombra_k=.5, reflejo=False)
            d += d3; b += b3
            b += texto(kx + ks * .65, ky + kh / 2 + ks * .706 / 2, ktxt, ks, kc, 700, 'start', .10)
        if flecha:
            b += _flecha_abajo(x + pw * .76, y + PH + 18, 1.1, MAGENTA)
        return svg_doc(W, H, d, b, txt)
    return fn, W, H


def dos_lineas(l1, l2, estilo, icono=None, burbuja=False, flecha=False, peso1=500, escala1=.62, tracking1=.16):
    """dos líneas: la primera chica y espaciada, la segunda grande"""
    tono, base, ctxt, cico = ESTILOS[estilo]
    s1, s2 = S * escala1, S * 1.0
    w1 = ancho_texto(l1, s1, peso1, tracking1)
    w2 = ancho_texto(l2, s2, 700, TRK)
    tw = max(w1, w2)
    ico = S * 1.45 if icono else 0
    gap = S * .42 if icono else 0
    pad = S * .62
    bw = pad * 2 + ico + gap + tw
    lh = s1 * .706 + S * .36 + s2 * .706
    bh = lh + pad * 1.6
    cola = 120 if burbuja else 0
    flecha_h = 330 if flecha else 0
    W = math.ceil(bw + 2 * MARG)
    H = math.ceil(bh + 2 * MARG + cola + flecha_h)

    def fn(modo):
        ids = Ids('d')
        x, y = MARG, MARG
        r = bh * .30
        if burbuja:
            # globo de diálogo: rectángulo redondeado + cola abajo a la izquierda
            tx0 = x + bw * .16
            shp = (f'<path d="M{fm(x + r)} {fm(y)} H{fm(x + bw - r)} A{fm(r)} {fm(r)} 0 0 1 {fm(x + bw)} {fm(y + r)} '
                   f'V{fm(y + bh - r)} A{fm(r)} {fm(r)} 0 0 1 {fm(x + bw - r)} {fm(y + bh)} H{fm(tx0 + 150)} '
                   f'L{fm(tx0 - 10)} {fm(y + bh + cola)} L{fm(tx0 + 30)} {fm(y + bh)} H{fm(x + r)} '
                   f'A{fm(r)} {fm(r)} 0 0 1 {fm(x)} {fm(y + bh - r)} V{fm(y + r)} A{fm(r)} {fm(r)} 0 0 1 {fm(x + r)} {fm(y)} Z"/>')
            mm = 'recorte' if modo == 'recorte' else base
            d, b = vidrio(shp, (x, y, bw, bh + cola), tono, mm, ids, cuerpo=1.6 if tono == 'claro' else 1.2, sombra_k=.7)
        else:
            d, b = _caja(tono, modo, base, x, y, bw, bh, r, ids)
        cx = x + pad
        if icono:
            d2, b2 = IC.icono_svg(icono, cx, y + (bh - ico) / 2, ico, cico, cico, ids, sw_k=1.3)
            d += d2; b += b2
            cx += ico + gap
        y1 = y + (bh - lh) / 2 + s1 * .706
        y2 = y1 + S * .36 + s2 * .706
        anchor_x = cx if icono else x + bw / 2
        anc = 'start' if icono else 'middle'
        c1 = MAGENTA if estilo in ('vidrio-claro', 'blanco') else (ROSA if estilo in ('vidrio-oscuro', 'noche') else BLANCO)
        b += texto(anchor_x, y1, l1, s1, c1, peso1, anc, tracking1)
        b += texto(anchor_x, y2, l2, s2, ctxt, 700, anc, TRK)
        if flecha:
            b += _flecha_abajo(x + bw * .78, y + bh + 18, 1.1, MAGENTA)
        return svg_doc(W, H, d, b, f'{l1} {l2}')
    return fn, W, H


def rec(estilo):
    return REC_N if estilo in ('vidrio-claro', 'blanco') else REC_B


def registrar():
    L = [
        # (slug, título, uso, [(estilo, constructor)])
        ('INGRESA-ACA', 'INGRESÁ ACÁ', 'Llamado a la acción con una flecha que apunta hacia abajo. Ubicalo arriba del sticker de enlace real de Instagram: el archivo no es un botón ni un enlace.',
         lambda e: una_linea('INGRESÁ ACÁ', e, flecha=True), ['magenta', 'vidrio-claro']),
        ('CONOCE-MAS', 'CONOCÉ MÁS', 'Invita a profundizar. Acompañalo con el sticker de enlace, la mención o la encuesta de Instagram.',
         lambda e: una_linea('CONOCÉ MÁS', e, flecha=True), ['vidrio-claro', 'noche']),
        ('EN-SESION', 'EN SESIÓN', 'Para historias desde el recinto durante una sesión. El punto indica que es en el momento (no es un indicador funcional de «en vivo»).',
         lambda e: una_linea('EN SESIÓN', e, vivo=True), ['vidrio-oscuro', 'blanco']),
        ('EN-AGENDA', 'EN AGENDA', 'Para anticipar actividades o temas de la semana.',
         lambda e: una_linea('EN AGENDA', e, icono='calendario'), ['magenta', 'vidrio-claro']),
        ('TRABAJANDO-JUNTOS', 'TRABAJANDO JUNTOS', 'Etiqueta tipográfica para reuniones, acuerdos o trabajo con instituciones y vecinos.',
         lambda e: dos_lineas('TRABAJANDO', 'JUNTOS', e, escala1=.56, tracking1=.20), ['vidrio-claro', 'magenta']),
        ('CORRIENTES', 'CORRIENTES', 'Identidad provincial con la golondrina del manual de marca.',
         lambda e: una_linea('CORRIENTES', e, icono='golondrina', tracking=.12), ['blanco', 'vidrio-oscuro']),
        ('NUEVA-INICIATIVA', 'NUEVA INICIATIVA', 'Para presentar un proyecto o una propuesta nueva. No indica que haya sido aprobada.',
         lambda e: una_linea('INICIATIVA', e, icono='destello', kicker=('NUEVA', 'blanco' if e == 'magenta' else 'magenta')), ['magenta', 'vidrio-oscuro']),
        ('DESCARGA-EL-EXPEDIENTE', 'DESCARGÁ EL EXPEDIENTE', 'Acompaña el sticker de enlace al expediente. Ubicalo arriba del enlace real.',
         lambda e: dos_lineas('DESCARGÁ', 'EL EXPEDIENTE', e, icono='proyecto-de-ley', flecha=True, escala1=.78, tracking1=.10, peso1=700), ['noche', 'vidrio-claro']),
        ('Y-VOS-QUE-PENSAS', 'Y VOS, ¿QUÉ PENSÁS?', 'Globo de diálogo para abrir la conversación. Combinalo con la caja de preguntas o la encuesta de Instagram.',
         lambda e: dos_lineas('Y VOS,', '¿QUÉ PENSÁS?', e, burbuja=True, escala1=.70, tracking1=.10), ['vidrio-claro', 'magenta']),
        ('DATO-CLAVE', 'DATO CLAVE', 'Para presentar una cifra o un dato verificable de la historia.',
         lambda e: una_linea('DATO CLAVE', e, icono='economia'), ['noche', 'blanco']),
        ('DESDE-LA-CAMARA', 'DESDE LA CÁMARA', 'Para historias tomadas en la Cámara de Diputados.',
         lambda e: una_linea('DESDE LA CÁMARA', e, icono='camara-de-diputados'), ['vidrio-oscuro', 'vidrio-claro']),
        ('REUNION-DE-TRABAJO', 'REUNIÓN DE TRABAJO', 'Para encuentros con vecinos, instituciones o equipos técnicos.',
         lambda e: una_linea('REUNIÓN DE TRABAJO', e, icono='dialogo-y-reunion'), ['blanco', 'vidrio-oscuro']),
        ('RECORRIDA', 'RECORRIDA', 'Para visitas a barrios, obras o localidades del interior.',
         lambda e: una_linea('RECORRIDA', e, icono='ubicacion'), ['magenta', 'vidrio-claro']),
        ('PARTICIPA', 'PARTICIPÁ', 'Invita a sumarse a una consulta, una reunión abierta o una actividad.',
         lambda e: una_linea('PARTICIPÁ', e, icono='participacion-ciudadana'), ['vidrio-claro', 'noche']),
        ('COMPARTILO', 'COMPARTILO', 'Cierre que invita a compartir la historia.',
         lambda e: una_linea('COMPARTILO', e, icono='compartir'), ['magenta', 'vidrio-claro']),
        ('GOYA', 'GOYA', 'Para contenido de Goya, ciudad a orillas del Paraná. El ícono de río está tomado del manual de marca.',
         lambda e: una_linea('GOYA', e, icono='rio', tracking=.16), ['noche', 'blanco']),
    ]
    for i, (slug, tit, uso, ctor, estilos) in enumerate(L, 1):
        g = grupo('05', i, f'etiqueta-{slug}', tit, uso, tags='etiqueta texto ' + tit.lower())
        for e in estilos:
            fn, W, H = ctor(e)
            recurso(g, e, W, H, fn, rec(e))
