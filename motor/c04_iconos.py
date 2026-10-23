# 04 · Íconos institucionales: trazo redondeado y grueso (grilla de 96), un acento de color por ícono.
from nucleo import *
from base import grupo, recurso, REC_B, REC_N

SW = 6.5   # grosor de trazo en la grilla de 96

# cada ícono: l = trazos principales, a = trazos de acento, f = rellenos de acento, n = rellenos del color principal,
# k = formas que se calan del trazo principal (para que el acento no se encime)
I = {
    'camara-de-diputados': dict(
        t='Cámara de Diputados',
        l=['<path d="M14 36 L48 15 L82 36 Z"/>', '<path d="M24 45 V69"/>', '<path d="M40 45 V69"/>', '<path d="M56 45 V69"/>',
           '<path d="M72 45 V69"/>', '<path d="M17 74 H79"/>', '<path d="M10 83 H86"/>'],
        f=['<circle cx="48" cy="29" r="4.2"/>']),
    'proyecto-de-ley': dict(
        t='Proyecto de ley',
        l=['<path d="M58 84 H26 a8 8 0 0 1 -8 -8 V20 a8 8 0 0 1 8 -8 H50 L66 28 V46"/>', '<path d="M50 12 V28 H66"/>',
           '<path d="M28 42 H52"/>', '<path d="M28 54 H46"/>', '<path d="M28 66 H40"/>'],
        a=['<path d="M82 52 L58 76"/>', '<path d="M58 76 L52 84 L60 78"/>'],
        k=['<path d="M82 52 L58 76" stroke-width="20"/>']),
    'expediente': dict(
        t='Expediente',
        l=['<path d="M12 30 a7 7 0 0 1 7 -7 H37 l8 8 H77 a7 7 0 0 1 7 7 V73 a7 7 0 0 1 -7 7 H19 a7 7 0 0 1 -7 -7 Z"/>',
           '<path d="M12 41 H84"/>'],
        f=['<rect x="30" y="52" width="36" height="14" rx="4"/>']),
    'educacion': dict(
        t='Educación',
        l=['<path d="M48 30 C40 23 28 21 13 22.5 V74 C28 72.5 40 74.5 48 81 C56 74.5 68 72.5 83 74 V22.5 C68 21 56 23 48 30 Z"/>',
           '<path d="M48 30 V81"/>'],
        f=['<path d="M61 24.2 V46 L67.5 40.5 L74 46 V22.6 Z"/>']),
    'salud': dict(
        t='Salud',
        l=['<path d="M48 82 C22 64 11 51 12.5 35.5 C14 23.5 23.5 15.5 33.5 15.5 C40.5 15.5 45.5 19.5 48 24.5 '
           'C50.5 19.5 55.5 15.5 62.5 15.5 C72.5 15.5 82 23.5 83.5 35.5 C85 51 74 64 48 82 Z"/>'],
        a=['<path d="M23 48 H36 L42 37 L51 60 L57 48 H73"/>']),
    'derechos-de-las-mujeres': dict(
        t='Derechos de las mujeres',
        l=['<circle cx="48" cy="35" r="21"/>'],
        a=['<path d="M48 56 V87"/>', '<path d="M35 73 H61"/>']),
    'participacion-ciudadana': dict(
        t='Participación ciudadana',
        l=['<circle cx="20" cy="39" r="7.5"/>', '<circle cx="76" cy="39" r="7.5"/>',
           '<path d="M7 74 C7 63 12.5 56.5 20 56.5 C23.5 56.5 26.5 58 28.5 60.5"/>',
           '<path d="M89 74 C89 63 83.5 56.5 76 56.5 C72.5 56.5 69.5 58 67.5 60.5"/>'],
        a=['<circle cx="48" cy="30" r="10.5"/>', '<path d="M29 79 C29 62 37.5 52.5 48 52.5 C58.5 52.5 67 62 67 79"/>']),
    'justicia': dict(
        t='Justicia',
        l=['<path d="M48 22 V78"/>', '<path d="M33 82 H63"/>', '<path d="M17 29 H79"/>', '<circle cx="48" cy="16" r="4.5"/>',
           '<path d="M17 29 L8 54"/>', '<path d="M17 29 L26 54"/>', '<path d="M79 29 L70 54"/>', '<path d="M79 29 L88 54"/>'],
        f=['<path d="M5 54 H29 C29 62 23.5 67.5 17 67.5 C10.5 67.5 5 62 5 54 Z"/>',
           '<path d="M67 54 H91 C91 62 85.5 67.5 79 67.5 C72.5 67.5 67 62 67 54 Z"/>']),
    'calendario': dict(
        t='Calendario y agenda',
        l=['<rect x="13" y="19" width="70" height="64" rx="10"/>', '<path d="M13 37 H83"/>', '<path d="M32 11 V26"/>',
           '<path d="M64 11 V26"/>'],
        n=['<circle cx="30" cy="52" r="3.6"/>', '<circle cx="43" cy="52" r="3.6"/>', '<circle cx="56" cy="52" r="3.6"/>',
           '<circle cx="30" cy="67" r="3.6"/>', '<circle cx="43" cy="67" r="3.6"/>'],
        f=['<circle cx="63" cy="65" r="9.5"/>']),
    'ubicacion': dict(
        t='Ubicación',
        l=['<path d="M48 87 C40 77 19 58 19 38 C19 22 32 9.5 48 9.5 C64 9.5 77 22 77 38 C77 58 56 77 48 87 Z"/>'],
        f=['<circle cx="48" cy="38" r="10.5"/>']),
    'prensa-y-comunicacion': dict(
        t='Prensa y comunicación',
        l=['<path d="M17 41 H28 L62 23 V77 L28 59 H17 a5 5 0 0 1 -5 -5 V46 a5 5 0 0 1 5 -5 Z"/>', '<path d="M28 60 L34 81 H42 L38 63"/>'],
        a=['<path d="M73 39 C77 45 77 55 73 61"/>', '<path d="M81 31 C89 41 89 59 81 69"/>']),
    'entrevista-microfono': dict(
        t='Entrevista y medios',
        l=['<path d="M24 45 C24 60 34 69 48 69 C62 69 72 60 72 45"/>', '<path d="M48 69 V83"/>', '<path d="M35 85 H61"/>'],
        a=['<rect x="36" y="10" width="24" height="46" rx="12"/>']),
    'redes-sociales': dict(
        t='Redes sociales',
        l=['<rect x="25" y="8" width="46" height="80" rx="11"/>', '<path d="M42 17.5 H54"/>', '<path d="M42 79 H54"/>'],
        f=['<path d="M48 61 C36.5 53.5 32 47.5 33 41.5 C33.8 36.6 37.6 33.4 41.8 33.4 C44.8 33.4 46.9 35.1 48 37.2 '
           'C49.1 35.1 51.2 33.4 54.2 33.4 C58.4 33.4 62.2 36.6 63 41.5 C64 47.5 59.5 53.5 48 61 Z"/>']),
    'obras-publicas': dict(
        t='Obras públicas e infraestructura',
        l=['<rect x="10" y="64" width="76" height="11" rx="5.5"/>', '<path d="M19 64 C19 42 31 28 48 28 C65 28 77 42 77 64"/>'],
        f=['<rect x="42" y="22" width="12" height="27" rx="4"/>'],
        k=['<rect x="38" y="18" width="20" height="35" rx="6" stroke="none" fill="#000"/>']),
    'economia': dict(
        t='Economía',
        l=['<path d="M13 13 V83 H85"/>', '<path d="M30 83 V68"/>', '<path d="M45 83 V60"/>', '<path d="M60 83 V52"/>',
           '<path d="M75 83 V44"/>'],
        a=['<path d="M23 47 L39 32 L52 39 L74 17"/>', '<path d="M61 17 H74 V30"/>']),
    'produccion': dict(
        t='Producción',
        l=['<path d="M22 84 H74"/>', '<path d="M48 84 V44"/>', '<path d="M48 63 C34 63 22 55 20 38 C36 38 46 48 48 63 Z"/>'],
        f=['<path d="M48 50 C48 31 60 19 79 17 C79 36 67 50 48 50 Z"/>'],
        k=['<path d="M48 50 C48 31 60 19 79 17 C79 36 67 50 48 50 Z" stroke-width="10" fill="#000"/>']),
    'chamame-cultura': dict(
        t='Cultura y chamamé',
        l=['<rect x="7" y="25" width="20" height="46" rx="6"/>', '<rect x="69" y="25" width="20" height="46" rx="6"/>',
           '<path d="M27 30 L35.5 37 L44 30 L52.5 37 L61 30 L69 37" stroke-width="5"/>',
           '<path d="M27 66 L35.5 59 L44 66 L52.5 59 L61 66 L69 59" stroke-width="5"/>',
           '<path d="M35.5 37 V59" stroke-width="5"/>', '<path d="M52.5 37 V59" stroke-width="5"/>'],
        f=['<circle cx="17" cy="38" r="3.4"/>', '<circle cx="17" cy="48" r="3.4"/>', '<circle cx="17" cy="58" r="3.4"/>',
           '<circle cx="79" cy="40" r="3.4"/>', '<circle cx="79" cy="52" r="3.4"/>']),
    'dialogo-y-reunion': dict(
        t='Diálogo y reunión',
        l=['<path d="M20 15 H56 a9 9 0 0 1 9 9 V44 a9 9 0 0 1 -9 9 H35 L23 63 V53 H20 a9 9 0 0 1 -9 -9 V24 a9 9 0 0 1 9 -9 Z"/>'],
        a=['<path d="M76 39 a9 9 0 0 1 9 9 V64 a9 9 0 0 1 -9 9 H74 V83 L61 73 H49 a9 9 0 0 1 -9 -9 V48 a9 9 0 0 1 9 -9 Z"/>'],
        k=['<path d="M76 39 a9 9 0 0 1 9 9 V64 a9 9 0 0 1 -9 9 H74 V83 L61 73 H49 a9 9 0 0 1 -9 -9 V48 a9 9 0 0 1 9 -9 Z" '
           'stroke-width="18" fill="#000"/>']),
}

# íconos de identidad del manual de marca (pág. 26), en su forma original
MANUAL = {
    'golondrina': ('ico_golondrina', 'Golondrina (manual)'),
    'rio': ('ico_rio', 'Río (manual)'),
    'pez': ('ico_pez', 'Pez (manual)'),
    'lancha': ('ico_lancha', 'Lancha (manual)'),
    'cana-de-pescar': ('ico_anzuelo', 'Caña de pescar (manual)'),
}


def icono_svg(nombre, x, y, size, col, acc, ids, sw_k=1.0):
    """dibuja el ícono de la grilla 96 en la caja (x, y, size)"""
    s = size / 96
    if nombre in MANUAL:
        key = MANUAL[nombre][0]
        r = icono_manual_ratio(key)
        bw, bh = (size * .92, size * .92 / r) if r >= 1 else (size * .92 * r, size * .92)
        return '', icono_manual(key, x + (size - bw) / 2, y + (size - bh) / 2, bh, col)
    d = I[nombre]
    defs, body = '', ''
    st = f'fill="none" stroke-width="{SW * sw_k}" stroke-linecap="round" stroke-linejoin="round"'
    main = ''.join(d.get('l', []))
    if d.get('k'):
        mid = ids('k')
        defs += (f'<mask id="{mid}" maskUnits="userSpaceOnUse" x="-20" y="-20" width="136" height="136">'
                 f'<rect x="-20" y="-20" width="136" height="136" fill="#fff"/>'
                 f'<g fill="#000" stroke="#000" stroke-linecap="round" stroke-linejoin="round">{"".join(d["k"])}</g></mask>')
        main = f'<g mask="url(#{mid})">{main}</g>'
    body += f'<g {st} stroke="{col}">{main}</g>'
    if d.get('n'):
        body += f'<g fill="{col}">{"".join(d["n"])}</g>'
    if d.get('a'):
        body += f'<g {st} stroke="{acc}">{"".join(d["a"])}</g>'
    if d.get('f'):
        body += f'<g fill="{acc}" stroke="{acc}" stroke-width="{SW * .4}" stroke-linejoin="round">{"".join(d["f"])}</g>'
    return defs, f'<g transform="translate({fm(x)} {fm(y)}) scale({s:.5f})">{body}</g>'


def insignia(nombre, tono, L=1024):
    def fn(modo):
        ids = Ids('i')
        c, R = L / 2, L * .40
        d, b = vidrio(circle(c, c, R), (c - R, c - R, 2 * R, 2 * R), tono, modo, ids, cuerpo=1.4 if tono == 'claro' else 1.15)
        col, acc = (NOCHE, MAGENTA) if tono == 'claro' else (BLANCO, ROSA)
        if nombre in MANUAL:
            col = NOCHE if tono == 'claro' else BLANCO
        size = 2 * R * .56
        d2, b2 = icono_svg(nombre, c - size / 2, c - size / 2, size, col, acc, ids)
        return svg_doc(L, L, d + d2, b + b2, I.get(nombre, {}).get('t', nombre))
    return fn


def trazo_solo(nombre, color, L=1024):
    def fn(modo):
        ids = Ids('j')
        fid = ids('sh')
        acc = ROSA if color == BLANCO else MAGENTA
        size = L * .74
        d2, b2 = icono_svg(nombre, (L - size) / 2, (L - size) / 2, size, color, acc, ids)
        defs = d2 + (sombra_filtro(fid, 9, 6, NOCHE, .34) if modo == 'original' else '')
        flt = f' filter="url(#{fid})"' if modo == 'original' else ''
        return svg_doc(L, L, defs, f'<g{flt}>{b2}</g>', I.get(nombre, {}).get('t', nombre))
    return fn


ORDEN = ['camara-de-diputados', 'proyecto-de-ley', 'expediente', 'educacion', 'salud', 'derechos-de-las-mujeres',
         'participacion-ciudadana', 'justicia', 'calendario', 'ubicacion', 'prensa-y-comunicacion', 'entrevista-microfono',
         'redes-sociales', 'dialogo-y-reunion', 'obras-publicas', 'economia', 'produccion', 'chamame-cultura',
         'golondrina', 'rio', 'pez', 'lancha', 'cana-de-pescar']


def registrar():
    for i, n in enumerate(ORDEN, 1):
        titulo = I[n]['t'] if n in I else MANUAL[n][1]
        uso = ('Ícono de identidad correntina tomado del manual de marca, sin modificar su forma.' if n in MANUAL else
               'Ícono de trazo grueso y redondeado, legible aun en tamaño chico.')
        g = grupo('04', i, f'icono-{n}', titulo,
                  uso + ' Insignia clara para fotos medias u oscuras; oscura para fondos claros; trazo blanco para apoyarlo directo sobre una foto.',
                  tags='icono ' + n.replace('-', ' '))
        recurso(g, 'insignia-clara', 1024, 1024, insignia(n, 'claro'), REC_N)
        recurso(g, 'insignia-oscura', 1024, 1024, insignia(n, 'oscuro'), REC_B)
        recurso(g, 'trazo-blanco', 1024, 1024, trazo_solo(n, BLANCO), dict(borde='noche', grosor=26))
