# Entrega: copia la biblioteca al Escritorio y arma el ZIP para el iPhone.
import os, shutil, zipfile, json
from base import CATS

BASE = os.path.dirname(os.path.abspath(__file__))
SAL = os.path.join(BASE, 'salida')
DEST = r'C:\Users\gonza\OneDrive\Escritorio\CECILIA_GORTARI_STICKERS_INSTAGRAM'
ZIPN = 'CECILIA_GORTARI_STICKERS_IPHONE.zip'

CARPETAS = list(CATS.values()) + ['07_VERSIONES_PARA_RECORTES', '08_EDITABLES', '09_CATALOGOS_Y_GUIAS']

LEEME_EDITABLES = '''EDITABLES SVG — Biblioteca de stickers de Cecilia Gortari

Hay un SVG por cada PNG de las carpetas 01 a 06, ordenados en subcarpetas por categoría y con el mismo nombre.

· Se abren con Inkscape, Illustrator, Figma o Affinity Designer.
· Los textos usan la tipografía Outfit: tiene que estar instalada en la computadora (también está en
  09_CATALOGOS_Y_GUIAS/_recursos/fuentes). El manual admite Regular, Medium y Bold.
· Los logos son los trazos vectoriales originales del manual de marca: no los modifiques, no los deformes ni cambies sus colores.
· Si editás un SVG, exportá el PNG con fondo transparente a 1024 px o más de lado.
· Los efectos de vidrio (desenfoques, degradés y sombras) se ven mejor en Inkscape y en navegadores; algunos programas los simplifican.
'''

ABRIR = '''<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta http-equiv="refresh" content="0; url=09_CATALOGOS_Y_GUIAS/CATALOGO_STICKERS.html">
<title>Abrir catálogo de stickers</title></head>
<body style="font-family:sans-serif"><a href="09_CATALOGOS_Y_GUIAS/CATALOGO_STICKERS.html">Abrir el catálogo de stickers</a></body></html>
'''


def copiar():
    if os.path.exists(DEST):
        # solo se reemplaza una entrega anterior de esta misma biblioteca
        assert os.path.exists(os.path.join(DEST, '09_CATALOGOS_Y_GUIAS', 'CATALOGO_STICKERS.html')), 'la carpeta de destino no es una entrega anterior'
        shutil.rmtree(DEST)
    os.makedirs(DEST)
    for c in CARPETAS:
        shutil.copytree(os.path.join(SAL, c), os.path.join(DEST, c))
    shutil.copy2(os.path.join(SAL, 'manifiesto.json'), os.path.join(DEST, '09_CATALOGOS_Y_GUIAS', '_recursos', 'manifiesto.json'))
    open(os.path.join(DEST, '08_EDITABLES', 'LEEME_EDITABLES.txt'), 'w', encoding='utf-8').write(LEEME_EDITABLES)
    open(os.path.join(DEST, '00_ABRIR_CATALOGO.html'), 'w', encoding='utf-8').write(ABRIR)


def zip_iphone():
    """PNG originales, versiones para Recortes, guía PDF y láminas: lo que sirve en el teléfono (sin SVG ni HTML)."""
    raiz = 'CECILIA_GORTARI_STICKERS_IPHONE'
    ruta = os.path.join(DEST, ZIPN)
    n = 0
    with zipfile.ZipFile(ruta, 'w', zipfile.ZIP_STORED) as z:
        for c in list(CATS.values()) + ['07_VERSIONES_PARA_RECORTES']:
            for f in sorted(os.listdir(os.path.join(DEST, c))):
                if f.lower().endswith('.png'):
                    z.write(os.path.join(DEST, c, f), f'{raiz}/{c}/{f}'); n += 1
        g = os.path.join(DEST, '09_CATALOGOS_Y_GUIAS')
        z.write(os.path.join(g, 'GUIA_DE_USO_INSTAGRAM.pdf'), f'{raiz}/GUIA_DE_USO_INSTAGRAM.pdf'); n += 1
        for f in sorted(os.listdir(os.path.join(g, 'LAMINAS'))):
            z.write(os.path.join(g, 'LAMINAS', f), f'{raiz}/LAMINAS/{f}'); n += 1
    with zipfile.ZipFile(ruta) as z:
        assert z.testzip() is None
    return ruta, n


if __name__ == '__main__':
    copiar()
    r, n = zip_iphone()
    print('entregado en', DEST)
    print(os.path.basename(r), n, 'archivos', f'{os.path.getsize(r) / 1e6:.0f} MB')
