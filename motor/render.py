# Render de SVG a PNG con transparencia real (Chromium vía Playwright) + versión para Recortes.
import os, io
import numpy as np
from PIL import Image
from scipy import ndimage
from nucleo import FONTS

FONT_CSS = ''.join(
    f"@font-face{{font-family:'Outfit';src:url('file:///{os.path.join(FONTS, f).replace(os.sep, '/')}');font-weight:{w};}}"
    for w, f in [(400, 'Outfit-Regular.ttf'), (500, 'Outfit-Medium.ttf'), (600, 'Outfit-SemiBold.ttf'),
                 (700, 'Outfit-Bold.ttf'), (900, 'Outfit-Black.ttf')])

HTML = f"""<!doctype html><html><head><meta charset="utf-8"><style>{FONT_CSS}
html,body{{margin:0;padding:0;background:transparent;}} #c{{display:inline-block;line-height:0}} svg{{display:block}}</style></head>
<body><div id="c"></div>
<div style="font-family:Outfit;position:absolute;left:-9999px">
<span style="font-weight:400">Áa¿?</span><span style="font-weight:500">Áa</span><span style="font-weight:600">Áa</span>
<span style="font-weight:700">Áa</span><span style="font-weight:900">Áa</span></div></body></html>"""


class Render:
    def __enter__(self):
        from playwright.sync_api import sync_playwright
        self.pw = sync_playwright().start()
        try:
            self.br = self.pw.chromium.launch()
        except Exception:
            self.br = self.pw.chromium.launch(channel='chrome')
        self.pg = self.br.new_page(device_scale_factor=1)
        tmp = os.path.join(os.path.dirname(os.path.abspath(__file__)), '_render.html')
        open(tmp, 'w', encoding='utf-8').write(HTML)
        self.pg.goto('file:///' + tmp.replace(os.sep, '/'))
        self.pg.evaluate("Promise.all([400,500,600,700,900].map(w=>document.fonts.load(w+' 40px Outfit')))")
        return self

    def __exit__(self, *a):
        self.br.close(); self.pw.stop()

    def png(self, svg, w, h):
        self.pg.set_viewport_size({'width': int(w), 'height': int(h)})
        self.pg.evaluate("s=>{document.getElementById('c').innerHTML=s}", svg)
        self.pg.evaluate("document.fonts.ready.then(()=>1)")
        b = self.pg.locator('#c svg').screenshot(omit_background=True, animations='disabled')
        return Image.open(io.BytesIO(b)).convert('RGBA')


# ---------------- versión para Recortes: silueta troquelada ----------------
GRIS_OCULTO = (138, 138, 148)   # color guardado en los píxeles transparentes


def troquelar(img, grosor, color=(255, 255, 255), rellenar_huecos=True, hueco_max=None):
    """agrega un borde opaco de grosor uniforme alrededor de todo el elemento (une las partes sueltas)
    y vuelve opaco el interior. Devuelve RGBA."""
    a = np.asarray(img, dtype=np.float32) / 255.0
    al = a[..., 3]
    mask = al > .35
    if rellenar_huecos:
        filled = ndimage.binary_fill_holes(mask)
        if hueco_max is not None:
            holes, n = ndimage.label(filled & ~mask)
            if n:
                sizes = ndimage.sum(np.ones_like(holes), holes, range(1, n + 1))
                for i, s in enumerate(sizes, 1):
                    if s > hueco_max:
                        filled[holes == i] = False
        mask = filled
    # cierre morfológico con disco (redondea recovecos) + desplazamiento de "grosor"
    rc = grosor * .9
    d1 = ndimage.distance_transform_edt(~mask)
    grande = d1 <= (grosor + rc)
    d2 = ndimage.distance_transform_edt(grande)
    borde = np.clip(d2 - rc + .5, 0, 1).astype(np.float32)
    out = np.zeros_like(a)
    col = np.array(color, np.float32) / 255
    out[..., :3] = col
    out[..., 3] = borde
    # elemento encima
    ea = al[..., None]
    out[..., :3] = a[..., :3] * ea + out[..., :3] * (1 - ea)
    out[..., 3] = ea[..., 0] + borde * (1 - ea[..., 0])
    res = (np.clip(out, 0, 1) * 255 + .5).astype(np.uint8)
    res[res[..., 3] == 0, :3] = GRIS_OCULTO
    return Image.fromarray(res, 'RGBA')


def opacar(img, umbral=.5):
    """para recortes sin troquel: interior opaco, borde nítido"""
    a = np.asarray(img).copy()
    al = a[..., 3].astype(np.float32) / 255
    a[..., 3] = (np.clip((al - umbral) * 6 + .5, 0, 1) * 255).astype(np.uint8)
    a[a[..., 3] == 0, :3] = GRIS_OCULTO
    return Image.fromarray(a, 'RGBA')


def guardar_png(img, ruta):
    os.makedirs(os.path.dirname(ruta), exist_ok=True)
    # los píxeles 100 % transparentes guardan un gris neutro (no negro): si una app ignora el canal alfa,
    # el elemento queda sobre gris y no sobre un negro incrustado
    a = np.asarray(img).copy()
    a[a[..., 3] == 0, :3] = GRIS_OCULTO
    img = Image.fromarray(a, 'RGBA')
    img.save(ruta, compress_level=7)
