# Construye la biblioteca: PNG transparente + SVG editable + versión para Recortes + manifiesto.
import os, sys, json, time
from base import REG, GRUPOS, CATS
import c01_logos, c02_marcadores, c03_contenedores, c04_iconos, c05_etiquetas, c06_creativos
from render import Render, troquelar, guardar_png
from PIL import Image

BASE = os.path.dirname(os.path.abspath(__file__))
SAL = os.path.join(BASE, 'salida')

for mod in (c01_logos, c02_marcadores, c03_contenedores, c04_iconos, c05_etiquetas, c06_creativos):
    mod.registrar()

filtro = sys.argv[1:]  # prefijos de gid o nombres de archivo
sel = [r for r in REG if not filtro or any(r['archivo'].startswith(f) for f in filtro)]
print(len(GRUPOS), 'grupos,', len(REG), 'archivos;', len(sel), 'seleccionados')

BORDES = {'blanco': (255, 255, 255), 'noche': (17, 16, 59)}
t0 = time.time()
man_path = os.path.join(SAL, 'manifiesto.json')
man = json.load(open(man_path, encoding='utf-8'))['archivos'] if (filtro and os.path.exists(man_path)) else {}
with Render() as R:
    for i, r in enumerate(sel):
        cat = CATS[r['cat']]
        svg = r['fn']('original')
        png = os.path.join(SAL, cat, r['archivo'] + '.png')
        guardar_png(R.png(svg, r['w'], r['h']), png)
        sp = os.path.join(SAL, '08_EDITABLES', cat, r['archivo'] + '.svg')
        os.makedirs(os.path.dirname(sp), exist_ok=True)
        open(sp, 'w', encoding='utf-8').write('<?xml version="1.0" encoding="UTF-8"?>\n' + svg)
        rec_png = None
        if r['recorte']:
            rc = r['recorte']
            im = R.png(r['fn']('recorte'), r['w'], r['h'])
            gros = rc.get('grosor') or max(12, min(30, round(min(r['w'], r['h']) * .026)))
            im = troquelar(im, gros, BORDES[rc['borde']], rc.get('huecos', True), rc.get('hueco_max'))
            rec_png = os.path.join(SAL, '07_VERSIONES_PARA_RECORTES', r['archivo'] + '_RECORTE.png')
            guardar_png(im, rec_png)
        man[r['archivo']] = dict(gid=r['gid'], cat=r['cat'], variante=r['variante'], w=r['w'], h=r['h'],
                                 png=os.path.relpath(png, SAL).replace(os.sep, '/'),
                                 svg=os.path.relpath(sp, SAL).replace(os.sep, '/'),
                                 recorte=os.path.relpath(rec_png, SAL).replace(os.sep, '/') if rec_png else None,
                                 nota=r['nota'])
        if (i + 1) % 20 == 0: print(i + 1, f'{time.time() - t0:.0f}s', flush=True)
json.dump(dict(grupos=GRUPOS, archivos=man), open(man_path, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('listo', f'{time.time() - t0:.0f}s')
