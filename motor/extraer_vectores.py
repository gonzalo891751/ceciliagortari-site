# Extrae los vectores originales del logo y de los íconos del manual de marca (PDF)
# sin modificarlos: solo se copian las curvas a SVG y JSON.
import fitz, json, os

PDF = r'C:\Users\gonza\OneDrive\Escritorio\BIBLIOTECA_MAESTRA_CECILIA_ECO\02_CECILIA\Cecilia Gortari - Branding 9-8.pdf'
OUT = os.path.join(os.path.dirname(__file__), 'vectores')
os.makedirs(OUT, exist_ok=True)


def f(v):
    s = f'{v:.3f}'.rstrip('0').rstrip('.')
    return s if s not in ('-0', '') else '0'


def path_d(drawing):
    d, cur = [], None
    for it in drawing['items']:
        op = it[0]
        if op == 're':
            r = it[1]
            d.append(f'M{f(r.x0)} {f(r.y0)}H{f(r.x1)}V{f(r.y1)}H{f(r.x0)}Z')
            cur = None
            continue
        if op == 'qu':
            q = it[1]
            d.append(f'M{f(q.ul.x)} {f(q.ul.y)}L{f(q.ur.x)} {f(q.ur.y)}L{f(q.lr.x)} {f(q.lr.y)}L{f(q.ll.x)} {f(q.ll.y)}Z')
            cur = None
            continue
        p0 = it[1]
        if cur is None or abs(cur.x - p0.x) > 1e-3 or abs(cur.y - p0.y) > 1e-3:
            if d and not d[-1].endswith('Z'):
                d.append('Z')
            d.append(f'M{f(p0.x)} {f(p0.y)}')
        if op == 'l':
            p1 = it[2]
            d.append(f'L{f(p1.x)} {f(p1.y)}')
            cur = p1
        elif op == 'c':
            c1, c2, p1 = it[2], it[3], it[4]
            d.append(f'C{f(c1.x)} {f(c1.y)} {f(c2.x)} {f(c2.y)} {f(p1.x)} {f(p1.y)}')
            cur = p1
    if d and not d[-1].endswith('Z'):
        d.append('Z')
    return ''.join(d)


doc = fitz.open(PDF)
partes = {
    # página 19: imagotipo grande (texto en azul noche, flor en magenta)
    'cecilia': (19, [11]),
    'gortari': (19, [12]),
    'flor': (19, [14, 15, 16, 17]),
    # página 20: logo reducido (CG + flor)
    'cg_texto': (20, [40]),
    'cg_flor': (20, [43, 44, 45, 46]),
    # página 26: íconos de identidad del manual
    'ico_rio': (26, [12]),
    'ico_anzuelo': (26, [15]),
    'ico_lancha': (26, [18]),
    'ico_pez': (26, [21, 22]),
    'ico_golondrina': (26, [24, 25]),
}
res = {}
for nombre, (pag, idx) in partes.items():
    dr = doc[pag - 1].get_drawings()
    ds, x0, y0, x1, y1 = [], 1e9, 1e9, -1e9, -1e9
    for i in idx:
        x = dr[i]
        ds.append({'d': path_d(x), 'evenodd': bool(x.get('even_odd')),
                   'fill': '#%02X%02X%02X' % tuple(round(v * 255) for v in x['fill'])})
        r = x['rect']
        x0, y0, x1, y1 = min(x0, r.x0), min(y0, r.y0), max(x1, r.x1), max(y1, r.y1)
    res[nombre] = {'pagina': pag, 'bbox': [x0, y0, x1, y1], 'paths': ds}
    print(nombre, pag, [round(v, 1) for v in (x0, y0, x1, y1)], sum(len(p['d']) for p in ds))

json.dump(res, open(os.path.join(OUT, 'vectores_manual.json'), 'w', encoding='utf-8'), indent=1)

# hoja de control: cada parte en su color original
def svg_de(nombres, pad=10):
    xs = [res[n]['bbox'] for n in nombres]
    x0 = min(b[0] for b in xs) - pad; y0 = min(b[1] for b in xs) - pad
    x1 = max(b[2] for b in xs) + pad; y1 = max(b[3] for b in xs) + pad
    body = ''.join(f'<path d="{p["d"]}" fill="{p["fill"]}" fill-rule="{"evenodd" if p["evenodd"] else "nonzero"}"/>'
                   for n in nombres for p in res[n]['paths'])
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x0} {y0} {x1-x0} {y1-y0}" width="{(x1-x0)*2}" height="{(y1-y0)*2}">{body}</svg>'

open(os.path.join(OUT, 'control_imagotipo.svg'), 'w').write(svg_de(['cecilia', 'gortari', 'flor']))
open(os.path.join(OUT, 'control_cg.svg'), 'w').write(svg_de(['cg_texto', 'cg_flor']))
open(os.path.join(OUT, 'control_iconos.svg'), 'w').write(svg_de(['ico_rio', 'ico_anzuelo', 'ico_lancha', 'ico_pez', 'ico_golondrina']))
