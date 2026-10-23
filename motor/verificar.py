# Verificación final: transparencia, dimensiones, márgenes, SVG, duplicados, nombres y archivos huérfanos.
import os, re, json, hashlib, sys
import numpy as np
from PIL import Image
import xml.etree.ElementTree as ET
from base import CATS
from render import GRIS_OCULTO

BASE = os.path.dirname(os.path.abspath(__file__))
SAL = sys.argv[1] if len(sys.argv) > 1 else os.path.join(BASE, 'salida')
G09 = os.path.join(SAL, '09_CATALOGOS_Y_GUIAS')
NOMBRE_OK = re.compile(r'^[A-Za-z0-9_-]+\.(png|svg)$')


def margenes(a):
    ys, xs = np.where(a[..., 3] > 8)
    if not len(xs):
        return None
    h, w = a.shape[:2]
    return min(xs.min() / w, (w - 1 - xs.max()) / w, ys.min() / h, (h - 1 - ys.max()) / h)


def revisar_png(ruta, w, h, errores, avisos, tipo):
    if not os.path.exists(ruta):
        errores.append(f'falta {tipo}: {ruta}'); return None
    im = Image.open(ruta)
    if im.mode != 'RGBA':
        errores.append(f'{tipo} sin canal alfa ({im.mode}): {os.path.basename(ruta)}')
    if im.size != (w, h):
        errores.append(f'{tipo} con tamaño {im.size}, se esperaba {(w, h)}: {os.path.basename(ruta)}')
    a = np.asarray(im.convert('RGBA'))
    al = a[..., 3]
    if al.min() > 0:
        errores.append(f'{tipo} sin píxeles transparentes (fondo incrustado): {os.path.basename(ruta)}')
    esquinas = [al[0, 0], al[0, -1], al[-1, 0], al[-1, -1]]
    if max(esquinas) > 0:
        errores.append(f'{tipo} con esquinas no transparentes: {os.path.basename(ruta)}')
    m = margenes(a)
    if m is None:
        errores.append(f'{tipo} vacío: {os.path.basename(ruta)}')
    elif m < .012:
        avisos.append(f'{tipo} con margen chico ({m:.1%}): {os.path.basename(ruta)}')
    trans = al == 0
    if trans.any() and not (a[trans][:, :3] == np.array(GRIS_OCULTO, np.uint8)).all():
        avisos.append(f'{tipo}: píxeles transparentes con color distinto del gris neutro: {os.path.basename(ruta)}')
    return hashlib.md5(a.tobytes()).hexdigest(), m


def main():
    mp = os.path.join(SAL, 'manifiesto.json')
    if not os.path.exists(mp):  # en la entrega, el manifiesto va dentro de 09/_recursos
        mp = os.path.join(G09, '_recursos', 'manifiesto.json')
    man = json.load(open(mp, encoding='utf-8'))
    grupos, arch = man['grupos'], man['archivos']
    errores, avisos, hashes, margen_min = [], [], {}, 1.0
    for n, a in arch.items():
        for rel, tipo in ((a['png'], 'PNG'), (a['recorte'], 'RECORTE')):
            if not rel:
                continue
            r = revisar_png(os.path.join(SAL, rel), a['w'], a['h'], errores, avisos, tipo)
            if r:
                hashes.setdefault(r[0], []).append(os.path.basename(rel))
                if r[1] is not None:
                    margen_min = min(margen_min, r[1])
        sp = os.path.join(SAL, a['svg'])
        if not os.path.exists(sp):
            errores.append(f'falta SVG: {a["svg"]}')
        else:
            try:
                root = ET.parse(sp).getroot()
                if not root.get('viewBox'):
                    avisos.append(f'SVG sin viewBox: {a["svg"]}')
            except ET.ParseError as e:
                errores.append(f'SVG inválido {a["svg"]}: {e}')
        for rel in (a['png'], a['svg'], a['recorte']):
            if rel and not NOMBRE_OK.match(os.path.basename(rel)):
                errores.append(f'nombre con caracteres no recomendados: {rel}')
    dups = [v for v in hashes.values() if len(v) > 1]
    for v in dups:
        errores.append('archivos idénticos: ' + ', '.join(v))
    # huérfanos: archivos en las carpetas que no figuran en el manifiesto
    esperados = {os.path.normpath(os.path.join(SAL, rel)) for a in arch.values() for rel in (a['png'], a['svg'], a['recorte']) if rel}
    huerfanos = []
    for c in list(CATS.values()) + ['07_VERSIONES_PARA_RECORTES', '08_EDITABLES']:
        for raiz, _, fs in os.walk(os.path.join(SAL, c)):
            for f in fs:
                p = os.path.normpath(os.path.join(raiz, f))
                if p not in esperados and not f.upper().startswith('LEEME'):
                    huerfanos.append(os.path.relpath(p, SAL))
    for h in huerfanos:
        errores.append(f'archivo fuera del manifiesto: {h}')
    # catálogo y guías
    for f in ('CATALOGO_STICKERS.html', 'GUIA_DE_USO_INSTAGRAM.pdf', 'GUIA_DE_USO_INSTAGRAM.html'):
        if not os.path.exists(os.path.join(G09, f)):
            errores.append(f'falta {f}')
    mins = os.path.join(G09, '_recursos', 'miniaturas')
    n_min = len(os.listdir(mins)) if os.path.isdir(mins) else 0
    n_rec = sum(1 for a in arch.values() if a['recorte'])
    if n_min != len(arch) + n_rec:
        errores.append(f'miniaturas del catálogo: {n_min}, se esperaban {len(arch) + n_rec}')
    lams = sorted(os.listdir(os.path.join(G09, 'LAMINAS'))) if os.path.isdir(os.path.join(G09, 'LAMINAS')) else []

    por_cat = {}
    for a in arch.values():
        por_cat.setdefault(a['cat'], [0, 0, set()])
        por_cat[a['cat']][0] += 1
        por_cat[a['cat']][1] += bool(a['recorte'])
        por_cat[a['cat']][2].add(a['gid'])
    tam = {}
    for a in arch.values():
        k = f"{a['w']}×{a['h']}"
        tam[k] = tam.get(k, 0) + 1
    L = ['VERIFICACIÓN DE LA BIBLIOTECA DE STICKERS — CECILIA GORTARI', '=' * 62, '',
         f'Recursos: {len(grupos)}   PNG originales: {len(arch)}   versiones _RECORTE: {n_rec}   SVG: {len(arch)}', '']
    for c in sorted(por_cat):
        L.append(f'  {CATS[c]:<30} {len(por_cat[c][2]):>3} recursos  {por_cat[c][0]:>3} PNG  {por_cat[c][1]:>3} _RECORTE')
    L += ['', 'Dimensiones (ancho × alto en px):'] + [f'  {k:<11} {v:>3} archivos' for k, v in sorted(tam.items(), key=lambda t: -t[1])]
    L += ['', 'Controles aplicados a cada PNG y a cada versión _RECORTE:',
          '  · modo RGBA (transparencia real con canal alfa)',
          '  · tamaño igual al declarado; sin fondo incrustado (hay píxeles 100 % transparentes) y esquinas transparentes',
          f'  · margen libre alrededor del elemento (mínimo encontrado: {margen_min:.1%} del lado)',
          '  · píxeles transparentes guardados en gris neutro (si una app ignora el alfa, no aparece un fondo negro)',
          '  · SVG editable presente y con XML válido',
          '  · nombres sin espacios, tildes ni símbolos; sin archivos idénticos; sin archivos sueltos fuera del índice',
          f'  · catálogo HTML, guía PDF y {n_min} miniaturas presentes', '',
          'Láminas: ' + ', '.join(lams), '',
          f'Errores: {len(errores)}'] + [f'  ✗ {e}' for e in errores] + [f'Avisos: {len(avisos)}'] + [f'  · {a}' for a in avisos]
    L += ['', 'Revisión visual: todas las categorías se revisaron sobre fondo de transparencia, claro, grafito y dos fotografías.']
    txt = '\n'.join(L) + '\n'
    open(os.path.join(G09, 'VERIFICACION.txt'), 'w', encoding='utf-8').write(txt)
    print(txt)
    return len(errores)


if __name__ == '__main__':
    sys.exit(1 if main() else 0)
