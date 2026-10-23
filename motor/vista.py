# Hojas de control: cada PNG sobre fondo claro, oscuro y fotográfico.
import os, sys
from PIL import Image, ImageDraw, ImageFont, ImageOps

BASE = os.path.dirname(os.path.abspath(__file__))
BIB = r'C:\Users\gonza\OneDrive\Escritorio\BIBLIOTECA_MAESTRA_CECILIA_ECO'
FOTOS = [os.path.join(BIB, r'01_COMPARTIDOS\Otros\palacio.jpg'),
         os.path.join(BIB, r'04_TEMATICOS\OBRA_PUBLICA_Y_TRANSPARENCIA\OBRA_trabajador_vial_atardecer_01.jpg'),
         os.path.join(BIB, r'01_COMPARTIDOS\Otros\Gobierno_edificio.jpg')]
_cache = {}


def fondo(tipo, w, h, i=0):
    k = (tipo, w, h, i)
    if k in _cache: return _cache[k].copy()
    if tipo == 'claro': im = Image.new('RGBA', (w, h), '#F7F7FD')
    elif tipo == 'oscuro': im = Image.new('RGBA', (w, h), '#2C2C31')
    elif tipo == 'blanco': im = Image.new('RGBA', (w, h), '#FFFFFF')
    elif tipo == 'negro': im = Image.new('RGBA', (w, h), '#000000')
    elif tipo == 'ajedrez':
        im = Image.new('RGBA', (w, h), '#FFFFFF'); d = ImageDraw.Draw(im); s = max(8, w // 24)
        for y in range(0, h, s):
            for x in range(0, w, s):
                if (x // s + y // s) % 2: d.rectangle([x, y, x + s - 1, y + s - 1], fill='#E3E3EA')
    else:
        im = ImageOps.fit(Image.open(FOTOS[i % len(FOTOS)]).convert('RGBA'), (w, h))
    _cache[k] = im
    return im.copy()


def tira(png, alto=300, tipos=('ajedrez', 'claro', 'oscuro', 'foto0', 'foto1')):
    el = Image.open(png).convert('RGBA')
    r = el.width / el.height
    cw = int(alto * max(1, r) * 1.0)
    celdas = []
    for t in tipos:
        f = fondo('foto' if t.startswith('foto') else t, cw, alto, int(t[-1]) if t.startswith('foto') else 0)
        e = el.copy(); e.thumbnail((int(cw * .92), int(alto * .92)), Image.LANCZOS)
        f.alpha_composite(e, ((cw - e.width) // 2, (alto - e.height) // 2))
        celdas.append(f)
    out = Image.new('RGBA', (cw * len(celdas) + 6 * (len(celdas) - 1), alto), '#888')
    for i, c in enumerate(celdas): out.paste(c, (i * (cw + 6), 0))
    return out


def hoja(pngs, salida, alto=260, ancho_max=1900):
    tiras = [tira(p, alto) for p in pngs]
    W = min(ancho_max, max(t.width for t in tiras))
    tiras = [t if t.width <= W else t.resize((W, int(t.height * W / t.width)), Image.LANCZOS) for t in tiras]
    H = sum(t.height + 34 for t in tiras)
    out = Image.new('RGB', (W, H), '#1b1b20')
    d = ImageDraw.Draw(out)
    try: fnt = ImageFont.truetype(os.path.join(BASE, 'fonts', 'Outfit-Medium.ttf'), 18)
    except Exception: fnt = None
    y = 0
    for p, t in zip(pngs, tiras):
        d.text((6, y + 6), os.path.basename(p), fill='#ddd', font=fnt)
        out.paste(t.convert('RGB'), (0, y + 30)); y += t.height + 34
    out.save(salida, quality=90)
    return salida


if __name__ == '__main__':
    hoja(sys.argv[2:], sys.argv[1])
